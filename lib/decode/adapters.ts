/**
 * Bộ chuyển đổi cài đặt: đọc một cài đặt từ file .DAT của từng máy rồi đổi về id trong data/game-tasks.json.
 * adaptersFor(model): một adapter cho mỗi cài đặt của danh mục (theo thứ tự danh mục, located:false nếu chưa đọc được),
 * rồi đến các cài đặt chỉ có trong codec (inCatalog:false; planner không chọn làm mục tiêu).
 * read() không ném lỗi: null nghĩa là file không đọc được với máy này. valueId là giá trị codec đọc được, kể cả khi
 * danh mục chưa có giá trị đó (khi đó ô có inCatalog:false); null khi chỉ đọc được raw.
 * owns là các byte (ZV-E10, α6400) hoặc ID bản ghi (A7C II) mà cài đặt chiếm; analyze.ts bỏ chúng khi tìm cài đặt chưa định vị.
 * raw và codeOf() dùng bản ghi/rule đầu tiên của cài đặt. Vài cài đặt có hai rule trùng mã (AF-S và AF-C cùng 2),
 * nên khi cần định danh giá trị hãy dùng valueId.
 */
import type { GameModel } from "../game/types.ts";
import { getCatalog } from "../game/catalog.ts";
import { decodeDat, FOCUS_PROFILE, FOCUS_AREA_PROFILE, METERING_PROFILE, FACE_PRIORITY_PROFILE, SOFT_SKIN_PROFILE, AUTO_REVIEW_PROFILE, FLASH_MODE_PROFILE, EXP_COMP_SET_PROFILE, AWB_PRIORITY_PROFILE, PRE_AF_PROFILE, STEADY_SHOT_PROFILE, E_FRONT_CURTAIN_PROFILE, LIVE_VIEW_PROFILE, PROFILE, APERTURES, SHUTTERS, ISOS, GAMMAS, COLOR_MODES, apexU16, avThirds, tvThirds } from "../zve10/dat.ts";
import type { DecodedSettings } from "../zve10/dat.ts";
import { parseA6400, toA6400Offset, decodeA6400, A6400_FIELDS } from "../a6400/dat.ts";
import type { A6400FieldKey } from "../a6400/dat.ts";
import { parseA7c2, headerModel, A7C2_HEADER_MODEL } from "../a7c2/dat.ts";
import type { A7c2Dat } from "../a7c2/dat.ts";
import { A7C2_SETTINGS, A7C2_FOCUS_AREA, A7C2_NUMERIC, A7C2_EXPOSURE, A7C2_PP_CODES, a7c2PpIds, readA7c2Exposure, readA7c2FocusArea, readA7c2Number, readA7c2PpArray, readA7c2Setting } from "../a7c2/settings.ts";
import type { A7c2SettingKey, A7c2PpParam } from "../a7c2/settings.ts";

export type SettingAdapter = {
  settingId: string;
  located: boolean;
  where: string | null;
  // Byte (ZV-E10, α6400) hoặc ID bản ghi (A7C II) mà cài đặt chiếm. Cài đặt chưa định vị thì rỗng.
  owns: readonly number[];
  // false: cài đặt chỉ có trong codec, không có trong data/game-tasks.json
  inCatalog: boolean;
  // Giá trị codec biết (đã đổi sang id danh mục khi có); có thể gồm giá trị danh mục chưa có
  codecValues: readonly string[];
  read(bytes: Uint8Array): { valueId: string | null; raw: number | string | null } | null;
  codeOf(valueId: string): number | string | null;
  staticConfirmed: readonly string[];
  // Profile rule đã hiệu chỉnh bằng file máy thật (profile.json: calibrated). Chỉ ZV-E10 và α6400 có cờ này.
  calibrated?: boolean;
  // Cài đặt số (ISO, nhiệt độ màu, mức đen): chỉ có raw, không có danh sách giá trị; không tính vào số liệu trạng thái
  numeric?: boolean;
};

type Codec = Omit<SettingAdapter, "inCatalog">;
type ReadOut = { valueId: string | null; raw: number | string | null };
type Rule = { offset: number; width: number; values: Record<string, number | null> };
type RuleProfile = { calibrated: boolean; rules: Rule[] };
type OffsetMap = (zveOffset: number) => number | null;

const asRules = (p: unknown) => p as RuleProfile;
const hex = (n: number, width = 0) => `0x${n.toString(16).toUpperCase().padStart(width, "0")}`;
const sameOffset: OffsetMap = (o) => o;
const a6400Offset: OffsetMap = (o) => {
  try {
    return toA6400Offset(o);
  } catch {
    return null;
  }
};

function readRule(b: Uint8Array, off: number, width: number): number | null {
  if (off + width > b.length) return null;
  return width === 2 ? b[off] + 256 * b[off + 1] : b[off];
}

function rawOf(b: Uint8Array, p: RuleProfile, map: OffsetMap): number | null {
  const off = map(p.rules[0].offset);
  return off === null ? null : readRule(b, off, p.rules[0].width);
}

const ownsOf = (rules: readonly Rule[], map: OffsetMap): number[] =>
  rules.flatMap((r) => {
    const o = map(r.offset);
    if (o === null) return [];
    return r.width === 2 ? [o, o + 1] : [o];
  });

const codeOfRules = (p: RuleProfile, valueId: string): number | null => {
  const v = p.rules[0].values[valueId];
  return typeof v === "number" ? v : null;
};

// Cùng quy tắc với decodeDat: mỗi trạng thái phải khớp mọi rule (null là ô bỏ qua); đúng một trạng thái khớp thì nhận.
function decodeRules(b: Uint8Array, p: RuleProfile, map: OffsetMap): string | null {
  if (!p.calibrated) return null;
  const matches = Object.keys(p.rules[0].values).filter((s) =>
    p.rules.every((r) => {
      const off = map(r.offset);
      const v = off === null ? null : readRule(b, off, r.width);
      return r.values[s] === null || (v !== null && v === r.values[s]);
    }));
  return matches.length === 1 ? matches[0] : null;
}

// decodeDat chậm (~24 ms mỗi file) và mỗi cài đặt gọi một lần: nhớ theo đối tượng byte, kiểm tra lại nội dung khi đọc lại.
const zveMemo = new WeakMap<Uint8Array, { bytes: Uint8Array; value: DecodedSettings | null }>();

function sameContent(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function decodeZve(bytes: Uint8Array): DecodedSettings | null {
  const hit = zveMemo.get(bytes);
  if (hit && sameContent(hit.bytes, bytes)) return hit.value;
  let value: DecodedSettings | null;
  try {
    value = decodeDat(bytes);
  } catch {
    value = null;
  }
  zveMemo.set(bytes, { bytes: Uint8Array.from(bytes), value });
  return value;
}

function a6400Ok(bytes: Uint8Array): boolean {
  try {
    parseA6400(bytes);
    return true;
  } catch {
    return false;
  }
}

function notLocated(settingId: string): Codec {
  return { settingId, located: false, where: null, owns: [], codecValues: [], read: () => null, codeOf: () => null, staticConfirmed: [] };
}

// ZV-E10: giá trị lấy từ decodeDat (đã khớp file máy); mã lấy từ rule của profile.json, chưa có danh sách đã xác nhận.
function zveRule(settingId: string, profile: RuleProfile, field: keyof DecodedSettings): Codec {
  return {
    settingId,
    located: true,
    where: profile.rules.map((r) => hex(r.offset)).join(" · "),
    owns: ownsOf(profile.rules, sameOffset),
    codecValues: Object.keys(profile.rules[0].values),
    read(bytes) {
      const d = decodeZve(bytes);
      if (!d) return null;
      return { valueId: (d[field] as string | null) ?? null, raw: rawOf(bytes, profile, sameOffset) };
    },
    codeOf: (valueId) => codeOfRules(profile, valueId),
    staticConfirmed: [],
    calibrated: profile.calibrated,
  };
}

// α6400: cùng rule ZV-E10 nhưng dời offset theo bản đồ LAYOUT; mã là dự đoán từ bảng ZV-E10 (chưa có file α6400 xác nhận).
function a6400Rule(settingId: string, profile: RuleProfile): Codec {
  const offsets = profile.rules.map((r) => a6400Offset(r.offset));
  if (offsets.some((o) => o === null)) return notLocated(settingId);
  return {
    settingId,
    located: true,
    where: offsets.map((o) => hex(o as number)).join(" · "),
    owns: ownsOf(profile.rules, a6400Offset),
    codecValues: Object.keys(profile.rules[0].values),
    read(bytes) {
      if (!a6400Ok(bytes)) return null;
      return { valueId: decodeRules(bytes, profile, a6400Offset), raw: rawOf(bytes, profile, a6400Offset) };
    },
    codeOf: (valueId) => codeOfRules(profile, valueId),
    staticConfirmed: [],
    calibrated: profile.calibrated,
  };
}

// Chế độ WB đọc tại 0x19A. Codec không có danh sách giá trị cho chế độ này nên valueId luôn null, chỉ trả raw.
function wbMode(model: "zve10" | "a6400"): Codec {
  const off = (model === "zve10" ? sameOffset : a6400Offset)(0x19a);
  const valid = (b: Uint8Array) => (model === "zve10" ? decodeZve(b) !== null : a6400Ok(b));
  return {
    settingId: "wb",
    located: off !== null,
    where: off === null ? null : hex(off),
    owns: off === null ? [] : [off],
    codecValues: [],
    read(bytes) {
      if (off === null || !valid(bytes)) return null;
      return { valueId: null, raw: readRule(bytes, off, 1) };
    },
    codeOf: () => null,
    staticConfirmed: [],
  };
}

const RULE_SETTINGS: [string, unknown, keyof DecodedSettings][] = [
  ["focusMode", FOCUS_PROFILE, "focus"],
  ["focusArea", FOCUS_AREA_PROFILE, "focusArea"],
  ["metering", METERING_PROFILE, "metering"],
  ["facePriority", FACE_PRIORITY_PROFILE, "facePriority"],
  ["softSkin", SOFT_SKIN_PROFILE, "softSkin"],
  ["autoReview", AUTO_REVIEW_PROFILE, "autoReview"],
  ["flash-mode", FLASH_MODE_PROFILE, "flashMode"],
  ["exp-comp-set", EXP_COMP_SET_PROFILE, "expCompSet"],
  ["awb-priority", AWB_PRIORITY_PROFILE, "awbPriority"],
  ["pre-af", PRE_AF_PROFILE, "preAF"],
  ["steady-shot", STEADY_SHOT_PROFILE, "steadyShot"],
  ["e-front-curtain", E_FRONT_CURTAIN_PROFILE, "eFrontCurtain"],
  ["live-view-display", LIVE_VIEW_PROFILE, "liveView"],
];

function a7cParse(bytes: Uint8Array): A7c2Dat | null {
  try {
    if (headerModel(bytes) !== A7C2_HEADER_MODEL) return null;
    return parseA7c2(bytes);
  } catch {
    return null;
  }
}

const a7cWhere = (ids: readonly number[]) => `ID ${ids.map((i) => hex(i, 4)).join(" · ")}`;

function firstCode(dat: A7c2Dat, ids: readonly number[]): number | null {
  const v = dat.records.find((r) => r.id === ids[0])?.value;
  return v && v.length === 1 ? v[0] : null;
}

// A7C II: một cài đặt một danh sách bản ghi; tên trong A7C2_SETTINGS đổi sang id danh mục qua rename.
function a7cSimple(settingId: string, key: A7c2SettingKey, rename: Record<string, string> = {}): Codec {
  const setting = A7C2_SETTINGS[key];
  const codes: readonly string[] = setting.values;
  const confirmed: readonly string[] = setting.confirmed;
  const toCatalog = (name: string) => rename[name] ?? name;
  const toCodec = (valueId: string) => Object.keys(rename).find((k) => rename[k] === valueId) ?? valueId;
  return {
    settingId,
    located: true,
    where: a7cWhere(setting.ids),
    owns: [...setting.ids],
    codecValues: codes.filter((v) => v !== "").map(toCatalog),
    read(bytes) {
      const dat = a7cParse(bytes);
      if (!dat) return null;
      const name = readA7c2Setting(dat, key);
      return { valueId: name === null ? null : toCatalog(name), raw: firstCode(dat, setting.ids) };
    },
    codeOf: (valueId) => codeIn(codes, toCodec(valueId)),
    staticConfirmed: confirmed.map(toCatalog),
  };
}

const codeIn = (values: readonly string[], name: string): number | null => {
  const i = name === "" ? -1 : values.indexOf(name);
  return i >= 0 ? i : null;
};

function a7cFocusArea(): Codec {
  const group = A7C2_FOCUS_AREA.groups[0];
  return {
    settingId: "focusArea",
    located: true,
    where: a7cWhere(group),
    owns: A7C2_FOCUS_AREA.groups.flat(),
    codecValues: Object.keys(A7C2_FOCUS_AREA.values),
    read(bytes) {
      const dat = a7cParse(bytes);
      if (!dat) return null;
      return { valueId: readA7c2FocusArea(dat), raw: firstCode(dat, group) };
    },
    codeOf: (valueId) => A7C2_FOCUS_AREA.values[valueId]?.[0] ?? null,
    // settings.ts không có danh sách đã xác nhận cho vùng lấy nét
    staticConfirmed: [],
  };
}

// Điểm là một lựa chọn của Đo sáng; cỡ điểm (Tiêu chuẩn/Lớn) nằm ở bản ghi riêng.
function a7cMetering(): Codec {
  const { ids, values, confirmed } = A7C2_SETTINGS.metering;
  const codes: readonly string[] = values;
  const sizeConfirmed: readonly string[] = A7C2_SETTINGS.meteringSpotSize.confirmed;
  const spotConfirmed = sizeConfirmed.includes("standard") && sizeConfirmed.includes("large");
  const confirmedNames: readonly string[] = confirmed;
  const spotName = (size: string | null) => (size === "standard" ? "spot-standard" : size === "large" ? "spot-large" : null);
  return {
    settingId: "metering",
    located: true,
    where: a7cWhere(ids),
    owns: [...ids, ...A7C2_SETTINGS.meteringSpotSize.ids],
    codecValues: codes.flatMap((v) => (v === "spot" ? ["spot-standard", "spot-large"] : [v])),
    read(bytes) {
      const dat = a7cParse(bytes);
      if (!dat) return null;
      const name = readA7c2Setting(dat, "metering");
      const valueId = name === "spot" ? spotName(readA7c2Setting(dat, "meteringSpotSize")) : name;
      return { valueId, raw: firstCode(dat, ids) };
    },
    codeOf: (valueId) => codeIn(codes, valueId.startsWith("spot-") ? "spot" : valueId),
    staticConfirmed: confirmedNames.flatMap((n) => (n === "spot" ? (spotConfirmed ? ["spot-standard", "spot-large"] : []) : [n])),
  };
}

// Làm mịn da: bản ghi bật/tắt, và khi bật thì mức (Thấp/Trung bình/Cao) ở bản ghi riêng; raw là bản ghi bật/tắt.
function a7cSoftSkin(): Codec {
  const onOff: readonly string[] = A7C2_SETTINGS.softSkin.values;
  const levels: readonly string[] = A7C2_SETTINGS.softSkinLevel.values;
  const softConfirmed: readonly string[] = A7C2_SETTINGS.softSkin.confirmed;
  const levelConfirmed: readonly string[] = A7C2_SETTINGS.softSkinLevel.confirmed;
  const codecValues = ["off", ...levels];
  return {
    settingId: "softSkin",
    located: true,
    where: "ID " + [...A7C2_SETTINGS.softSkin.ids, ...A7C2_SETTINGS.softSkinLevel.ids].map((i) => hex(i, 4)).join(" · "),
    owns: [...A7C2_SETTINGS.softSkin.ids, ...A7C2_SETTINGS.softSkinLevel.ids],
    codecValues,
    read(bytes) {
      const dat = a7cParse(bytes);
      if (!dat) return null;
      const on = readA7c2Setting(dat, "softSkin");
      const valueId = on === "off" ? "off" : on === "on" ? readA7c2Setting(dat, "softSkinLevel") : null;
      return { valueId, raw: firstCode(dat, A7C2_SETTINGS.softSkin.ids) };
    },
    codeOf: (valueId) => codeIn(valueId === "off" ? onOff : levels, valueId),
    staticConfirmed: codecValues.filter((v) => (v === "off" ? softConfirmed.includes("off") : levelConfirmed.includes(v) && softConfirmed.includes("on"))),
  };
}

// Trường số tự do (ISO, nhiệt độ màu): định vị được nhưng không có giá trị liệt kê nào; chỉ đọc raw
function a7cNumber(settingId: string, ids: readonly number[], owns: readonly number[] = ids): Codec {
  return {
    settingId,
    located: true,
    where: a7cWhere(ids),
    owns: [...owns],
    codecValues: [],
    read(bytes) {
      const dat = a7cParse(bytes);
      if (!dat) return null;
      return { valueId: null, raw: readA7c2Number(dat, ids) };
    },
    codeOf: () => null,
    staticConfirmed: [],
    numeric: true,
  };
}

function a7c2Adapters(): Codec[] {
  const shiftAuto = A7C2_NUMERIC.wbShiftAuto;
  const shiftCTemp = A7C2_NUMERIC.wbShiftCTemp;
  return [
    a7cSimple("focusMode", "focusMode"),
    a7cFocusArea(),
    a7cMetering(),
    a7cSimple("facePriority", "facePriority"),
    a7cSoftSkin(),
    a7cSimple("flash-mode", "flashMode"),
    a7cSimple("exp-comp-set", "expCompSet"),
    a7cSimple("pre-af", "preAF"),
    a7cSimple("steady-shot", "steadyShot"),
    a7cSimple("awb-priority", "awbPriority"),
    a7cSimple("live-view-display", "liveViewDisplay"),
    a7cSimple("wb", "wb"),
    a7cSimple("dro", "dro", { auto: "dro-auto" }),
    a7cNumber("isoAutoMin", A7C2_NUMERIC.isoAutoMin),
    a7cNumber("isoAutoMax", A7C2_NUMERIC.isoAutoMax),
    a7cNumber("iso", A7C2_NUMERIC.iso),
    a7cNumber("isoUpper", A7C2_NUMERIC.isoUpper),
    a7cNumber("wbKelvin", A7C2_NUMERIC.wbKelvin),
    a7cNumber("wbShiftAuto", shiftAuto.ab, [...shiftAuto.ab, ...shiftAuto.gm]),
    a7cNumber("wbShiftCTemp", shiftCTemp.ab, [...shiftCTemp.ab, ...shiftCTemp.gm]),
  ];
}

function zveAndA6400(model: "zve10" | "a6400"): Codec[] {
  return [
    ...RULE_SETTINGS.map(([id, p, field]) => (model === "zve10" ? zveRule(id, asRules(p), field) : a6400Rule(id, asRules(p)))),
    wbMode(model),
  ];
}

// Hàng chỉ có trong codec (inCatalog:false, planner không chọn). Có danh sách giá trị thì là liệt kê; numeric thì chỉ có raw.
function codecRow(s: Pick<Codec, "settingId" | "where" | "owns" | "codecValues" | "read"> & Partial<Pick<Codec, "codeOf" | "staticConfirmed" | "numeric">>): Codec {
  return { ...s, located: true, codeOf: s.codeOf ?? (() => null), staticConfirmed: s.staticConfirmed ?? [] };
}

const atOffset = (off: number, width: number) => ({ where: hex(off), owns: width === 2 ? [off, off + 1] : [off] });

// Mã ISO trong byte 404 (cùng công thức isoCode của zve10/dat.ts): AUTO là profile.auto, còn lại theo nấc 1/3 EV
const isoByte = (label: string): number | null => {
  const c = PROFILE.exposure.iso;
  if (!ISOS.includes(label)) return null;
  return label === "AUTO" ? (c.auto ?? 0) : (c.base ?? 11) + Math.round(3 * Math.log2(parseInt(label, 10) / 100));
};

// Mã APEX của khẩu độ hoặc tốc độ (cùng công thức decodeDat đảo lại)
const apexCode = (list: readonly string[], thirds: (s: string) => number) => (v: string): number | null =>
  list.includes(v) ? apexU16(thirds(v)) : null;

// Mã lựa chọn theo bảng profile.json (nhãn → mã); nhãn không có trong bảng (S-Cinetone ở ZV-E10) thì null: pending
const tableCode = (table: Record<string, number>) => (v: string): number | null => table[v] ?? null;
const nameFromCode = (table: Record<string, number>, code: number | undefined): string | null =>
  code === undefined ? null : (Object.keys(table).find((k) => table[k] === code) ?? null);

// ZV-E10: giá trị từ decodeDat (pick, null nếu chỉ có raw) và raw là số tại off
function zveRead(off: number, width: number, pick: ((d: DecodedSettings) => string | null) | null): (b: Uint8Array) => ReadOut | null {
  return (b) => {
    const d = decodeZve(b);
    return d ? { valueId: pick ? pick(d) : null, raw: readRule(b, off, width) } : null;
  };
}

// Lõi file M1–M4 của ZV-E10 (chỉ có trong codec). Chưa hiệu chỉnh nên mã là predicted đến khi thấy trong file máy thật.
function zveCore(): Codec[] {
  const ex = PROFILE.exposure;
  const pp = (index: number) => 0x317 + 14 * index;
  const apOff: number = ex.aperture.apex_offsets[0];
  const shOff: number = ex.shutter.apex_offsets[0];
  const isoOff: number = ex.iso.offsets[0];
  const modeOff: number = PROFILE.shoot_offsets[0];
  return [
    codecRow({ settingId: "shootMode", ...atOffset(modeOff, 1), codecValues: Object.keys(PROFILE.shoot_modes), codeOf: tableCode(PROFILE.shoot_modes), read: zveRead(modeOff, 1, (d) => d.mode) }),
    codecRow({ settingId: "aperture", ...atOffset(apOff, 2), codecValues: [], numeric: true, read: zveRead(apOff, 2, null) }),
    codecRow({ settingId: "shutter", ...atOffset(shOff, 2), codecValues: [], numeric: true, read: zveRead(shOff, 2, null) }),
    codecRow({ settingId: "iso", ...atOffset(isoOff, 1), codecValues: [], numeric: true, read: zveRead(isoOff, 1, null) }),
    codecRow({ settingId: "pictureProfile", ...atOffset(0x315, 1), codecValues: [], numeric: true, read: zveRead(0x315, 1, null) }),
    codecRow({ settingId: "ppGamma", ...atOffset(pp(1), 1), codecValues: GAMMAS, codeOf: tableCode(PROFILE.pp.gamma.values), read: zveRead(pp(1), 1, (d) => (d.pp1.gamma as string | null) ?? null) }),
    codecRow({ settingId: "ppColorMode", ...atOffset(pp(9), 1), codecValues: COLOR_MODES, codeOf: tableCode(PROFILE.pp.color_mode.values), read: zveRead(pp(9), 1, (d) => (d.pp1.color_mode as string | null) ?? null) }),
    codecRow({ settingId: "ppLevels", ...atOffset(pp(0), 1), codecValues: [], numeric: true, read: zveRead(pp(0), 1, null) }),
    codecRow({ settingId: "wbKelvin", ...atOffset(0x1d8, 1), codecValues: [], numeric: true, read: zveRead(0x1d8, 1, null) }),
  ];
}

// Lõi file M1–M4 của α6400 (chỉ có trong codec): cùng trường với SPEC của lib/a6400/dat.ts, giá trị từ decodeA6400
function a6400Core(): Codec[] {
  const field = (key: A6400FieldKey) => A6400_FIELDS.find((f) => f.key === key)!;
  const row = (settingId: string, key: A6400FieldKey, spec: { codecValues?: readonly string[]; codeOf?: (v: string) => number | null; numeric?: boolean }): Codec => {
    const f = field(key);
    return codecRow({
      settingId,
      ...atOffset(f.a6400Offset, f.width),
      codecValues: spec.codecValues ?? [],
      codeOf: spec.codeOf,
      numeric: spec.numeric,
      read(bytes) {
        if (!a6400Ok(bytes)) return null;
        const v = spec.numeric ? null : decodeA6400(bytes).fields[key].value;
        return { valueId: typeof v === "string" ? v : null, raw: readRule(bytes, f.a6400Offset, f.width) };
      },
    });
  };
  return [
    row("shootMode", "mode", { codecValues: Object.keys(PROFILE.shoot_modes), codeOf: tableCode(PROFILE.shoot_modes) }),
    row("aperture", "aperture", { numeric: true }),
    row("shutter", "shutter", { numeric: true }),
    row("iso", "iso", { numeric: true }),
    row("ppGamma", "ppGamma", { codecValues: GAMMAS, codeOf: tableCode(PROFILE.pp.gamma.values) }),
    row("ppColorMode", "ppColorMode", { codecValues: COLOR_MODES, codeOf: tableCode(PROFILE.pp.color_mode.values) }),
    row("ppLevels", "ppBlackLevel", { numeric: true }),
    row("wbKelvin", "kelvin", { numeric: true }),
  ];
}

// Khẩu độ và tốc độ của A7C II đọc từ bản ghi 0x017E: thang số, không liệt kê giá trị.
function a7cExposureRow(settingId: "aperture" | "shutter"): Codec {
  const ids = [A7C2_EXPOSURE.id];
  return codecRow({
    settingId,
    where: a7cWhere(ids),
    owns: ids,
    codecValues: [],
    numeric: true,
    read(bytes) {
      const dat = a7cParse(bytes);
      if (!dat) return null;
      const e = readA7c2Exposure(dat);
      // Thang số: raw là giá trị đã đọc (F hoặc tốc độ) để đếm số giá trị đã thấy trong file máy
      return { valueId: null, raw: e === null ? null : settingId === "aperture" ? e.aperture : e.shutter };
    },
  });
}

// Picture Profile của A7C II: mã trong A7C2_PP_CODES đều đã thấy trong file máy lưu nên xác nhận tĩnh; giá trị là PP1 (phần tử đầu)
function a7cPpChoice(settingId: string, key: A7c2PpParam, table: Record<string, number>): Codec {
  const ids = a7c2PpIds(key);
  return codecRow({
    settingId,
    where: a7cWhere(ids),
    owns: ids,
    codecValues: Object.keys(table),
    codeOf: tableCode(table),
    staticConfirmed: Object.keys(table),
    read(bytes) {
      const dat = a7cParse(bytes);
      if (!dat) return null;
      const code = readA7c2PpArray(dat, key)[0];
      return { valueId: nameFromCode(table, code), raw: code ?? null };
    },
  });
}

function a7c2Core(): Codec[] {
  const levelIds = a7c2PpIds("blackLevel");
  return [
    a7cSimple("shootMode", "shootMode"),
    a7cSimple("pictureProfile", "pictureProfile"),
    a7cSimple("isoAutoMinSS", "isoAutoMinSS"),
    a7cSimple("isoAutoMinSSSpeed", "isoAutoMinSSSpeed"),
    a7cExposureRow("aperture"),
    a7cExposureRow("shutter"),
    a7cPpChoice("ppGamma", "gamma", A7C2_PP_CODES.gamma),
    a7cPpChoice("ppColorMode", "colorMode", A7C2_PP_CODES.colorMode),
    codecRow({
      settingId: "ppLevels",
      where: a7cWhere(levelIds),
      owns: levelIds,
      codecValues: [],
      numeric: true,
      read(bytes) {
        const dat = a7cParse(bytes);
        if (!dat) return null;
        return { valueId: null, raw: readA7c2PpArray(dat, "blackLevel")[0] ?? null };
      },
    }),
  ];
}

function builtFor(model: GameModel): Codec[] {
  if (model === "a7c2") return [...a7c2Adapters(), ...a7c2Core()];
  return model === "zve10" ? [...zveAndA6400("zve10"), ...zveCore()] : [...zveAndA6400("a6400"), ...a6400Core()];
}

/**
 * Một adapter cho mỗi cài đặt của danh mục (theo thứ tự danh mục), rồi đến các cài đặt chỉ có trong codec (inCatalog:false).
 */
export function adaptersFor(model: GameModel): SettingAdapter[] {
  const settings = getCatalog()[model].settings;
  const built = new Map<string, Codec>(builtFor(model).map((a) => [a.settingId, a] as const));
  const catalogIds = new Set(settings.map((s) => s.id));
  const inCatalog = settings.map((s): SettingAdapter => ({ ...(built.get(s.id) ?? notLocated(s.id)), inCatalog: true }));
  const codecOnly = [...built.values()]
    .filter((a) => !catalogIds.has(a.settingId))
    .map((a): SettingAdapter => ({ ...a, inCatalog: false }));
  return [...inCatalog, ...codecOnly];
}
