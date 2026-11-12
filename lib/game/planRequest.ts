/**
 * Yêu cầu lập lượt gửi lên /giai-ma/plan, và làm sạch phát hiện trên máy (LocalFindings).
 * Không import JSON và không import plan.ts: file này dùng được ở client (localStore.ts, planClient.ts) và server (route.ts).
 * Mục sai kiểu hoặc sai máy thì bỏ mục đó. parsePlanRequest trả null khi model hoặc seed sai.
 */
import type { GameModel } from "./types.ts";
import type { LocalFindings } from "../decode/statusCore.ts";

export type PlanRequest = { model: GameModel; seed: number; focus: string[]; local: LocalFindings };

const MODELS: readonly GameModel[] = ["zve10", "a6400", "a7c2"];
const MAX_FOCUS = 16;

const isModel = (v: unknown): v is GameModel => typeof v === "string" && (MODELS as readonly string[]).includes(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 64;

// Phát hiện trên máy: mục sai kiểu hoặc sai máy thì bỏ mục đó
export function cleanLocal(data: unknown): LocalFindings {
  if (typeof data !== "object" || data === null) return { values: [], located: [] };
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

// Yêu cầu: model và seed (số nguyên từ 1) bắt buộc; focus và local tùy chọn. local chỉ giữ mục của đúng máy được hỏi
export function parsePlanRequest(data: unknown): PlanRequest | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  const model = d.model;
  if (!isModel(model)) return null;
  const seed = d.seed;
  if (typeof seed !== "number" || !Number.isSafeInteger(seed) || seed < 1) return null;
  const focus = Array.isArray(d.focus) ? d.focus.filter(isText).slice(0, MAX_FOCUS) : [];
  const local = cleanLocal(d.local);
  return {
    model,
    seed,
    focus,
    local: {
      values: (local.values ?? []).filter((v) => v.model === model),
      located: (local.located ?? []).filter((l) => l.model === model),
    },
  };
}
