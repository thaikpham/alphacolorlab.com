// Nhận diện file Memory Recall (.DAT) của máy nào rồi giải mã ở chế độ chỉ đọc. Không ghi file.
// Không bao giờ ném lỗi: file lạ hoặc hỏng trả về kind "unknown".
import {
  AUTO_REVIEW,
  AWB_PRIORITIES,
  E_FRONT_CURTAIN,
  EXP_COMP_SETS,
  FACE_PRIORITY,
  FLASH_MODES,
  FOCUS_AREAS,
  LIVE_VIEW,
  METERING_MODES,
  PRE_AF,
  SOFT_SKIN,
  STEADY_SHOT,
  decodeDat,
  decodeMovieDat,
  readRecordMode,
} from "./zve10/dat.ts";
import type { DecodedSettings, WB } from "./zve10/dat.ts";
import type { SlotDraft } from "./presetSets.ts";
import { A6400_MODEL, decodeA6400 } from "./a6400/dat.ts";
import type { A6400Decoded } from "./a6400/dat.ts";
import { A7C2_HEADER_MODEL, headerModel, parseA7c2 } from "./a7c2/dat.ts";
import type { A7c2Dat } from "./a7c2/dat.ts";
import { A7C2_SETTINGS, readA7c2Setting } from "./a7c2/settings.ts";
import type { A7c2SettingKey } from "./a7c2/settings.ts";

export const IMPORT_KINDS = ["zve10", "a6400", "a7c2"] as const;

export type ImportResult =
  | { kind: "zve10"; model: "ZV-E10"; recordMode: "photo"; readOnly: false; decoded: DecodedSettings }
  | { kind: "zve10"; model: "ZV-E10"; recordMode: "movie"; readOnly: true; decoded: DecodedSettings }
  | { kind: "unsupported"; model: "ZV-E10"; recordMode: "movie" }
  | { kind: "a6400"; model: "ILCE-6400"; decoded: A6400Decoded }
  | { kind: "a7c2"; model: "ILCE-7CM2"; dat: A7c2Dat; settings: Partial<Record<A7c2SettingKey, string | null>> }
  | { kind: "unknown"; error: string };

// Tên máy sau "SONY!": từ byte 5 tới byte 0 đầu tiên, tối đa 0x14 (cùng cách với parseA6400).
function sonyBangModel(b: Uint8Array): string {
  const end = b.indexOf(0, 5);
  return String.fromCharCode(...b.subarray(5, end === -1 || end > 0x14 ? 0x14 : end));
}

export function importDat(bytes: Uint8Array, fileName?: string): ImportResult {
  try {
    if (String.fromCharCode(...bytes.subarray(0, 5)) === "SONY!") {
      const model = sonyBangModel(bytes);
      if (model === "ZV-E10") {
        if (readRecordMode(bytes) === "movie") {
          try {
            return { kind: "zve10", model: "ZV-E10", recordMode: "movie", readOnly: true, decoded: decodeMovieDat(bytes) };
          } catch {
            return { kind: "unsupported", model: "ZV-E10", recordMode: "movie" };
          }
        }
        const decoded = decodeDat(bytes);
        if (decoded.recordMode !== "photo") throw new Error("Không đọc được byte 0x17E (ảnh hay phim).");
        return { kind: "zve10", model: "ZV-E10", recordMode: "photo", readOnly: false, decoded };
      }
      if (model === A6400_MODEL) return { kind: "a6400", model: A6400_MODEL, decoded: decodeA6400(bytes) };
      throw new Error(`Máy không nhận ra (model: ${model || "trống"}).`);
    }
    if (String.fromCharCode(...bytes.subarray(0, 4)) === "SONY" && headerModel(bytes) === A7C2_HEADER_MODEL) {
      const dat = parseA7c2(bytes);
      const settings = Object.fromEntries(
        (Object.keys(A7C2_SETTINGS) as A7c2SettingKey[]).map((key) => [key, readA7c2Setting(dat, key)])
      ) as Partial<Record<A7c2SettingKey, string | null>>;
      return { kind: "a7c2", model: A7C2_HEADER_MODEL, dat, settings };
    }
    throw new Error("Không phải file Memory Recall của máy Sony được hỗ trợ.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { kind: "unknown", error: fileName ? `${fileName}: ${msg}` : msg };
  }
}

export type SlotImport = {
  settings: SlotDraft;
  // Tên trường không đưa vào ô được: không đọc được, không biểu diễn được trong ô, hoặc PP2–10 (DecodedSettings không chứa).
  skipped: string[];
  family: "pal" | "ntsc" | null;
  slot: 1 | 2 | 3 | 4 | null;
};

// Trạng thái một ô M1–M4 (cùng dạng với SlotDraft của PresetBuilder) từ file đã giải mã. Chỉ đọc, không ghi file.
export function toSlotSettings(decoded: DecodedSettings): SlotImport {
  const settings: SlotDraft = {};
  const skipped: string[] = [];
  const name = /^CAMPR0([1-4])([NP])\.DAT$/.exec(decoded.name);

  if (decoded.mode === "P" || decoded.mode === "A" || decoded.mode === "S" || decoded.mode === "M") settings.mode = decoded.mode;
  else skipped.push("mode");

  const { aperture, shutter, iso } = decoded.exposure;
  if (aperture !== null) settings.aperture = aperture;
  else skipped.push("aperture");
  if (shutter !== null) settings.shutter = shutter;
  else skipped.push("shutter");
  if (iso !== null) settings.iso = iso === "AUTO" ? "auto" : iso;
  else skipped.push("iso");

  const w = decoded.wb;
  if ((w.mode === "awb" || w.mode === "ctemp") && w.ab !== undefined && w.gm !== undefined && (w.mode === "awb" || w.kelvin !== undefined)) {
    const wb: WB = w.mode === "ctemp" ? { mode: "ctemp", kelvin: w.kelvin, ab: w.ab, gm: w.gm } : { mode: "awb", ab: w.ab, gm: w.gm };
    if (w.mode === "awb" && w.priority !== undefined) wb.priority = w.priority;
    else if (w.mode === "awb") skipped.push("wb.priority");
    settings.wb = wb;
  } else skipped.push("wb");

  // Cùng thứ tự với SlotSettings; giá trị phải thuộc danh sách đã học của ZV-E10.
  const choices: [string, string | null, readonly string[]][] = [
    ["focus", decoded.focus, ["MF", "AF-S", "AF-C"]],
    ["focusArea", decoded.focusArea, FOCUS_AREAS],
    ["metering", decoded.metering, METERING_MODES],
    ["facePriority", decoded.facePriority, FACE_PRIORITY],
    ["softSkin", decoded.softSkin, SOFT_SKIN],
    ["autoReview", decoded.autoReview, AUTO_REVIEW],
    ["flashMode", decoded.flashMode, FLASH_MODES],
    ["expCompSet", decoded.expCompSet, EXP_COMP_SETS],
    ["awbPriority", decoded.awbPriority, AWB_PRIORITIES],
    ["preAF", decoded.preAF, PRE_AF],
    ["steadyShot", decoded.steadyShot, STEADY_SHOT],
    ["eFrontCurtain", decoded.eFrontCurtain, E_FRONT_CURTAIN],
    ["liveView", decoded.liveView, LIVE_VIEW],
  ];
  for (const [key, value, options] of choices) {
    if (value !== null && options.includes(value)) (settings as Record<string, unknown>)[key] = value;
    else skipped.push(key);
  }

  // Byte 0x315 là bank PP đang chọn: 0 = tắt, 1 = PP1, 2–10 = PP2–10. Ô chỉ ghi PP1 (ppOn), nên khi chọn PP2–10 không nạp gì: pp1 không phải bank đang dùng.
  // applySettings không ghi PP khi tắt, nên ô tắt không nhận pp.
  if (decoded.pp_selected === 0) {
    settings.ppOn = false;
    skipped.push("pp");
  } else if (decoded.pp_selected === 1) {
    settings.ppOn = true;
    const pp: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(decoded.pp1)) {
      if (value === null) skipped.push(`pp.${key}`);
      else pp[key] = value;
    }
    if (Object.keys(pp).length > 0) settings.pp = pp;
  } else {
    skipped.push("ppOn", "pp");
  }

  skipped.push("ppBanks");

  return {
    settings,
    skipped,
    family: name ? (name[2] === "P" ? "pal" : "ntsc") : null,
    slot: name ? (Number(name[1]) as 1 | 2 | 3 | 4) : null,
  };
}
