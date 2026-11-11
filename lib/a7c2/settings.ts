// Cài đặt A7C II đã giải mã từ file mẫu máy thật: mỗi lần đổi đúng một cài đặt, lưu sang ô kế tiếp, rồi so hai file.
// Mỗi cài đặt nằm ở 3 bản ghi 1 byte: một ở vùng 0x03xx và một cặp cách nhau 2 mã ở vùng 0x0Dxx–0x0Exx; máy ghi cả ba cùng giá trị.
// Giá trị là số thứ tự của lựa chọn trong menu, đếm từ 0. `confirmed`: giá trị đã thấy trong file máy lưu; giá trị khác suy theo thứ tự menu.
// Không nằm trong file: Tự động xem lại (Cài đặt › Tùy chọn hiển thị). Lượt 5 đặt 10 giây rồi lưu M4, file chỉ đổi Detail Mode.
import type { A7c2Dat } from "./dat.ts";
import { APERTURES, SHUTTERS, avThirds, tvThirds } from "../zve10/dat.ts";

export const A7C2_SETTINGS = {
  // MF là 6, không theo thứ tự menu (có mục ẩn ở giữa); DMF chưa có mẫu
  focusMode: { ids: [0x0379, 0x0df4, 0x0df6], values: ["AF-S", "AF-A", "AF-C", "", "", "", "MF"], confirmed: ["AF-S", "AF-A", "AF-C", "MF"] },
  metering: { ids: [0x034e, 0x0e04, 0x0e06], values: ["multi", "center", "spot", "entire", "highlight"], confirmed: ["multi", "center", "spot", "entire", "highlight"] },
  // Cỡ vòng đo của Điểm (lượt 9), giữ nguyên khi đổi sang kiểu đo khác. 0x04D2 gán theo cấu trúc bộ ba (đổi cùng lượt với Điểm: L).
  meteringSpotSize: { ids: [0x04d2, 0x0e08, 0x0e0a], values: ["standard", "large"], confirmed: ["standard", "large"] },
  // Tự động là một lựa chọn; Môi trường / Trắng nằm ở Ưu tiên trong AWB (bản ghi khác)
  // Bộ ba này có bản ghi đầu ở 0x0053 thay vì vùng 0x03xx
  pictureProfile: { ids: [0x0053, 0x0e10, 0x0e12], values: ["off", "PP1", "PP2", "PP3", "PP4", "PP5", "PP6", "PP7", "PP8", "PP9", "PP10", "PP11"], confirmed: ["off", "PP1", "PP2"] }, // PP1: lượt 10b gọi lại đúng
  wb: {
    ids: [0x0365, 0x0e0c, 0x0e0e],
    values: ["auto", "daylight", "shade", "cloudy", "incandescent", "fluor-warm", "fluor-cool", "fluor-day", "fluor-daylight", "flash", "underwater-auto", "c-temp"],
    confirmed: ["auto", "underwater-auto", "c-temp"],
  },
  // Một bản ghi duy nhất
  isoAutoMinSS: { ids: [0x04d0], values: ["slower", "slow", "standard", "fast", "faster"], confirmed: ["standard", "fast"] },
  // Tốc độ cụ thể của ISO AUTO tốc độ tối thiểu: số thứ tự trong menu (5 mức ở trên, rồi 1/8000 … 30" theo nấc 1 EV).
  // 0 = đang dùng mức ở 0x04D0; chọn tốc độ cụ thể thì 0x04D0 giữ nguyên.
  isoAutoMinSSSpeed: {
    ids: [0x0334],
    values: ["preset", "", "", "", "", "1/8000", "1/4000", "1/2000", "1/1000", "1/500", "1/250", "1/125", "1/60", "1/30", "1/15", "1/8", "1/4", "1/2", '1"', '2"', '4"', '8"', '15"', '30"'],
    confirmed: ["preset", "1/250", "1/125"],
  },
  // Lượt mẫu 6: mỗi mục dưới đây chỉ có một bản ghi. "" là mã chưa biết.
  preAF: { ids: [0x0388], values: ["on", "off"], confirmed: ["on", "off"] },
  facePriority: { ids: [0x0350], values: ["on", "off"], confirmed: ["on", "off"] },
  awbPriority: { ids: [0x0367], values: ["standard", "ambience", "white"], confirmed: ["standard", "ambience", "white"] },
  // Đồng bộ sau là 5 chứ không phải 4 theo thứ tự menu: mã 3–4 gồm Slow Sync. và một mục ẩn, chưa rõ thứ tự
  flashMode: { ids: [0x0355], values: ["", "autoflash", "fill-flash", "", "", "rear-sync"], confirmed: ["autoflash", "fill-flash", "rear-sync"] },
  // Bật Picture Profile thì máy ghi Tắt (DRO bị khóa Tắt khi dùng PP); Lv1–Lv5 chưa kiểm
  dro: { ids: [0x036d], values: ["off", "auto"], confirmed: ["off", "auto"] },
  // Chế độ chụp theo vòng chế độ (lượt 8), hai bản ghi cùng giá trị; mã 0 chưa có mẫu
  shootMode: { ids: [0x0b8b, 0x11ac], values: ["", "P", "A", "S", "M"], confirmed: ["P", "A", "S", "M"] },
  // Lượt mẫu 7
  steadyShot: { ids: [0x02f5], values: ["on", "off"], confirmed: ["on", "off"] },
  liveViewDisplay: { ids: [0x0314], values: ["setting-effect-on", "setting-effect-off"], confirmed: ["setting-effect-on", "setting-effect-off"] },
  // Làm mịn da: bật/tắt và mức là hai bản ghi riêng, tắt thì mức giữ nguyên; mức theo thứ tự menu Cao, Trung bình, Thấp.
  // Lượt 7 M3 đổi Làm mịn da (Tắt) và Cài đặt bù sáng cùng lúc; lượt 8 M1 bật riêng Làm mịn da và chỉ 0x0373 đổi.
  expCompSet: { ids: [0x0359], values: ["ambient-flash", "ambient-only"], confirmed: ["ambient-flash", "ambient-only"] },
  softSkin: { ids: [0x0373], values: ["off", "on"], confirmed: ["off", "on"] },
  softSkinLevel: { ids: [0x04dc], values: ["high", "mid", "low"], confirmed: ["high", "mid", "low"] },
} as const;

// Vùng lấy nét (lượt 6, 7, 9): bộ ba 0x0E66/0x0E68/0x0E6A (kiểu vùng) và 18 bản ghi 0x0F44–0x0F54, 0x0FE8–0x0FF8 đổi cùng nhau.
// Ghi kèm khi máy lưu: chọn Điểm: L thì bộ ba 0x0E5A/0x0E5C/0x0E5E = 2 và 9 bản ghi 0x0F58–0x0F68 = 1 (cỡ điểm, giữ nguyên khi đổi vùng);
// Theo dõi thì bộ ba 0x0E60/0x0E62/0x0E64 và 9 bản ghi 0x0F6C–0x0F7C là vùng bắt đầu theo dõi (Vùng 1/1, điểm L 5/4).
// Lượt 9 M2 còn đổi 0x04DE 1→2 (AF đơn + Rộng + Trung tâm + 0.5"), chưa rõ thuộc mục nào.
const everyOther = (from: number, to: number) => Array.from({ length: (to - from) / 2 + 1 }, (_, i) => from + 2 * i);
export const A7C2_FOCUS_AREA = {
  groups: [[0x0e66, 0x0e68, 0x0e6a], [...everyOther(0x0f44, 0x0f54), ...everyOther(0x0fe8, 0x0ff8)]],
  values: { wide: [0, 0], zone: [1, 1], "spot-l": [3, 4], "tracking-zone": [6, 13], "tracking-spot-l": [6, 16] } as Record<string, number[]>,
};

/** Vùng lấy nét; null nếu các bản ghi trong một nhóm lệch nhau hoặc giá trị chưa có mẫu. */
export function readA7c2FocusArea(dat: A7c2Dat): string | null {
  const got = A7C2_FOCUS_AREA.groups.map((ids) => {
    const v = ids.map((id) => dat.records.find((r) => r.id === id)?.value[0]);
    return v.every((x) => x === v[0]) ? v[0] : undefined;
  });
  return Object.entries(A7C2_FOCUS_AREA.values).find(([, codes]) => codes.every((c, i) => c === got[i]))?.[0] ?? null;
}

// Giá trị số (lượt mẫu 5). ISO theo bậc 1/3 stop: mã = 5 + 3·log2(ISO/100), ISO 100 = 5 (200 → 8, 400 → 11, 3200 → 20, 12800 → 26).
// Nhiệt độ màu C.Temp: mã = (K − 2500) / 100 (5600K → 31). Chỉnh màu A-B / G-M lưu nhân 1000, số nguyên 4 byte có dấu:
// A và G dương, B và M âm (ngược dấu G-M so với ZV-E10); mỗi chế độ cân bằng trắng có cặp chỉnh màu riêng.
export const A7C2_NUMERIC = {
  isoAutoMin: [0x0df8, 0x0dfa, 0x0dfc],
  isoAutoMax: [0x0dfe, 0x0e00, 0x0e02],
  // ISO đặt tay (lượt 8): 0 = ISO AUTO, còn lại cùng thang mã (ISO 800 → 14)
  iso: [0x0332, 0x0df0, 0x0df2],
  // Bằng ISO AUTO tối đa khi đang ISO AUTO, bằng ISO đặt tay khi ISO cố định (lượt 5 và 8)
  isoUpper: [0x0fdc, 0x0fde],
  wbKelvin: [0x0b8f, 0x0b91, 0x0b93],
  wbShiftAuto: { ab: [0x0c4b, 0x0e97, 0x0e99], gm: [0x0c69, 0x0ecf, 0x0ed1] },
  wbShiftCTemp: { ab: [0x0c61, 0x0ebf, 0x0ec1], gm: [0x0c7f, 0x0ef7, 0x0ef9] },
} as const;

// Khẩu độ và tốc độ nằm trong bản ghi 0x017E (320 byte). Giá trị đặt (máy gọi lại) là mã APEX như ZV-E10, 4096 + 256·nấc/3:
// khẩu độ ở byte 260 (bản sao 272), tốc độ ở byte 262 (bản sao 274). Khẩu độ máy ghi theo ống kính nên lệch vài đơn vị (F5.6 = 5381, không phải 5376).
// Byte 288 (số F × 100), 290/292 (tử/mẫu tốc độ) chỉ là số đang hiện lúc lưu (ở P, A, S là số đo); lượt 10b–10d máy bỏ qua khi gọi lại.
// Lượt 10e–10f: máy gọi lại cả tốc độ lẫn khẩu độ (nhận cả mã chuẩn 5376); ống kính có vòng khẩu phải để vòng ở A, nếu không ống giữ khẩu đang xoay.
export const A7C2_EXPOSURE = { id: 0x017e, av: [260, 272], tv: [262, 274], aperture: 288, shutterNum: 290, shutterDen: 292 } as const;

/** Khẩu độ (số F) và tốc độ đặt trong file, theo nhãn menu; null nếu ngoài bảng. */
export function readA7c2Exposure(dat: A7c2Dat): { aperture: number; shutter: string } | null {
  const r = dat.records.find((x) => x.id === A7C2_EXPOSURE.id);
  if (!r || r.value.length < A7C2_EXPOSURE.shutterDen + 2) return null;
  const dv = new DataView(r.value.buffer, r.value.byteOffset, r.value.byteLength);
  const thirds = (o: number) => Math.round(((dv.getUint16(o, true) - 4096) * 3) / 256);
  const av = APERTURES.find((x) => avThirds(x) === thirds(A7C2_EXPOSURE.av[0]));
  // shortcut: bảng tốc độ của ZV-E10 dừng ở 1/4000; 1/5000–1/8000 của A7C II đọc ra null
  const shutter = SHUTTERS.find((x) => tvThirds(x) === thirds(A7C2_EXPOSURE.tv[0]));
  return av && shutter ? { aperture: parseFloat(av), shutter } : null;
}

export const isoFromCode = (code: number) => Math.round(100 * 2 ** ((code - 5) / 3));
export const kelvinFromCode = (code: number) => 2500 + code * 100;

/** Giá trị số của bản ghi đầu trong danh sách mã: 1 byte không dấu, 4 byte có dấu. */
export function readA7c2Number(dat: A7c2Dat, ids: readonly number[]): number | null {
  const r = dat.records.find((x) => x.id === ids[0]);
  if (!r || r.count !== 1) return null;
  return r.size === 4 ? new DataView(r.value.buffer, r.value.byteOffset, 4).getInt32(0, true) : r.value[0];
}

export type A7c2SettingKey = keyof typeof A7C2_SETTINGS;

/** Đọc một cài đặt; null nếu ba bản ghi không khớp nhau hoặc giá trị ngoài bảng. */
export function readA7c2Setting(dat: A7c2Dat, key: A7c2SettingKey): string | null {
  const { ids, values } = A7C2_SETTINGS[key];
  const raw = ids.map((id) => dat.records.find((r) => r.id === id)?.value);
  if (raw.some((v) => !v || v.length !== 1 || v[0] !== raw[0]![0])) return null;
  return values[raw[0]![0]] || null;
}

// Picture Profile: 25 tham số theo thứ tự menu (như bộ giải mã ZV-E10), mỗi tham số là mảng PP1–PP11 ở 0x04E7 + k × 0x42
// (cộng 2 bản sao cách nhau 0x16). Số nguyên lưu đúng giá trị trên menu (4 byte, có dấu); phần trăm lưu nhân 100 (97,5% → 9750);
// lựa chọn lưu theo mã. Mã gamma và chế độ màu theo danh sách nội bộ của Sony (có cả mục A7C II không cho chọn).
// `A7C2_PP_CONFIRMED`: tham số đã đổi thử trên máy và thấy đúng mảng; mã lựa chọn chỉ ghi những mã đã thấy trong file máy lưu.
// PP7 mặc định mang mã gamma 15 và màu 11, chưa rõ là gì.
const PP_KEYS = [
  "blackLevel", "gamma", "blackGammaRange", "blackGammaLevel", "kneeMode", "kneeAutoMax", "kneeAutoSens", "kneePoint", "kneeSlope",
  "colorMode", "saturation", "colorPhase", "depthR", "depthG", "depthB", "depthC", "depthM", "depthY",
  "detailLevel", "detailMode", "detailVH", "detailBW", "detailLimit", "detailCrisp", "detailHilight",
] as const;
export type A7c2PpParam = (typeof PP_KEYS)[number];

const ppId = (key: A7c2PpParam) => 0x04e7 + PP_KEYS.indexOf(key) * 0x42;

export const A7C2_PP_CODES = {
  gamma: { Movie: 0, Still: 1, "S-Cinetone": 2, Cine1: 3, Cine2: 4, Cine3: 5, Cine4: 6, ITU709: 7, "S-Log3": 10, HLG2: 13 },
  colorMode: { Movie: 0, Still: 1, "S-Cinetone": 2, Cinema: 3, Pro: 4, "ITU709 Matrix": 5, "Black & White": 6, "S-Gamut3.Cine": 8, "S-Gamut3": 9, "BT.2020": 10 },
  blackGammaRange: { Wide: 0, Middle: 1, Narrow: 2 },
  kneeMode: { Auto: 0, Manual: 1 },
  kneeAutoSens: { High: 0, Mid: 1 }, // thứ tự ngược với ZV-E10
  detailMode: { Auto: 0, Manual: 1 },
  detailBW: { Type1: 0, Type2: 1, Type3: 2, Type4: 3, Type5: 4 },
} as const;

export const A7C2_PP_CONFIRMED: readonly A7c2PpParam[] = PP_KEYS;

/** Mã ba bản ghi của một tham số PP. */
export function a7c2PpIds(key: A7c2PpParam): number[] {
  const id = ppId(key);
  return [id, id + 0x16, id + 0x2c];
}

/** Mảng giá trị PP1–PP11 của một tham số (bản ghi đầu trong 3 bản sao); phần tử 4 byte đọc là số nguyên có dấu. */
export function readA7c2PpArray(dat: A7c2Dat, key: A7c2PpParam): number[] {
  const r = dat.records.find((x) => x.id === ppId(key));
  if (!r) return [];
  const dv = new DataView(r.value.buffer, r.value.byteOffset, r.value.byteLength);
  return Array.from({ length: r.count }, (_, i) => (r.size === 4 ? dv.getInt32(i * 4, true) : r.value[i]));
}
