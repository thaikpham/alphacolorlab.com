"use client";

import { useSyncExternalStore } from "react";

export type IndexView = "list" | "grid";

const STORAGE_KEY = "index-view";
const CHANGE_EVENT = "index-view-change";

/** Giá trị lưu trong localStorage thành kiểu hiển thị. Rỗng hoặc lạ thì là "list". */
export function parseIndexView(stored: string | null | undefined): IndexView {
  return stored === "grid" ? "grid" : "list";
}

function getSnapshot(): IndexView {
  if (typeof window === "undefined") return "list";
  return parseIndexView(localStorage.getItem(STORAGE_KEY));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/** Lưu trên máy này, không đồng bộ theo tài khoản. */
export function setIndexView(view: IndexView) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, view);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useIndexView(): IndexView {
  return useSyncExternalStore(subscribe, getSnapshot, () => "list");
}
