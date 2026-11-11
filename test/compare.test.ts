import { test } from "node:test";
import assert from "node:assert/strict";
import { blocked, parseCompare, toggle, compareHref, EMPTY_COMPARE, type CompareItem } from "../lib/compare.ts";
import { compareRows, productChips } from "../lib/productSpecs.ts";
import products from "../data/products.json" with { type: "json" };
import { wiki } from "../app/content.ts";

const cam = (n: number): CompareItem => ({ slug: `cam-${n}`, kind: "camera", name: `Cam ${n}` });
const lens: CompareItem = { slug: "lens-1", kind: "lens", name: "Lens 1" };

test("compare: up to 4 products of one kind", () => {
  let c = EMPTY_COMPARE;
  for (const n of [1, 2, 3, 4, 5]) c = toggle(c, cam(n));
  assert.deepEqual(c.items.map((i) => i.slug), ["cam-1", "cam-2", "cam-3", "cam-4"]);
  assert.equal(blocked(c, "camera"), "full");
  assert.equal(toggle(c, lens), c, "a lens cannot join cameras");
  assert.equal(blocked({ items: [cam(1)] }, "lens"), "kind");
  assert.equal(blocked(EMPTY_COMPARE, "accessory"), "kind", "accessories are never compared");
  assert.deepEqual(toggle(c, cam(2)).items.map((i) => i.slug), ["cam-1", "cam-3", "cam-4"], "toggling a picked product removes it");
  assert.equal(compareHref({ items: [cam(1), cam(3)] }), "/wiki/san-pham/so-sanh?sp=cam-1,cam-3");
});

test("compare: stored pick is re-checked on read", () => {
  const raw = JSON.stringify({ items: [cam(1), cam(1), lens, { slug: 2 }, { ...lens, kind: "accessory" }, cam(2), cam(3), cam(4), cam(5)] });
  assert.deepEqual(parseCompare(raw).items.map((i) => i.slug), ["cam-1", "cam-2", "cam-3", "cam-4"]);
  assert.deepEqual(parseCompare("not json"), EMPTY_COMPARE);
  assert.deepEqual(parseCompare(null), EMPTY_COMPARE);
});

test("compare: rows line up by label, null where a product lacks the value", () => {
  const bySlug = (s: string) => products.find((p) => p.slug === s)!;
  const ps = products.filter((p) => p.kind === "lens").slice(0, 3);
  const rows = compareRows(ps);
  assert.ok(rows.length > 5);
  assert.ok(!rows.some((r) => r.label === wiki.specRows.code.label), "code sits in the column header");
  for (const r of rows) assert.equal(r.values.length, ps.length, r.label);
  assert.equal(new Set(rows.map((r) => r.label)).size, rows.length, "one row per label");
  // A camera without IBIS and one with it still share the stabilization row.
  const cams = [bySlug("zv-e10"), bySlug("a7c-ii")].filter(Boolean);
  if (cams.length === 2) assert.ok(compareRows(cams).find((r) => r.label === wiki.specRows.stabilization.label)?.values.every(Boolean));
});

test("compare: card chips are short and never empty for cameras and lenses", () => {
  for (const p of products) {
    const chips = productChips(p);
    if (p.kind === "accessory") assert.deepEqual(chips, []);
    // DSC-W830 has no Full HD or 4K video, so a camera may show only its megapixels.
    else assert.ok(chips.length >= (p.kind === "lens" ? 2 : 1) && chips.length <= 3 && chips.every((c) => c.length <= 24), `${p.code}: ${chips}`);
  }
});
