"use client";

import { useSyncExternalStore } from "react";
import { cameraModels, type ModelId } from "../app/content.ts";

export type { ModelId };

const read = (): ModelId => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return cameraModels.find((m) => m.id === stored)?.id ?? "zve10";
};

const STORAGE_KEY = "camera-model";

function getSnapshot(): ModelId {
  if (typeof window === "undefined") return "zve10";
  return read();
}

function subscribe(callback: () => void) {
  const handleStorageChange = () => callback();
  const handleCustomEvent = () => callback();

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener("camera-model", handleCustomEvent);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener("camera-model", handleCustomEvent);
  };
}

export function setModel(id: ModelId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
  document.documentElement.dataset.model = id;
  window.dispatchEvent(new Event("camera-model"));
}

export function useModel(): ModelId {
  return useSyncExternalStore(subscribe, getSnapshot, () => "zve10");
}
