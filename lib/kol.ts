import { useEffect, useState } from "react";
import { AUTH_KEY, AUTH_URL, authReady, getSession, type Session } from "./auth.ts";
import { validatePresetSets, type PresetAuthor, type PresetSet } from "./presetSets.ts";

// KOL được duyệt tự đăng trang công khai (/kol/[handle]) và bộ M1–M4 (/bo-m1-m4). Dữ liệu nằm ở AUTH Supabase: supabase/kol.sql (chạy tay).
// Ranh giới tin cậy: mọi dòng đọc từ Supabase đi qua parseKolProfile / parseRemoteSet trước khi dùng.
// Mọi lỗi (mạng, bảng chưa tạo, authReady = false) đều trả về rỗng: trang công khai chỉ hiện dữ liệu trong repo.

export type KolProfile = {
  handle: string;
  name: string;
  bio: string;
  link?: string;
  avatar?: string;
  cover?: string;
  /** Ảnh mẫu, mỗi ảnh là URL trong bucket kol của AUTH project. */
  photos: string[];
};

/** Bộ M1–M4 của KOL. published = false chỉ thấy được ở "Bộ của tôi". */
export type RemoteSet = PresetSet & { author: PresetAuthor; published: boolean };

export const KOL_LIMITS = { name: 60, bio: 160, link: 200, photos: 12, imageBytes: 5 * 1024 * 1024 };
export const KOL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const HANDLE = /^[a-z0-9-]{1,30}$/;
const SET_ID = /^[a-z0-9-]{1,40}$/;
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

/** Ảnh đại diện: trong bucket kol của AUTH, hoặc ảnh tài khoản Google. Ảnh bìa và ảnh mẫu chỉ nhận bucket. */
const avatarUrl = (base: string) => (s: string) => imageUrl(base)(s) ?? googleAvatar(s) ?? null;

function photosOf(v: unknown, base: string): string[] | null {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > KOL_LIMITS.photos) return null;
  const out: string[] = [];
  for (const p of v) {
    const url = typeof p === "string" ? imageUrl(base)(p) : null;
    if (!url) return null;
    out.push(url);
  }
  return out;
}

/**
 * Hồ sơ KOL từ một dòng kol_profiles (hoặc bản chọn lọc của nó). Sai bất kỳ trường nào thì trả null.
 * base: origin của AUTH project; ảnh bucket phải nằm dưới base, ảnh đại diện còn có thể là ảnh Google.
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
 * Bộ từ một dòng kol_sets kèm tác giả (kol_profiles). Qua validatePresetSets như mọi bộ khác.
 * taken: id các bộ trong repo; trùng thì bỏ, để bộ repo luôn thắng. recommended không bao giờ lấy từ dữ liệu từ xa.
 */
export function parseRemoteSet(raw: unknown, taken: ReadonlySet<string> = new Set(), base = AUTH_URL): RemoteSet | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || taken.has(raw.id)) return null;
  const owner = parseKolProfile(raw.kol_profiles, base);
  if (!owner) return null;
  const author: PresetAuthor = { name: owner.name, handle: owner.handle, ...(owner.avatar ? { avatar: owner.avatar } : {}), ...(owner.link ? { link: owner.link } : {}) };
  try {
    const [set] = validatePresetSets([{ id: raw.id, name: raw.name, description: raw.description, slots: raw.slots, author }]);
    return { ...set, author, published: raw.published === true };
  } catch {
    return null;
  }
}

/** Ảnh có đúng loại và cỡ không. Trả mã lỗi để giao diện hiện đúng câu chữ, null nếu được. */
export function imageProblem(file: { type: string; size: number }): "type" | "size" | null {
  if (!(KOL_IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size > KOL_LIMITS.imageBytes) return "size";
  return null;
}

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
// Sau mỗi lần ghi thành công thì xóa sạch cache để trang công khai không hiện bản cũ.
const cache = new Map<string, unknown>();

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

/** Bộ đã công khai, bỏ bộ trùng id trong repo. Lỗi hoặc chưa cấu hình thì rỗng. */
export async function listPublicSets(taken: ReadonlySet<string>): Promise<RemoteSet[]> {
  if (!authReady) return [];
  try {
    const rows = await ok(await fetch(`${REST}/kol_sets?select=${SET_SELECT}&published=eq.true&order=updated_at.desc`, { headers: headers(await session()) }));
    return Array.isArray(rows) ? rows.flatMap((r) => parseRemoteSet(r, taken) ?? []) : [];
  } catch {
    return [];
  }
}

/** Một bộ theo id: bộ công khai, hoặc bản nháp nếu là của chính người dùng (RLS). null: không có hoặc lỗi. */
export async function getRemoteSet(id: string, taken: ReadonlySet<string> = new Set()): Promise<RemoteSet | null> {
  if (!authReady || !SET_ID.test(id)) return null;
  try {
    const rows = await ok(await fetch(`${REST}/kol_sets?select=${SET_SELECT}&id=eq.${id}&limit=1`, { headers: headers(await session()) }));
    return Array.isArray(rows) ? parseRemoteSet(rows[0], taken) : null;
  } catch {
    return null;
  }
}

/** Hồ sơ KOL theo handle. null: không có hoặc lỗi. */
export async function getKolProfile(handle: string): Promise<KolProfile | null> {
  if (!authReady || !HANDLE.test(handle)) return null;
  try {
    const rows = await ok(await fetch(`${REST}/kol_profiles?select=${PROFILE_SELECT}&handle=eq.${handle}&limit=1`, { headers: headers(await session()) }));
    return Array.isArray(rows) ? parseKolProfile(rows[0]) : null;
  } catch {
    return null;
  }
}

/** Tài khoản đang đăng nhập có phải KOL được duyệt không (RPC is_kol). Chưa đăng nhập hoặc lỗi thì false. */
export async function isKol(): Promise<boolean> {
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
 * Lỗi mạng hoặc HTTP được ném ra, không coi là chưa có hồ sơ (trang /kol/sua hiện nút thử lại).
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
 * Bộ của chính người dùng, gồm bản nháp. Khác các hàm đọc khác, lỗi được ném ra để trang /kol/sua
 * báo lỗi thay vì hiện danh sách rỗng.
 */
export async function listMySets(userId: string, taken: ReadonlySet<string>): Promise<RemoteSet[]> {
  if (!authReady || !UUID.test(userId)) throw new KolError("not-ready");
  const rows = await ok(await fetch(`${REST}/kol_sets?select=${SET_SELECT}&user_id=eq.${userId}&order=updated_at.desc`, { headers: headers(await session()) }));
  return Array.isArray(rows) ? rows.flatMap((r) => parseRemoteSet(r, taken) ?? []) : [];
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
    photos: p.photos,
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
 * Ghi một bộ. previousId khác set.id (đổi slug) thì tạo bộ mới rồi xóa bộ cũ.
 * Bộ không qua validatePresetSets thì ném PresetError. Kiểm tra trùng id với repo do giao diện làm.
 */
export async function saveSet(userId: string, set: PresetSet, published: boolean, previousId?: string): Promise<void> {
  const s = await session();
  if (!s || s.user.id !== userId) throw new KolError("signed-out", 401);
  const [clean] = validatePresetSets([{ id: set.id, name: set.name, description: set.description, slots: set.slots }]);
  const fields = { name: clean.name, description: clean.description, slots: clean.slots, published, updated_at: new Date().toISOString() };
  if (previousId === clean.id) {
    const rows = await ok(await fetch(`${REST}/kol_sets?id=eq.${clean.id}`, { method: "PATCH", headers: headers(s, true), body: JSON.stringify(fields) }));
    if (!Array.isArray(rows) || rows.length !== 1) throw new KolError("not-saved");
  } else {
    await ok(await fetch(`${REST}/kol_sets`, { method: "POST", headers: headers(s, true), body: JSON.stringify({ ...fields, id: clean.id, user_id: userId }) }));
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
 * nên SSR và client khớp nhau). Fetcher đã tự bắt lỗi nên giá trị luôn là kết quả hoặc fallback.
 */
export function useCachedFetch<T>(key: string, load: () => Promise<T>, fallback: T): T | undefined {
  const [state, setState] = useState<{ key: string; value: T } | null>(null);
  useEffect(() => {
    let live = true;
    const done = (value: T) => {
      if (live) setState({ key, value });
    };
    if (cache.has(key)) done(cache.get(key) as T);
    else
      load().then(
        (v) => {
          cache.set(key, v);
          done(v);
        },
        () => done(fallback),
      );
    return () => {
      live = false;
    };
    // Khóa theo key: load và fallback của cùng một key luôn giống nhau nên không đưa vào danh sách phụ thuộc.
  }, [key]);
  return state?.key === key ? state.value : undefined;
}

/** Bộ công khai của KOL, không gồm bộ trùng id repo. undefined khi đang tải; [] khi lỗi. taken là danh sách cố định của repo. */
export function useRemoteSetList(taken: ReadonlySet<string>): RemoteSet[] | undefined {
  return useCachedFetch("sets", () => listPublicSets(taken), [] as RemoteSet[]);
}

/** Như useRemoteSetList nhưng [] khi đang tải hoặc lỗi. */
export function useRemoteSets(taken: ReadonlySet<string>): RemoteSet[] {
  return useRemoteSetList(taken) ?? [];
}

/** Một bộ từ xa theo id. undefined khi đang tải, null khi không có. */
export function useRemoteSet(id: string): RemoteSet | null | undefined {
  return useCachedFetch(`set:${id}`, () => getRemoteSet(id), null as RemoteSet | null);
}

/** Hồ sơ KOL theo handle. undefined khi đang tải, null khi không có. */
export function useKolProfile(handle: string): KolProfile | null | undefined {
  return useCachedFetch(`profile:${handle}`, () => getKolProfile(handle), null as KolProfile | null);
}

/** Tài khoản này có phải KOL không. undefined khi đang kiểm tra. */
export function useIsKol(userId: string | undefined): boolean | undefined {
  return useCachedFetch(`kol:${userId ?? ""}`, () => (userId ? isKol() : Promise.resolve(false)), false);
}
