"use client";

import { useSyncExternalStore } from "react";
import type { ModelId } from "./model.ts";
import { setModel } from "./model.ts";
import { cameraModels } from "../app/content.ts";
import { validIdsByCategory } from "./gearCatalog.ts";

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

export function parseGear(raw: string | null): GearBag {
  try {
    const g = JSON.parse(raw ?? "");
    const valid = validIdsByCategory();
    const bag = { body: [], lens: [], acc: [] } as GearBag;
    const seen = new Set<string>();

    for (const cat of ["body", "lens", "acc"] as const) {
      if (Array.isArray(g?.[cat])) {
        for (const id of g[cat]) {
          if (typeof id === "string" && !seen.has(id) && valid[cat].has(id)) {
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
let cached = EMPTY_BAG;

function snapshot(): GearBag {
  const r = localStorage.getItem(STORAGE_KEY);
  if (r !== raw) {
    raw = r;
    cached = parseGear(r);
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
