"use client";

import { useSyncExternalStore } from "react";

/** Giỏ Color Bank: mỗi ô M1–M4 giữ tối đa 10 công thức theo thứ tự PP1…PP10. PP1 quyết định cân bằng trắng của ô. */
export type Slot = 1 | 2 | 3 | 4;
export interface Cart { target: Slot; slots: Record<Slot, string[]> }

export const SLOTS: Slot[] = [1, 2, 3, 4];
export const PP_PER_SLOT = 10;
const KEY = "color-bank-cart";
const EVENT = "color-bank-cart";
export const EMPTY_CART: Cart = { target: 1, slots: { 1: [], 2: [], 3: [], 4: [] } };

/** localStorage là dữ liệu cũ hoặc bị sửa tay: chỉ nhận đúng hình dạng, id là chuỗi, mỗi ô tối đa 10, không trùng. */
export function parseCart(raw: string | null): Cart {
  try {
    const c = JSON.parse(raw ?? "");
    const seen = new Set<string>();
    const slots = Object.fromEntries(
      SLOTS.map((m) => [m, (Array.isArray(c?.slots?.[m]) ? c.slots[m] : [])
        .filter((id: unknown) => typeof id === "string" && !seen.has(id) && seen.add(id))
        .slice(0, PP_PER_SLOT)]),
    ) as Cart["slots"];
    return { target: SLOTS.includes(c?.target) ? c.target : 1, slots };
  } catch {
    return EMPTY_CART;
  }
}

/** Vị trí của công thức trong giỏ, hoặc null. pp: 1…10. */
export function placeOf(cart: Cart, id: string): { slot: Slot; pp: number } | null {
  for (const m of SLOTS) {
    const i = cart.slots[m].indexOf(id);
    if (i >= 0) return { slot: m, pp: i + 1 };
  }
  return null;
}

/** Convert cart to slot state: PP1 = first valid recipe, ppBanks = rest. Invalid/blocked ids dropped.
 * getRecipe: callback to get recipe by id and extract { pp, wb } fields. */
export function cartToSlots(
  cart: Cart,
  getRecipe: (id: string) => { pp?: any; wb?: any } | null
): Partial<Record<Slot, any>> {
  const result: Partial<Record<Slot, any>> = {};
  for (const slot of SLOTS) {
    const validIds = cart.slots[slot].filter(id => getRecipe(id) !== null);
    if (validIds.length === 0) continue;
    const [pp1Id, ...bankIds] = validIds;
    const pp1Recipe = getRecipe(pp1Id)!;
    result[slot] = {
      recipeId: pp1Id,
      pp: pp1Recipe.pp,
      wb: pp1Recipe.wb ? { ...pp1Recipe.wb } : undefined,
      ppBanks: bankIds.length > 0 ? Object.fromEntries(
        bankIds.map((id, i) => [
          i + 2, // PP2, PP3, etc.
          getRecipe(id)?.pp || {},
        ])
      ) : undefined,
      bankIds: bankIds.length > 0 ? Object.fromEntries(
        bankIds.map((id, i) => [i + 2, id])
      ) : undefined,
    };
  }
  return result;
}

/** Có trong giỏ thì bỏ ra; chưa có thì thêm vào cuối ô đang chọn (bỏ qua nếu ô đã đủ 10). */
export function toggle(cart: Cart, id: string): Cart {
  const at = placeOf(cart, id);
  if (at) return { ...cart, slots: { ...cart.slots, [at.slot]: cart.slots[at.slot].filter((x) => x !== id) } };
  const list = cart.slots[cart.target];
  if (list.length >= PP_PER_SLOT) return cart;
  return { ...cart, slots: { ...cart.slots, [cart.target]: [...list, id] } };
}

let raw: string | null | undefined;
let cached = EMPTY_CART;
function snapshot(): Cart {
  const r = localStorage.getItem(KEY);
  if (r !== raw) { raw = r; cached = parseCart(r); }
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

export function readCart(): Cart {
  return typeof window === "undefined" ? EMPTY_CART : snapshot();
}

export function writeCart(cart: Cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(EVENT));
}

export function useCart(): Cart {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_CART);
}
