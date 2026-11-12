/**
 * Sony α6400 (ILCE-6400, Legacy Menu) Memory Recall DAT — bộ giải mã CHỈ ĐỌC, thử nghiệm.
 * Checksum 0x38 và bản đồ offset được suy ra từ 5 file máy thật (test/fixtures/a6400/).
 * Không có hàm ghi: α6400 chưa được hỗ trợ tạo file.
 * Enum và công thức APEX/ISO dùng chung với ZV-E10 (lib/zve10/dat.ts).
 */

import { APERTURES, ISOS, PROFILE, SHUTTERS, apexU16, avThirds, tvThirds } from "../zve10/dat.ts";

export const A6400_MODEL = "ILCE-6400";
const SIZE = 4608;

// Bản đồ offset ZV-E10 → α6400 (trainer README). Khoảng 0x2DE chưa xác nhận nên không ánh xạ.
const LAYOUT: readonly [number, number, number][] = [
  [0x3c, 0x2dd, 0],
  [0x2df, 0x489, 1],
  [0x48a, 0x48f, 0],
  [0x491, 0x7aa, -2],
];

export function toA6400Offset(zveOffset: number): number {
  for (const [start, end, shift] of LAYOUT) {
    if (zveOffset >= start && zveOffset <= end) return zveOffset + shift;
  }
  throw new Error(`Chưa có ánh xạ α6400 cho offset 0x${zveOffset.toString(16)}`);
}

function readLE(b: Uint8Array, off: number, width: 1 | 2): number {
  return width === 1 ? b[off] : b[off] + 256 * b[off + 1];
}

function enumKey(values: Record<string, number>, raw: number): string | null {
  return Object.entries(values).find(([, v]) => v === raw)?.[0] ?? null;
}

function isoCode(label: string): number {
  const iso = PROFILE.exposure.iso;
  return label === "AUTO" ? (iso.auto ?? 0) : (iso.base ?? 11) + Math.round(3 * Math.log2(parseInt(label, 10) / 100));
}

// Mỗi trường: offset gốc ZV-E10, độ rộng, giá trị đã thấy trong 5 file máy thật (observed), bộ giải mã.
type Spec = {
  zve: number;
  width: 1 | 2;
  observed: readonly (string | number)[];
  decode: (raw: number) => string | number | null;
};

const PP1 = (fieldIndex: number) => 0x317 + 14 * fieldIndex;

const SPEC = {
  mode: {
    zve: PROFILE.shoot_offsets[0] as number,
    width: 1,
    observed: ["M"],
    decode: (r) => enumKey(PROFILE.shoot_modes, r),
  },
  aperture: {
    zve: PROFILE.exposure.aperture.apex_offsets[0] as number,
    width: 2,
    observed: ["5.6", "8", "11"],
    decode: (r) => APERTURES.find((x) => apexU16(avThirds(x)) === r) ?? null,
  },
  shutter: {
    zve: PROFILE.exposure.shutter.apex_offsets[0] as number,
    width: 2,
    observed: ["1/60", "1/125", "1/250"],
    decode: (r) => SHUTTERS.find((x) => apexU16(tvThirds(x)) === r) ?? null,
  },
  iso: {
    zve: PROFILE.exposure.iso.offsets[0] as number,
    width: 1,
    observed: ["AUTO", "400", "800", "1600"],
    decode: (r) => ISOS.find((x) => isoCode(x) === r) ?? null,
  },
  wbMode: {
    zve: 0x19a,
    width: 1,
    observed: ["ctemp", "awb"],
    decode: (r) => ({ 14: "ctemp", 1: "awb" } as Record<number, string>)[r] ?? null,
  },
  kelvin: {
    zve: 0x1d8,
    width: 1,
    observed: [4300, 5500],
    decode: (r) => r * 100,
  },
  ppGamma: {
    zve: PP1(1),
    width: 1,
    observed: ["Movie", "Cine3", "Still", "Cine2"],
    decode: (r) => enumKey(PROFILE.pp.gamma.values, r),
  },
  ppColorMode: {
    zve: PP1(9),
    width: 1,
    observed: ["Movie", "Cinema", "Pro", "ITU709 Matrix"],
    decode: (r) => enumKey(PROFILE.pp.color_mode.values, r),
  },
  ppBlackLevel: {
    zve: PP1(0),
    width: 1,
    observed: [0, 5, -5],
    decode: (r) => (r >= 128 ? r - 256 : r),
  },
} satisfies Record<string, Spec>;

export type A6400FieldKey = keyof typeof SPEC;

export const A6400_FIELDS = (Object.keys(SPEC) as A6400FieldKey[]).map((key) => ({
  key,
  zveOffset: SPEC[key].zve,
  a6400Offset: toA6400Offset(SPEC[key].zve),
  width: SPEC[key].width,
  observed: SPEC[key].observed,
}));

// Checksum byte 0x38 của α6400: như ZV-E10 nhưng bỏ byte 0x5D1 (AWB Priority) và cộng 0x81.
// Quy tắc khớp đúng cả 5 file máy thật; chưa kiểm chứng trên mẫu khác.
export function a6400Checksum38(bytes: Uint8Array): number {
  let sum = 0;
  for (let o = 0x39; o < 0x1000; o++) {
    if (o === 0x5d1) continue;
    sum += bytes[o] << ((o - 0x39) % 8);
  }
  return (sum + 0x81) & 255;
}

export interface A6400Header {
  model: string;
  date: string;
  name: string;
}

export function parseA6400(bytes: Uint8Array): A6400Header {
  if (bytes.length !== SIZE) throw new Error("Cần file Memory Recall SONY! của α6400, dài 4.608 byte.");
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== "SONY!") throw new Error("Không phải file Memory Recall SONY!.");
  const end = bytes.indexOf(0, 5);
  const model = String.fromCharCode(...bytes.subarray(5, end === -1 || end > 0x14 ? 0x14 : end));
  if (model !== A6400_MODEL) throw new Error(`File này không phải α6400 (model: ${model}).`);
  if (bytes[0x38] !== a6400Checksum38(bytes)) throw new Error("Sai checksum byte 0x38 của α6400.");
  return {
    model,
    date: String.fromCharCode(...bytes.subarray(0x15, 0x24)).replace(/\0.*$/, ""),
    name: String.fromCharCode(...bytes.subarray(0x28, 0x34)).replace(/\0.*$/, ""),
  };
}

export interface A6400Value {
  value: string | number | null;
  offset: number;
  // true chỉ khi giá trị đã xuất hiện trong file máy thật (A6400_FIELDS[].observed)
  confirmed: boolean;
}

export interface A6400Decoded extends A6400Header {
  fields: Record<A6400FieldKey, A6400Value>;
}

export function decodeA6400(bytes: Uint8Array): A6400Decoded {
  const header = parseA6400(bytes);
  const fields = {} as Record<A6400FieldKey, A6400Value>;
  for (const key of Object.keys(SPEC) as A6400FieldKey[]) {
    const spec = SPEC[key];
    const offset = toA6400Offset(spec.zve);
    const value = spec.decode(readLE(bytes, offset, spec.width));
    fields[key] = { value, offset, confirmed: value !== null && (spec.observed as readonly unknown[]).includes(value) };
  }
  // Nhiệt độ màu chỉ có nghĩa khi WB là C.Temp (cùng quy ước ZV-E10).
  if (fields.wbMode.value !== "ctemp") fields.kelvin = { value: null, offset: fields.kelvin.offset, confirmed: false };
  return { ...header, fields };
}
