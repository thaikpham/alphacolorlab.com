/**
 * Trạng thái từng giá trị của mỗi máy, phần thuần (không đọc JSON): dùng được ở client (analyze.ts) và server (status.ts).
 * rowsFor nhận quan sát đã đọc sẵn; observed null = chỉ dữ liệu tĩnh (adapter, danh mục, ZV-E10 đã hiệu chỉnh, phát hiện trên máy).
 * File này không import data/decode-observed.json: status.ts giữ việc đọc file đó và đưa quan sát vào đây.
 * - confirmed: đã thấy trong file máy thật (observed), hoặc adapter có danh sách đã xác nhận,
 *   hoặc ZV-E10 đã hiệu chỉnh (profile.json), hoặc phát hiện trên máy người dùng (LocalFindings).
 * - predicted: đã định vị và có mã, nhưng chưa thấy trong file máy thật.
 * - pending: đã định vị nhưng chưa có mã.
 * - unknown: chưa định vị.
 * inCatalog:false: giá trị hoặc cài đặt chỉ có trong codec, không có trong data/game-tasks.json.
 * numeric: cài đặt số (ISO, nhiệt độ màu, mức đen) chỉ có raw; không có ô, observedCount là số raw khác nhau đã thấy.
 * Số liệu (matrix.ts) chỉ tính ô trong danh mục, và bỏ hàng numeric.
 */
import type { GameModel } from "../game/types.ts";
import { getCatalog } from "../game/catalog.ts";
import { adaptersFor } from "./adapters.ts";
import type { Observed } from "./observed.ts";

export type ValueStatus = "confirmed" | "predicted" | "pending" | "unknown";

// Phát hiện từ lượt chơi trên máy người dùng (analyze.ts tạo ra)
export type LocalFindings = {
  values?: readonly { model: GameModel; settingId: string; valueId: string }[];
  located?: readonly { model: GameModel; settingId: string }[];
};

export type MatrixCell = {
  valueId: string;
  status: ValueStatus;
  code: number | string | null;
  inCatalog: boolean;
  local: boolean; // đã thấy trên máy người dùng (LocalFindings)
};
export type MatrixRow = {
  settingId: string;
  located: boolean;
  where: string | null;
  inCatalog: boolean;
  numeric: boolean;
  observedCount: number; // số raw khác nhau đã thấy trong file máy thật (0 khi không có quan sát)
  cells: MatrixCell[];
};

function observedHas(observed: Observed, model: GameModel, settingId: string, valueId: string): boolean {
  return (observed.values[model]?.[settingId]?.[valueId] ?? []).length > 0;
}

// Số raw khác nhau của một cài đặt đã thấy trong file máy thật (raws chỉ ghi khi không có valueId)
function observedRawCount(observed: Observed, model: GameModel, settingId: string): number {
  return Object.keys(observed.raws[model]?.[settingId] ?? {}).length;
}

// observed null: không dùng quan sát (analyze.ts gọi rowsFor(model, {}, null) để isNew không phụ thuộc file đóng gói)
export function rowsFor(model: GameModel, local: LocalFindings, observed: Observed | null): MatrixRow[] {
  const localValues = new Set((local.values ?? []).filter((v) => v.model === model).map((v) => `${v.settingId}|${v.valueId}`));
  const localLocated = new Set((local.located ?? []).filter((l) => l.model === model).map((l) => l.settingId));
  const catalog = new Map(getCatalog()[model].settings.map((s) => [s.id, s] as const));

  return adaptersFor(model).map((a) => {
    const located = a.located || localLocated.has(a.settingId);
    const catalogIds = a.inCatalog ? (catalog.get(a.settingId)?.values.map((v) => v.id) ?? []) : [];
    const ids = [...catalogIds, ...a.codecValues.filter((v) => !catalogIds.includes(v))];
    const cells = ids.map((id): MatrixCell => {
      const code = located ? a.codeOf(id) : null;
      const isLocal = localValues.has(`${a.settingId}|${id}`);
      const confirmed =
        isLocal ||
        (observed !== null && observedHas(observed, model, a.settingId, id)) ||
        a.staticConfirmed.includes(id) ||
        (model === "zve10" && a.located && a.calibrated === true && code !== null);
      const status: ValueStatus = confirmed ? "confirmed" : !located ? "unknown" : code !== null ? "predicted" : "pending";
      return { valueId: id, status, code, inCatalog: catalogIds.includes(id), local: isLocal };
    });
    return {
      settingId: a.settingId,
      located,
      where: a.where,
      inCatalog: a.inCatalog,
      numeric: a.numeric === true,
      observedCount: observed !== null ? observedRawCount(observed, model, a.settingId) : 0,
      cells,
    };
  });
}
