// Phát hiện giải mã của người chơi, lưu trên máy (localStorage "decode-findings").
// Bảng giải mã đọc qua useSyncExternalStore; lượt chơi ghi qua addLocal, mọi nơi đang mở đều nhận sự kiện.
import type { LocalFindings } from "@/lib/decode/status";
import type { GameModel } from "@/lib/game/types";
import { mergeLocal } from "@/lib/game/analyze";

export const LOCAL_KEY = "decode-findings";
export const LOCAL_EVENT = "decode-findings-change";

const MODELS: readonly GameModel[] = ["zve10", "a6400", "a7c2"];
const EMPTY: LocalFindings = { values: [], located: [] };

const isModel = (v: unknown): v is GameModel => typeof v === "string" && (MODELS as readonly string[]).includes(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 64;

// Đọc an toàn: JSON hỏng hoặc mục sai kiểu thì bỏ mục đó
export function parseLocal(raw: string): LocalFindings {
  if (!raw) return EMPTY;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (typeof data !== "object" || data === null) return EMPTY;
  const d = data as Record<string, unknown>;
  const values = Array.isArray(d.values)
    ? d.values.flatMap((v) => {
        const o = v as Record<string, unknown>;
        return isModel(o?.model) && isText(o.settingId) && isText(o.valueId)
          ? [{ model: o.model, settingId: o.settingId, valueId: o.valueId }]
          : [];
      })
    : [];
  const located = Array.isArray(d.located)
    ? d.located.flatMap((v) => {
        const o = v as Record<string, unknown>;
        return isModel(o?.model) && isText(o.settingId) ? [{ model: o.model, settingId: o.settingId }] : [];
      })
    : [];
  return { values, located };
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
