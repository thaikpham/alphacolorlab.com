// File Memory Recall của A7C II: áp dụng cài đặt vào file cơ sở từ máy.

import { apexU16, avThirds, tvThirds, shutterDisplay, type SlotSettings, type BuiltSet } from "../zve10/dat.ts";
import {
  parseA7c2,
  serializeA7c2,
  type A7c2Record,
} from "./dat.ts";
import {
  A7C2_SETTINGS,
  A7C2_NUMERIC,
  A7C2_EXPOSURE,
  A7C2_FOCUS_AREA,
  A7C2_PP_CODES,
  readA7c2Setting,
  readA7c2Number,
  a7c2PpIds,
  type A7c2PpParam,
} from "./settings.ts";

const ZVE10_FIELDS = [
  "black_level", "gamma", "black_gamma_range", "black_gamma_level", "knee_mode",
  "knee_auto_max", "knee_auto_sens", "knee_point", "knee_slope", "color_mode",
  "saturation", "color_phase", "depth_r", "depth_g", "depth_b", "depth_c",
  "depth_m", "depth_y", "detail_level", "detail_mode", "detail_vh", "detail_bw",
  "detail_limit", "detail_crisp", "detail_hilight",
] as const;

const A7C2_PP_KEYS = [
  "blackLevel", "gamma", "blackGammaRange", "blackGammaLevel", "kneeMode",
  "kneeAutoMax", "kneeAutoSens", "kneePoint", "kneeSlope", "colorMode",
  "saturation", "colorPhase", "depthR", "depthG", "depthB", "depthC",
  "depthM", "depthY", "detailLevel", "detailMode", "detailVH", "detailBW",
  "detailLimit", "detailCrisp", "detailHilight",
] as const;

function normalizePpKey(key: string): A7c2PpParam {
  // If it's already camelCase A7C II key, use it
  if (A7C2_PP_KEYS.includes(key as any)) return key as A7c2PpParam;

  // Try to map from snake_case ZV-E10 key
  const zvIdx = ZVE10_FIELDS.indexOf(key as any);
  if (zvIdx >= 0) return A7C2_PP_KEYS[zvIdx] as A7c2PpParam;

  throw new Error(`PP key chưa biết: ${key}`);
}

// PP label alias for color_mode "709" → "ITU709 Matrix"
const PP_LABEL_ALIASES: Record<string, Record<string, string>> = {
  colorMode: { "709": "ITU709 Matrix" },
};

export interface A7c2SlotSettings extends SlotSettings {
  isoAutoMinSS?:
    | "slower"
    | "slow"
    | "standard"
    | "fast"
    | "faster"
    | string
    | "keep";
}

function setRecordValue(
  records: A7c2Record[],
  id: number,
  value: Uint8Array | number
): void {
  const r = records.find((x) => x.id === id);
  if (!r) throw new Error(`Không tìm bản ghi 0x${id.toString(16)}`);
  if (typeof value === "number") {
    r.value = Uint8Array.of(value);
  } else {
    r.value = value;
  }
}

function setRecordInt32(
  records: A7c2Record[],
  id: number,
  value: number
): void {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setInt32(0, value, true);
  setRecordValue(records, id, new Uint8Array(dv.buffer));
}

function setRecordBytes(
  records: A7c2Record[],
  id: number,
  offset: number,
  value: number,
  width: number = 2
): void {
  const r = records.find((x) => x.id === id);
  if (!r || r.value.length < offset + width)
    throw new Error(`Bản ghi 0x${id.toString(16)} không đủ kích thước`);
  const dv = new DataView(r.value.buffer, r.value.byteOffset, r.value.byteLength);
  if (width === 2) dv.setUint16(offset, value, true);
  else if (width === 4) dv.setInt32(offset, value, true);
}

export function applyA7c2(base: Uint8Array, s: A7c2SlotSettings): Uint8Array {
  const dat = parseA7c2(base);

  // ---- shootMode: mode → A7C2_SETTINGS.shootMode
  if (s.mode !== undefined && s.mode !== "keep") {
    const modeCode = A7C2_SETTINGS.shootMode.values.indexOf(s.mode as any);
    if (modeCode < 0) throw new Error(`Chế độ chụp chưa hỗ trợ: ${s.mode}`);
    for (const id of A7C2_SETTINGS.shootMode.ids)
      setRecordValue(dat.records, id, modeCode);
  }

  // ---- aperture, shutter: mã APEX ở giá trị đặt (máy gọi lại) + số hiển thị @288–292 (máy bỏ qua, ghi cho khớp)
  if (s.aperture !== undefined && s.aperture !== "keep") {
    const fNum = typeof s.aperture === "number" ? s.aperture : parseFloat(s.aperture);
    if (!Number.isFinite(fNum) || fNum <= 0) throw new Error(`Khẩu độ không hợp lệ`);
    for (const off of A7C2_EXPOSURE.av) setRecordBytes(dat.records, A7C2_EXPOSURE.id, off, apexU16(avThirds(String(fNum))), 2);
    setRecordBytes(dat.records, A7C2_EXPOSURE.id, A7C2_EXPOSURE.aperture, Math.round(fNum * 100), 2);
  }
  if (s.shutter !== undefined && s.shutter !== "keep") {
    const thirds = tvThirds(s.shutter);
    if (!Number.isFinite(thirds)) throw new Error(`Tốc độ không hợp lệ: ${s.shutter}`);
    for (const off of A7C2_EXPOSURE.tv) setRecordBytes(dat.records, A7C2_EXPOSURE.id, off, apexU16(thirds), 2);
    const [num, den] = shutterDisplay(s.shutter);
    setRecordBytes(dat.records, A7C2_EXPOSURE.id, A7C2_EXPOSURE.shutterNum, num, 2);
    setRecordBytes(dat.records, A7C2_EXPOSURE.id, A7C2_EXPOSURE.shutterDen, den, 2);
  }

  // ---- iso: "auto"/"AUTO" → 0 + isoAutoMax; number/string → code = 5 + 3·log2(ISO/100)
  if (s.iso !== undefined && s.iso !== "keep") {
    let code: number;
    if (typeof s.iso === "string" && s.iso.toLowerCase() === "auto") {
      code = 0;
      const maxCode = readA7c2Number(dat, A7C2_NUMERIC.isoAutoMax);
      if (maxCode === null || maxCode === 0) throw new Error(`isoAutoMax chưa thiết lập`);
      for (const id of A7C2_NUMERIC.isoUpper) setRecordValue(dat.records, id, maxCode);
    } else {
      const isoNum = typeof s.iso === "number" ? s.iso : parseInt(String(s.iso), 10);
      if (!Number.isFinite(isoNum) || isoNum < 100 || isoNum > 51200) {
        throw new Error(`ISO phải 100–51200`);
      }
      // Validate in log domain: exact = 5 + 3·log2(iso/100), |exact - round(exact)| < 0.1
      const exact = 5 + 3 * Math.log2(isoNum / 100);
      code = Math.round(exact);
      if (Math.abs(exact - code) >= 0.1) throw new Error(`ISO ${isoNum} không chính xác`);
      for (const id of A7C2_NUMERIC.isoUpper) setRecordValue(dat.records, id, code);
    }
    for (const id of A7C2_NUMERIC.iso) setRecordValue(dat.records, id, code);
  }

  // ---- isoAutoMinSS: preset name → A7C2_SETTINGS.isoAutoMinSS; speed string → isoAutoMinSSSpeed
  if (s.isoAutoMinSS !== undefined && s.isoAutoMinSS !== "keep") {
    const presetIdx = A7C2_SETTINGS.isoAutoMinSS.values.indexOf(
      s.isoAutoMinSS as any
    );
    if (presetIdx >= 0) {
      // Preset name
      setRecordValue(dat.records, A7C2_SETTINGS.isoAutoMinSS.ids[0], presetIdx);
      setRecordValue(dat.records, A7C2_SETTINGS.isoAutoMinSSSpeed.ids[0], 0);
    } else {
      // Speed string
      const speedIdx = A7C2_SETTINGS.isoAutoMinSSSpeed.values.indexOf(
        s.isoAutoMinSS as any
      );
      if (speedIdx < 0) throw new Error(`Tốc độ ISO AUTO tối thiểu không hỗ trợ: ${s.isoAutoMinSS}`);
      setRecordValue(dat.records, A7C2_SETTINGS.isoAutoMinSSSpeed.ids[0], speedIdx);
    }
  }

  // ---- wb: {mode, kelvin, ab, gm}
  if (s.wb !== undefined && s.wb !== "keep") {
    const wb = s.wb as any;
    // Map ZV-E10 format (awb/ctemp) to A7C II format (auto/c-temp)
    const modeNormalized = wb.mode === "awb" ? "auto" : wb.mode === "ctemp" ? "c-temp" : wb.mode;
    const modeCode = A7C2_SETTINGS.wb.values.indexOf(modeNormalized);
    if (modeCode < 0) throw new Error(`WB chế độ không hỗ trợ: ${wb.mode}`);
    for (const id of A7C2_SETTINGS.wb.ids) setRecordValue(dat.records, id, modeCode);

    if (modeNormalized === "c-temp") {
      const K = wb.kelvin;
      if (!Number.isFinite(K) || K < 2500 || K > 9900 || K % 100 !== 0) {
        throw new Error(`Kelvin phải 2500–9900 K, bước 100`);
      }
      const code = (K - 2500) / 100;
      for (const id of A7C2_NUMERIC.wbKelvin) setRecordValue(dat.records, id, code);
      const ab = wb.ab || 0;
      const gm = wb.gm || 0;
      const shiftCTemp = A7C2_NUMERIC.wbShiftCTemp;
      for (const id of shiftCTemp.ab) setRecordInt32(dat.records, id, Math.round(ab * 1000));
      for (const id of shiftCTemp.gm) setRecordInt32(dat.records, id, Math.round(-gm * 1000));
    } else if (modeNormalized === "auto") {
      const ab = wb.ab || 0;
      const gm = wb.gm || 0;
      const shiftAuto = A7C2_NUMERIC.wbShiftAuto;
      for (const id of shiftAuto.ab) setRecordInt32(dat.records, id, Math.round(ab * 1000));
      for (const id of shiftAuto.gm) setRecordInt32(dat.records, id, Math.round(-gm * 1000));
      // If wb.priority is set and awbPriority is not, use wb.priority
      if (wb.priority && (s.awbPriority === undefined || s.awbPriority === "keep")) {
        const priorityCode = A7C2_SETTINGS.awbPriority.values.indexOf(wb.priority as any);
        if (priorityCode < 0) throw new Error(`AWB Priority không hỗ trợ: ${wb.priority}`);
        setRecordValue(dat.records, A7C2_SETTINGS.awbPriority.ids[0], priorityCode);
      }
    }
  }

  // ---- focus: "AF-S", "AF-C", "MF"
  if (s.focus !== undefined && s.focus !== "keep") {
    const focusCode = A7C2_SETTINGS.focusMode.values.indexOf(s.focus as any);
    if (focusCode < 0) throw new Error(`Focus mode không hỗ trợ: ${s.focus}`);
    for (const id of A7C2_SETTINGS.focusMode.ids) setRecordValue(dat.records, id, focusCode);
  }

  // ---- focusArea: wide, zone, flexible-spot-l, tracking-zone, tracking-flexible-spot-l
  if (s.focusArea !== undefined && s.focusArea !== "keep") {
    const area = s.focusArea;
    const focusMode = readA7c2Setting(dat, "focusMode") || (s.focus ?? "keep");
    if (
      (area === "tracking-zone" || area === "tracking-flexible-spot-l") &&
      focusMode !== "AF-C"
    ) {
      throw new Error(`Theo dõi chỉ dùng được với AF-C`);
    }
    // Map ZV-E10 format to A7C II stored names
    const areaStored =
      area === "flexible-spot-l" ? "spot-l" :
      area === "tracking-flexible-spot-l" ? "tracking-spot-l" :
      area;
    const codes = A7C2_FOCUS_AREA.values[areaStored as any];
    if (!codes) throw new Error(`Vùng lấy nét không hỗ trợ: ${area}`);

    // Write the area type in groups[0]
    const group0 = A7C2_FOCUS_AREA.groups[0];
    for (let i = 0; i < group0.length; i++) {
      setRecordValue(dat.records, group0[i], codes[0]);
    }

    // Write the area parameters in groups[1]
    const group1 = A7C2_FOCUS_AREA.groups[1];
    for (let i = 0; i < group1.length; i++) {
      setRecordValue(dat.records, group1[i], codes[1]);
    }

    // For flexible-spot-l, write the spot size triple and records
    if (areaStored === "spot-l") {
      const spotTriple = [0x0e5a, 0x0e5c, 0x0e5e];
      for (const id of spotTriple) setRecordValue(dat.records, id, 2);
      const spotRecords = [0x0f58, 0x0f5a, 0x0f5c, 0x0f5e, 0x0f60, 0x0f62, 0x0f64, 0x0f66, 0x0f68];
      for (const id of spotRecords) setRecordValue(dat.records, id, 1);
    }

    // For tracking-flexible-spot-l, write both spot size and tracking zone triples/records
    if (areaStored === "tracking-spot-l") {
      // Spot size triple and records
      const spotTriple = [0x0e5a, 0x0e5c, 0x0e5e];
      for (const id of spotTriple) setRecordValue(dat.records, id, 2);
      const spotRecords = [0x0f58, 0x0f5a, 0x0f5c, 0x0f5e, 0x0f60, 0x0f62, 0x0f64, 0x0f66, 0x0f68];
      for (const id of spotRecords) setRecordValue(dat.records, id, 1);
      // Tracking zone triple and records
      const trackTriple = [0x0e60, 0x0e62, 0x0e64];
      for (const id of trackTriple) setRecordValue(dat.records, id, 5);
      const trackRecords = [0x0f6c, 0x0f6e, 0x0f70, 0x0f72, 0x0f74, 0x0f76, 0x0f78, 0x0f7a, 0x0f7c];
      for (const id of trackRecords) setRecordValue(dat.records, id, 4);
    }

    // For tracking-zone, write the tracking zone triple and records
    if (areaStored === "tracking-zone") {
      const trackTriple = [0x0e60, 0x0e62, 0x0e64];
      for (const id of trackTriple) setRecordValue(dat.records, id, 1);
      const trackRecords = [0x0f6c, 0x0f6e, 0x0f70, 0x0f72, 0x0f74, 0x0f76, 0x0f78, 0x0f7a, 0x0f7c];
      for (const id of trackRecords) setRecordValue(dat.records, id, 1);
    }
  }

  // ---- metering: multi 0, center 1, spot 2 (with spotSize), entire 3, highlight 4
  if (s.metering !== undefined && s.metering !== "keep") {
    const meteringStr = s.metering as string;
    let meteringCode: number;
    if (meteringStr === "spot-standard" || meteringStr === "spot-large") {
      meteringCode = 2;
      const spotSize = meteringStr === "spot-standard" ? 0 : 1;
      for (const id of A7C2_SETTINGS.meteringSpotSize.ids)
        setRecordValue(dat.records, id, spotSize);
    } else {
      meteringCode = A7C2_SETTINGS.metering.values.indexOf(meteringStr as any);
      if (meteringCode < 0) throw new Error(`Chế độ đo sáng không hỗ trợ: ${meteringStr}`);
    }
    for (const id of A7C2_SETTINGS.metering.ids)
      setRecordValue(dat.records, id, meteringCode);
  }

  // ---- single value settings
  if (s.facePriority !== undefined && s.facePriority !== "keep") {
    const code = A7C2_SETTINGS.facePriority.values.indexOf(s.facePriority as any);
    if (code < 0) throw new Error(`Face Priority không hỗ trợ: ${s.facePriority}`);
    for (const id of A7C2_SETTINGS.facePriority.ids) setRecordValue(dat.records, id, code);
  }

  if (s.preAF !== undefined && s.preAF !== "keep") {
    const code = A7C2_SETTINGS.preAF.values.indexOf(s.preAF as any);
    if (code < 0) throw new Error(`Pre-AF không hỗ trợ: ${s.preAF}`);
    setRecordValue(dat.records, A7C2_SETTINGS.preAF.ids[0], code);
  }

  if (s.awbPriority !== undefined && s.awbPriority !== "keep") {
    const code = A7C2_SETTINGS.awbPriority.values.indexOf(s.awbPriority as any);
    if (code < 0) throw new Error(`AWB Priority không hỗ trợ: ${s.awbPriority}`);
    setRecordValue(dat.records, A7C2_SETTINGS.awbPriority.ids[0], code);
  }

  if (s.flashMode !== undefined && s.flashMode !== "keep") {
    if (s.flashMode === "slow-sync") throw new Error(`Flash mode không hỗ trợ: ${s.flashMode}`);
    const code = A7C2_SETTINGS.flashMode.values.indexOf(s.flashMode as any);
    if (code < 0) throw new Error(`Flash mode không hỗ trợ: ${s.flashMode}`);
    setRecordValue(dat.records, A7C2_SETTINGS.flashMode.ids[0], code);
  }

  if (s.expCompSet !== undefined && s.expCompSet !== "keep") {
    const code = A7C2_SETTINGS.expCompSet.values.indexOf(s.expCompSet as any);
    if (code < 0) throw new Error(`Exp Comp Set không hỗ trợ: ${s.expCompSet}`);
    setRecordValue(dat.records, A7C2_SETTINGS.expCompSet.ids[0], code);
  }

  if (s.steadyShot !== undefined && s.steadyShot !== "keep") {
    const code = A7C2_SETTINGS.steadyShot.values.indexOf(s.steadyShot as any);
    if (code < 0) throw new Error(`Steady Shot không hỗ trợ: ${s.steadyShot}`);
    setRecordValue(dat.records, A7C2_SETTINGS.steadyShot.ids[0], code);
  }

  if (s.liveView !== undefined && s.liveView !== "keep") {
    const code = A7C2_SETTINGS.liveViewDisplay.values.indexOf(s.liveView as any);
    if (code < 0) throw new Error(`Live View Display không hỗ trợ: ${s.liveView}`);
    setRecordValue(dat.records, A7C2_SETTINGS.liveViewDisplay.ids[0], code);
  }

  if (s.softSkin !== undefined && s.softSkin !== "keep") {
    if (s.softSkin === "off") {
      setRecordValue(dat.records, A7C2_SETTINGS.softSkin.ids[0], 0);
    } else {
      setRecordValue(dat.records, A7C2_SETTINGS.softSkin.ids[0], 1);
      const levelCode = A7C2_SETTINGS.softSkinLevel.values.indexOf(s.softSkin as any);
      if (levelCode < 0) throw new Error(`Soft Skin level không hỗ trợ: ${s.softSkin}`);
      setRecordValue(dat.records, A7C2_SETTINGS.softSkinLevel.ids[0], levelCode);
    }
  }

  // Note: autoReview and eFrontCurtain không lưu trong A7C II DAT files

  // Helper: write PP value to record at specific bank offset
  function writePpValue(ppKeyNorm: A7c2PpParam, codeValue: number, bankNum: number) {
    const ids = a7c2PpIds(ppKeyNorm);
    for (const id of ids) {
      const r = dat.records.find((x) => x.id === id);
      if (!r) throw new Error(`Bản ghi PP 0x${id.toString(16)} không có`);
      const dv = new DataView(r.value.buffer, r.value.byteOffset, r.value.byteLength);
      const offset = (bankNum - 1) * r.size;
      if (offset + r.size > r.value.length) throw new Error(`PP ${ppKeyNorm} bank ${bankNum} vượt quá`);
      if (r.size === 4) dv.setInt32(offset, codeValue, true);
      else if (r.size === 1) r.value[offset] = codeValue & 0xff;
    }
  }

  // Helper: encode PP value
  function encodePpValue(ppKeyNorm: A7c2PpParam, valueAny: any): number {
    // Check enum types first
    const ppKeyStr = ppKeyNorm as keyof typeof A7C2_PP_CODES;
    if (A7C2_PP_CODES[ppKeyStr]) {
      const codeMap = A7C2_PP_CODES[ppKeyStr] as Record<string, number>;
      let label = String(valueAny);
      // Apply label alias
      if (PP_LABEL_ALIASES[ppKeyNorm]) {
        label = PP_LABEL_ALIASES[ppKeyNorm][label] || label;
      }
      const code = codeMap[label];
      if (code === undefined) throw new Error(`PP ${ppKeyNorm} label chưa mã hóa: ${valueAny}`);
      return code;
    } else {
      // Numeric: percent params ×100, else round
      const numVal = typeof valueAny === "number" ? valueAny : parseFloat(valueAny);
      if (!Number.isFinite(numVal)) throw new Error(`PP ${ppKeyNorm} giá trị không hợp lệ: ${valueAny}`);
      if (ppKeyNorm === "kneeAutoMax" || ppKeyNorm === "kneePoint") {
        return Math.round(numVal * 100);
      }
      return Math.round(numVal);
    }
  }

  // ---- Picture Profile
  if (s.ppOn === false) {
    if (s.pp && s.pp !== "keep") throw new Error(`Tắt Picture Profile thì không chỉnh thông số PP`);
    for (const id of A7C2_SETTINGS.pictureProfile.ids) setRecordValue(dat.records, id, 0);
  } else {
    if (s.ppOn === true) {
      for (const id of A7C2_SETTINGS.pictureProfile.ids) setRecordValue(dat.records, id, 1);
      for (const id of A7C2_SETTINGS.dro.ids) setRecordValue(dat.records, id, 0);
    }

    if (s.pp && s.pp !== "keep") {
      const pp = s.pp as Record<string, any>;
      for (const [ppKey, valueAny] of Object.entries(pp)) {
        const ppKeyNorm = normalizePpKey(ppKey);
        const codeValue = encodePpValue(ppKeyNorm, valueAny);
        writePpValue(ppKeyNorm, codeValue, 1);
      }
    }
  }

  // ppBanks: write PP parameters to specific banks (outside ppOn block)
  if (s.ppBanks) {
    for (const [bankStr, bank] of Object.entries(s.ppBanks)) {
      const bankNum = parseInt(bankStr, 10);
      if (!Number.isInteger(bankNum) || bankNum < 2 || bankNum > 11) {
        throw new Error(`PP bank phải từ 2 đến 11`);
      }
      if (!bank || typeof bank !== "object") continue;

      for (const [ppKey, valueAny] of Object.entries(bank as Record<string, any>)) {
        const ppKeyNorm = normalizePpKey(ppKey);
        const codeValue = encodePpValue(ppKeyNorm, valueAny);
        writePpValue(ppKeyNorm, codeValue, bankNum);
      }
    }
  }

  return serializeA7c2(dat);
}

export function buildSetA7c2(
  bases: Uint8Array[],
  settings: A7c2SlotSettings[],
  family: "P" | "N" = "P"
): BuiltSet[] {
  if (bases.length !== 4) throw new Error("Cần đúng 4 file cơ sở");
  if (settings.length !== 4) throw new Error("Cần đúng 4 cài đặt");

  const result: BuiltSet[] = [];
  for (let slot = 1; slot <= 4; slot++) {
    const data = applyA7c2(bases[slot - 1], settings[slot - 1]);
    result.push({
      name: `CAMPR0${slot}${family}.DAT`,
      data,
    });
  }
  return result;
}
