import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseGear, toggleGear, pickModel, entryModel, EMPTY_BAG, type GearBag } from "../lib/gear.ts";
import { gearCatalog, compatible, nearGear } from "../lib/gearCatalog.ts";
import type { ModelId } from "../lib/model.ts";

const accessories = JSON.parse(readFileSync(new URL("../data/accessories.json", import.meta.url), "utf8"));

test("gear: parseGear handles bad JSON", () => {
  assert.deepEqual(parseGear(null), EMPTY_BAG);
  assert.deepEqual(parseGear("not json"), EMPTY_BAG);
  assert.deepEqual(parseGear('{"invalid"}'), EMPTY_BAG);
});

test("gear: parseGear drops unknown ids", () => {
  const bag = parseGear(JSON.stringify({ body: ["zv-e10", "unknown-camera"], lens: [], acc: [] }));
  assert.equal(bag.body.length, 1);
  assert.ok(bag.body.includes("zv-e10"));
  assert.ok(!bag.body.includes("unknown-camera"));
});

test("gear: parseGear drops miscategorised ids", () => {
  const catalog = gearCatalog();
  const lensId = catalog.lens[0]?.id;
  if (lensId) {
    const bag = parseGear(JSON.stringify({ body: [lensId], lens: [], acc: [] }));
    assert.equal(bag.body.length, 0, "lens id in body should be dropped");
  }
});

test("gear: parseGear deduplicates", () => {
  const bag = parseGear(JSON.stringify({ body: ["zv-e10", "zv-e10", "a6400"], lens: [], acc: [] }));
  assert.equal(bag.body.length, 2);
});

test("gear: parseGear keeps any number of items (no slot limit)", () => {
  const ids = gearCatalog().body.map((b) => b.id).slice(0, 10);
  const bag = parseGear(JSON.stringify({ body: ids, lens: [], acc: [] }));
  assert.equal(bag.body.length, 10);
});

test("gear: toggleGear adds item", () => {
  const bag = toggleGear(EMPTY_BAG, "body", "zv-e10");
  assert.deepEqual(bag.body, ["zv-e10"]);
});

test("gear: toggleGear removes item", () => {
  const initial = { ...EMPTY_BAG, body: ["zv-e10"] };
  assert.equal(toggleGear(initial, "body", "zv-e10").body.length, 0);
});

test("gear: toggleGear adds past six items", () => {
  const initial = { ...EMPTY_BAG, body: ["zv-e10", "a6400", "a6100", "a6700", "a5100", "a5000"] };
  assert.equal(toggleGear(initial, "body", "a3000").body.length, 7);
});

test("gear: toggleGear maintains immutability", () => {
  const initial = { ...EMPTY_BAG, body: ["zv-e10"] };
  const result = toggleGear(initial, "body", "a6400");
  assert.notEqual(result, initial);
  assert.deepEqual(initial.body, ["zv-e10"]);
});

test("gear: catalog has 36 bodies", () => {
  const cat = gearCatalog();
  assert.equal(cat.body.length, 36);
});

test("gear: catalog has 82 lenses", () => {
  const cat = gearCatalog();
  assert.equal(cat.lens.length, 82);
});

test("gear: catalog has guide flag on 3 cameras", () => {
  const cat = gearCatalog();
  const guides = cat.body.filter((b) => b.guide);
  assert.equal(guides.length, 3);
  assert.ok(guides.some((g) => g.id === "zv-e10"));
  assert.ok(guides.some((g) => g.id === "a6400"));
  assert.ok(guides.some((g) => g.id === "a7c-ii"));
});

test("gear: guide cameras are first in body list", () => {
  const cat = gearCatalog();
  assert.ok(cat.body[0].guide);
  assert.ok(cat.body[1].guide);
  assert.ok(cat.body[2].guide);
});

test("gear: compatible returns true for FF lenses on all bodies", () => {
  const cat = gearCatalog();
  const ffLens = cat.lens.find((l) => l.mount === "full-frame");
  const apscBody = cat.body.find((b) => b.group === "aps-c");
  if (ffLens && apscBody) {
    assert.ok(compatible(ffLens, [apscBody]));
  }
});

test("gear: catalog ids are unique across categories", () => {
  const cat = gearCatalog();
  const seen = new Set<string>();
  for (const cat_ of ["body", "lens", "acc"] as const) {
    for (const item of cat[cat_]) {
      assert.ok(!seen.has(item.id), `duplicate id: ${item.id}`);
      seen.add(item.id);
    }
  }
});

test("gear: accessories.json has valid structure", () => {
  assert.ok(Array.isArray(accessories));
  for (const acc of accessories) {
    assert.ok(typeof acc.id === "string", "acc id is string");
    assert.ok(typeof acc.name === "string", "acc name is string");
    assert.ok(typeof acc.code === "string", "acc code is string");
    assert.ok(
      ["audio", "power", "grip", "lighting"].includes(acc.group),
      `invalid acc group: ${acc.group}`
    );
    if (acc.battery) {
      assert.ok(typeof acc.battery === "string", "acc battery is string");
    }
  }
});

test("gear: pickModel returns first guide camera slug if current is not a guide", () => {
  const bag: GearBag = { body: ["zv-e10", "a6400"], lens: [], acc: [] };
  const model = pickModel(bag, "a5000" as ModelId);
  assert.equal(model, "zve10");
});

test("gear: pickModel returns null if current is already a guide camera", () => {
  const bag: GearBag = { body: ["zv-e10"], lens: [], acc: [] };
  const model = pickModel(bag, "zve10" as ModelId);
  assert.equal(model, null);
});

test("gear: pickModel returns null if bag has no guide cameras", () => {
  const bag: GearBag = { body: ["a5000"], lens: [], acc: [] };
  const model = pickModel(bag, "a6400" as ModelId);
  assert.equal(model, null);
});

test("gear: findGear matches name or code loosely, unknown products return null", async () => {
  const { findGear, suggestGear } = await import("../lib/gearCatalog.ts");
  assert.equal(findGear("a6400")?.item.id, "a6400");
  assert.equal(findGear("ILCE 6400")?.item.id, "a6400");
  assert.equal(findGear("Canon R6"), null);
  assert.equal(findGear(""), null);
  assert.ok(suggestGear("a7c").some((h) => h.item.id === "a7c-ii"));
  assert.equal(suggestGear("ecm-w2")[0]?.cat, "acc");
});

test("nearGear: typo trims until it finds close matches", () => {
  const hits = nearGear("A7 IIII");
  assert.ok(hits.length > 0 && hits.length <= 3);
  assert.ok(hits.some((h) => /A7 III/i.test(h.item.name)), hits.map((h) => h.item.name).join(", "));
  assert.deepEqual(nearGear("zz"), []);
});

test("gear: entryModel prefers a guide camera in the bag, then the stored model, else null", () => {
  const bag = (body: string[]): GearBag => ({ body, lens: [], acc: [] });
  assert.equal(entryModel(EMPTY_BAG, null), null);
  assert.deepEqual(entryModel(EMPTY_BAG, "a6400"), { model: "a6400", fromBag: false });
  assert.deepEqual(entryModel(bag(["a5000"]), null), null);
  // last guide camera added wins when the stored model is not in the bag
  assert.deepEqual(entryModel(bag(["zv-e10", "a7c-ii"]), null), { model: "a7c2", fromBag: true });
  assert.deepEqual(entryModel(bag(["zv-e10", "a7c-ii"]), "a6400"), { model: "a7c2", fromBag: true });
  // the stored model stays when it is one of the cameras in the bag
  assert.deepEqual(entryModel(bag(["zv-e10", "a7c-ii"]), "zve10"), { model: "zve10", fromBag: true });
});
