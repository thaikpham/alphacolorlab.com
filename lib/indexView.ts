"use client";

import { useSyncExternalStore } from "react";

export type IndexView = "list" | "grid";
/** Mỗi app có núm Danh sách / Lưới riêng trong menu avatar. */
export type IndexApp = "blog" | "wiki";

/** Khóa chung cũ của mọi app; chỉ còn là dự phòng khi app chưa có khóa riêng. */
const LEGACY_KEY = "index-view";
const CHANGE_EVENT = "index-view-change";
const keyOf = (app: IndexApp) => `index-view-${app}`;

/** Giá trị lưu trong localStorage thành kiểu hiển thị. Chỉ "list" là danh sách; rỗng hoặc lạ thì là "grid". */
export function parseIndexView(stored: string | null | undefined): IndexView {
  return stored === "list" ? "list" : "grid";
}

/** Khóa riêng của app thắng; chưa có thì lấy khóa chung cũ (ai đã chọn Danh sách trước đó thì giữ cho cả hai app). */
export function readIndexView(app: IndexApp, getItem: (key: string) => string | null): IndexView {
  return parseIndexView(getItem(keyOf(app)) ?? getItem(LEGACY_KEY));
}

function getSnapshot(app: IndexApp): IndexView {
  if (typeof window === "undefined") return "grid";
  return readIndexView(app, (key) => localStorage.getItem(key));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/** Lưu trên máy này, không đồng bộ theo tài khoản. Chỉ ghi khóa riêng của app đó. */
export function setIndexView(app: IndexApp, view: IndexView) {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyOf(app), view);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useIndexView(app: IndexApp): IndexView {
  return useSyncExternalStore(subscribe, () => getSnapshot(app), () => "grid");
}

/** App có núm Danh sách / Lưới theo đường dẫn: `/blog`, `/wiki` và trang con của chúng; còn lại là null. */
export function browseAppOf(pathname: string): IndexApp | null {
  if (pathname === "/blog" || pathname.startsWith("/blog/")) return "blog";
  if (pathname === "/wiki" || pathname.startsWith("/wiki/")) return "wiki";
  return null;
}

/** Đang ở Blog hoặc Wiki và app đó ở Lưới: không có thanh dọc (AppSidebar), thanh trên cùng (AppNav) có tìm kiếm giữa. */
export function useWideBrowse(pathname: string): boolean {
  // Gọi cả hai app để đúng thứ tự hook; chỉ app của đường dẫn hiện tại quyết định
  const blog = useIndexView("blog");
  const wiki = useIndexView("wiki");
  const app = browseAppOf(pathname);
  return (app === "blog" && blog === "grid") || (app === "wiki" && wiki === "grid");
}
