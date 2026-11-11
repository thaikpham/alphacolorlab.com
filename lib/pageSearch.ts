"use client";

import { useSyncExternalStore } from "react";

// Thanh tìm kiếm trên thanh điều hướng là ô tìm duy nhất của trang. Trang nào cần tìm riêng thì đăng ký ở đây:
// - "pick": thêm gợi ý của trang lên đầu danh sách (đồ thị: chọn nút trên đồ thị thay vì chuyển trang)
// active(): trang có thể đang ẩn bằng CSS (landing và đồ thị cùng nằm ở "/"), chỉ dùng nguồn đang hiện.

export interface PageHit {
  id: string;
  label: string;
}

export type PageSearch = { kind: "pick"; placeholder: string; active(): boolean; find(query: string): PageHit[]; pick(id: string): void; /** Chọn nút mà không bao giờ mở trang (pick lần hai vào nút đang chọn thì mở) */ show?(id: string): boolean };

const sources = new Set<PageSearch>();
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  for (const f of listeners) f();
};

/** Đăng ký nguồn tìm của trang; trả về hàm hủy đăng ký (gọi trong cleanup của effect). */
export function registerPageSearch(source: PageSearch): () => void {
  sources.add(source);
  emit();
  return () => {
    sources.delete(source);
    emit();
  };
}

/** Nguồn đang hiện trên trang, nếu có. Gọi lại khi cần (lúc focus, lúc gõ) vì trạng thái hiện/ẩn đổi theo CSS. */
export function activePageSearch(): PageSearch | null {
  for (const s of sources) if (s.active()) return s;
  return null;
}

/** Số phiên bản đăng ký, để component render lại khi trang đăng ký hoặc hủy nguồn tìm. */
export function usePageSearchVersion(): number {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    () => version,
    () => 0,
  );
}
