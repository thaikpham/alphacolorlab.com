import presets from "./zve10/presets.ts";
import type { SlotDraft } from "./presetSets.ts";

// Nhãn tiếng Việt cho từng giá trị cài đặt của một ô. Dùng chung cho Tạo bộ M1–M4 và trang bộ chia sẻ.
export const FOCUS_AREA_LABELS: Record<string, string> = {
  wide: "Rộng",
  zone: "Vùng",
  "flexible-spot-l": "Điểm linh hoạt: L",
  "tracking-zone": "Theo dõi: Vùng",
  "tracking-flexible-spot-l": "Theo dõi: Điểm linh hoạt L",
};
export const METERING_LABELS: Record<string, string> = {
  multi: "Đa điểm",
  center: "Trung tâm",
  "spot-standard": "Điểm: Tiêu chuẩn",
  "spot-large": "Điểm: Lớn",
  entire: "Trung bình toàn khung",
  highlight: "Vùng sáng",
};
export const FACE_PRIORITY_LABELS: Record<string, string> = {
  off: "Tắt",
  on: "Bật",
};
export const SOFT_SKIN_LABELS: Record<string, string> = {
  off: "Tắt",
  low: "Bật: Thấp",
  mid: "Bật: Trung bình",
  high: "Bật: Cao",
};
export const AUTO_REVIEW_LABELS: Record<string, string> = {
  off: "Tắt",
  "2s": "2 giây",
  "5s": "5 giây",
  "10s": "10 giây",
};
const FLASH_MODE_LABELS: Record<string, string> = {
  "fill-flash": "Đèn flash cưỡng bức",
  "slow-sync": "Đồng bộ chậm",
  "rear-sync": "Đồng bộ sau",
};
const EXP_COMP_SET_LABELS: Record<string, string> = {
  "ambient-only": "Chỉ môi trường",
  "ambient-flash": "Môi trường & flash",
};
const AWB_PRIORITY_LABELS: Record<string, string> = {
  standard: "Chuẩn",
  ambience: "Môi trường",
  white: "Trắng",
};
const PRE_AF_LABELS: Record<string, string> = {
  off: "Tắt",
  on: "Bật",
};
const STEADY_SHOT_LABELS: Record<string, string> = {
  off: "Tắt",
  on: "Bật",
};
const E_FRONT_CURTAIN_LABELS: Record<string, string> = {
  off: "Tắt",
  on: "Bật",
};
const LIVE_VIEW_LABELS: Record<string, string> = {
  "setting-effect-off": "Tắt hiệu ứng cài đặt",
  "setting-effect-on": "Bật hiệu ứng cài đặt",
};

/** Các dòng tóm tắt một ô (tên cài đặt, giá trị), chỉ những mục đã đặt. `t` là bảng chữ `presetConsole.summary` trong app/content.ts. */
export function summaryRows(st: SlotDraft, t: Record<string, string>): [string, string][] {
  const v = (x: unknown) => (x === undefined || x === "keep" ? t.keep : String(x));
  const vLabel = (value: unknown, labels: Record<string, string>) => (value === undefined || value === "keep" ? t.keep : labels[String(value)] || String(value));
  const wb = st.wb === undefined || st.wb === "keep" ? t.keep : st.wb.mode === "ctemp" ? `${st.wb.kelvin}K` : "AWB";
  const color = st.ppOn === false ? "Tắt Picture Profile" : st.recipeId === "custom" ? t.custom : st.recipeId ? (presets.find((p) => p.id === st.recipeId)?.name ?? t.keep) : t.keep;
  const focusAreaLabel = st.focusArea === undefined || st.focusArea === "keep" ? t.keep : FOCUS_AREA_LABELS[st.focusArea] || st.focusArea;
  const meteringLabel = st.metering === undefined || st.metering === "keep" ? t.keep : METERING_LABELS[st.metering] || st.metering;
  const facePriorityLabel = st.facePriority === undefined || st.facePriority === "keep" ? t.keep : FACE_PRIORITY_LABELS[st.facePriority] || st.facePriority;
  const softSkinLabel = st.softSkin === undefined || st.softSkin === "keep" ? t.keep : SOFT_SKIN_LABELS[st.softSkin] || st.softSkin;
  const autoReviewLabel = st.autoReview === undefined || st.autoReview === "keep" ? t.keep : AUTO_REVIEW_LABELS[st.autoReview] || st.autoReview;
  const rows = [
    [t.mode, v(st.mode)],
    [t.aperture, st.aperture === undefined || st.aperture === "keep" ? t.keep : `F${st.aperture}`],
    [t.shutter, v(st.shutter)],
    [t.iso, st.iso === "auto" || st.iso === "AUTO" ? "AUTO" : v(st.iso)],
    [t.focus, v(st.focus)],
    [t.focusArea, focusAreaLabel],
    [t.metering, meteringLabel],
    [t.facePriority, facePriorityLabel],
    [t.softSkin, softSkinLabel],
    [t.autoReview, autoReviewLabel],
    [t.flashMode, vLabel(st.flashMode, FLASH_MODE_LABELS)],
    [t.expCompSet, vLabel(st.expCompSet, EXP_COMP_SET_LABELS)],
    [t.awbPriority, vLabel(st.awbPriority, AWB_PRIORITY_LABELS)],
    [t.preAF, vLabel(st.preAF, PRE_AF_LABELS)],
    [t.steadyShot, vLabel(st.steadyShot, STEADY_SHOT_LABELS)],
    [t.eFrontCurtain, vLabel(st.eFrontCurtain, E_FRONT_CURTAIN_LABELS)],
    [t.liveView, vLabel(st.liveView, LIVE_VIEW_LABELS)],
    [t.wb, wb],
    [t.color, color],
  ];
  return rows.filter(([_, val]) => val !== t.keep) as [string, string][];
}
