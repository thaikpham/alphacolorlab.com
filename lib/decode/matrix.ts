/**
 * Ma trận giải mã của ba máy và số liệu tóm tắt (modelSummary). Dùng được trong server component:
 * không có state phía client, chỉ đọc data/decode-observed.json và danh mục.
 * Số liệu: settings và located chỉ tính hàng trong danh mục; values và trạng thái tính thêm ô của cài đặt chỉ có trong codec
 * (inCatalog:false, liệt kê giá trị), bỏ qua hàng numeric (không có ô). roundsLeft chỉ dùng danh mục, như planner.
 * roundsLeft mô phỏng planner: mỗi lượt lập từ trạng thái hiện tại, mọi mục tiêu của lượt được giả định thành công
 * (confirm: predicted hoặc pending; learn: unknown ở ô 2–4), rồi lặp đến khi mọi giá trị trong danh mục đã confirmed.
 * Không thoát sớm được ROUNDS_CAP: nếu lượt nào không có mục tiêu thì roundsLeft là ROUNDS_CAP.
 */
import type { GameModel } from "../game/types.ts";
import { planMission, yieldTargets } from "../game/plan.ts";
import { catalogRows, statusRows } from "./status.ts";
import type { LocalFindings, MatrixRow, ValueStatus } from "./status.ts";
import { ROUNDS_CAP } from "./cap.ts";

export type { LocalFindings, MatrixCell, MatrixRow, ValueStatus } from "./status.ts";

export const MODELS: readonly GameModel[] = ["zve10", "a6400", "a7c2"];
// Số lượt mô phỏng tối đa (định nghĩa ở cap.ts); roundsLeft bằng ROUNDS_CAP nghĩa là chưa hết trong giới hạn hoặc không còn mục tiêu tiến được
export { ROUNDS_CAP };

export type ModelSummary = {
  settings: number;
  located: number;
  values: number;
  confirmed: number;
  pending: number;
  predicted: number;
  unknown: number;
  roundsLeft: number;
};

export function decodeMatrix(local?: LocalFindings): Record<GameModel, MatrixRow[]> {
  return { zve10: statusRows("zve10", local), a6400: statusRows("a6400", local), a7c2: statusRows("a7c2", local) };
}

function roundsLeftOf(model: GameModel, local: LocalFindings): number {
  const state = {
    values: [...(local.values ?? [])],
    located: [...(local.located ?? [])],
  };
  for (let round = 1; round <= ROUNDS_CAP; round++) {
    const remaining = catalogRows(model, state)
      .flatMap((r) => r.cells)
      .filter((c) => c.status !== "confirmed").length;
    if (remaining === 0) return round - 1;
    const hits = yieldTargets(planMission(model, { seed: round, local: state }), state);
    if (hits.length === 0) break;
    for (const t of hits) {
      state.values.push({ model, settingId: t.settingId, valueId: t.valueId });
      state.located.push({ model, settingId: t.settingId });
    }
  }
  return ROUNDS_CAP;
}

export function modelSummary(model: GameModel, local?: LocalFindings): ModelSummary {
  const rows = catalogRows(model, local);
  // Ô trong danh mục của hàng danh mục, và mọi ô của hàng chỉ có trong codec; hàng numeric không có ô
  const cells = statusRows(model, local ?? {})
    .filter((r) => !r.numeric)
    .flatMap((r) => r.cells.filter((c) => c.inCatalog || !r.inCatalog));
  const count = (s: ValueStatus) => cells.filter((c) => c.status === s).length;
  return {
    settings: rows.length,
    located: rows.filter((r) => r.located).length,
    values: cells.length,
    confirmed: count("confirmed"),
    pending: count("pending"),
    predicted: count("predicted"),
    unknown: count("unknown"),
    roundsLeft: roundsLeftOf(model, local ?? {}),
  };
}
