import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
// @ts-ignore: plain ESM script without types
import { lint } from "../scripts/check-design.mjs";

const rules = (src: string, file = "x.tsx") => lint(src, file).map((p: { rule: string }) => p.rule);

test("bắt các vi phạm design system", () => {
  const bad = `<div className="text-[13px] bg-blue-500 rounded-xl shadow-lg text-sm bg-white uppercase bg-(--x)" style={{ color: "#fff" }}>›</div>`;
  assert.deepEqual(new Set(rules(bad)), new Set(["arbitrary-value", "palette-color", "raw-black-white", "default-type-scale", "default-radius", "default-shadow", "hex-or-rgb", "glyph-icon", "uppercase-label"]));
});

test("cho qua token và ngoại lệ đã định", () => {
  const good = `<div className="md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] aspect-[4/3] text-footnote bg-accent/10 rounded-full rounded-card shadow-card text-balance text-label bg-card/70"><a href="#tao-preset">x</a></div>\nexport const viewport = { themeColor: "#F2F2F7" };`;
  assert.deepEqual(rules(good), []);
});

test("file .ts chỉ bị quét màu thô", () => {
  assert.deepEqual(rules(`const s = "MENU → Setup › uppercase text-sm";`, "content.ts"), []);
  assert.deepEqual(rules(`const c = "#0071e3";`, "content.ts"), ["hex-or-rgb"]);
});

test("toàn bộ app/ tuân thủ design system", () => {
  const r = spawnSync(process.execPath, ["scripts/check-design.mjs"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout);
});
