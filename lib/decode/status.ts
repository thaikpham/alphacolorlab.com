/**
 * Trạng thái từng giá trị của mỗi máy: confirmed / predicted / pending / unknown.
 * Dùng chung cho matrix.ts (số liệu), table.ts (bảng) và plan.ts (chọn mục tiêu). Không import matrix.ts hay plan.ts.
 * - confirmed: đã thấy trong file máy thật (data/decode-observed.json), hoặc adapter có danh sách đã xác nhận,
 *   hoặc ZV-E10 đã hiệu chỉnh (profile.json), hoặc phát hiện trên máy người dùng (LocalFindings).
 * - predicted: đã định vị và có mã, nhưng chưa thấy trong file máy thật.
 * - pending: đã định vị nhưng chưa có mã.
 * - unknown: chưa định vị.
 * inCatalog:false: giá trị hoặc cài đặt chỉ có trong codec, không có trong data/game-tasks.json.
 * numeric: cài đặt số (ISO, nhiệt độ màu, mức đen) chỉ có raw; không có ô, observedCount là số raw khác nhau đã thấy.
 * Số liệu (matrix.ts) chỉ tính ô trong danh mục, và bỏ hàng numeric.
 * setObserved() thay quan sát đang dùng (scanFs.ts gọi bằng kết quả quét mới trước khi tính số liệu).
 */
import type { GameModel } from "../game/types.ts";
import { getCatalog } from "../game/catalog.ts";
import { adaptersFor } from "./adapters.ts";
import type { Observed } from "./observed.ts";
import observedJson from "../../data/decode-observed.json" with { type: "json" };

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
  observedCount: number; // số raw khác nhau đã thấy trong file máy thật (0 khi withObserved:false)
  cells: MatrixCell[];
};

const bundled = observedJson as unknown as Observed;
let observed: Observed = bundled;

// Thay quan sát đang dùng; null để về data/decode-observed.json đã đóng gói
export function setObserved(active: Observed | null): void {
  observed = active ?? bundled;
}

// File máy thật đã đọc ra giá trị này (đường dẫn fixture), để hiển thị bằng chứng
export function observedFiles(model: GameModel, settingId: string, valueId: string): string[] {
  return [...(observed.values[model]?.[settingId]?.[valueId] ?? [])];
}

function observedHas(model: GameModel, settingId: string, valueId: string): boolean {
  return observedFiles(model, settingId, valueId).length > 0;
}

// Số raw khác nhau của một cài đặt đã thấy trong file máy thật (raws chỉ ghi khi không có valueId)
function observedRawCount(model: GameModel, settingId: string): number {
  return Object.keys(observed.raws[model]?.[settingId] ?? {}).length;
}

// Hàng và ô trong danh mục (inCatalog); số liệu và planner chỉ dùng phần này
export function catalogRows(model: GameModel, local: LocalFindings = {}): MatrixRow[] {
  return statusRows(model, local)
    .filter((r) => r.inCatalog)
    .map((r) => ({ ...r, cells: r.cells.filter((c) => c.inCatalog) }));
}

// withObserved:false chỉ dùng dữ liệu tĩnh (adapter và danh mục); analyze.ts dùng để isNew không phụ thuộc quan sát đang đóng gói
export function statusRows(model: GameModel, local: LocalFindings = {}, withObserved = true): MatrixRow[] {
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
        (withObserved && observedHas(model, a.settingId, id)) ||
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
      observedCount: withObserved ? observedRawCount(model, a.settingId) : 0,
      cells,
    };
  });
}
