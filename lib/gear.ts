"use client";

import { useSyncExternalStore } from "react";
import type { ModelId } from "./model.ts";
import { setModel } from "./model.ts";
import { cameraModels } from "../app/content.ts";

function readCurrentModel(): ModelId {
  if (typeof window === "undefined") return "zve10";
  const stored = localStorage.getItem("camera-model");
  return cameraModels.find((m) => m.id === stored)?.id ?? "zve10";
}

export interface GearBag {
  body: string[];
  lens: string[];
  acc: string[];
}

const STORAGE_KEY = "gear-bag";
const EVENT = "gear-bag";
export const EMPTY_BAG: GearBag = { body: [], lens: [], acc: [] };

// Map product slugs to ModelId for guide cameras
const GUIDE_TO_MODEL: Record<string, ModelId> = {
  "zv-e10": "zve10",
  "a6400": "a6400",
  "a7c-ii": "a7c2",
};

export interface GearIds {
  body: Set<string>;
  lens: Set<string>;
  acc: Set<string>;
}

let ids: GearIds | null = null;
let loading: Promise<GearIds> | null = null;

/** Nạp danh mục sản phẩm (data/products.json) để kiểm id. Chỉ gọi khi có túi đồ cần kiểm nên không nằm trong bundle chung. */
export function loadGearIds(): Promise<GearIds> {
  loading ??= import("./gearCatalog.ts").then((m) => {
    ids = m.validIdsByCategory();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
    return ids;
  });
  return loading;
}

/** valid = null khi danh mục chưa nạp: giữ mọi id đúng dạng, id lạ bị bỏ khi danh mục về. */
export function parseGear(raw: string | null, valid: GearIds | null): GearBag {
  try {
    const g = JSON.parse(raw ?? "");
    const bag = { body: [], lens: [], acc: [] } as GearBag;
    const seen = new Set<string>();

    for (const cat of ["body", "lens", "acc"] as const) {
      if (Array.isArray(g?.[cat])) {
        for (const id of g[cat]) {
          if (typeof id === "string" && !seen.has(id) && (!valid || valid[cat].has(id))) {
            seen.add(id);
            bag[cat].push(id);
          }
        }
      }
    }
    return bag;
  } catch {
    return EMPTY_BAG;
  }
}

export function pickModel(bag: GearBag, current: ModelId): ModelId | null {
  // Find first guide camera in bag
  for (const bodyId of bag.body) {
    const modelId = GUIDE_TO_MODEL[bodyId];
    if (modelId) {
      // Only change if current model is not a guide camera
      const currentIsGuide = Object.values(GUIDE_TO_MODEL).includes(current);
      if (!currentIsGuide) return modelId;
      return null;
    }
  }
  return null;
}

/** Máy mà nút vào dự án ở landing nên mở: máy có hướng dẫn trong túi đồ (ưu tiên máy đang chọn nếu nó nằm trong túi,
 * không thì máy thêm sau cùng), không có thì máy người dùng đã chọn từ lần trước (stored). Người mới chưa có gì: null. */
export function entryModel(bag: GearBag, stored: ModelId | null): { model: ModelId; fromBag: boolean } | null {
  const guides = bag.body.flatMap((id) => GUIDE_TO_MODEL[id] ?? []);
  if (guides.length) return { model: stored && guides.includes(stored) ? stored : guides[guides.length - 1], fromBag: true };
  return stored ? { model: stored, fromBag: false } : null;
}

export function toggleGear(
  bag: GearBag,
  cat: keyof GearBag,
  id: string,
): GearBag {
  // Không giới hạn số món: người dùng có bao nhiêu thì thêm bấy nhiêu
  const list = bag[cat];
  return { ...bag, [cat]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
}

let raw: string | null | undefined;
let rawIds: GearIds | null = null;
let cached = EMPTY_BAG;

function snapshot(): GearBag {
  const r = localStorage.getItem(STORAGE_KEY);
  if (r !== raw || ids !== rawIds) {
    raw = r;
    rawIds = ids;
    cached = parseGear(r, ids);
  }
  return cached;
}

function subscribe(callback: () => void) {
  // Người chưa có túi đồ không tải danh mục sản phẩm.
  if (localStorage.getItem(STORAGE_KEY) != null) void loadGearIds();
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function writeGear(bag: GearBag) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  // Sync model if bag has a guide camera
  const newModel = pickModel(bag, readCurrentModel());
  if (newModel) setModel(newModel);
  window.dispatchEvent(new Event(EVENT));
}

export function useGear(): GearBag {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_BAG);
}
