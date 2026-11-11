// Ghép 4 file M1–M4 đúng cấu trúc thẻ nhớ rồi zip để tải về. Dùng chung cho PresetBuilder (tạo bộ, sao lưu thẻ) và trang /bo-m1-m4/[id].
// Không import app/content.ts ở đây (chữ hướng dẫn truyền vào từ ngoài) để test node chạy được.
import { buildSet, type BuiltSet, type SlotSettings } from "./zve10/dat.ts";
import { makeZip, type ZipEntry } from "./zve10/zip.ts";

/** Thư mục trong thẻ nhớ mà máy đọc bộ Memory Recall. */
export const CARD_PATH_PREFIX = "PRIVATE/SONY/SETTING/E10/";
export const ZIP_FILENAME = "ZV-E10_M1-M4.zip";
export const GUIDE_FILE = "HUONG_DAN.txt";

export type PresetSystem = "pal" | "ntsc";

/** File mẫu do máy lưu: base và header từng ô (đổi header làm máy báo File Error). Đọc từ /dat/ trên trình duyệt. */
export async function loadPresetBase(system: PresetSystem): Promise<{ base: Uint8Array; headers: Uint8Array[] }> {
  const load = (name: string) => fetch(`/dat/${name}.dat`).then((res) => res.arrayBuffer()).then((ab) => new Uint8Array(ab));
  const [base, ...headers] = await Promise.all([load(`zve10-base-${system}`), ...[1, 2, 3, 4].map((i) => load(`zve10-${system}-m${i}`))]);
  return { base, headers };
}

/** Zip đúng cấu trúc thẻ: mỗi .DAT vào PRIVATE/SONY/SETTING/E10/, tùy chọn thêm HUONG_DAN.txt ở gốc. */
export function cardZip(files: { name: string; data: Uint8Array }[], guideText?: string): Uint8Array {
  const entries: ZipEntry[] = files.map((f) => ({ path: CARD_PATH_PREFIX + f.name, data: f.data }));
  if (guideText !== undefined) entries.push({ path: GUIDE_FILE, data: new TextEncoder().encode(guideText) });
  return makeZip(entries);
}

/** 4 file .DAT từ 4 ô cài đặt, kèm zip có hướng dẫn. */
export function buildPresetFiles(
  settings: SlotSettings[],
  base: Uint8Array | Uint8Array[],
  headers: Uint8Array[],
  guideText: string,
): { files: BuiltSet[]; zip: Uint8Array } {
  const files = buildSet(base, settings, undefined, undefined, headers);
  return { files, zip: cardZip(files, guideText) };
}

/** Tải về qua thẻ a tạm. Chỉ gọi trên trình duyệt. */
export function saveFile(data: Uint8Array, filename: string, type: string) {
  const blob = new Blob([data as any], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
