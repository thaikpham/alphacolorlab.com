"use client";

import { useSyncExternalStore } from "react";
import { loadGearIds, parseGear, type GearBag } from "./gear.ts";

// Hồ sơ người dùng ở /tai-khoan: username, bio, link. Lưu trong localStorage ("user-profile"), đồng bộ theo tài khoản (lib/userState).
// Chia sẻ hồ sơ không cần server: cả hồ sơ + túi đồ nén vào phần # của link /ho-so (không gửi lên máy chủ khi mở).

export interface Profile {
  username: string;
  bio: string;
  links: string[];
}

export interface SharedProfile extends Profile {
  name: string;
  avatar: string | null;
  gear: GearBag;
}

const KEY = "user-profile";
const EMPTY_PROFILE: Profile = { username: "", bio: "", links: [] };
export const LIMITS = { username: 30, bio: 160, links: 5, name: 60 };

export const cleanUsername = (s: string) =>
  s
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, LIMITS.username);

/** Chỉ nhận link http(s) (chặn javascript:, data:…); thiếu giao thức thì thêm https://. Link hỏng trả null. */
export function cleanLink(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  try {
    // "example.com:8080/x" có dấu hai chấm nhưng sau nó là số (cổng), không phải giao thức
    const u = new URL(/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(t) ? t : `https://${t}`);
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".") ? u.href : null;
  } catch {
    return null;
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseProfile(raw: unknown): Profile {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const links = Array.isArray(p.links) ? p.links.flatMap((l) => (typeof l === "string" && cleanLink(l) ? [cleanLink(l)!] : [])) : [];
  return {
    username: cleanUsername(typeof p.username === "string" ? p.username : ""),
    bio: str(p.bio, LIMITS.bio),
    links: [...new Set(links)].slice(0, LIMITS.links),
  };
}

const readJson = (raw: string | null) => {
  try {
    return JSON.parse(raw ?? "null");
  } catch {
    return null;
  }
};

// base64url của chuỗi UTF-8 (tên, bio tiếng Việt)
const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

export function encodeShare(p: SharedProfile): string {
  return toB64(JSON.stringify({ n: p.name, a: p.avatar, u: p.username, b: p.bio, l: p.links, g: p.gear }));
}

/** Đọc hồ sơ từ link chia sẻ. Mọi trường được kiểm lại như dữ liệu người lạ gửi: link chỉ http(s), ảnh chỉ https, món lạ bị bỏ. */
export async function decodeShare(s: string): Promise<SharedProfile | null> {
  try {
    const d = JSON.parse(fromB64(s)) as Record<string, unknown>;
    const avatar = typeof d.a === "string" && cleanLink(d.a)?.startsWith("https:") ? cleanLink(d.a) : null;
    return { name: str(d.n, LIMITS.name), avatar, ...parseProfile({ username: d.u, bio: d.b, links: d.l }), gear: parseGear(JSON.stringify(d.g ?? null), await loadGearIds()) };
  } catch {
    return null;
  }
}

let raw: string | null | undefined;
let cached = EMPTY_PROFILE;
function snapshot(): Profile {
  const r = localStorage.getItem(KEY);
  if (r !== raw) {
    raw = r;
    cached = parseProfile(readJson(r));
  }
  return cached;
}

export function writeProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(parseProfile(p)));
  window.dispatchEvent(new Event(KEY));
}

export function parseProfileRaw(r: string | null): Profile {
  return parseProfile(readJson(r));
}

export function useProfile(): Profile {
  return useSyncExternalStore(
    (f) => {
      addEventListener("storage", f);
      addEventListener(KEY, f);
      return () => {
        removeEventListener("storage", f);
        removeEventListener(KEY, f);
      };
    },
    snapshot,
    () => EMPTY_PROFILE,
  );
}
