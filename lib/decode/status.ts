/**
 * Trạng thái từng giá trị của mỗi máy (confirmed / predicted / pending / unknown), phần đọc JSON.
 * Logic thuần nằm ở statusCore.ts (rowsFor), không đọc JSON, và là phần duy nhất analyze.ts (client) dùng.
 * File này giữ data/decode-observed.json (observedJson), setObserved và observedFiles. Chỉ server import: matrix.ts, table.ts, plan.ts.
 */
import type { GameModel } from "../game/types.ts";
import type { Observed } from "./observed.ts";
import { rowsFor } from "./statusCore.ts";
import type { LocalFindings, MatrixRow } from "./statusCore.ts";
import observedJson from "../../data/decode-observed.json" with { type: "json" };

export type { ValueStatus, LocalFindings, MatrixCell, MatrixRow } from "./statusCore.ts";

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

// Hàng và ô trong danh mục (inCatalog); số liệu và planner chỉ dùng phần này
export function catalogRows(model: GameModel, local: LocalFindings = {}): MatrixRow[] {
  return statusRows(model, local)
    .filter((r) => r.inCatalog)
    .map((r) => ({ ...r, cells: r.cells.filter((c) => c.inCatalog) }));
}

// withObserved:false chỉ dùng dữ liệu tĩnh (adapter và danh mục), giống rowsFor(model, local, null)
export function statusRows(model: GameModel, local: LocalFindings = {}, withObserved = true): MatrixRow[] {
  return rowsFor(model, local, withObserved ? observed : null);
}
