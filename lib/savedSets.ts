"use client";

import { useSyncExternalStore } from "react";

/** Bộ M1–M4 đã sưu tầm ("Sưu tầm" ở /bo-m1-m4): danh sách id bộ trong data/preset-sets.json, lưu mới nhất ở đầu. */
export const MAX_SAVED = 50;
const KEY = "saved-sets";
const EVENT = "saved-sets";
const EMPTY: string[] = [];
const ID = /^[a-z0-9-]{1,40}$/;

/** localStorage là dữ liệu cũ hoặc bị sửa tay: chỉ nhận chuỗi đúng dạng id, bỏ trùng, tối đa 50. */
export function parseSaved(raw: string | null): string[] {
  try {
    const list: unknown = JSON.parse(raw ?? "");
    if (!Array.isArray(list)) return EMPTY;
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of list) {
      if (typeof id !== "string" || !ID.test(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length === MAX_SAVED) break;
    }
    return out;
  } catch {
    return EMPTY;
  }
}

/** Đã sưu tầm thì bỏ ra; chưa sưu tầm thì thêm lên đầu. Đủ 50 bộ thì bỏ qua (không đẩy bộ cũ ra). */
export function toggleSaved(list: string[], id: string): string[] {
  if (!ID.test(id)) return list;
  if (list.includes(id)) return list.filter((x) => x !== id);
  if (list.length >= MAX_SAVED) return list;
  return [id, ...list];
}

let raw: string | null | undefined;
let cached = EMPTY;
function snapshot(): string[] {
  const r = localStorage.getItem(KEY);
  if (r !== raw) { raw = r; cached = parseSaved(r); }
  return cached;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function readSaved(): string[] {
  return typeof window === "undefined" ? EMPTY : snapshot();
}

export function writeSaved(list: string[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
}

export function useSavedSets(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
