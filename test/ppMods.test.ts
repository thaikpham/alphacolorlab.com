import { test } from "node:test";
import assert from "node:assert/strict";
import { MOD_LIMITS, baseRecipe, changesOf, cleanPatch, parseMods, patchOf, type PpMod } from "../lib/ppMods.ts";

const valid = { id: "ok", name: "Tốt", base: "pp-001", patch: { saturation: 10 } };

test("cleanPatch: keeps only the values that differ from the base recipe", () => {
  assert.deepEqual(cleanPatch("pp-001", { saturation: 25, color_phase: 3 }), { color_phase: 3 }, "equal to base is dropped");
  assert.deepEqual(cleanPatch("pp-001", { saturation: 25 }), {}, "nothing changed gives an empty patch");
});

test("cleanPatch: unknown key, bad enum, out-of-range value or non-object is refused", () => {
  assert.equal(cleanPatch("pp-001", { nope: 1 }), null, "unknown key");
  assert.equal(cleanPatch("pp-001", { saturation: 99 }), null, "above max");
  assert.equal(cleanPatch("pp-001", { gamma: "NoSuch" }), null, "enum value not in options");
  assert.equal(cleanPatch("pp-001", "saturation"), null, "not an object");
});

test("cleanPatch: blocked or unknown base returns null", () => {
  assert.equal(cleanPatch("pp-027", { saturation: 10 }), null, "blocked recipe");
  assert.equal(cleanPatch("pp-999", { saturation: 10 }), null, "unknown recipe");
});

test("patchOf and changesOf round trip on a real recipe", () => {
  const base = baseRecipe("pp-001");
  if (!base) throw new Error("pp-001 missing");
  const patch = cleanPatch("pp-001", { ...base.pp, saturation: 10, color_phase: 3 });
  assert.deepEqual(patch, { saturation: 10, color_phase: 3 });
  const mod: PpMod = { id: "m-test", name: "Thử", base: "pp-001", patch: patch ?? {} };
  assert.deepEqual(patchOf(mod), { saturation: 10, color_phase: 3 });
  assert.deepEqual(changesOf("pp-001", patchOf(mod)), [
    { key: "saturation", label: "Độ bão hoà", from: 25, to: 10 },
    { key: "color_phase", label: "Pha màu", from: 1, to: 3 },
  ]);
  assert.deepEqual(parseMods(JSON.stringify([mod])), [mod], "survives the stored JSON");
});

test("parseMods: unreadable input gives an empty list", () => {
  assert.deepEqual(parseMods("{not json"), []);
  assert.deepEqual(parseMods(null), []);
  assert.deepEqual(parseMods('{"a":1}'), []);
});

test("parseMods: caps the list at the mod limit", () => {
  const raw = Array.from({ length: 25 }, (_, i) => ({ ...valid, id: `m${i}`, name: `Mod ${i}` }));
  assert.equal(MOD_LIMITS.mods, 20);
  assert.equal(parseMods(JSON.stringify(raw)).length, MOD_LIMITS.mods);
});

test("parseMods: bad items are dropped, the rest are kept", () => {
  const raw = [
    null,
    "text",
    { ...valid, id: "BAD ID" },
    { ...valid, id: "no-name", name: undefined },
    { ...valid, id: "ghost", base: "pp-999" },
    { ...valid, id: "blocked", base: "pp-027" },
    { ...valid, id: "unknown-key", patch: { nope: 1 } },
    { ...valid, id: "range", patch: { saturation: 99 } },
    { ...valid, id: "same", patch: { saturation: 25 } },
    valid,
  ];
  assert.deepEqual(parseMods(JSON.stringify(raw)), [valid]);
});

test("parseMods: duplicate ids keep the first; padded long names are trimmed to the limit", () => {
  const first = { ...valid, id: "dup", name: `  ${"x".repeat(60)}  ` };
  const second = { ...valid, id: "dup", name: "Sau" };
  const out = parseMods(JSON.stringify([first, second]));
  assert.equal(out.length, 1, "second item with the same id is dropped");
  assert.equal(out[0]?.name, "x".repeat(MOD_LIMITS.name), "trimmed, then cut to 40");
});
