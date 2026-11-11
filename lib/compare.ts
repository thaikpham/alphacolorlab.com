"use client";

import { useSyncExternalStore } from "react";

// Products picked for /wiki/san-pham/so-sanh: up to 4, all cameras or all lenses. Kept in localStorage so the pick survives page changes.
export type CompareKind = "camera" | "lens";
export type CompareItem = { slug: string; kind: CompareKind; name: string };
export type Compare = { items: CompareItem[] };

const MAX_COMPARE = 4;
export const EMPTY_COMPARE: Compare = { items: [] };
const KEY = "wiki-compare";
const EVENT = "wiki-compare";

/** Why a product of `kind` cannot join the pick, or null when it can. */
export function blocked(c: Compare, kind: string): "kind" | "full" | null {
  if (kind !== "camera" && kind !== "lens") return "kind";
  if (c.items.length > 0 && c.items[0].kind !== kind) return "kind";
  return c.items.length >= MAX_COMPARE ? "full" : null;
}

export function toggle(c: Compare, item: CompareItem): Compare {
  if (c.items.some((i) => i.slug === item.slug)) return { items: c.items.filter((i) => i.slug !== item.slug) };
  return blocked(c, item.kind) ? c : { items: [...c.items, item] };
}

export function parseCompare(raw: string | null): Compare {
  try {
    const items: CompareItem[] = [];
    for (const i of JSON.parse(raw ?? "")?.items ?? []) {
      if (typeof i?.slug !== "string" || typeof i?.name !== "string" || items.some((x) => x.slug === i.slug)) continue;
      if (!blocked({ items }, i.kind)) items.push({ slug: i.slug, kind: i.kind, name: i.name });
    }
    return { items };
  } catch {
    return EMPTY_COMPARE;
  }
}

export function compareHref(c: Compare) {
  return `/wiki/san-pham/so-sanh?sp=${c.items.map((i) => i.slug).join(",")}`;
}

let raw: string | null | undefined;
let cached = EMPTY_COMPARE;

function snapshot(): Compare {
  const r = localStorage.getItem(KEY);
  if (r !== raw) {
    raw = r;
    cached = parseCompare(r);
  }
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

// Read at click time, not from the render, so two quick clicks both count.
export const readCompare = () => (typeof window === "undefined" ? EMPTY_COMPARE : snapshot());

export function writeCompare(c: Compare) {
  localStorage.setItem(KEY, JSON.stringify(c));
  window.dispatchEvent(new Event(EVENT));
}

export function useCompare(): Compare {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_COMPARE);
}
