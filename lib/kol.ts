import { useEffect, useState } from "react";
import { AUTH_KEY, AUTH_URL, authReady, getSession, type Session } from "./auth.ts";
import type { PresetAuthor, PresetSet } from "./presetSets.ts";
import type { PpValues } from "./ppMods.ts";
import type { Profile } from "./profile.ts";

// KOL được duyệt tự đăng trang công khai (/kol/[handle]) và bộ M1–M4 (/bo-m1-m4). Dữ liệu nằm ở AUTH Supabase: supabase/kol.sql (chạy tay).
// Ranh giới tin cậy: mọi dòng đọc từ Supabase đi qua parseKolProfile / parseRemoteSet trước khi dùng.
// Mọi lỗi (mạng, bảng chưa tạo, authReady = false) đều trả về rỗng: trang công khai chỉ hiện dữ liệu trong repo.

/** Mod PP chụp kèm, chụp lại lúc lưu (không theo mod gốc trên máy). patch chỉ giữ giá trị khác công thức gốc. */
export type PhotoMod = { name: string; base: string; patch: PpValues };

/** Thông số và lời ghi của một ảnh mẫu. Mọi trường tùy chọn; không có trường nào thì ảnh chỉ là link. */
export type PhotoNote = {
  aperture?: string;
  shutter?: string;
  iso?: string;
  lens?: string;
  /** Ô M1–M4 của bộ KOL. */
  slot?: 1 | 2 | 3 | 4;
  /** id công thức Color Bank (lib/zve10/presets.json). Id lạ được giao diện bỏ qua. */
  recipe?: string;
  /** Mod PP chụp kèm. Giao diện kiểm lại bằng cleanPatch (lib/ppMods.ts) trước khi hiện; lib/kol.ts chỉ kiểm hình dạng. */
  mod?: PhotoMod;
  text?: string;
};

/** Ảnh mẫu: url kèm ghi chú (phẳng). Trong jsonb, ảnh không có ghi chú là chuỗi url (xem photosPayload). */
export type KolPhoto = PhotoNote & { url: string };

export type KolProfile = {
  handle: string;
  name: string;
  bio: string;
  link?: string;
  avatar?: string;
  cover?: string;
  /** Ảnh mẫu: URL trong bucket kol của AUTH project, hoặc link https tới file ảnh (xem photoUrl), kèm ghi chú tùy chọn. */
  photos: KolPhoto[];
};

/** Bộ M1–M4 của KOL. published = false chỉ thấy được ở "Bộ của tôi". */
export type RemoteSet = PresetSet & { author: PresetAuthor; published: boolean };

export const KOL_LIMITS = { name: 60, bio: 160, link: 200, photos: 12, sets: 1, imageBytes: 5 * 1024 * 1024, noteField: 40, noteText: 140 };
export const KOL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const HANDLE_MAX = 30;
export const HANDLE = /^[a-z0-9-]{1,30}$/;
const SET_ID = /^[a-z0-9-]{1,40}$/;
const RECIPE_ID = /^[a-z0-9-]{1,40}$/;
const UUID = /^[0-9a-f-]{36}$/;
const STORAGE_PATH = "/storage/v1/object/public/kol/";
const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

function str(v: unknown, min: number, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length >= min && t.length <= max ? t : null;
}

function httpUrl(s: string): string | null {
  if (s.length > KOL_LIMITS.link) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

/** Trường tùy chọn: thiếu hoặc rỗng thì undefined; có nhưng sai thì null (cả hồ sơ bị bỏ). */
function optional(v: unknown, check: (s: string) => string | null): string | undefined | null {
  if (v === undefined || v === null || v === "") return undefined;
  return typeof v === "string" ? check(v) : null;
}

/** Chỉ nhận ảnh nằm dưới tiền tố storage của AUTH project (https). Host khác, kể cả http, bị loại. */
const imageUrl = (base: string) => (s: string) => (s.length <= 300 && base && s.startsWith(`${base}${STORAGE_PATH}`) ? s : null);

const GOOGLE_AVATAR_HOST = "lh3.googleusercontent.com";
/** Ảnh tài khoản Google: https và đúng host (so hostname sau khi parse, không khớp chuỗi), tối đa 300 ký tự. Không hợp lệ thì undefined. */
export function googleAvatar(s: string | null | undefined): string | undefined {
  if (!s || s.length > 300) return undefined;
  try {
    const u = new URL(s);
    return u.protocol === "https:" && u.hostname === GOOGLE_AVATAR_HOST ? u.href : undefined;
  } catch {
    return undefined;
  }
}

/** Handle từ tên người dùng trên máy: chỉ giữ a–z, 0–9 và gạch ngang (bỏ dấu chấm, gạch dưới), tối đa 30 ký tự. */
export function handleFrom(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, HANDLE_MAX);
}

/** Liên kết dùng chung cho hiển thị và form: của máy nếu có, không thì link của hồ sơ KOL. */
const linksOf = (local: Profile, kol: KolProfile | null): string[] => (local.links.length ? local.links : kol?.link ? [kol.link] : []);

export type Identity = { name: string; username: string; bio: string; links: string[]; avatar: string | null };

/** Thông tin hiển thị ở /tai-khoan (tường, chia sẻ). Có hồ sơ KOL thì tên, handle, giới thiệu, ảnh lấy từ đó (giới thiệu trống vẫn trống); không có thì như hồ sơ máy, dùng tên và ảnh fallback. */
export function displayIdentity(local: Profile, kol: KolProfile | null, fallback: { name: string; avatar: string | null }): Identity {
  if (!kol) return { name: fallback.name, username: local.username, bio: local.bio, links: local.links, avatar: fallback.avatar };
  return { name: kol.name, username: kol.handle, bio: kol.bio, links: linksOf(local, kol), avatar: kol.avatar ?? null };
}

export type IdentityDraft = { handle: string; name: string; bio: string; links: string[]; avatar: string | undefined };

/** Giá trị điền sẵn của form Giới thiệu: ưu tiên hồ sơ KOL, trống thì lấy từ máy và phiên đăng nhập. Chỉ dùng cho form, không dùng để hiển thị. */
export function draftIdentity(local: Profile, kol: KolProfile | null, session: { name: string | null; avatar: string | null } | null): IdentityDraft {
  return {
    handle: kol?.handle || handleFrom(local.username),
    name: kol?.name || session?.name || "",
    bio: kol?.bio || local.bio,
    links: linksOf(local, kol),
    avatar: kol?.avatar ?? googleAvatar(session?.avatar),
  };
}

/** Ảnh đại diện: trong bucket kol của AUTH, hoặc ảnh tài khoản Google. Ảnh bìa và ảnh mẫu chỉ nhận bucket. */
const avatarUrl = (base: string) => (s: string) => imageUrl(base)(s) ?? googleAvatar(s) ?? null;

const PHOTO_MAX = 300;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Ảnh mẫu: URL trong bucket kol của base, hoặc link https ngoài trỏ tới file ảnh. Trả href đã chuẩn hóa, sai thì null.
 * Link ngoài: tối đa 300 ký tự, không khoảng trắng hay ký tự điều khiển, không userinfo, host có dấu chấm,
 * không phải localhost, IP hay IPv6. Chỉ kiểm tra cú pháp; ảnh có tải được hay không do trình soạn kiểm tra.
 */
export function photoUrl(s: string, base = AUTH_URL): string | null {
  if (typeof s !== "string" || s.length > PHOTO_MAX) return null;
  const bucket = imageUrl(base)(s);
  if (bucket) return bucket;
  if (/[\s\x00-\x1f\x7f]/.test(s)) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const host = u.hostname;
    if (!host.includes(".") || host === "localhost" || host.includes(":") || IPV4.test(host)) return null;
    return u.href;
  } catch {
    return null;
  }
}

// Giới hạn jsonb của photos trong supabase/kol.sql là octet_length < 16384; để dư chỗ cho khoảng trắng của jsonb.
const PHOTOS_BYTES = 16000;

const PP_KEY = /^[A-Za-z0-9_]{1,40}$/;

/** Mod chụp kèm: sai hình dạng thì bỏ cả mod (không phải riêng một giá trị). Khóa PP và giá trị hợp lệ được kiểm ở giao diện. */
function cleanMod(raw: unknown): PhotoMod | undefined {
  if (!isRecord(raw) || !isRecord(raw.patch)) return undefined;
  const name = str(raw.name, 1, KOL_LIMITS.noteField);
  const base = str(raw.base, 1, 40);
  const entries = Object.entries(raw.patch);
  if (!name || !base || !RECIPE_ID.test(base) || entries.length === 0 || entries.length > 40) return undefined;
  const patch: PpValues = {};
  for (const [key, v] of entries) {
    if (!PP_KEY.test(key)) return undefined;
    if (typeof v === "number" && Number.isFinite(v)) patch[key] = v;
    else if (typeof v === "string" && v.length >= 1 && v.length <= 40) patch[key] = v;
    else return undefined;
  }
  return { name, base, patch };
}

/**
 * Ghi chú từ dữ liệu từ xa hoặc từ form: trường sai kiểu, rỗng, quá dài hoặc không thuộc danh sách thì bỏ riêng trường đó,
 * không làm hỏng cả ảnh.
 */
function cleanNote(raw: Record<string, unknown>): PhotoNote {
  const note: PhotoNote = {};
  for (const k of ["aperture", "shutter", "iso", "lens"] as const) {
    const v = str(raw[k], 1, KOL_LIMITS.noteField);
    if (v) note[k] = v;
  }
  const recipe = str(raw.recipe, 1, 40);
  if (recipe && RECIPE_ID.test(recipe)) note.recipe = recipe;
  if (raw.slot === 1 || raw.slot === 2 || raw.slot === 3 || raw.slot === 4) note.slot = raw.slot;
  const mod = cleanMod(raw.mod);
  if (mod) note.mod = mod;
  const text = str(raw.text, 1, KOL_LIMITS.noteText);
  if (text) note.text = text;
  return note;
}

/** Ghi chú đã làm sạch của một ảnh, hoặc undefined nếu ảnh không có trường nào. */
export function photoNote(p: KolPhoto): PhotoNote | undefined {
  const note = cleanNote(p);
  return Object.keys(note).length > 0 ? note : undefined;
}

/** Một ảnh mẫu: chuỗi url, hoặc đối tượng {url, ...ghi chú}. url sai thì null; ghi chú sai thì chỉ bỏ trường đó. */
function photoOf(v: unknown, base: string): KolPhoto | null {
  if (typeof v === "string") {
    const url = photoUrl(v, base);
    return url ? { url } : null;
  }
  if (!isRecord(v) || typeof v.url !== "string") return null;
  const url = photoUrl(v.url, base);
  return url ? { ...cleanNote(v), url } : null;
}

/** Ảnh mẫu dạng jsonb: không có ghi chú thì là chuỗi url, có ghi chú thì là {url, ...ghi chú}. Không kiểm tra url (việc của photosOf). */
export function photosPayload(photos: readonly KolPhoto[]): unknown[] {
  return photos.map((p) => {
    const note = photoNote(p);
    return note ? { url: p.url, ...note } : p.url;
  });
}

/** Giá trị photos gửi đi. Quá PHOTOS_BYTES thì ném KolError("note-too-long") trước khi gọi mạng. */
function photosBody(photos: readonly KolPhoto[]): unknown[] {
  const body = photosPayload(photos);
  if (new TextEncoder().encode(JSON.stringify(body)).length > PHOTOS_BYTES) throw new KolError("note-too-long");
  return body;
}

/** Ảnh mẫu qua photoOf, bỏ ảnh trùng url (giữ ảnh đầu). Quá KOL_LIMITS.photos hoặc có ảnh sai url thì null. */
function photosOf(v: unknown, base: string): KolPhoto[] | null {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > KOL_LIMITS.photos) return null;
  const out: KolPhoto[] = [];
  for (const p of v) {
    const photo = photoOf(p, base);
    if (!photo) return null;
    if (!out.some((o) => o.url === photo.url)) out.push(photo);
  }
  return out;
}

/**
 * Hồ sơ KOL từ một dòng kol_profiles (hoặc bản chọn lọc của nó). Sai bất kỳ trường nào thì trả null.
 * base: origin của AUTH project; ảnh bucket phải nằm dưới base, ảnh đại diện còn có thể là ảnh Google, ảnh mẫu còn có thể là link https ngoài (photoUrl).
 */
export function parseKolProfile(raw: unknown, base = AUTH_URL): KolProfile | null {
  if (!isRecord(raw)) return null;
  const handle = typeof raw.handle === "string" && HANDLE.test(raw.handle) ? raw.handle : null;
  const name = str(raw.name, 1, KOL_LIMITS.name);
  const bio = raw.bio === undefined || raw.bio === null ? "" : str(raw.bio, 0, KOL_LIMITS.bio);
  const link = optional(raw.link, httpUrl);
  const avatar = optional(raw.avatar_url, avatarUrl(base));
  const cover = optional(raw.cover_url, imageUrl(base));
  const photos = photosOf(raw.photos, base);
  if (!handle || name === null || bio === null || link === null || avatar === null || cover === null || photos === null) return null;
  return {
    handle,
    name,
    bio,
    ...(link ? { link } : {}),
    ...(avatar ? { avatar } : {}),
    ...(cover ? { cover } : {}),
    photos,
  };
}

/**
 * Bộ từ một dòng kol_sets kèm tác giả (kol_profiles). Qua validatePresetSets như mọi bộ khác; module đó nạp lười vì kéo bảng zve10 nên không nằm trong bundle chung.
 * taken: id các bộ trong repo; trùng thì bỏ, để bộ repo luôn thắng. recommended không bao giờ lấy từ dữ liệu từ xa.
 */
export async function parseRemoteSet(raw: unknown, taken: ReadonlySet<string> = new Set(), base = AUTH_URL): Promise<RemoteSet | null> {
  if (!isRecord(raw) || typeof raw.id !== "string" || taken.has(raw.id)) return null;
  const owner = parseKolProfile(raw.kol_profiles, base);
  if (!owner) return null;
  const author: PresetAuthor = { name: owner.name, handle: owner.handle, ...(owner.avatar ? { avatar: owner.avatar } : {}), ...(owner.link ? { link: owner.link } : {}) };
  try {
    const { validatePresetSets } = await import("./presetSets.ts");
    const [set] = validatePresetSets([{ id: raw.id, name: raw.name, description: raw.description, slots: raw.slots, author }]);
    return { ...set, author, published: raw.published === true };
  } catch {
    return null;
  }
}

/** Các dòng qua được parseRemoteSet; dòng lỗi bị bỏ. */
async function parseRemoteSets(rows: unknown[], taken: ReadonlySet<string>): Promise<RemoteSet[]> {
  const sets = await Promise.all(rows.map((r) => parseRemoteSet(r, taken)));
  return sets.filter((s): s is RemoteSet => s !== null);
}

/** Ảnh có đúng loại và cỡ không. Trả mã lỗi để giao diện hiện đúng câu chữ, null nếu được. */
export function imageProblem(file: { type: string; size: number }): "type" | "size" | null {
  if (!(KOL_IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size > KOL_LIMITS.imageBytes) return "size";
  return null;
}

/** Còn được tạo bộ mới không: mỗi KOL chỉ có KOL_LIMITS.sets bộ. mySets là các bộ hiện có của tài khoản. */
export function canCreateSet(mySets: readonly { id: string }[]): boolean {
  return mySets.length < KOL_LIMITS.sets;
}

/** Mã lỗi khi tài khoản đã có bộ: trình soạn hiện câu chữ riêng, không coi là lỗi mạng hay trùng đường dẫn. */
export const SET_LIMIT_ERROR = "set-limit";

export class KolError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

const REST = `${AUTH_URL}/rest/v1`;
const SET_SELECT = "id,name,description,slots,published,kol_profiles(handle,name,avatar_url,link)";
const PROFILE_SELECT = "handle,name,bio,link,avatar_url,cover_url,photos";
// Chỉ mục duy nhất theo user_id trong supabase/kol.sql: mỗi KOL một bộ. Server trả 409 kèm tên chỉ mục này.
const ONE_SET_INDEX = "kol_sets_one_per_user";
// Sau mỗi lần ghi thành công thì xóa sạch cache để trang công khai không hiện bản cũ. at: lúc tải xong (ms), để làm mới khi quay lại tab.
const cache = new Map<string, { at: number; value: unknown }>();

/** Dữ liệu đã tải quá maxAge (mặc định 30 giây) thì cần tải lại. Hàm thuần, không đụng mạng. */
export function isStale(at: number, now: number, maxAge = 30000): boolean {
  return now - at > maxAge;
}

async function session(): Promise<Session | null> {
  if (!authReady) return null;
  return (await getSession()).session;
}

function headers(s: Session | null, write = false): Record<string, string> {
  return {
    apikey: AUTH_KEY,
    ...(s && { Authorization: `Bearer ${s.accessToken}` }),
    ...(write && { "Content-Type": "application/json", Prefer: "return=representation" }),
  };
}

async function ok(r: Response): Promise<unknown> {
  if (!r.ok) throw new KolError(`HTTP ${r.status}`, r.status);
  return r.json();
}

/** Bộ đã công khai, bỏ bộ trùng id trong repo. Chưa cấu hình thì rỗng. Lỗi mạng được ném ra để useCachedFetch giữ dữ liệu cũ khi làm mới. */
async function listPublicSets(taken: ReadonlySet<string>): Promise<RemoteSet[]> {
  if (!authReady) return [];
  const rows = await ok(await fetch(`${REST}/kol_sets?select=${SET_SELECT}&published=eq.true&order=updated_at.desc`, { headers: headers(await session()) }));
  return Array.isArray(rows) ? await parseRemoteSets(rows, taken) : [];
}

/** Một bộ theo id: bộ công khai, hoặc bản nháp nếu là của chính người dùng (RLS). null: không có hoặc lỗi. */
async function getRemoteSet(id: string, taken: ReadonlySet<string> = new Set()): Promise<RemoteSet | null> {
  if (!authReady || !SET_ID.test(id)) return null;
  try {
    const rows = await ok(await fetch(`${REST}/kol_sets?select=${SET_SELECT}&id=eq.${id}&limit=1`, { headers: headers(await session()) }));
    return Array.isArray(rows) ? await parseRemoteSet(rows[0], taken) : null;
  } catch {
    return null;
  }
}

/** Hồ sơ KOL theo handle. null: không có. Lỗi mạng được ném ra (xem listPublicSets). */
async function getKolProfile(handle: string): Promise<KolProfile | null> {
  if (!authReady || !HANDLE.test(handle)) return null;
  const rows = await ok(await fetch(`${REST}/kol_profiles?select=${PROFILE_SELECT}&handle=eq.${handle}&limit=1`, { headers: headers(await session()) }));
  return Array.isArray(rows) ? parseKolProfile(rows[0]) : null;
}

/** Tài khoản đang đăng nhập có phải KOL được duyệt không (RPC is_kol). Chưa đăng nhập hoặc lỗi thì false. */
async function isKol(): Promise<boolean> {
  const s = await session();
  if (!s) return false;
  try {
    return (await ok(await fetch(`${REST}/rpc/is_kol`, { method: "POST", headers: headers(s, true), body: "{}" }))) === true;
  } catch {
    return false;
  }
}

/**
 * Hồ sơ KOL của tài khoản đang đăng nhập, kể cả khi chưa công khai bộ nào. Chưa có hồ sơ thì null.
 * Lỗi mạng hoặc HTTP được ném ra, không coi là chưa có hồ sơ (KolProvider ở /tai-khoan hiện nút thử lại).
 */
export async function getMyKol(userId: string): Promise<KolProfile | null> {
  if (!authReady || !UUID.test(userId)) throw new KolError("not-ready");
  const rows = await ok(await fetch(`${REST}/kol_profiles?select=${PROFILE_SELECT}&user_id=eq.${userId}&limit=1`, { headers: headers(await session()) }));
  if (!Array.isArray(rows)) throw new KolError("bad-response");
  if (rows.length === 0) return null;
  const profile = parseKolProfile(rows[0]);
  if (!profile) throw new KolError("bad-response");
  return profile;
}

/**
 * Bộ của chính người dùng, gồm bản nháp. Khác các hàm đọc khác, lỗi được ném ra để tường bộ ở /tai-khoan
 * báo lỗi thay vì hiện danh sách rỗng.
 */
export async function listMySets(userId: string, taken: ReadonlySet<string>): Promise<RemoteSet[]> {
  if (!authReady || !UUID.test(userId)) throw new KolError("not-ready");
  const rows = await ok(await fetch(`${REST}/kol_sets?select=${SET_SELECT}&user_id=eq.${userId}&order=updated_at.desc`, { headers: headers(await session()) }));
  return Array.isArray(rows) ? await parseRemoteSets(rows, taken) : [];
}

/** Ghi hồ sơ KOL: sửa dòng có sẵn, nếu chưa có thì tạo. Handle trùng người khác báo lỗi 409. */
export async function saveProfile(userId: string, p: KolProfile): Promise<KolProfile> {
  const s = await session();
  if (!s || s.user.id !== userId) throw new KolError("signed-out", 401);
  const fields = {
    handle: p.handle,
    name: p.name,
    bio: p.bio,
    link: p.link ?? null,
    avatar_url: p.avatar ?? null,
    cover_url: p.cover ?? null,
    photos: photosBody(p.photos),
    updated_at: new Date().toISOString(),
  };
  const patched = await ok(await fetch(`${REST}/kol_profiles?user_id=eq.${userId}`, { method: "PATCH", headers: headers(s, true), body: JSON.stringify(fields) }));
  let row = Array.isArray(patched) ? patched[0] : undefined;
  if (!row) {
    const created = await ok(await fetch(`${REST}/kol_profiles`, { method: "POST", headers: headers(s, true), body: JSON.stringify({ ...fields, user_id: userId }) }));
    row = Array.isArray(created) ? created[0] : undefined;
  }
  const saved = parseKolProfile(row);
  if (!saved) throw new KolError("bad-response");
  cache.clear();
  return saved;
}

/**
 * Ghi ảnh mẫu ngay, không cần Lưu hồ sơ. Mỗi ảnh qua photosOf, không trùng, tối đa KOL_LIMITS.photos; sai thì ném KolError("bad-photos"); ghi chú quá dài thì ném KolError("note-too-long").
 * Chưa có hồ sơ (PATCH không khớp dòng nào) thì ném KolError("not-saved"): trình soạn giữ ảnh trong form đến khi Lưu hồ sơ.
 */
export async function savePhotos(userId: string, photos: KolPhoto[]): Promise<void> {
  const s = await session();
  if (!s || s.user.id !== userId) throw new KolError("signed-out", 401);
  const clean = photosOf(photosPayload(photos), AUTH_URL);
  if (!clean || clean.length !== photos.length) throw new KolError("bad-photos");
  const rows = await ok(await fetch(`${REST}/kol_profiles?user_id=eq.${userId}`, { method: "PATCH", headers: headers(s, true), body: JSON.stringify({ photos: photosBody(clean), updated_at: new Date().toISOString() }) }));
  if (!Array.isArray(rows) || rows.length !== 1) throw new KolError("not-saved");
  cache.clear();
}

/**
 * Ghi một bộ. previousId khác set.id (đổi slug) thì tạo bộ mới rồi xóa bộ cũ.
 * Bộ không qua validatePresetSets thì ném PresetError. Kiểm tra trùng id với repo do giao diện làm.
 * Tạo mới (kể cả đổi đường dẫn) chỉ khi tài khoản chưa có bộ nào, không thì ném KolError(SET_LIMIT_ERROR).
 */
export async function saveSet(userId: string, set: PresetSet, published: boolean, previousId?: string): Promise<void> {
  const s = await session();
  if (!s || s.user.id !== userId) throw new KolError("signed-out", 401);
  const { validatePresetSets } = await import("./presetSets.ts");
  const [clean] = validatePresetSets([{ id: set.id, name: set.name, description: set.description, slots: set.slots }]);
  const fields = { name: clean.name, description: clean.description, slots: clean.slots, published, updated_at: new Date().toISOString() };
  if (previousId === clean.id) {
    const rows = await ok(await fetch(`${REST}/kol_sets?id=eq.${clean.id}`, { method: "PATCH", headers: headers(s, true), body: JSON.stringify(fields) }));
    if (!Array.isArray(rows) || rows.length !== 1) throw new KolError("not-saved");
  } else {
    // Kiểm tra trước để báo rõ; hai lần tạo cùng lúc thì chỉ mục duy nhất ở dưới chặn lần sau.
    if (!canCreateSet(await listMySets(userId, new Set()))) throw new KolError(SET_LIMIT_ERROR);
    const created = await fetch(`${REST}/kol_sets`, { method: "POST", headers: headers(s, true), body: JSON.stringify({ ...fields, id: clean.id, user_id: userId }) });
    if (created.status === 409 && (await created.text()).includes(ONE_SET_INDEX)) throw new KolError(SET_LIMIT_ERROR, 409);
    await ok(created);
    if (previousId) await deleteSet(previousId);
  }
  cache.clear();
}

/** Xóa bộ của mình (RLS chặn bộ người khác). */
export async function deleteSet(id: string): Promise<void> {
  if (!SET_ID.test(id)) throw new KolError("bad-id");
  const rows = await ok(await fetch(`${REST}/kol_sets?id=eq.${id}`, { method: "DELETE", headers: headers(await session(), true) }));
  if (!Array.isArray(rows) || rows.length !== 1) throw new KolError("not-deleted");
  cache.clear();
}

/** Tải ảnh lên bucket kol trong thư mục của người dùng; trả về URL công khai. */
export async function uploadImage(userId: string, file: File): Promise<string> {
  const s = await session();
  if (!s || s.user.id !== userId) throw new KolError("signed-out", 401);
  const problem = imageProblem(file);
  if (problem) throw new KolError(problem);
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const r = await fetch(`${AUTH_URL}/storage/v1/object/kol/${path}`, {
    method: "POST",
    headers: { apikey: AUTH_KEY, Authorization: `Bearer ${s.accessToken}`, "Content-Type": file.type },
    body: file,
  });
  if (!r.ok) throw new KolError(`HTTP ${r.status}`, r.status);
  return `${AUTH_URL}/storage/v1/object/public/kol/${path}`;
}

/**
 * Hook đọc một lần cho mỗi key, cache theo module. Trả undefined khi đang tải (kể cả render đầu tiên,
 * nên SSR và client khớp nhau). Lỗi lần đầu thì ra fallback. known: giá trị đã biết trước khi render (không có backend thì không có gì để tải), có sẵn trong HTML, không chờ effect.
 * watch: khi tab hiện lại mà cache đã cũ (isStale) thì tải lại; lỗi khi làm mới thì giữ dữ liệu đang có. Không polling.
 */
function useCachedFetch<T>(key: string, load: () => Promise<T>, fallback: T, known?: T, watch = false): T | undefined {
  const [state, setState] = useState<{ key: string; value: T } | null>(() => (known === undefined ? null : { key, value: known }));
  useEffect(() => {
    if (known !== undefined) return;
    let live = true;
    const done = (value: T) => {
      if (live) setState({ key, value });
    };
    const store = (value: T) => {
      cache.set(key, { at: Date.now(), value });
      done(value);
    };
    const hit = cache.get(key);
    if (hit) done(hit.value as T);
    else load().then(store, () => done(fallback));
    const onVisible = () => {
      const cur = cache.get(key);
      if (document.visibilityState !== "visible" || !cur || !isStale(cur.at, Date.now())) return;
      load().then(store, () => {});
    };
    if (watch) document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
    // Khóa theo key: load và fallback của cùng một key luôn giống nhau nên không đưa vào danh sách phụ thuộc.
  }, [key]);
  return state?.key === key ? state.value : undefined;
}

/** Bộ công khai của KOL, không gồm bộ trùng id repo. undefined khi đang tải; [] khi lỗi lần đầu. taken là danh sách cố định của repo. Tab quay lại thì làm mới (xem useCachedFetch). */
export function useRemoteSetList(taken: ReadonlySet<string>): RemoteSet[] | undefined {
  // Chưa cấu hình AUTH thì không có bộ từ xa: [] ngay, nên dòng "chưa có bộ" nằm trong HTML thay vì chờ effect.
  return useCachedFetch("sets", () => listPublicSets(taken), [] as RemoteSet[], authReady ? undefined : [], true);
}

/** Như useRemoteSetList nhưng [] khi đang tải hoặc lỗi. */
export function useRemoteSets(taken: ReadonlySet<string>): RemoteSet[] {
  return useRemoteSetList(taken) ?? [];
}

/** Một bộ từ xa theo id. undefined khi đang tải, null khi không có. */
export function useRemoteSet(id: string): RemoteSet | null | undefined {
  return useCachedFetch(`set:${id}`, () => getRemoteSet(id), null as RemoteSet | null);
}

/** Hồ sơ KOL theo handle. undefined khi đang tải, null khi không có. Tab quay lại thì làm mới (xem useCachedFetch). */
export function useKolProfile(handle: string): KolProfile | null | undefined {
  return useCachedFetch(`profile:${handle}`, () => getKolProfile(handle), null as KolProfile | null, undefined, true);
}

/** Tài khoản này có phải KOL không. undefined khi đang kiểm tra. */
export function useIsKol(userId: string | undefined): boolean | undefined {
  return useCachedFetch(`kol:${userId ?? ""}`, () => (userId ? isKol() : Promise.resolve(false)), false);
}
