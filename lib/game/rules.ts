/**
 * Luật ghép bước trong một ô, khai báo một chỗ. mission.ts (generateMission) và plan.ts (planMission) cùng dùng,
 * nên đổi luật ở đây là đổi cả hai. Không đổi thứ tự gọi rng() ở mission.ts khi thay luật bằng hàm này.
 */
import type { CatalogValue } from "./types.ts";

export type Target = { settingId: string; valueId: string };
export type PendingSteps = ReadonlyMap<string, string>;

export type ControlRule = {
  id: string;
  // Bước (settingId = valueId) có được thêm khi các bước đã có trong ô là pending không.
  allows(settingId: string, valueId: string, pending: PendingSteps): boolean;
};

export const CONTROL_RULES: readonly ControlRule[] = [
  // Ưu tiên mặt chỉ chọn được khi Đo sáng là Đa điểm
  { id: "face-needs-multi", allows: (s, _v, p) => s !== "facePriority" || p.get("metering") === "multi" },
  // Vùng lấy nét cần chế độ AF; Theo dõi cần AF-C
  {
    id: "focus-area-needs-af",
    allows: (s, v, p) => {
      if (s !== "focusArea") return true;
      const mode = p.get("focusMode");
      return !!mode && mode !== "MF" && !(v.startsWith("tracking-") && mode !== "AF-C");
    },
  },
  // MF không đi cùng Vùng lấy nét
  { id: "mf-excludes-focus-area", allows: (s, v, p) => !(s === "focusMode" && v === "MF" && p.has("focusArea")) },
];

export function allowsControl(settingId: string, valueId: string, pending: PendingSteps): boolean {
  return CONTROL_RULES.every((r) => r.allows(settingId, valueId, pending));
}

// Máy chưa giải mã (A6400, A7C II), ô 1: đặt giá trị nền rồi các ô sau đổi thêm mục tiêu.
export type BaselineContext = { target: Target; faceTarget: boolean; mode: string | null };

export const BASELINE_ORDER: readonly string[] = ["focusMode", "focusArea", "metering"];

export const needsAfC = (t: Target): boolean => t.settingId === "focusArea" && t.valueId.startsWith("tracking-");

// Không đặt nền cho chính mục tiêu; mục tiêu MF làm mờ Vùng lấy nét nên bỏ qua mục này
export function baselineSkips(settingId: string, target: Target): boolean {
  if (settingId === target.settingId) return true;
  return settingId === "focusArea" && target.settingId === "focusMode" && target.valueId === "MF";
}

const BASELINE_KEEP: Record<string, (v: string, c: BaselineContext) => boolean> = {
  // Mục tiêu Theo dõi cần AF-C; còn lại không đặt MF làm nền
  focusMode: (v, c) => (needsAfC(c.target) ? v === "AF-C" : v !== "MF"),
  // Theo dõi chỉ khi chế độ hiện tại là AF-C
  focusArea: (v, c) => !v.startsWith("tracking-") || c.mode === "AF-C",
  // Có mục tiêu Ưu tiên mặt thì đo sáng phải là Đa điểm
  metering: (v, c) => !c.faceTarget || v === "multi",
};

export function baselineValues(settingId: string, values: readonly CatalogValue[], c: BaselineContext): CatalogValue[] {
  const keep = BASELINE_KEEP[settingId];
  return keep ? values.filter((v) => keep(v.id, c)) : [...values];
}

// Điều kiện cần của một giá trị: cài đặt `settingId` trong cùng ô phải có một trong `valueIds`.
// Cài đặt giữ nguyên giữa các ô, nên planner chỉ kiểm tra trong ô đang lập.
export type Need = { settingId: string; valueIds: readonly string[] };

export function prerequisites(settingId: string, valueId: string): Need[] {
  if (settingId === "facePriority" && valueId === "on") return [{ settingId: "metering", valueIds: ["multi"] }];
  if (settingId !== "focusArea") return [];
  // Theo dõi cần AF-C; vùng thường chấp nhận AF-S hoặc AF-C
  return valueId.startsWith("tracking-")
    ? [{ settingId: "focusMode", valueIds: ["AF-C"] }]
    : [{ settingId: "focusMode", valueIds: ["AF-S", "AF-C"] }];
}

export function prerequisitesMet(settingId: string, valueId: string, pending: PendingSteps): boolean {
  return prerequisites(settingId, valueId).every((n) => {
    const cur = pending.get(n.settingId);
    return cur !== undefined && n.valueIds.includes(cur);
  });
}
