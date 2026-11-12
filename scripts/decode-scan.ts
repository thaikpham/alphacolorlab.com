// Quét file máy thật (test/fixtures/camera-saved.json) và lượt chơi (test/fixtures/rounds/), ghi data/decode-observed.json
// và data/decode-summary.json. Chạy: npm run decode:scan. Chạy hai lần phải không có khác biệt.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, writeScan } from "../lib/decode/scanFs.ts";

export function main(root: string = ROOT): void {
  writeScan(root);
  console.log("decode:scan: đã ghi data/decode-observed.json và data/decode-summary.json");
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) main();
