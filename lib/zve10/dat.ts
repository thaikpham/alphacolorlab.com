/**
 * Sony ZV-E10 Memory Recall DAT codec — faithful port from Python.
 * Byte-exact parity with zve10_dat.py, exposure.py, focus.py.
 * Browser-compatible: no Node APIs or crypto imports.
 */

import bundle from "./profile.json" with { type: "json" };

const FIELDS = [
  "black_level",
  "gamma",
  "black_gamma_range",
  "black_gamma_level",
  "knee_mode",
  "knee_auto_max",
  "knee_auto_sens",
  "knee_point",
  "knee_slope",
  "color_mode",
  "saturation",
  "color_phase",
  "depth_r",
  "depth_g",
  "depth_b",
  "depth_c",
  "depth_m",
  "depth_y",
  "detail_level",
  "detail_mode",
  "detail_vh",
  "detail_bw",
  "detail_limit",
  "detail_crisp",
  "detail_hilight",
];

const PP_OFFSETS: Record<string, number> = {};
for (let i = 0; i < FIELDS.length; i++) {
  PP_OFFSETS[FIELDS[i]] = 0x317 + 14 * i;
}

// Helper to compute Picture Profile bank k (1..10) offset for field i
function ppBankOffset(i: number, k: number): number {
  if (k < 1 || k > 10 || !Number.isInteger(k)) throw new Error(`Bank phải từ 1 đến 10, nhận ${k}`);
  if (k <= 7) return 0x317 + 14 * i + 2 * (k - 1);
  return 0x528 + 6 * i + 2 * (k - 8);
}

export const GAMMAS = [
  "Movie",
  "Still",
  "Cine1",
  "Cine2",
  "Cine3",
  "Cine4",
  "ITU709",
  "ITU709(800%)",
  "S-Log2",
  "S-Log3",
  "HLG",
  "HLG1",
  "HLG2",
  "HLG3",
  "S-Cinetone",
];

export const COLOR_MODES = [
  "Movie",
  "Still",
  "Cinema",
  "Pro",
  "ITU709 Matrix",
  "Black & White",
  "S-Gamut",
  "S-Gamut3.Cine",
  "S-Gamut3",
  "BT.2020",
  "709",
  "S-Cinetone",
];

export const APERTURES = [
  "1.0",
  "1.1",
  "1.2",
  "1.4",
  "1.6",
  "1.8",
  "2",
  "2.2",
  "2.5",
  "2.8",
  "3.2",
  "3.5",
  "4",
  "4.5",
  "5",
  "5.6",
  "6.3",
  "7.1",
  "8",
  "9",
  "10",
  "11",
  "13",
  "14",
  "16",
  "18",
  "20",
  "22",
  "25",
  "29",
  "32",
];

export const SHUTTERS = [
  '30"',
  '25"',
  '20"',
  '15"',
  '13"',
  '10"',
  '8"',
  '6"',
  '5"',
  '4"',
  '3.2"',
  '2.5"',
  '2"',
  '1.6"',
  '1.3"',
  '1"',
  '0.8"',
  '0.6"',
  '0.5"',
  '0.4"',
  "1/3",
  "1/4",
  "1/5",
  "1/6",
  "1/8",
  "1/10",
  "1/13",
  "1/15",
  "1/20",
  "1/25",
  "1/30",
  "1/40",
  "1/50",
  "1/60",
  "1/80",
  "1/100",
  "1/125",
  "1/160",
  "1/200",
  "1/250",
  "1/320",
  "1/400",
  "1/500",
  "1/640",
  "1/800",
  "1/1000",
  "1/1250",
  "1/1600",
  "1/2000",
  "1/2500",
  "1/3200",
  "1/4000",
];

export const ISOS = [
  "AUTO",
  "100",
  "125",
  "160",
  "200",
  "250",
  "320",
  "400",
  "500",
  "640",
  "800",
  "1000",
  "1250",
  "1600",
  "2000",
  "2500",
  "3200",
  "4000",
  "5000",
  "6400",
  "8000",
  "10000",
  "12800",
  "16000",
  "20000",
  "25600",
  "32000",
  "40000",
  "51200",
];

export const PP_FIELDS = [
  { key: "black_level", label: "Mức đen", kind: "int", min: -15, max: 15, step: 1 },
  { key: "gamma", label: "Gamma", kind: "enum", options: GAMMAS },
  { key: "black_gamma_range", label: "Phạm vi Gamma đen", kind: "enum", options: ["Wide", "Middle", "Narrow"] },
  { key: "black_gamma_level", label: "Mức Gamma đen", kind: "int", min: -7, max: 7, step: 1 },
  { key: "knee_mode", label: "Chế độ Knee", kind: "enum", options: ["Auto", "Manual"] },
  { key: "knee_auto_max", label: "Knee Auto Max", kind: "int", min: 90, max: 100, step: 0.5 },
  { key: "knee_auto_sens", label: "Độ nhạy Knee Auto", kind: "enum", options: ["Low", "Mid", "High"] },
  { key: "knee_point", label: "Điểm Knee", kind: "int", min: 75, max: 105, step: 0.5 },
  { key: "knee_slope", label: "Độ dốc Knee", kind: "int", min: -5, max: 5, step: 1 },
  { key: "color_mode", label: "Chế độ màu", kind: "enum", options: COLOR_MODES },
  { key: "saturation", label: "Độ bão hoà", kind: "int", min: -32, max: 32, step: 1 },
  { key: "color_phase", label: "Pha màu", kind: "int", min: -7, max: 7, step: 1 },
  { key: "depth_r", label: "Độ sâu Đỏ", kind: "int", min: -7, max: 7, step: 1 },
  { key: "depth_g", label: "Độ sâu Lục", kind: "int", min: -7, max: 7, step: 1 },
  { key: "depth_b", label: "Độ sâu Xanh", kind: "int", min: -7, max: 7, step: 1 },
  { key: "depth_c", label: "Độ sâu Cyan", kind: "int", min: -7, max: 7, step: 1 },
  { key: "depth_m", label: "Độ sâu Magenta", kind: "int", min: -7, max: 7, step: 1 },
  { key: "depth_y", label: "Độ sâu Vàng", kind: "int", min: -7, max: 7, step: 1 },
  { key: "detail_level", label: "Mức chi tiết", kind: "int", min: -7, max: 7, step: 1 },
  { key: "detail_mode", label: "Chế độ chi tiết", kind: "enum", options: ["Auto", "Manual"] },
  { key: "detail_vh", label: "Chi tiết ngang/dọc", kind: "int", min: -2, max: 2, step: 1 },
  { key: "detail_bw", label: "Chi tiết B&W", kind: "enum", options: ["Type1", "Type2", "Type3", "Type4", "Type5"] },
  { key: "detail_limit", label: "Giới hạn chi tiết", kind: "int", min: 0, max: 7, step: 1 },
  { key: "detail_crisp", label: "Chi tiết sắc nét", kind: "int", min: 0, max: 7, step: 1 },
  { key: "detail_hilight", label: "Chi tiết sáng", kind: "int", min: 0, max: 4, step: 1 },
];

function checksum38(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < 0x1000 - 0x39; i++) {
    sum += data[0x39 + i] << (i % 8);
  }
  return sum & 255;
}

function tail(payload: Uint8Array): Uint8Array {
  const result = new Uint8Array(512);
  const dv = new DataView(result.buffer);
  for (let i = 0; i < 128; i++) {
    let sum = 0;
    for (let j = 0; j < 32; j++) {
      sum += payload[32 * i + j];
    }
    dv.setUint16(i * 2, ~sum & 0xffff, true);
  }
  for (let i = 0; i < 128; i++) {
    let sum = 0;
    for (let j = i; j < payload.length; j += 10) {
      sum += payload[j];
    }
    dv.setUint16((128 + i) * 2, ~sum & 0xffff, true);
  }
  return result;
}

function finalize(data: Uint8Array): Uint8Array {
  const b = new Uint8Array(data);
  b[0x38] = checksum38(b);
  b.set(tail(b.slice(0, 0x1000)), 0x1000);
  return b;
}


// Số hữu tỉ chính xác (thay Fraction của Python): "0.25" → 1/4, "2/5" → 2/5, không làm tròn.
class Fraction {
  n: number;
  d: number;
  constructor(value: string | number) {
    const text = String(value).trim();
    let n: number, d: number;
    const slash = text.split("/");
    if (slash.length === 2) {
      n = parseInt(slash[0], 10); d = parseInt(slash[1], 10);
    } else {
      const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(text);
      if (!m || (m[2] === "" && !m[3])) throw new Error("Giá trị số không hợp lệ: " + text);
      const frac = m[3] || "";
      n = parseInt((m[2] || "0") + frac, 10) * (m[1] === "-" ? -1 : 1);
      d = 10 ** frac.length;
    }
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) throw new Error("Giá trị số không hợp lệ: " + text);
    if (d < 0) { n = -n; d = -d; }
    const g = Fraction.gcd(Math.abs(n), d) || 1;
    this.n = n / g; this.d = d / g;
  }
  static gcd(a: number, b: number): number { return b === 0 ? a : Fraction.gcd(b, a % b); }
  static of(n: number, d: number): Fraction { return new Fraction(`${n}/${d}`); }
  mul(o: Fraction): Fraction { return Fraction.of(this.n * o.n, this.d * o.d); }
  div(o: Fraction): Fraction { return Fraction.of(this.n * o.d, this.d * o.n); }
  add(o: Fraction): Fraction { return Fraction.of(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o: Fraction): Fraction { return Fraction.of(this.n * o.d - o.n * this.d, this.d * o.d); }
  floorInt(): number { return Math.floor(this.n / this.d); }
  truncInt(): number { return Math.trunc(this.n / this.d); }
  isInteger(): boolean { return this.d === 1; }
  toNumber(): number { return this.n / this.d; }
}

// Port của zve10_dat.encoded: enum tra bảng, affine y = transform(x)·a + b, phải ra số nguyên.
function encoded(rule: any, value: any): number {
  if (rule.kind === "enum") {
    const key = String(value);
    if (!(key in rule.values)) throw new Error("Chưa hiệu chỉnh giá trị " + key);
    return Number(rule.values[key]);
  }
  let x = new Fraction(String(value));
  const t = rule.transform || "identity";
  if (t === "trunc") x = new Fraction(x.truncInt());
  else if (t === "floor") x = new Fraction(x.floorInt());
  else if (t === "fraction") x = x.sub(new Fraction(x.truncInt()));
  else if (t === "floor_fraction") x = x.sub(new Fraction(x.floorInt()));
  else if (t !== "identity") throw new Error("Kiểu mã hóa chưa hỗ trợ.");
  const y = x.mul(new Fraction(rule.a)).add(new Fraction(rule.b));
  if (!y.isInteger()) throw new Error("Giá trị " + value + " không biểu diễn chính xác được; không làm tròn.");
  return y.n;
}

function decodeEncoded(rule: any, raw: number): any {
  if (rule.kind === "enum") {
    for (const [label, code] of Object.entries(rule.values || {})) if (code === raw) return label;
    return null;
  }
  const x = new Fraction(raw).sub(new Fraction(rule.b)).div(new Fraction(rule.a));
  return x.isInteger() ? x.n : x.toNumber();
}

export interface ParsedInfo {
  slot: 1 | 2 | 3 | 4;
  family: "N" | "P";
  name: string;
  date: string;
}

export function parseDat(bytes: Uint8Array): ParsedInfo {
  if (bytes.length !== 4608)
    throw new Error("Cần file Memory Recall SONY! của ZV-E10, dài 4.608 byte.");
  if (
    bytes[0] !== 0x53 ||
    bytes[1] !== 0x4f ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x59 ||
    bytes[4] !== 0x21
  )
    throw new Error("Cần file Memory Recall SONY! của ZV-E10, dài 4.608 byte.");

  const modelEnd = bytes.indexOf(0, 5);
  const model = new TextDecoder()
    .decode(bytes.slice(5, modelEnd))
    .replace(/\0/g, "");
  if (model !== "ZV-E10")
    throw new Error("Cần file Memory Recall SONY! của ZV-E10, dài 4.608 byte.");

  const name = new TextDecoder().decode(bytes.slice(0x28, 0x34));
  const match = name.match(/^CAMPR(0[1-4])([NP])\.DAT$/);
  if (!match)
    throw new Error(
      "Chỉ dùng file M1–M4 chụp ảnh CAMPR01…04N/P.DAT; tên nhúng: " + name
    );

  // Validate PP1 structure
  for (const offset of Object.values(PP_OFFSETS)) {
    if (bytes[offset - 1] !== 1)
      throw new Error(
        "Bố cục PP1 khác mẫu đã nghiên cứu; cần hiệu chỉnh lại."
      );
  }

  // Validate checksums
  if (
    bytes[0x38] !== checksum38(bytes) ||
    !bytes
      .slice(0x1000)
      .every((v, i) => v === tail(bytes.slice(0, 0x1000))[i])
  ) {
    throw new Error(
      "Checksum không khớp. Hãy dùng file máy vừa lưu, chưa bị sửa."
    );
  }

  const date = new TextDecoder()
    .decode(bytes.slice(0x15, 0x24))
    .replace(/\0/g, "");
  return {
    slot: parseInt(match[1]) as 1 | 2 | 3 | 4,
    family: match[2] as "N" | "P",
    name,
    date,
  };
}

export type RecordMode = "photo" | "movie";

// Byte 0x17E: 0 = ảnh, 1 = phim. Verified on NTSC (N) Photo and Movie samples only; no PAL movie sample observed.
// Read-only. Skips the embedded-name check of parseDat, so movie slots (CAMPR05N–08N) are readable here.
export function readRecordMode(bytes: Uint8Array): RecordMode | null {
  if (bytes.length !== 4608 || String.fromCharCode(...bytes.subarray(0, 5)) !== "SONY!") return null;
  const flag = bytes[0x17e];
  return flag === 0 ? "photo" : flag === 1 ? "movie" : null;
}

// Read-only decode of a movie file (CAMPR05N–08N). Same checks as parseDat except its name gate: the tail (which covers the name bytes)
// is verified on the original, then a copy gets a photo name so decodeDat can run; name, slot and family are restored afterwards.
export function decodeMovieDat(bytes: Uint8Array): DecodedSettings {
  if (readRecordMode(bytes) !== "movie") throw new Error("Không phải file phim CAMPR05–08.");
  const name = new TextDecoder().decode(bytes.slice(0x28, 0x34));
  const match = name.match(/^CAMPR(0[5-8])([NP])\.DAT$/);
  if (!match) throw new Error("Tên file phim không hợp lệ: " + name);
  const expectedTail = tail(bytes.slice(0, 0x1000));
  if (!bytes.slice(0x1000).every((v, i) => v === expectedTail[i]))
    throw new Error("Checksum không khớp. Hãy dùng file máy vừa lưu, chưa bị sửa.");
  const probe = new Uint8Array(bytes);
  probe.set(new TextEncoder().encode(`CAMPR01${match[2]}.DAT`), 0x28);
  probe.set(tail(probe.slice(0, 0x1000)), 0x1000);
  const decoded = decodeDat(probe);
  return { ...decoded, slot: Number(match[1]), family: match[2] as "N" | "P", name };
}

export interface WB {
  mode: "awb" | "ctemp";
  kelvin?: number;
  ab?: number;
  gm?: number;
  priority?: string;
}

export interface Exposure {
  aperture: string | null;
  shutter: string | null;
  iso: string | null;
}

export interface DecodedSettings {
  slot: number;
  family: "N" | "P";
  name: string;
  date: string;
  wb: WB;
  pp_selected: number;
  pp1: Record<string, number | string | null>;
  mode: string | null;
  focus: string | null;
  focusArea: string | null;
  metering: string | null;
  facePriority: string | null;
  softSkin: string | null;
  autoReview: string | null;
  flashMode: string | null;
  expCompSet: string | null;
  awbPriority: string | null;
  preAF: string | null;
  steadyShot: string | null;
  eFrontCurtain: string | null;
  liveView: string | null;
  exposure: Exposure;
  recordMode: RecordMode | null;
}

function seconds(label: string): number {
  if (label.startsWith("1/")) {
    return 1 / parseFloat(label.slice(2));
  }
  return parseFloat(label.replace('"', ""));
}

export function avThirds(label: string): number {
  return Math.round(6 * Math.log2(parseFloat(label)));
}

export function tvThirds(label: string): number {
  return Math.round(-3 * Math.log2(seconds(label)));
}

export function apexU16(thirds: number): number {
  return Math.floor(4096 + (256 * thirds) / 3);
}

function readInt(b: Uint8Array, offset: number, width = 1, signed = false): number {
  let v = 0;
  for (let i = width - 1; i >= 0; i--) v = v * 256 + b[offset + i];
  return signed && v >= 2 ** (8 * width - 1) ? v - 2 ** (8 * width) : v;
}

function isoCode(label: string, c: any): number {
  return label === "AUTO" ? (c.auto ?? 0) : (c.base ?? 11) + Math.round(3 * Math.log2(parseInt(label, 10) / 100));
}

// Decode Picture Profile bank k (1..10); returns map field key → decoded value
export function decodePpBank(bytes: Uint8Array, k: number, profile: any = PROFILE): Record<string, number | string | null> {
  if (bytes.length !== 4608) throw new Error("Cần file Memory Recall SONY! của ZV-E10, dài 4.608 byte.");
  if (k < 1 || k > 10 || !Number.isInteger(k)) throw new Error(`Bank phải từ 1 đến 10, nhận ${k}`);

  const result: Record<string, number | string | null> = {};
  for (let i = 0; i < FIELDS.length; i++) {
    const fieldKey = FIELDS[i];
    const offset = ppBankOffset(i, k);
    const rule = profile.pp?.[fieldKey];
    if (!rule) continue;
    result[fieldKey] = decodeEncoded(rule, readInt(bytes, offset, 1, Boolean(rule.signed)));
  }
  return result;
}

// Port của zve10_dat.decode_settings + exposure.describe + focus.describe (đọc lại giá trị hiệu lực trong file).
export function decodeDat(bytes: Uint8Array, profile: any = PROFILE, focusProfile: any = FOCUS_PROFILE, focusAreaProfile: any = FOCUS_AREA_PROFILE, meteringProfile: any = METERING_PROFILE, facePriorityProfile: any = FACE_PRIORITY_PROFILE, softSkinProfile: any = SOFT_SKIN_PROFILE): DecodedSettings {
  const info = parseDat(bytes);
  const b = bytes;
  const pp1: Record<string, number | string | null> = {};
  for (const [key, rule] of Object.entries<any>(profile.pp || {}))
    pp1[key] = decodeEncoded(rule, readInt(b, PP_OFFSETS[key], 1, Boolean(rule.signed)));

  const wbMode = ({ 14: "ctemp", 1: "awb" } as Record<number, "ctemp" | "awb">)[b[0x19a]];
  const wb: WB = { mode: wbMode, kelvin: wbMode === "ctemp" ? b[0x1d8] * 100 : undefined };
  const config = profile.wb?.[wbMode] || {};
  for (const axis of ["ab", "gm"] as const) {
    const full: Fraction[] = [], parts: Fraction[] = [];
    for (const r of config[axis] || []) {
      const x = new Fraction(readInt(b, r.offset, r.width, r.signed)).sub(new Fraction(r.b)).div(new Fraction(r.a));
      ((r.transform || "identity") === "identity" ? full : parts).push(x);
    }
    if (full.length || parts.length)
      wb[axis] = (full[0] ?? parts.reduce((acc, x) => acc.add(x), new Fraction(0))).toNumber();
  }
  if (wbMode === "awb") {
    const offsets: number[] = config.priority_offsets || [];
    wb.priority = Object.entries<number>(config.priority_values || {}).find(([, v]) => offsets.length > 0 && offsets.every((o) => b[o] === v))?.[0];
  }

  const mode = Object.entries<number>(profile.shoot_modes || {}).find(([, v]) => v === b[0x180])?.[0] ?? null;

  let focus: string | null = null;
  if (focusProfile?.calibrated && focusProfile.rules?.length) { // dùng chung quy tắc N cho P (xem shortcut ở applySettings)
    const matches = (focusProfile.modes as string[]).filter((m) =>
      focusProfile.rules.every((r: any) => r.values[m] === null || readInt(b, r.offset, r.width) === r.values[m]));
    focus = matches.length === 1 ? matches[0] : null;
  }

  let focusArea: string | null = null;
  if (focusAreaProfile?.calibrated && focusAreaProfile.rules?.length) {
    const matches = (focusAreaProfile.areas as string[]).filter((a) =>
      focusAreaProfile.rules.every((r: any) => r.values[a] === null || readInt(b, r.offset, r.width) === r.values[a]));
    focusArea = matches.length === 1 ? matches[0] : null;
  }

  let metering: string | null = null;
  if (meteringProfile?.calibrated && meteringProfile.rules?.length) {
    const matches = (meteringProfile.modes as string[]).filter((m) =>
      meteringProfile.rules.every((r: any) => r.values[m] === null || readInt(b, r.offset, r.width) === r.values[m]));
    metering = matches.length === 1 ? matches[0] : null;
  }

  let facePriority: string | null = null;
  if (facePriorityProfile?.calibrated && facePriorityProfile.rules?.length) {
    const matches = (facePriorityProfile.states as string[]).filter((s) =>
      facePriorityProfile.rules.every((r: any) => r.values[s] === null || readInt(b, r.offset, r.width) === r.values[s]));
    facePriority = matches.length === 1 ? matches[0] : null;
  }

  let softSkin: string | null = null;
  if (softSkinProfile?.calibrated && softSkinProfile.rules?.length) {
    const matches = (softSkinProfile.levels as string[]).filter((l) =>
      softSkinProfile.rules.every((r: any) => r.values[l] === null || readInt(b, r.offset, r.width) === r.values[l]));
    softSkin = matches.length === 1 ? matches[0] : null;
  }

  let autoReview: string | null = null;
  const autoReviewProfile = bundle.auto_review;
  if (autoReviewProfile?.calibrated && autoReviewProfile.rules?.length) {
    const matches = (autoReviewProfile.modes as string[]).filter((m) =>
      autoReviewProfile.rules.every((r: any) => r.values[m] === null || readInt(b, r.offset, r.width) === r.values[m]));
    autoReview = matches.length === 1 ? matches[0] : null;
  }

  let flashMode: string | null = null;
  const flashModeProfile = bundle.flash_mode;
  if (flashModeProfile?.calibrated && flashModeProfile.rules?.length) {
    const matches = (flashModeProfile.modes as string[]).filter((m) =>
      flashModeProfile.rules.every((r: any) => r.values[m] === null || readInt(b, r.offset, r.width) === r.values[m]));
    flashMode = matches.length === 1 ? matches[0] : null;
  }

  let expCompSet: string | null = null;
  const expCompSetProfile = bundle.exp_comp_set;
  if (expCompSetProfile?.calibrated && expCompSetProfile.rules?.length) {
    const matches = (expCompSetProfile.modes as string[]).filter((m) =>
      expCompSetProfile.rules.every((r: any) => r.values[m] === null || readInt(b, r.offset, r.width) === r.values[m]));
    expCompSet = matches.length === 1 ? matches[0] : null;
  }

  let awbPriority: string | null = null;
  const awbPriorityProfile = bundle.awb_priority;
  if (awbPriorityProfile?.calibrated && awbPriorityProfile.rules?.length) {
    const matches = (awbPriorityProfile.modes as string[]).filter((m) =>
      awbPriorityProfile.rules.every((r: any) => r.values[m] === null || readInt(b, r.offset, r.width) === r.values[m]));
    awbPriority = matches.length === 1 ? matches[0] : null;
  }

  let preAF: string | null = null;
  const preAFProfile = bundle.pre_af;
  if (preAFProfile?.calibrated && preAFProfile.rules?.length) {
    const matches = (preAFProfile.states as string[]).filter((s) =>
      preAFProfile.rules.every((r: any) => r.values[s] === null || readInt(b, r.offset, r.width) === r.values[s]));
    preAF = matches.length === 1 ? matches[0] : null;
  }

  let steadyShot: string | null = null;
  const steadyShotProfile = bundle.steady_shot;
  if (steadyShotProfile?.calibrated && steadyShotProfile.rules?.length) {
    const matches = (steadyShotProfile.states as string[]).filter((s) =>
      steadyShotProfile.rules.every((r: any) => r.values[s] === null || readInt(b, r.offset, r.width) === r.values[s]));
    steadyShot = matches.length === 1 ? matches[0] : null;
  }

  let eFrontCurtain: string | null = null;
  const eFrontCurtainProfile = bundle.e_front_curtain;
  if (eFrontCurtainProfile?.calibrated && eFrontCurtainProfile.rules?.length) {
    const matches = (eFrontCurtainProfile.states as string[]).filter((s) =>
      eFrontCurtainProfile.rules.every((r: any) => r.values[s] === null || readInt(b, r.offset, r.width) === r.values[s]));
    eFrontCurtain = matches.length === 1 ? matches[0] : null;
  }

  let liveView: string | null = null;
  const liveViewProfile = bundle.live_view;
  if (liveViewProfile?.calibrated && liveViewProfile.rules?.length) {
    const matches = (liveViewProfile.modes as string[]).filter((m) =>
      liveViewProfile.rules.every((r: any) => r.values[m] === null || readInt(b, r.offset, r.width) === r.values[m]));
    liveView = matches.length === 1 ? matches[0] : null;
  }

  const exposure: Exposure = { aperture: null, shutter: null, iso: null };
  const ec = profile.exposure;
  if (ec) {
    const rawAv = readInt(b, ec.aperture.apex_offsets[0], 2), rawTv = readInt(b, ec.shutter.apex_offsets[0], 2);
    exposure.aperture = APERTURES.find((x) => apexU16(avThirds(x)) === rawAv) ?? null;
    exposure.shutter = SHUTTERS.find((x) => apexU16(tvThirds(x)) === rawTv) ?? null;
    const code = b[ec.iso.offsets[0]];
    exposure.iso = ISOS.find((x) => isoCode(x, ec.iso) === code) ?? null;
  }

  return { ...info, wb, pp_selected: b[0x315], pp1, mode, focus, focusArea, metering, facePriority, softSkin, autoReview, flashMode, expCompSet, awbPriority, preAF, steadyShot, eFrontCurtain, liveView, exposure, recordMode: readRecordMode(b) };
}

export interface SlotSettings {
  pp?: string | Record<string, any> | "keep";
  ppOn?: boolean;
  ppBanks?: Partial<Record<number, Record<string, any>>>;
  wb?: WB | "keep";
  mode?: "P" | "A" | "S" | "M" | "keep";
  aperture?: number | string | "keep";
  shutter?: string | "keep";
  iso?: number | string | "auto" | "keep";
  focus?: "MF" | "AF-S" | "AF-C" | "keep";
  focusArea?: "wide" | "zone" | "flexible-spot-l" | "tracking-zone" | "tracking-flexible-spot-l" | "keep";
  metering?: "multi" | "center" | "spot-standard" | "spot-large" | "entire" | "highlight" | "keep";
  facePriority?: "off" | "on" | "keep";
  softSkin?: "off" | "low" | "mid" | "high" | "keep";
  autoReview?: "off" | "2s" | "5s" | "10s" | "keep";
  flashMode?: "fill-flash" | "rear-sync" | "slow-sync" | "keep";
  expCompSet?: "ambient-only" | "ambient-flash" | "keep";
  awbPriority?: "standard" | "ambience" | "white" | "keep";
  preAF?: "off" | "on" | "keep";
  steadyShot?: "off" | "on" | "keep";
  eFrontCurtain?: "off" | "on" | "keep";
  liveView?: "setting-effect-on" | "setting-effect-off" | "keep";
}

// Port của zve10_dat.with_supplement: phủ mã enum Dot6, cờ AWB lẻ và offset phơi sáng lên hồ sơ đã học.
export function withSupplement(profile: any, supplement: any): any {
  if (!supplement || !profile?.calibrated || profile.model !== "ZV-E10" ||
      (profile.family ?? supplement.family) !== supplement.family) return profile;
  const p = JSON.parse(JSON.stringify(profile));
  for (const [key, values] of Object.entries<any>(supplement.pp_enum || {})) {
    const rule = p.pp?.[key];
    if (!rule || rule.kind !== "enum") continue;
    for (const [label, code] of Object.entries<any>(values)) {
      const old = rule.values[label];
      if (old !== undefined && old !== code) throw new Error(`Hồ sơ bổ sung mâu thuẫn ${key} ${label}: ${old} ≠ ${code}`);
      if (old === undefined && Object.values(rule.values).includes(code)) throw new Error(`Mã ${key}=${code} đã thuộc giá trị khác.`);
      rule.values[label] = code;
    }
  }
  if (p.wb?.awb) for (const [axis, ok] of Object.entries(supplement.awb_fractional_verified || {}))
    (p.wb.awb.fractional_verified ??= {})[axis] = Boolean(ok);
  if (supplement.exposure) p.exposure = JSON.parse(JSON.stringify(supplement.exposure));
  p.pp_basis = supplement.pp_basis || {};
  p.supplement_revision = supplement.revision ?? 1;
  return p;
}

export const PROFILE: any = withSupplement(bundle.profile, bundle.supplement);
export const FOCUS_PROFILE: any = bundle.focus;
export const FOCUS_AREA_PROFILE: any = bundle.focus_area;
export const FOCUS_AREAS: readonly string[] = bundle.focus_area?.areas ?? [];
export const METERING_PROFILE: any = bundle.metering;
export const METERING_MODES: readonly string[] = bundle.metering?.modes ?? [];
export const FACE_PRIORITY_PROFILE: any = bundle.face_priority;
export const FACE_PRIORITY: readonly string[] = bundle.face_priority?.states ?? [];
export const SOFT_SKIN_PROFILE: any = bundle.soft_skin;
export const SOFT_SKIN: readonly string[] = bundle.soft_skin?.levels ?? [];
export const AUTO_REVIEW_PROFILE: any = bundle.auto_review;
export const AUTO_REVIEW: readonly string[] = bundle.auto_review?.modes ?? [];
export const FLASH_MODE_PROFILE: any = bundle.flash_mode;
export const FLASH_MODES: readonly string[] = bundle.flash_mode?.modes ?? [];
export const EXP_COMP_SET_PROFILE: any = bundle.exp_comp_set;
export const EXP_COMP_SETS: readonly string[] = bundle.exp_comp_set?.modes ?? [];
export const AWB_PRIORITY_PROFILE: any = bundle.awb_priority;
export const AWB_PRIORITIES: readonly string[] = bundle.awb_priority?.modes ?? [];
export const PRE_AF_PROFILE: any = bundle.pre_af;
export const PRE_AF: readonly string[] = bundle.pre_af?.states ?? [];
export const STEADY_SHOT_PROFILE: any = bundle.steady_shot;
export const STEADY_SHOT: readonly string[] = bundle.steady_shot?.states ?? [];
export const E_FRONT_CURTAIN_PROFILE: any = bundle.e_front_curtain;
export const E_FRONT_CURTAIN: readonly string[] = bundle.e_front_curtain?.states ?? [];
export const LIVE_VIEW_PROFILE: any = bundle.live_view;
export const LIVE_VIEW: readonly string[] = bundle.live_view?.modes ?? [];

function put(b: Uint8Array, offset: number, value: number, width = 1, signed = false) {
  const v = Math.trunc(value);
  const lo = signed ? -(2 ** (8 * width - 1)) : 0, hi = signed ? 2 ** (8 * width - 1) - 1 : 2 ** (8 * width) - 1;
  if (v < lo || v > hi) throw new Error("Giá trị vượt kiểu dữ liệu tại 0x" + offset.toString(16).toUpperCase().padStart(4, "0") + ".");
  let u = v < 0 ? v + 2 ** (8 * width) : v;
  for (let i = 0; i < width; i++) { b[offset + i] = u & 0xff; u = Math.floor(u / 256); }
}

const SHOOT_MODES = ["P", "A", "S", "M"];
const EXPOSURE_OPTIONS: Record<string, readonly string[]> = { aperture: APERTURES, shutter: SHUTTERS, iso: ISOS };

function exposureLabel(key: string, value: unknown): string {
  if (value === "keep" || value === undefined || value === null) return "keep";
  if (key === "iso") return typeof value === "string" && value.toLowerCase() === "auto" ? "AUTO" : String(value);
  if (key === "aperture" && typeof value === "number") return APERTURES.find((a) => Number(a) === value) ?? String(value);
  return String(value);
}

export function shutterDisplay(label: string): [number, number] {
  if (label.startsWith("1/")) return [1, parseInt(label.slice(2), 10)];
  const t = parseFloat(label.replace('"', ""));
  return t === Math.trunc(t) ? [Math.trunc(t), 1] : [Math.round(t * 10), 10];
}

export function applySettings(
  base: Uint8Array,
  _slot: 1 | 2 | 3 | 4,
  settings: SlotSettings,
  _date?: Date,
  profile: any = PROFILE,
  focusProfile: any = FOCUS_PROFILE,
  focusAreaProfile: any = FOCUS_AREA_PROFILE,
  meteringProfile: any = METERING_PROFILE,
  facePriorityProfile: any = FACE_PRIORITY_PROFILE,
  softSkinProfile: any = SOFT_SKIN_PROFILE,
  autoReviewProfile: any = AUTO_REVIEW_PROFILE
): Uint8Array {
  // shortcut: hồ sơ học từ dòng N; file P (hệ PAL) cùng bố cục theo đối chiếu 06/11/2026, dùng chung offset cho tới khi có bộ mẫu P riêng
  const b = new Uint8Array(base);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const issues: string[] = [];

  // ---- requirements (port của dat.requirements + focus.requirements + exposure.requirements)
  if (!profile?.calibrated) throw new Error("Thiếu hồ sơ ZV-E10 phù hợp.");
  const mode = settings.mode ?? "keep";
  if (mode !== "keep") {
    if (!SHOOT_MODES.includes(mode)) issues.push("Chế độ chụp phải là P/A/S/M.");
    else if (!(mode in (profile.shoot_modes || {}))) issues.push("Cần hiệu chỉnh chế độ " + mode + ".");
  }
  const pp = settings.pp && settings.pp !== "keep" ? settings.pp : null;
  if (pp) for (const [key, value] of Object.entries(pp)) {
    try {
      const rule = profile.pp?.[key];
      if (!rule) throw new Error("Cần hiệu chỉnh " + key.replace(/_/g, " ") + ".");
      encoded(rule, value);
    } catch (e) { issues.push((e as Error).message); }
  }
  const ppBanks = settings.ppBanks ?? {};
  for (const [kStr, bank] of Object.entries(ppBanks)) {
    const k = Number(kStr);
    if (!Number.isInteger(k) || k < 2 || k > 10) { issues.push(`PP bank phải từ 2 đến 10, nhận ${kStr}`); continue; }
    if (!bank || typeof bank !== "object") { issues.push(`PP${k}: cần bộ thông số`); continue; }
    for (const [key, value] of Object.entries(bank as Record<string, unknown>)) {
      try {
        const rule = profile.pp?.[key];
        if (!rule) throw new Error("Cần hiệu chỉnh " + key.replace(/_/g, " ") + ".");
        if (value === "S-Cinetone") throw new Error("S-Cinetone không được lưu trong file; dùng bộ khác.");
        encoded(rule, value);
      } catch (e) { issues.push(`PP${k}: ${(e as Error).message}`); }
    }
  }
  const wb = settings.wb && settings.wb !== "keep" ? (settings.wb as WB) : null;
  let wbConfig: any = null;
  if (wb) {
    if (wb.mode !== "ctemp" && wb.mode !== "awb") issues.push("WB preset " + wb.mode + " chưa hiệu chỉnh; chọn C.Temp hoặc AWB rõ ràng.");
    else {
      wbConfig = profile.wb?.[wb.mode];
      if (!wbConfig?.ab || !wbConfig?.gm) issues.push("Cần hiệu chỉnh WB " + (wb.mode === "ctemp" ? "mức lẻ C.Temp" : "AWB/shift/priority") + ".");
      else {
        for (const axis of ["ab", "gm"] as const) {
          const v = wb[axis] ?? 0;
          if (wbConfig.fractional_verified?.[axis] === false && !new Fraction(String(v)).isInteger())
            issues.push("Chưa có mẫu xác nhận phần lẻ AWB " + axis.toUpperCase() + "; chọn mức nguyên cho trục này.");
          for (const rule of wbConfig[axis]) { try { encoded(rule, v); } catch (e) { issues.push((e as Error).message); } }
        }
        if (wb.mode === "awb" && !((wb.priority ?? "standard") in (wbConfig.priority_values || {})))
          issues.push("Chưa hiệu chỉnh Priority AWB " + (wb.priority ?? "standard") + ".");
      }
    }
  }
  const focus = settings.focus ?? "keep";
  if (!["keep", "MF", "AF-S", "AF-C"].includes(focus)) issues.push("Focus phải là Giữ nguyên, MF, AF-S hoặc AF-C.");
  else if (focus !== "keep") {
    if (!focusProfile?.calibrated || !focusProfile.rules?.length) issues.push("Chưa có hồ sơ Focus phù hợp. Chọn Giữ nguyên.");
    else for (const r of focusProfile.rules) {
      // shortcut: bỏ kiểm tra chồng lấn với WB/PP/Mode (protected_spans) vì hồ sơ đóng gói đã qua kiểm tra đó trong Python
      if (![1, 2, 4].includes(r.width) || !(0x17e <= r.offset && r.offset + r.width <= 0x7e1) || b[r.offset - 1] !== r.width) {
        issues.push("Bố cục trường Focus khác bộ mẫu đã học; cần đối chiếu lại."); break;
      }
      if (!(focus in r.values)) { issues.push("Chưa học mã Focus " + focus + "."); break; }
    }
  }
  const focusArea = settings.focusArea ?? "keep";
  if (focusArea !== "keep") {
    if (!focusAreaProfile?.calibrated || !focusAreaProfile.areas?.length) issues.push("Chưa có hồ sơ Vùng lấy nét phù hợp. Chọn Giữ nguyên.");
    else if (!(focusAreaProfile.areas as string[]).includes(focusArea)) issues.push("Vùng lấy nét không hợp lệ: " + focusArea + ".");
    else if (focusArea.startsWith("tracking-") && focus !== "AF-C") issues.push("Theo dõi chỉ dùng được với AF-C.");
  }
  const metering = settings.metering ?? "keep";
  if (metering !== "keep") {
    if (!meteringProfile?.calibrated || !meteringProfile.modes?.length) issues.push("Chưa có hồ sơ Đo sáng phù hợp. Chọn Giữ nguyên.");
    else if (!(meteringProfile.modes as string[]).includes(metering)) issues.push("Chế độ đo sáng không hợp lệ: " + metering + ".");
  }
  const facePriority = settings.facePriority ?? "keep";
  if (facePriority !== "keep") {
    if (!facePriorityProfile?.calibrated || !facePriorityProfile.states?.length) issues.push("Chưa có hồ sơ Ưu tiên khuôn mặt phù hợp. Chọn Giữ nguyên.");
    else if (!(facePriorityProfile.states as string[]).includes(facePriority)) issues.push("Trạng thái ưu tiên khuôn mặt không hợp lệ: " + facePriority + ".");
  }
  const softSkin = settings.softSkin ?? "keep";
  if (softSkin !== "keep") {
    if (!softSkinProfile?.calibrated || !softSkinProfile.levels?.length) issues.push("Chưa có hồ sơ Làm mịn da phù hợp. Chọn Giữ nguyên.");
    else if (!(softSkinProfile.levels as string[]).includes(softSkin)) issues.push("Mức làm mịn da không hợp lệ: " + softSkin + ".");
  }
  const autoReview = settings.autoReview ?? "keep";
  if (autoReview !== "keep") {
    if (!autoReviewProfile?.calibrated || !autoReviewProfile.modes?.length) issues.push("Chưa có hồ sơ Tự động xem lại phù hợp. Chọn Giữ nguyên.");
    else if (!(autoReviewProfile.modes as string[]).includes(autoReview)) issues.push("Chế độ tự động xem lại không hợp lệ: " + autoReview + ".");
  }
  const flashMode = settings.flashMode ?? "keep";
  if (flashMode !== "keep") {
    if (!bundle.flash_mode?.calibrated || !bundle.flash_mode.modes?.length) issues.push("Chưa có hồ sơ Chế độ đèn flash phù hợp. Chọn Giữ nguyên.");
    else if (!(bundle.flash_mode.modes as string[]).includes(flashMode)) issues.push("Chế độ đèn flash không hợp lệ: " + flashMode + ".");
  }
  const expCompSet = settings.expCompSet ?? "keep";
  if (expCompSet !== "keep") {
    if (!bundle.exp_comp_set?.calibrated || !bundle.exp_comp_set.modes?.length) issues.push("Chưa có hồ sơ Cài đặt bù sáng phù hợp. Chọn Giữ nguyên.");
    else if (!(bundle.exp_comp_set.modes as string[]).includes(expCompSet)) issues.push("Cài đặt bù sáng không hợp lệ: " + expCompSet + ".");
  }
  const awbPriority = settings.awbPriority ?? "keep";
  if (awbPriority !== "keep") {
    if (!bundle.awb_priority?.calibrated || !bundle.awb_priority.modes?.length) issues.push("Chưa có hồ sơ Ưu tiên AWB phù hợp. Chọn Giữ nguyên.");
    else if (!(bundle.awb_priority.modes as string[]).includes(awbPriority)) issues.push("Ưu tiên AWB không hợp lệ: " + awbPriority + ".");
  }
  const preAF = settings.preAF ?? "keep";
  if (preAF !== "keep") {
    if (!bundle.pre_af?.calibrated || !bundle.pre_af.states?.length) issues.push("Chưa có hồ sơ Pre-AF phù hợp. Chọn Giữ nguyên.");
    else if (!(bundle.pre_af.states as string[]).includes(preAF)) issues.push("Pre-AF không hợp lệ: " + preAF + ".");
  }
  const steadyShot = settings.steadyShot ?? "keep";
  if (steadyShot !== "keep") {
    if (!bundle.steady_shot?.calibrated || !bundle.steady_shot.states?.length) issues.push("Chưa có hồ sơ SteadyShot phù hợp. Chọn Giữ nguyên.");
    else if (!(bundle.steady_shot.states as string[]).includes(steadyShot)) issues.push("SteadyShot không hợp lệ: " + steadyShot + ".");
  }
  const eFrontCurtain = settings.eFrontCurtain ?? "keep";
  if (eFrontCurtain !== "keep") {
    if (!bundle.e_front_curtain?.calibrated || !bundle.e_front_curtain.states?.length) issues.push("Chưa có hồ sơ Màn trập trước điện tử phù hợp. Chọn Giữ nguyên.");
    else if (!(bundle.e_front_curtain.states as string[]).includes(eFrontCurtain)) issues.push("Màn trập trước điện tử không hợp lệ: " + eFrontCurtain + ".");
  }
  const liveView = settings.liveView ?? "keep";
  if (liveView !== "keep") {
    if (!bundle.live_view?.calibrated || !bundle.live_view.modes?.length) issues.push("Chưa có hồ sơ Hiển thị Live View phù hợp. Chọn Giữ nguyên.");
    else if (!(bundle.live_view.modes as string[]).includes(liveView)) issues.push("Hiển thị Live View không hợp lệ: " + liveView + ".");
  }
  const exposure: Record<string, string> = {};
  for (const key of ["aperture", "shutter", "iso"] as const) {
    const label = exposureLabel(key, settings[key]);
    exposure[key] = label;
    if (label === "keep") continue;
    if (!profile.exposure) { issues.push("Hồ sơ hiện tại chưa có mã khẩu/tốc/ISO; chọn Giữ gốc."); break; }
    if (!EXPOSURE_OPTIONS[key].includes(label)) issues.push(`Giá trị ${key} không hợp lệ: ${label}`);
  }
  if (issues.length) throw new Error([...new Set(issues)].join("\n"));

  // Header 0x00–0x37 (tên, ngày, byte 0x35 chưa giải mã) giữ nguyên như Python: máy báo File Error nếu đổi ngày/tên mà 0x35 không khớp

  // ---- focus.apply
  if (focus !== "keep") for (const r of focusProfile.rules) if (r.values[focus] !== null) put(b, r.offset, r.values[focus], r.width);

  // ---- focusArea.apply
  if (focusArea !== "keep") for (const r of focusAreaProfile.rules) if (r.values[focusArea] !== null) put(b, r.offset, r.values[focusArea], r.width);

  // ---- metering.apply
  if (metering !== "keep") for (const r of meteringProfile.rules) if (r.values[metering] !== null) put(b, r.offset, r.values[metering], r.width);

  // ---- facePriority.apply
  if (facePriority !== "keep") for (const r of facePriorityProfile.rules) if (r.values[facePriority] !== null) put(b, r.offset, r.values[facePriority], r.width);

  // ---- softSkin.apply
  if (softSkin !== "keep") for (const r of softSkinProfile.rules) if (r.values[softSkin] !== null) put(b, r.offset, r.values[softSkin], r.width);

  // ---- autoReview.apply
  if (autoReview !== "keep") for (const r of autoReviewProfile.rules) if (r.values[autoReview] !== null) put(b, r.offset, r.values[autoReview], r.width);

  // ---- flashMode.apply
  if (flashMode !== "keep") for (const r of bundle.flash_mode.rules) if (r.values[flashMode] !== null) put(b, r.offset, r.values[flashMode], r.width);

  // ---- expCompSet.apply
  if (expCompSet !== "keep") for (const r of bundle.exp_comp_set.rules) if (r.values[expCompSet] !== null) put(b, r.offset, r.values[expCompSet], r.width);

  // ---- awbPriority.apply
  if (awbPriority !== "keep") for (const r of bundle.awb_priority.rules) if (r.values[awbPriority] !== null) put(b, r.offset, r.values[awbPriority], r.width);

  // ---- preAF.apply
  if (preAF !== "keep") for (const r of bundle.pre_af.rules) if (r.values[preAF] !== null) put(b, r.offset, r.values[preAF], r.width);

  // ---- steadyShot.apply
  if (steadyShot !== "keep") for (const r of bundle.steady_shot.rules) if (r.values[steadyShot] !== null) put(b, r.offset, r.values[steadyShot], r.width);

  // ---- eFrontCurtain.apply
  if (eFrontCurtain !== "keep") for (const r of bundle.e_front_curtain.rules) if (r.values[eFrontCurtain] !== null) put(b, r.offset, r.values[eFrontCurtain], r.width);

  // ---- liveView.apply
  if (liveView !== "keep") for (const r of bundle.live_view.rules) if (r.values[liveView] !== null) put(b, r.offset, r.values[liveView], r.width);

  // ---- exposure.apply
  const ec = profile.exposure;
  if (exposure.aperture !== "keep") {
    for (const off of ec.aperture.apex_offsets) dv.setUint16(off, apexU16(avThirds(exposure.aperture)), true);
    dv.setUint16(ec.aperture.display_offset, Math.round(parseFloat(exposure.aperture) * 100), true);
  }
  if (exposure.shutter !== "keep") {
    for (const off of ec.shutter.apex_offsets) dv.setUint16(off, apexU16(tvThirds(exposure.shutter)), true);
    const [num, den] = shutterDisplay(exposure.shutter);
    dv.setUint16(ec.shutter.display_offset, num, true);
    dv.setUint16(ec.shutter.display_offset + 2, den, true);
  }
  if (exposure.iso !== "keep") {
    const code = exposure.iso === "AUTO" ? (ec.iso.auto ?? 0) : (ec.iso.base ?? 11) + Math.round(3 * Math.log2(parseInt(exposure.iso, 10) / 100));
    for (const off of ec.iso.offsets) b[off] = code;
  }

  // ---- PP1 (mỗi file MR giữ PP1 riêng; không ghi PP2–10 chưa hiệu chỉnh)
  if (settings.ppOn === false) {
    if (pp) throw new Error("Tắt Picture Profile thì không chỉnh thông số PP.");
    b[0x315] = 0;
  } else {
    if (pp) {
      for (const [key, value] of Object.entries(pp)) {
        const rule = profile.pp[key];
        put(b, PP_OFFSETS[key], encoded(rule, value), 1, Boolean(rule.signed));
      }
    }
    if (settings.ppOn === true) b[0x315] = 1;
  }

  // ---- PP2–PP10 banks
  for (const [kStr, bank] of Object.entries(ppBanks)) {
    const k = Number(kStr);
    if (!Number.isInteger(k) || k < 2 || k > 10) continue;
    for (let i = 0; i < FIELDS.length; i++) {
      const fieldKey = FIELDS[i];
      const value = (bank as Record<string, unknown>)[fieldKey];
      if (value === undefined) continue;
      const rule = profile.pp[fieldKey];
      const offset = ppBankOffset(i, k);
      // Kiểm tra byte cấu trúc trước khi ghi
      if (b[offset - 1] !== 1) throw new Error(`PP${k}: bố cục khác mẫu đã nghiên cứu; cần hiệu chỉnh lại.`);
      put(b, offset, encoded(rule, value), 1, Boolean(rule.signed));
    }
  }

  // ---- WB
  if (wb) {
    b[0x19a] = wb.mode === "ctemp" ? 14 : 1;
    const ab = wb.ab ?? 0, gm = wb.gm ?? 0;
    if (wb.mode === "ctemp") {
      const k = wb.kelvin ?? 0;
      if (!(2500 <= k && k <= 9900) || k % 100 !== 0) throw new Error("Kelvin phải 2500–9900 K, bước 100.");
      b[0x1d8] = Math.trunc(k / 100);
      if (new Fraction(String(ab)).isInteger() && new Fraction(String(gm)).isInteger()) {
        put(b, 0x1b8, Number(ab), 1, true);
        put(b, 0x1d6, Number(gm), 1, true); // quy ước XML: +M, −G
      }
    }
    for (const axis of ["ab", "gm"] as const)
      for (const rule of wbConfig[axis]) put(b, rule.offset, encoded(rule, axis === "ab" ? ab : gm), rule.width, rule.signed);
    if (wb.mode === "awb")
      for (const off of wbConfig.priority_offsets || []) put(b, off, wbConfig.priority_values[(awbPriority !== "keep" ? awbPriority : wb.priority) ?? "standard"]); // cùng byte 0x5D3 với awbPriority
  }

  // ---- shoot mode
  if (mode !== "keep") {
    for (const off of profile.shoot_offsets) put(b, off, profile.shoot_modes[mode]);
    for (const r of profile.mode_bindings || []) put(b, r.offset, r.values[mode], r.width ?? 1);
  }

  const out = finalize(b);
  parseDat(out);
  return out;
}

export interface BuiltSet {
  name: string;
  data: Uint8Array;
}

export function buildSet(
  base: Uint8Array | Uint8Array[],
  settings: SlotSettings[],
  date?: Date,
  profile: any = PROFILE,
  headers?: Uint8Array[] // file do máy lưu cho từng ô: mượn header 0x00–0x37 để tên ô và byte 0x35 khớp
): BuiltSet[] {
  const result: BuiltSet[] = [];
  const bases = Array.isArray(base) ? base : [base, base, base, base];

  for (let slot = 1; slot <= 4; slot++) {
    const slotSettings = settings[slot - 1];
    const data = applySettings(
      bases[slot - 1],
      slot as 1 | 2 | 3 | 4,
      slotSettings,
      date,
      profile
    );
    const header = headers?.[slot - 1];
    if (header) data.set(header.subarray(0, 0x38));
    const out = header ? finalize(data) : data;
    result.push({
      name: `CAMPR0${slot}${parseDat(out).family}.DAT`,
      data: out,
    });
  }

  return result;
}
