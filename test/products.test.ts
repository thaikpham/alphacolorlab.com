import { test } from "node:test";
import assert from "node:assert/strict";
import products from "../data/products.json" with { type: "json" };

const by = (code: string) => products.find((p) => p.code === code)!.specs as Record<string, unknown>;

test("products: codes and slugs are unique", () => {
  assert.equal(new Set(products.map((p) => p.code)).size, products.length);
  assert.equal(new Set(products.map((p) => p.slug)).size, products.length);
});

// Values checked by hand against the sony.jp spec pages
test("products: lens specs come from the right rows", () => {
  assert.deepEqual([by("SEL2070G").focalMin, by("SEL2070G").focalMax, by("SEL2070G").oss, by("SEL2070G").filterMm], [20, 70, false, 72]);
  assert.deepEqual([by("SEL70200GM2").ossModes, by("SEL70200GM2").series], [3, "GM"]);
  assert.deepEqual([by("SEL400F28GM").filterMm, by("SEL400F28GM").rearFilterMm], [null, 40.5]);
  assert.equal(by("SELP16502").powerZoom, true);
  assert.equal(by("SEL30M35").focalMin, 30);
});

test("products: camera specs come from the right rows", () => {
  const a7c2 = by("ILCE-7CM2");
  assert.deepEqual([a7c2.megapixels, a7c2.battery, a7c2.stabilization, a7c2.weightG], [33, "NP-FZ100", "ibis", 429]);
  assert.deepEqual(a7c2.video4k, [60, 30, 24]);
  assert.deepEqual([by("ZV-E10").stabilization, by("ILCE-6400").stabilization], ["electronic", "none"]);
  assert.deepEqual(by("DSC-RX100M7").video1080, [120, 60, 30, 24]);
});

// Thumbnails must be Sony Japan's own photo of that exact model (separators ignored: VENICE_2 is VENICE2.jpg)
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
// Headphone and series pages use the og:image of the model's own sony.jp page, which names a short id or variant (checked 2026-11-11)
const OWN_PAGE_PHOTO = new Set(["MDR-7506", "MDR-CD900ST", "MDR-EX800ST", "MDR-M1ST", "SF-MT", "SF-UZ"]);
test("products: every image is the sony.jp photo named after its code", () => {
  for (const p of products) assert.ok(p.image.startsWith("https://www.sony.jp/") && (OWN_PAGE_PHOTO.has(p.code) || squash(p.image).includes(squash(p.code.replace(/^DSC-/, "")))), p.code);
});

// sony.jp has no <code>.jpg for these five (404 on 2026-11-09), so they keep the page's og:image
const NO_EXACT_PHOTO = new Set(["ILCE-6400", "DSC-RX10M5", "DSC-RX1RM3", "DSC-W830", "ILCE-7C"]);
// Cinema Line pages name the photo with a variant suffix (ILME-FR7K, ILME-FX3A_01, ILME-FX5B) or without the dash (VENICE2)
const VARIANT_PHOTO = new Set(["ILME-FR7", "ILME-FX3A", "ILME-FX5", "VENICE_2"]);
test("products: camera photos are the file named exactly after the code where sony.jp has one", () => {
  for (const p of products.filter((p) => p.kind === "camera" && !NO_EXACT_PHOTO.has(p.code) && !VARIANT_PHOTO.has(p.code)))
    assert.match(p.image, new RegExp(`/${p.code}\\.jpg$`), p.code);
});

test("products: every lens falls in one of the Product Wiki lens sections (series × format)", async () => {
  const { wiki } = await import("../app/content.ts");
  const series = new Set(wiki.product.lenses.series.map((s) => s.id));
  const formats = new Set(wiki.product.lenses.formats.map((f) => f.id));
  for (const p of products.filter((p) => p.kind === "lens")) assert.ok(series.has(p.specs.series ?? "") && formats.has(p.group ?? ""), p.code);
});

test("products: the page summary sentence is complete for every product", async () => {
  const { productSummary } = await import("../lib/productSpecs.ts");
  for (const p of products) {
    const s = productSummary(p);
    assert.ok(s.startsWith(p.name) && s.endsWith(".") && !/undefined|null|NaN|\(\)/.test(s), `${p.code}: ${s}`);
  }
});

// Values checked by hand against the cached sony.jp spec rows (Cinema Line: body-only weight, still-image megapixels)
test("products: cinema specs come from the right rows", () => {
  assert.deepEqual([by("ILME-FX30").megapixels, by("ILME-FX30").weightG, by("ILME-FX30").sensorFormat], [26, 562, "aps-c"]);
  assert.deepEqual([by("ILME-FX2B").megapixels, by("ILME-FX6V").weightG], [33, 890]);
  // FR7 top page: "フルサイズ裏面照射型CMOSセンサー" (no spec-row sensor entry)
  assert.deepEqual(by("ILME-FR7"), { sensorFormat: "full-frame", sensorType: "CMOS" });
});

test("products: every product group has a Product Wiki heading", async () => {
  const { wiki } = await import("../app/content.ts");
  const cameras = new Set(Object.keys(wiki.product.cameras));
  const groupOf = { "full-frame": "fullframe", "aps-c": "apsc", compact: "compact", cinema: "cinema" } as Record<string, string>;
  for (const p of products.filter((p) => p.kind === "camera")) assert.ok(cameras.has(groupOf[p.group]), p.code);
  for (const p of products.filter((p) => p.kind === "accessory")) assert.ok(wiki.product.accessoryGroups[p.group]?.title, p.code);
});

test("products: accessory summaries name their group, not the lens accessory wording", async () => {
  const { productSummary } = await import("../lib/productSpecs.ts");
  for (const p of products.filter((p) => p.kind === "accessory" && p.group !== "lens-converter"))
    assert.ok(!productSummary(p).includes("phụ kiện ống kính"), p.code);
});
