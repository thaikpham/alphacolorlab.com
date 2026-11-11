import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseKolProfile, parseRemoteSet, imageProblem } from "../lib/kol.ts";

// Origin storage giả lập; trong ứng dụng thật đây là AUTH_URL.
const BASE = "https://auth.example.test";
const img = (name: string, base = BASE) => `${base}/storage/v1/object/public/kol/user/${name}.jpg`;
const slots = () => JSON.parse(fs.readFileSync("data/preset-sets.json", "utf8"))[0].slots;

const profileRow = (over: Record<string, unknown> = {}) => ({
  handle: "ai-do",
  name: "Ai Đó",
  bio: "Chụp ảnh đường phố",
  link: "https://example.com/ai-do",
  avatar_url: img("avatar"),
  cover_url: img("cover"),
  photos: [img("p1"), img("p2")],
  ...over,
});

const setRow = (over: Record<string, unknown> = {}) => ({
  id: "bo-moi",
  name: "Bộ mới",
  description: "Mô tả ngắn",
  slots: slots(),
  published: true,
  kol_profiles: { handle: "ai-do", name: "Ai Đó", avatar_url: img("avatar"), link: "https://example.com/ai-do" },
  ...over,
});

test("hồ sơ hợp lệ: đủ trường, ảnh dưới đúng storage của AUTH", () => {
  const p = parseKolProfile(profileRow(), BASE);
  assert.ok(p);
  assert.equal(p.handle, "ai-do");
  assert.equal(p.name, "Ai Đó");
  assert.equal(p.link, "https://example.com/ai-do");
  assert.equal(p.avatar, img("avatar"));
  assert.deepEqual(p.photos, [img("p1"), img("p2")]);
});

test("hồ sơ thiếu ảnh và link thì vẫn hợp lệ, không có trường đó", () => {
  const p = parseKolProfile({ handle: "ai-do", name: "Ai Đó", bio: null, link: null, avatar_url: null, cover_url: null, photos: null }, BASE);
  assert.deepEqual(p, { handle: "ai-do", name: "Ai Đó", bio: "", photos: [] });
});

test("ảnh trên host khác storage của AUTH bị loại, cả avatar lẫn ảnh mẫu", () => {
  assert.equal(parseKolProfile(profileRow({ avatar_url: img("a", "https://evil.example") }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ photos: [img("p1", "https://evil.example")] }), BASE), null);
});

test("ảnh http (không https) bị loại", () => {
  assert.equal(parseKolProfile(profileRow({ cover_url: img("c", "http://auth.example.test") }), BASE), null);
});

test("hơn 12 ảnh mẫu bị loại, đúng 12 thì nhận", () => {
  const twelve = Array.from({ length: 12 }, (_, i) => img(`p${i}`));
  assert.equal(parseKolProfile(profileRow({ photos: [...twelve, img("p13")] }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ photos: twelve }), BASE)?.photos.length, 12);
});

test("handle sai định dạng bị loại", () => {
  assert.equal(parseKolProfile(profileRow({ handle: "Ai_Do" }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ handle: "" }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ handle: "a".repeat(31) }), BASE), null);
});

test("link không phải http(s) bị loại; tên trống bị loại", () => {
  assert.equal(parseKolProfile(profileRow({ link: "javascript:alert(1)" }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ name: "   " }), BASE), null);
});

test("dòng không phải object thì null", () => {
  assert.equal(parseKolProfile(null, BASE), null);
  assert.equal(parseKolProfile("ai-do", BASE), null);
});

test("bộ hợp lệ: có tác giả, published theo dữ liệu, 4 ô", () => {
  const s = parseRemoteSet(setRow(), new Set(["shoot-easy"]), BASE);
  assert.ok(s);
  assert.equal(s.id, "bo-moi");
  assert.equal(s.published, true);
  assert.equal(s.author.handle, "ai-do");
  assert.equal(s.author.avatar, img("avatar"));
  assert.equal(s.slots.length, 4);
});

test("bộ từ xa không tự đặt recommended", () => {
  const s = parseRemoteSet(setRow({ recommended: true }), new Set(), BASE);
  assert.ok(s);
  assert.equal("recommended" in s, false);
});

test("bộ có ô không qua validatePresetSets (3 ô hoặc mode sai) thì bỏ", () => {
  assert.equal(parseRemoteSet(setRow({ slots: slots().slice(0, 3) }), new Set(), BASE), null);
  const bad = slots();
  bad[1].settings.mode = "X";
  assert.equal(parseRemoteSet(setRow({ slots: bad }), new Set(), BASE), null);
});

test("bộ trùng id trong repo (shoot-easy) thì bỏ, repo luôn thắng", () => {
  assert.equal(parseRemoteSet(setRow({ id: "shoot-easy" }), new Set(["shoot-easy"]), BASE), null);
  assert.ok(parseRemoteSet(setRow({ id: "shoot-easy" }), new Set(), BASE));
});

test("bộ có tác giả hỏng (handle sai, ảnh sai host) thì bỏ", () => {
  assert.equal(parseRemoteSet(setRow({ kol_profiles: { handle: "Sai Handle", name: "X" } }), new Set(), BASE), null);
  assert.equal(parseRemoteSet(setRow({ kol_profiles: { handle: "ai-do", name: "X", avatar_url: img("a", "https://evil.example") } }), new Set(), BASE), null);
});

test("imageProblem: đúng loại và cỡ thì null; sai loại hoặc quá 5 MB thì báo", () => {
  assert.equal(imageProblem({ type: "image/jpeg", size: 1000 }), null);
  assert.equal(imageProblem({ type: "image/gif", size: 1000 }), "type");
  assert.equal(imageProblem({ type: "image/png", size: 5 * 1024 * 1024 + 1 }), "size");
});

const GOOGLE = "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c";

test("ảnh tài khoản Google (https, đúng host) làm được ảnh đại diện, cả của hồ sơ lẫn tác giả bộ", () => {
  assert.equal(parseKolProfile(profileRow({ avatar_url: GOOGLE }), BASE)?.avatar, GOOGLE);
  assert.equal(parseRemoteSet(setRow({ kol_profiles: { handle: "ai-do", name: "Ai Đó", avatar_url: GOOGLE } }), new Set(), BASE)?.author.avatar, GOOGLE);
});

test("host Google giả, http, hoặc ảnh Google làm bìa hay ảnh mẫu thì bị loại", () => {
  assert.equal(parseKolProfile(profileRow({ avatar_url: "https://lh3.googleusercontent.com.evil.com/x" }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ avatar_url: "http://lh3.googleusercontent.com/x" }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ cover_url: GOOGLE }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ photos: [GOOGLE] }), BASE), null);
});
