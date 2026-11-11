import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applySettings, decodeDat } from "../lib/zve10/dat.ts";
import presets from "../lib/zve10/presets.ts";

const base = new Uint8Array(readFileSync("public/dat/zve10-pal-m1.dat"));
const parityRecipes = JSON.parse(readFileSync("test/fixtures/parity-recipes.json", "utf8"));
const knowledge = JSON.parse(readFileSync("data/knowledge.json", "utf8"));

test("Color Bank: 30 exportable + 15 blocked presets", () => {
  const exportable = presets.filter((p) => !p.blocked);
  const blocked = presets.filter((p) => p.blocked);
  assert.equal(exportable.length, 30, `Expected 30 exportable presets, got ${exportable.length}`);
  assert.equal(blocked.length, 15, `Expected 15 blocked presets, got ${blocked.length}`);
});

test("Color Bank: exportable presets apply without error", () => {
  const exportable = presets.filter((p) => !p.blocked);
  for (const preset of exportable) {
    try {
      const result = applySettings(base, 1, {
        pp: preset.pp,
        ppOn: true,
        wb: preset.wb,
        awbPriority: "keep",
      });
      const decoded = decodeDat(result);
      // Verify PP values roundtrip
      for (const [key, value] of Object.entries(preset.pp)) {
        const decodedValue = decoded.pp1[key];
        assert.strictEqual(String(decodedValue), String(value), `preset ${preset.id} pp.${key} mismatch`);
      }
      // Verify WB values roundtrip
      assert.strictEqual(decoded.wb.mode, preset.wb.mode, `preset ${preset.id} wb.mode mismatch`);
      if (preset.wb.mode === "ctemp") {
        assert.strictEqual(decoded.wb.kelvin, preset.wb.kelvin, `preset ${preset.id} wb.kelvin mismatch`);
      }
      assert.strictEqual(decoded.wb.ab, preset.wb.ab, `preset ${preset.id} wb.ab mismatch`);
      assert.strictEqual(decoded.wb.gm, preset.wb.gm, `preset ${preset.id} wb.gm mismatch`);
    } catch (e) {
      throw new Error(`preset ${preset.id} failed to apply: ${(e as Error).message}`);
    }
  }
});

test("Color Bank: blocked presets throw on applySettings", () => {
  const blocked = presets.filter((p) => p.blocked);
  for (const preset of blocked) {
    assert.throws(() => {
      applySettings(base, 1, {
        pp: preset.pp,
        ppOn: true,
        wb: preset.wb,
        awbPriority: "keep",
      });
    }, Error);
  }
});

test("Color Bank: pp-001 matches Mojave Sun in parity-recipes.json", () => {
  const pp001 = presets.find((p) => p.id === "pp-001");
  assert.ok(pp001, "pp-001 not found");

  const mojave = parityRecipes.find((p: any) => p.name === "Mojave Sun");
  assert.ok(mojave, "Mojave Sun not found in parity-recipes.json");

  // Compare WB
  assert.strictEqual(pp001.wb.mode, mojave.wb.mode, "wb.mode mismatch");
  assert.strictEqual(pp001.wb.kelvin, mojave.wb.kelvin, "wb.kelvin mismatch");
  assert.strictEqual(pp001.wb.ab, mojave.wb.ab, "wb.ab mismatch");
  assert.strictEqual(pp001.wb.gm, mojave.wb.gm, "wb.gm mismatch");

  // Compare PP
  for (const key of Object.keys(mojave.pp)) {
    assert.strictEqual(pp001.pp[key], mojave.pp[key], `pp.${key} mismatch`);
  }
});

test("no /creative (look|style)/i in presets.json", () => {
  for (const preset of presets) {
    assert.ok(
      !/creative\s+(look|style)/i.test(JSON.stringify(preset)),
      `preset ${preset.id} contains forbidden 'creative look/style'`
    );
  }
});

test("no /creative (look|style)/i in knowledge.json", () => {
  for (const entry of knowledge) {
    assert.ok(
      !/creative\s+(look|style)/i.test(JSON.stringify(entry)),
      `knowledge entry ${(entry as any).title} contains forbidden 'creative look/style'`
    );
  }
});
