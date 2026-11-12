/**
 * Bảng giải mã cho giao diện: mỗi hàng là một cài đặt (gộp ba máy), mỗi ô là trạng thái cài đặt đó trên một máy.
 * Thuần: không đọc ổ đĩa, không giữ state; dùng được trong server và client component. Không import matrix.ts hay plan.ts.
 * Số đếm trong ô khớp modelSummary: giá trị trong danh mục, và mọi giá trị của cài đặt chỉ có trong codec (inCatalog:false).
 * Hàng numeric không đếm (ô không có giá trị liệt kê; hiển thị observedCount). Giá trị chỉ có trong codec vẫn nằm trong values với inCatalog:false.
 */
import type { GameModel, Localized } from "../game/types.ts";
import { getCatalog } from "../game/catalog.ts";
import { observedFiles, statusRows } from "./status.ts";
import type { LocalFindings, MatrixRow, ValueStatus } from "./status.ts";

export type TableValue = {
  valueId: string;
  label: Localized;
  status: ValueStatus;
  local: boolean;
  inCatalog: boolean;
  code: number | string | null;
  evidence: string[]; // tối đa 3 đường dẫn file máy thật (data/decode-observed.json)
};
export type TableCell = {
  located: boolean;
  where: string | null;
  confirmed: number;
  predicted: number;
  pending: number;
  unknown: number;
  numeric: boolean; // cài đặt số: không có ô đếm
  observedCount: number; // số raw khác nhau đã thấy trong file máy thật
  values: TableValue[];
};
export type TableRow = {
  settingId: string;
  label: Localized;
  inCatalog: boolean;
  cells: Record<GameModel, TableCell | null>; // null: máy đó không có cài đặt này
};

const MODELS: readonly GameModel[] = ["zve10", "a6400", "a7c2"];

// Nhãn cài đặt: từ danh mục của máy nào có; không có thì dùng id (cài đặt chỉ có trong codec)
function settingLabel(settingId: string): Localized {
  for (const m of MODELS) {
    const s = getCatalog()[m].settings.find((x) => x.id === settingId);
    if (s) return s.label;
  }
  return { vi: settingId, en: settingId };
}

// Nhãn giá trị: ưu tiên danh mục của chính máy, rồi máy khác; không có thì dùng id (giá trị chỉ có trong codec)
function valueLabel(model: GameModel, settingId: string, valueId: string): Localized {
  const order = [model, ...MODELS.filter((m) => m !== model)];
  for (const m of order) {
    const v = getCatalog()[m].settings.find((s) => s.id === settingId)?.values.find((x) => x.id === valueId);
    if (v) return v.label;
  }
  return { vi: valueId, en: valueId };
}

function toCell(model: GameModel, row: MatrixRow): TableCell {
  const values: TableValue[] = row.cells.map((c) => ({
    valueId: c.valueId,
    label: valueLabel(model, row.settingId, c.valueId),
    status: c.status,
    local: c.local,
    inCatalog: c.inCatalog,
    code: c.code,
    evidence: observedFiles(model, row.settingId, c.valueId).slice(0, 3),
  }));
  // Đếm như modelSummary: hàng numeric không đếm; hàng trong danh mục chỉ đếm ô trong danh mục
  const counted = values.filter((v) => !row.numeric && (v.inCatalog || !row.inCatalog));
  const count = (s: ValueStatus) => counted.filter((v) => v.status === s).length;
  return {
    located: row.located,
    where: row.where,
    confirmed: count("confirmed"),
    predicted: count("predicted"),
    pending: count("pending"),
    unknown: count("unknown"),
    numeric: row.numeric,
    observedCount: row.observedCount,
    values,
  };
}

// Cài đặt lõi của file M1–M4 (chỉ có trong codec); xếp đầu bảng
export const CODEC_SETTING_IDS: readonly string[] = [
  "shootMode",
  "aperture",
  "shutter",
  "iso",
  "pictureProfile",
  "ppGamma",
  "ppColorMode",
  "ppLevels",
  "wbKelvin",
];

// Thứ tự hàng: lõi file M1–M4, rồi danh mục zve10, cài đặt chỉ có ở máy khác (theo danh mục), cuối cùng là cài đặt chỉ có trong codec
export function decodeTable(local: LocalFindings = {}): TableRow[] {
  const rows = Object.fromEntries(MODELS.map((m) => [m, statusRows(m, local)])) as Record<GameModel, MatrixRow[]>;
  const ids: string[] = [];
  const add = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
  };
  for (const id of CODEC_SETTING_IDS) add(id);
  for (const m of MODELS) for (const s of getCatalog()[m].settings) add(s.id);
  for (const m of MODELS) for (const r of rows[m]) add(r.settingId);

  return ids.map((settingId): TableRow => {
    const cells = {} as Record<GameModel, TableCell | null>;
    let inCatalog = false;
    for (const m of MODELS) {
      const row = rows[m].find((r) => r.settingId === settingId);
      cells[m] = row ? toCell(m, row) : null;
      if (row?.inCatalog) inCatalog = true;
    }
    return { settingId, label: settingLabel(settingId), inCatalog, cells };
  });
}
