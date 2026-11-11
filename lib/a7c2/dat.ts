// File Memory Recall của A7C II (New-gen Menu), PRIVATE/SONY/SETTING/7CM2/CAMPR0xP.DAT.
// Khung file đọc từ file máy thật (ILCE-7CM2 firmware 2.01, 2026-11-08); ý nghĩa từng mã bản ghi chưa giải mã.
//   0x00–0x37  header: "SONY", 1 byte, tên máy, ngày giờ lưu "YYYYMMDD_HHMMSS" ở 0x15
//   0x39       checksum header: Σ b[i] << (i % 8), i = 0x00…0x38, lấy 8 bit thấp
//   0x3C       u32 số bản ghi
//   0x40…      bản ghi: u16 mã, u16 kiểu, u16 cỡ phần tử, u16 số phần tử, rồi cỡ × số phần tử byte giá trị
//   4 byte cuối u32 tổng mọi byte từ 0x3C đến trước 4 byte này

export type A7c2Record = { id: number; kind: number; size: number; count: number; value: Uint8Array };
export type A7c2Dat = { header: Uint8Array; records: A7c2Record[] };

export const A7C2_HEADER_MODEL = "ILCE-7CM2";

export function headerChecksum(b: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i <= 0x38; i++) sum += b[i] << (i % 8);
  return sum & 0xff;
}

function bodySum(b: Uint8Array): number {
  let sum = 0;
  for (let i = 0x3c; i < b.length - 4; i++) sum += b[i];
  return sum >>> 0;
}

/** Tên máy trong header (từ byte 5 tới byte 0 đầu tiên). */
export function headerModel(b: Uint8Array): string {
  const end = b.indexOf(0, 5);
  return new TextDecoder("latin1").decode(b.subarray(5, end > 5 ? end : 5));
}

/** Đọc file; báo lỗi nếu sai checksum hay bản ghi tràn file, để không bao giờ sửa trên file hỏng. */
export function parseA7c2(bytes: Uint8Array): A7c2Dat {
  if (bytes.length < 0x44 || new TextDecoder("latin1").decode(bytes.subarray(0, 4)) !== "SONY") throw new Error("Không phải file cài đặt Sony");
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes[0x39] !== headerChecksum(bytes)) throw new Error("Checksum header không khớp");
  if (dv.getUint32(bytes.length - 4, true) !== bodySum(bytes)) throw new Error("Checksum thân file không khớp");
  const records: A7c2Record[] = [];
  let o = 0x40;
  for (let n = dv.getUint32(0x3c, true); n > 0; n--) {
    if (o + 8 > bytes.length - 4) throw new Error("Bản ghi vượt quá cuối file");
    const size = dv.getUint16(o + 4, true);
    const count = dv.getUint16(o + 6, true);
    const end = o + 8 + size * count;
    if (end > bytes.length - 4) throw new Error("Bản ghi vượt quá cuối file");
    records.push({ id: dv.getUint16(o, true), kind: dv.getUint16(o + 2, true), size, count, value: bytes.slice(o + 8, end) });
    o = end;
  }
  if (o !== bytes.length - 4) throw new Error("Thừa byte sau bản ghi cuối");
  return { header: bytes.slice(0, 0x3c), records };
}

/** Ghi lại file từ header của máy và các bản ghi; tính lại hai checksum. */
export function serializeA7c2(dat: A7c2Dat): Uint8Array {
  const out = new Uint8Array(0x40 + dat.records.reduce((sum, r) => sum + 8 + r.size * r.count, 0) + 4);
  const dv = new DataView(out.buffer);
  out.set(dat.header.subarray(0, 0x3c));
  dv.setUint32(0x3c, dat.records.length, true);
  let o = 0x40;
  for (const r of dat.records) {
    if (r.value.length !== r.size * r.count) throw new Error(`Bản ghi ${r.id} sai độ dài giá trị`);
    dv.setUint16(o, r.id, true);
    dv.setUint16(o + 2, r.kind, true);
    dv.setUint16(o + 4, r.size, true);
    dv.setUint16(o + 6, r.count, true);
    out.set(r.value, o + 8);
    o += 8 + r.value.length;
  }
  out[0x39] = headerChecksum(out);
  dv.setUint32(out.length - 4, bodySum(out), true);
  return out;
}

/** Mã các bản ghi khác nhau giữa hai file cùng máy: dùng để giải mã từ file mẫu (đổi một cài đặt, lưu, so). */
export function diffA7c2(a: A7c2Dat, b: A7c2Dat): number[] {
  const byId = new Map(b.records.map((r) => [r.id, r.value]));
  return a.records.filter((r) => {
    const other = byId.get(r.id);
    return !other || other.length !== r.value.length || other.some((v, i) => v !== r.value[i]);
  }).map((r) => r.id);
}
