/**
 * Quét dự án bằng node:fs (chỉ dùng trong script và kiểm thử, không đưa vào bundle của trang).
 * Đọc file máy thật (test/fixtures/camera-saved.json) và lượt chơi (test/fixtures/rounds/), tính quan sát và số liệu,
 * rồi ghi data/decode-observed.json và data/decode-summary.json (ghi file tạm rồi đổi tên).
 */
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { GameModel, Mission, RoundFile } from "../game/types.ts";
import { scanObserved, serializeObserved, stableJson } from "./observed.ts";
import type { CameraFile, RoundInput } from "./observed.ts";
import { modelSummary, MODELS } from "./matrix.ts";
import type { ModelSummary } from "./matrix.ts";
import { setObserved } from "./status.ts";

// Gốc dự án: npm script, kiểm thử và route handler của Next đều chạy từ thư mục gốc.
// Không dùng new URL(..., import.meta.url): Turbopack coi đó là asset và báo không tìm thấy module.
export const ROOT = process.cwd();
const DAT = /\.dat$/i;

export function loadCameraFiles(root: string): CameraFile[] {
  const manifest = JSON.parse(readFileSync(join(root, "test/fixtures/camera-saved.json"), "utf8")) as {
    dir: string;
    model: GameModel;
  }[];
  const out: CameraFile[] = [];
  for (const entry of manifest) {
    const dir = join(root, entry.dir);
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      if (!DAT.test(name) || !statSync(path).isFile()) continue;
      out.push({ file: `${entry.dir}/${name}`, model: entry.model, bytes: new Uint8Array(readFileSync(path)) });
    }
  }
  // File của các lượt đã lưu (test/fixtures/rounds/<model>/<missionId>/) cũng là file máy lưu:
  // giá trị đọc được từ chúng được tính là đã thấy, nên lưu một lượt là bảng và tiến độ tự cập nhật.
  const rounds = join(root, "test/fixtures/rounds");
  if (existsSync(rounds)) {
    for (const model of readdirSync(rounds).sort()) {
      if (!(MODELS as readonly string[]).includes(model)) continue;
      for (const missionId of readdirSync(join(rounds, model)).sort()) {
        const dir = join(rounds, model, missionId);
        if (!statSync(dir).isDirectory()) continue;
        for (const name of readdirSync(dir).sort()) {
          if (!DAT.test(name)) continue;
          out.push({
            file: `test/fixtures/rounds/${model}/${missionId}/${name}`,
            model: model as GameModel,
            bytes: new Uint8Array(readFileSync(join(dir, name))),
          });
        }
      }
    }
  }
  return out;
}

// test/fixtures/rounds/<model>/<missionId>/: mission.json (Mission) và 4 file CAMPR0x[PN].DAT
export function loadRounds(root: string): RoundInput[] {
  const base = join(root, "test/fixtures/rounds");
  if (!existsSync(base)) return [];
  const out: RoundInput[] = [];
  for (const model of readdirSync(base).sort()) {
    // Chỉ thư mục mang tên máy; thư mục lượt thiếu mission.json thì bỏ qua (không có đề bài để phân tích)
    if (!(MODELS as readonly string[]).includes(model)) continue;
    for (const missionId of readdirSync(join(base, model)).sort()) {
      const dir = join(base, model, missionId);
      if (!statSync(dir).isDirectory() || !existsSync(join(dir, "mission.json"))) continue;
      const mission = JSON.parse(readFileSync(join(dir, "mission.json"), "utf8")) as Mission;
      const files: RoundFile[] = readdirSync(dir)
        .filter((n) => DAT.test(n))
        .sort()
        .map((n) => {
          const m = n.match(/CAMPR0([1-4])[PN]\.DAT$/i);
          if (!m) throw new Error(`Tên file lượt chơi không đúng: ${dir}/${n}`);
          return { slot: Number(m[1]), bytes: new Uint8Array(readFileSync(join(dir, n))) };
        });
      out.push({ model: model as GameModel, missionId, mission, files });
    }
  }
  return out;
}

// Kết quả quét dưới dạng hai chuỗi JSON (không ghi đĩa). Số liệu tính trên quan sát vừa quét, không phụ thuộc file đóng gói.
export function scanProject(root: string): { observed: string; summary: string } {
  const observed = scanObserved(loadCameraFiles(root), loadRounds(root));
  setObserved(observed);
  try {
    const models = Object.fromEntries(MODELS.map((m) => [m, modelSummary(m)])) as Record<GameModel, ModelSummary>;
    return { observed: serializeObserved(observed), summary: stableJson({ version: 1, models }) + "\n" };
  } finally {
    setObserved(null);
  }
}

// Ghi file tạm rồi đổi tên: không để lại file dở nếu ghi bị ngắt
function writeAtomic(path: string, text: string): void {
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

export function writeScan(root: string): void {
  const { observed, summary } = scanProject(root);
  writeAtomic(join(root, "data/decode-observed.json"), observed);
  writeAtomic(join(root, "data/decode-summary.json"), summary);
}
