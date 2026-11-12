import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseKolProfile, parseRemoteSet, imageProblem, canCreateSet, photoUrl, photoNote, photosPayload, isStale, handleFrom, displayIdentity, draftIdentity, type KolProfile } from "../lib/kol.ts";

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
  assert.deepEqual(p.photos, [{ url: img("p1") }, { url: img("p2") }]);
});

test("hồ sơ thiếu ảnh và link thì vẫn hợp lệ, không có trường đó", () => {
  const p = parseKolProfile({ handle: "ai-do", name: "Ai Đó", bio: null, link: null, avatar_url: null, cover_url: null, photos: null }, BASE);
  assert.deepEqual(p, { handle: "ai-do", name: "Ai Đó", bio: "", photos: [] });
});

test("ảnh đại diện và ảnh bìa trên host khác storage của AUTH bị loại", () => {
  assert.equal(parseKolProfile(profileRow({ avatar_url: img("a", "https://evil.example") }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ cover_url: img("c", "https://evil.example") }), BASE), null);
});

test("ảnh mẫu là link https tới bất kỳ đâu thì nhận; một ảnh http hoặc sai định dạng thì cả hồ sơ bị loại", () => {
  const ext = "https://example.com/a.jpg";
  assert.deepEqual(parseKolProfile(profileRow({ photos: [img("p1"), ext] }), BASE)?.photos.map((p) => p.url), [img("p1"), ext]);
  assert.equal(parseKolProfile(profileRow({ photos: [ext.replace("https", "http")] }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ photos: ["javascript:alert(1)"] }), BASE), null);
});

test("ảnh mẫu trùng thì giữ cái đầu, bỏ cái sau", () => {
  assert.deepEqual(parseKolProfile(profileRow({ photos: [img("p1"), img("p2"), img("p1")] }), BASE)?.photos.map((p) => p.url), [img("p1"), img("p2")]);
});

test("photoUrl: bucket của AUTH và link https thường được nhận, giữ nguyên", () => {
  assert.equal(photoUrl(img("p1", BASE), BASE), img("p1", BASE));
  assert.equal(photoUrl("https://example.com/a.jpg"), "https://example.com/a.jpg");
});

test("photoUrl: từ chối http, scheme khác, userinfo, IP, localhost, khoảng trắng và chuỗi rỗng", () => {
  for (const bad of [
    "http://example.com/a.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "https://user:pw@example.com/a.jpg",
    "https://93.184.216.34/a.jpg",
    "https://[::1]/a.jpg",
    "https://localhost/a.jpg",
    "https://example.com/a b.jpg",
    "https://example.com/a.jpg\n",
    "not a url",
    "",
  ]) {
    assert.equal(photoUrl(bad), null, bad);
  }
});

test("photoUrl: tối đa 300 ký tự, đúng 300 thì nhận, 301 thì loại", () => {
  const link = (n: number) => `https://example.com/${"a".repeat(n - 20)}`;
  assert.equal(photoUrl(link(300))?.length, 300);
  assert.equal(photoUrl(link(301)), null);
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

test("bộ hợp lệ: có tác giả, published theo dữ liệu, 4 ô", async () => {
  const s = await parseRemoteSet(setRow(), new Set(["shoot-easy"]), BASE);
  assert.ok(s);
  assert.equal(s.id, "bo-moi");
  assert.equal(s.published, true);
  assert.equal(s.author.handle, "ai-do");
  assert.equal(s.author.avatar, img("avatar"));
  assert.equal(s.slots.length, 4);
});

test("bộ từ xa không tự đặt recommended", async () => {
  const s = await parseRemoteSet(setRow({ recommended: true }), new Set(), BASE);
  assert.ok(s);
  assert.equal("recommended" in s, false);
});

test("bộ có ô không qua validatePresetSets (3 ô hoặc mode sai) thì bỏ", async () => {
  assert.equal(await parseRemoteSet(setRow({ slots: slots().slice(0, 3) }), new Set(), BASE), null);
  const bad = slots();
  bad[1].settings.mode = "X";
  assert.equal(await parseRemoteSet(setRow({ slots: bad }), new Set(), BASE), null);
});

test("bộ trùng id trong repo (shoot-easy) thì bỏ, repo luôn thắng", async () => {
  assert.equal(await parseRemoteSet(setRow({ id: "shoot-easy" }), new Set(["shoot-easy"]), BASE), null);
  assert.ok(await parseRemoteSet(setRow({ id: "shoot-easy" }), new Set(), BASE));
});

test("bộ có tác giả hỏng (handle sai, ảnh sai host) thì bỏ", async () => {
  assert.equal(await parseRemoteSet(setRow({ kol_profiles: { handle: "Sai Handle", name: "X" } }), new Set(), BASE), null);
  assert.equal(await parseRemoteSet(setRow({ kol_profiles: { handle: "ai-do", name: "X", avatar_url: img("a", "https://evil.example") } }), new Set(), BASE), null);
});

test("mỗi KOL một bộ: chưa có bộ nào thì được tạo, từ một bộ trở lên thì không", () => {
  assert.equal(canCreateSet([]), true);
  assert.equal(canCreateSet([{ id: "bo-moi" }]), false);
  assert.equal(canCreateSet([{ id: "bo-moi" }, { id: "bo-cu" }]), false);
});

test("imageProblem: đúng loại và cỡ thì null; sai loại hoặc quá 5 MB thì báo", () => {
  assert.equal(imageProblem({ type: "image/jpeg", size: 1000 }), null);
  assert.equal(imageProblem({ type: "image/gif", size: 1000 }), "type");
  assert.equal(imageProblem({ type: "image/png", size: 5 * 1024 * 1024 + 1 }), "size");
});

const GOOGLE = "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c";

test("ảnh tài khoản Google (https, đúng host) làm được ảnh đại diện, cả của hồ sơ lẫn tác giả bộ", async () => {
  assert.equal(parseKolProfile(profileRow({ avatar_url: GOOGLE }), BASE)?.avatar, GOOGLE);
  assert.equal((await parseRemoteSet(setRow({ kol_profiles: { handle: "ai-do", name: "Ai Đó", avatar_url: GOOGLE } }), new Set(), BASE))?.author.avatar, GOOGLE);
});

test("host Google giả, http, hoặc ảnh Google làm bìa thì bị loại", () => {
  assert.equal(parseKolProfile(profileRow({ avatar_url: "https://lh3.googleusercontent.com.evil.com/x" }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ avatar_url: "http://lh3.googleusercontent.com/x" }), BASE), null);
  assert.equal(parseKolProfile(profileRow({ cover_url: GOOGLE }), BASE), null);
});

test("ảnh Google là https nên cũng nhận làm ảnh mẫu", () => {
  assert.deepEqual(parseKolProfile(profileRow({ photos: [GOOGLE] }), BASE)?.photos.map((p) => p.url), [GOOGLE]);
});

test("photosPayload: ảnh không có ghi chú là chuỗi url, có ghi chú là {url, ...ghi chú}", () => {
  assert.deepEqual(photosPayload([{ url: img("p1") }, { url: img("p2"), aperture: "f/2.8", slot: 2 }]), [img("p1"), { url: img("p2"), aperture: "f/2.8", slot: 2 }]);
});

test("photoNote: không có trường nào thì undefined; trường rỗng hoặc chỉ khoảng trắng bị bỏ, còn lại được cắt khoảng trắng", () => {
  assert.equal(photoNote({ url: img("p1") }), undefined);
  assert.equal(photoNote({ url: img("p1"), aperture: "   " }), undefined);
  assert.deepEqual(photoNote({ url: img("p1"), iso: "  400 " }), { iso: "400" });
});

test("ghi chú sai kiểu, quá dài hoặc không thuộc danh sách thì bỏ riêng trường đó, ảnh vẫn nhận", () => {
  const photo = { url: img("p1"), aperture: "f/2.8", shutter: 250, iso: "x".repeat(41), slot: 5, recipe: "Có Dấu", text: "a".repeat(141), lens: "35mm" };
  assert.deepEqual(parseKolProfile(profileRow({ photos: [photo] }), BASE)?.photos, [{ url: img("p1"), aperture: "f/2.8", lens: "35mm" }]);
});

test("slot chỉ nhận 1 đến 4 kiểu số; recipe đúng dạng id thì giữ (tên công thức do giao diện kiểm)", () => {
  assert.deepEqual(parseKolProfile(profileRow({ photos: [{ url: img("p1"), slot: 4, recipe: "cool-tone" }] }), BASE)?.photos, [{ url: img("p1"), slot: 4, recipe: "cool-tone" }]);
  assert.deepEqual(parseKolProfile(profileRow({ photos: [{ url: img("p1"), slot: "2", recipe: "ND Filter" }] }), BASE)?.photos, [{ url: img("p1") }]);
});

test("mod chụp kèm: đúng hình dạng thì giữ; sai một khóa, giá trị hoặc patch rỗng thì bỏ cả mod, ảnh và các trường khác vẫn còn", () => {
  const good = { name: "Da ấm", base: "cool-tone", patch: { Sharpness: 2, Contrast: "+1" } };
  assert.deepEqual(parseKolProfile(profileRow({ photos: [{ url: img("p1"), iso: "400", mod: good }] }), BASE)?.photos, [{ url: img("p1"), iso: "400", mod: good }]);
  const dropped = parseKolProfile(
    profileRow({
      photos: [
        { url: img("p1"), iso: "400", mod: { ...good, patch: { "Sharp ness": 2 } } },
        { url: img("p2"), mod: { ...good, patch: { Sharpness: { x: 1 } } } },
        { url: img("p3"), mod: { ...good, patch: {} } },
      ],
    }),
    BASE,
  )?.photos;
  assert.deepEqual(dropped, [{ url: img("p1"), iso: "400" }, { url: img("p2") }, { url: img("p3") }]);
});

test("ảnh có ghi chú nhưng url sai thì cả hồ sơ bị loại", () => {
  assert.equal(parseKolProfile(profileRow({ photos: [{ url: "http://example.com/a.jpg", iso: "400" }] }), BASE), null);
});

test("dữ liệu quá 30 giây thì cần tải lại, còn mới thì giữ cache", () => {
  assert.equal(isStale(1000, 31000), false);
  assert.equal(isStale(1000, 31001), true);
  assert.equal(isStale(1000, 500, 0), false);
});

const LOCAL = { username: "ai.do", bio: "Bio máy", links: ["https://local.example"] };
const SESSION = { name: "Tên Google", avatar: GOOGLE };
const KOL: KolProfile = { handle: "ai-do", name: "Ai Đó", bio: "Bio KOL", link: "https://kol.example/ai-do", avatar: img("avatar"), cover: img("cover"), photos: [] };
const FALLBACK = { name: "Tên phiên", avatar: GOOGLE };

test("có hồ sơ KOL: hiển thị tên, handle, giới thiệu, ảnh của hồ sơ KOL; không lấy tên và ảnh phiên", () => {
  assert.deepEqual(displayIdentity(LOCAL, KOL, FALLBACK), { name: "Ai Đó", username: "ai-do", bio: "Bio KOL", links: ["https://local.example"], avatar: img("avatar") });
});

test("hồ sơ KOL không có ảnh thì ảnh hiển thị trống, không lấy ảnh phiên", () => {
  assert.equal(displayIdentity(LOCAL, { ...KOL, avatar: undefined }, FALLBACK).avatar, null);
});

test("không có hồ sơ KOL: hiển thị như hồ sơ máy, dùng tên và ảnh fallback", () => {
  assert.deepEqual(displayIdentity(LOCAL, null, FALLBACK), { name: "Tên phiên", username: "ai.do", bio: "Bio máy", links: ["https://local.example"], avatar: GOOGLE });
});

test("giới thiệu KOL trống: hiển thị trống, còn form điền bio của máy", () => {
  const kol = { ...KOL, bio: "" };
  assert.equal(displayIdentity(LOCAL, kol, FALLBACK).bio, "");
  assert.equal(draftIdentity(LOCAL, kol, SESSION).bio, "Bio máy");
});

test("liên kết: có liên kết của máy thì dùng; không có thì lấy link KOL; cả hai trống thì rỗng", () => {
  const none = { ...LOCAL, links: [] };
  assert.deepEqual(displayIdentity(LOCAL, KOL, FALLBACK).links, ["https://local.example"]);
  assert.deepEqual(displayIdentity(none, KOL, FALLBACK).links, ["https://kol.example/ai-do"]);
  assert.deepEqual(draftIdentity(none, KOL, SESSION).links, ["https://kol.example/ai-do"]);
  assert.deepEqual(displayIdentity(none, { ...KOL, link: undefined }, FALLBACK).links, []);
  assert.deepEqual(draftIdentity(none, null, SESSION).links, []);
});

test("handleFrom: chỉ giữ a–z, 0–9, gạch ngang; tối đa 30 ký tự", () => {
  assert.equal(handleFrom("Ai.Do_1-x"), "aido1-x");
  assert.equal(handleFrom("a".repeat(40)).length, 30);
  assert.equal(handleFrom("@@@"), "");
});

test("handle điền sẵn: có hồ sơ KOL thì lấy handle KOL, không có thì rút gọn tên người dùng trên máy", () => {
  assert.equal(draftIdentity(LOCAL, KOL, SESSION).handle, "ai-do");
  assert.equal(draftIdentity(LOCAL, null, SESSION).handle, "aido");
});

test("tên và ảnh điền sẵn: tên KOL trước, rồi tên phiên; ảnh KOL trước, rồi ảnh Google của phiên (ảnh lạ bị bỏ)", () => {
  assert.equal(draftIdentity(LOCAL, KOL, SESSION).name, "Ai Đó");
  assert.equal(draftIdentity(LOCAL, null, SESSION).name, "Tên Google");
  assert.equal(draftIdentity(LOCAL, null, { name: null, avatar: null }).name, "");
  assert.equal(draftIdentity(LOCAL, KOL, { name: null, avatar: null }).avatar, img("avatar"));
  assert.equal(draftIdentity(LOCAL, { ...KOL, avatar: undefined }, SESSION).avatar, GOOGLE);
  assert.equal(draftIdentity(LOCAL, null, { name: null, avatar: "https://evil.example/a.png" }).avatar, undefined);
});
