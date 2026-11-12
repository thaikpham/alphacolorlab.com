// Phát hiện giải mã của người chơi, lưu trên máy (localStorage "decode-findings").
// Bảng giải mã đọc qua useSyncExternalStore; lượt chơi ghi qua addLocal, mọi nơi đang mở đều nhận sự kiện.
import type { LocalFindings } from "@/lib/decode/statusCore";
import { cleanLocal } from "@/lib/game/planRequest";
import { mergeLocal } from "@/lib/game/analyze";

export const LOCAL_KEY = "decode-findings";
export const LOCAL_EVENT = "decode-findings-change";

const EMPTY: LocalFindings = { values: [], located: [] };

// Đọc an toàn: JSON hỏng hoặc mục sai kiểu thì bỏ mục đó
export function parseLocal(raw: string): LocalFindings {
  if (!raw) return EMPTY;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  return cleanLocal(data);
}

export function getLocalRaw(): string {
  try {
    return window.localStorage.getItem(LOCAL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function readLocal(): LocalFindings {
  return parseLocal(getLocalRaw());
}

// Gộp phát hiện mới vào kho rồi báo mọi nơi đang mở
export function addLocal(add: LocalFindings): void {
  const merged = mergeLocal(readLocal(), add);
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

export function subscribeLocal(onChange: () => void): () => void {
  window.addEventListener(LOCAL_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOCAL_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
