"use client";

import { useSyncExternalStore } from "react";
import presets, { type Preset } from "./zve10/presets.ts";
import { PP_FIELDS } from "./zve10/dat.ts";
import { ppValue } from "./presetSets.ts";

// Mod PP: bản chỉnh Picture Profile của một công thức Color Bank. Chỉ lưu các giá trị khác công thức gốc.
// localStorage giữ ở key "pp-mods" (cũng là tên sự kiện), đồng bộ tài khoản qua lib/userState.ts.
// Ranh giới tin cậy: dữ liệu đọc từ localStorage hay từ máy khác đều qua parseMods, và giá trị qua cleanPatch.

export type PpValues = Record<string, string | number>;
export type PpMod = { id: string; name: string; base: string; patch: PpValues };
export type PpChange = { key: string; label: string; from?: string | number; to: string | number };

export const MOD_LIMITS = { mods: 20, name: 40 };
export const MODS_KEY = "pp-mods";
const ID = /^[a-z0-9-]{1,40}$/;
const EMPTY: PpMod[] = [];

/** Công thức gốc theo id, hoặc null nếu không có. */
export function baseRecipe(id: string): Preset | null {
  return presets.find((p) => p.id === id) ?? null;
}

/** Giá trị gửi lên (từ form hay localStorage) → chỉ các giá trị khác công thức gốc. null nếu gốc không dùng được (không có, bị chặn) hoặc có khóa/giá trị sai. */
export function cleanPatch(base: string, raw: unknown): PpValues | null {
  const preset = baseRecipe(base);
  if (!preset || preset.blocked || !raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: PpValues = {};
  for (const [key, v] of Object.entries(raw)) {
    const field = PP_FIELDS.find((f) => f.key === key);
    if (!field) return null;
    if (v === undefined) continue;
    let value: string | number;
    try {
      value = ppValue(field, v, key);
    } catch {
      return null;
    }
    const was = preset.pp[key];
    if (was === undefined || String(was) !== String(value)) out[key] = value;
  }
  return out;
}

/** Các giá trị của mod (chỉ phần khác công thức gốc). */
export function patchOf(mod: PpMod): PpValues {
  return { ...mod.patch };
}

/** Các giá trị đã đổi so với công thức gốc, theo thứ tự menu. Gốc không có thì trả về mảng rỗng. */
export function changesOf(base: string, patch: PpValues): PpChange[] {
  const preset = baseRecipe(base);
  if (!preset) return [];
  return PP_FIELDS.flatMap((f) => {
    const to = patch[f.key];
    if (to === undefined) return [];
    const from = preset.pp[f.key];
    return from !== undefined && String(from) === String(to) ? [] : [{ key: f.key, label: f.label, from, to }];
  });
}

/** Chuỗi JSON từ localStorage hoặc đồng bộ → mod hợp lệ. Mod sai bị bỏ, id trùng giữ cái đầu, tối đa MOD_LIMITS.mods. */
export function parseMods(raw: string | null | undefined): PpMod[] {
  let list: unknown;
  try {
    list = JSON.parse(raw ?? "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: PpMod[] = [];
  for (const item of list) {
    if (out.length >= MOD_LIMITS.mods) break;
    if (!item || typeof item !== "object") continue;
    const { id, name, base, patch } = item as Record<string, unknown>;
    if (typeof id !== "string" || !ID.test(id) || seen.has(id)) continue;
    if (typeof name !== "string" || typeof base !== "string") continue;
    const clean = cleanPatch(base, patch);
    const label = name.trim().slice(0, MOD_LIMITS.name);
    if (!clean || !Object.keys(clean).length || !label) continue;
    seen.add(id);
    out.push({ id, name: label, base, patch: clean });
  }
  return out;
}

/** Id mới cho mod: chữ thường và số, khớp ID trong parseMods. */
export function newModId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

let raw: string | null | undefined;
let cached: PpMod[] = EMPTY;
function snapshot(): PpMod[] {
  const r = localStorage.getItem(MODS_KEY);
  if (r !== raw) {
    raw = r;
    cached = parseMods(r);
  }
  return cached;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(MODS_KEY, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(MODS_KEY, callback);
  };
}

export function writeMods(mods: PpMod[]): void {
  localStorage.setItem(MODS_KEY, JSON.stringify(mods));
  window.dispatchEvent(new Event(MODS_KEY));
}

export function useMods(): PpMod[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
