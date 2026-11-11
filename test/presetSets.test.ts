import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validatePresetSets, defaultSet, listedSets, PresetError } from "../lib/presetSets.ts";

const ok = () => JSON.parse(fs.readFileSync("data/preset-sets.json", "utf8"));

test("data/preset-sets.json hợp lệ và có bộ mặc định", () => {
  const sets = validatePresetSets(ok());
  // file do /admin sửa: chỉ kiểm tra cấu trúc, không ghim tên hay giá trị
  assert.ok(defaultSet(sets).slots.length === 4);
});

test("chuẩn hóa khẩu độ dạng số và ISO AUTO", () => {
  const raw = ok();
  raw[0].slots[0].settings.aperture = 1;
  raw[0].slots[0].settings.iso = "AUTO";
  const s = validatePresetSets(raw)[0].slots[0].settings;
  assert.equal(s.aperture, "1.0");
  assert.equal(s.iso, "auto");
});

test("từ chối dữ liệu sai", () => {
  const bad = (mut: (r: any) => void) => { const r = ok(); mut(r); assert.throws(() => validatePresetSets(r), PresetError); };
  bad((r) => r[0].slots.pop());
  bad((r) => (r[0].slots[1].settings.mode = "X"));
  bad((r) => (r[0].slots[1].settings.shutter = "1/7"));
  bad((r) => (r[0].id = "Có Dấu"));
  bad((r) => r.push({ ...r[0] }));
  bad((r) => (r[0].slots[0].settings.recipeId = "khong-co"));
  bad((r) => (r[0].slots[0].settings.wb = { mode: "ctemp", kelvin: 99999 }));
  bad((r) => (r[0].slots[0].settings.metering = "spot"));
  bad((r) => (r[0].slots[0].settings.facePriority = "maybe"));
  bad((r) => (r[0].slots[0].settings.softSkin = "ultra"));
});

test("chấp nhận cài đặt đo sáng, ưu tiên khuôn mặt, làm mịn da", () => {
  const raw = ok();
  raw[0].slots[0].settings.metering = "center";
  raw[0].slots[1].settings.facePriority = "off";
  raw[0].slots[2].settings.softSkin = "high";
  const s = validatePresetSets(raw)[0].slots;
  assert.equal(s[0].settings.metering, "center");
  assert.equal(s[1].settings.facePriority, "off");
  assert.equal(s[2].settings.softSkin, "high");
});

test("author: không có thì bỏ qua, có thì giữ tên, handle, avatar và link", () => {
  const raw = ok();
  assert.equal(validatePresetSets(raw)[0].author?.handle, "thaikpham");
  delete raw[0].author;
  assert.equal("author" in validatePresetSets(raw)[0], false);
  raw[0].author = { name: "  Ai Đó  ", handle: "ai-do", avatar: "https://example.com/a.png", link: "http://example.com" };
  assert.deepEqual(validatePresetSets(raw)[0].author, { name: "Ai Đó", handle: "ai-do", avatar: "https://example.com/a.png", link: "http://example.com/" });
});

test("author: từ chối handle sai, avatar không https, link không phải http(s), URL tương đối", () => {
  const bad = (author: unknown) => { const r = ok(); r[0].author = author; assert.throws(() => validatePresetSets(r), PresetError); };
  bad({ name: "A", handle: "Có Hoa" });
  bad({ name: "A", handle: "a".repeat(31) });
  bad({ name: "A", handle: "a b" });
  bad({ name: "A", handle: "ok", avatar: "http://example.com/a.png" });
  bad({ name: "A", handle: "ok", avatar: "/anh.png" });
  bad({ name: "A", handle: "ok", link: "javascript:alert(1)" });
  bad({ name: "A", handle: "ok", link: "ftp://example.com" });
  bad({ name: "", handle: "ok" });
  bad({ handle: "ok" });
  bad("thaikpham");
});

test("unlisted: giữ khi true, bỏ khi false hoặc không có, từ chối khi không phải boolean", () => {
  const raw = ok();
  raw[0].unlisted = true;
  assert.equal(validatePresetSets(raw)[0].unlisted, true);
  raw[0].unlisted = false;
  assert.equal("unlisted" in validatePresetSets(raw)[0], false);
  delete raw[0].unlisted;
  assert.equal("unlisted" in validatePresetSets(raw)[0], false);
  raw[0].unlisted = "yes";
  assert.throws(() => validatePresetSets(raw), PresetError);
});

test("listedSets bỏ bộ unlisted, giữ thứ tự; bộ ẩn vẫn là bộ mặc định nếu được đánh dấu", () => {
  const raw = ok();
  raw[0].unlisted = true;
  const second = { ...raw[0], id: "night-1", name: "Đêm" };
  delete second.unlisted;
  delete second.recommended;
  raw.push(second);
  const sets = validatePresetSets(raw);
  assert.deepEqual(listedSets(sets).map((s) => s.id), ["night-1"]);
  assert.equal(sets.length, 2);
  assert.equal(defaultSet(sets).id, raw[0].id);
});
