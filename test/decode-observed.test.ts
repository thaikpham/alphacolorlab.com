import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scanObserved, serializeObserved } from "../lib/decode/observed.ts";
import type { RoundInput } from "../lib/decode/observed.ts";
import { loadCameraFiles, loadRounds, ROOT } from "../lib/decode/scanFs.ts";
import { buildSet } from "../lib/zve10/dat.ts";
import { getCatalog } from "../lib/game/catalog.ts";
import type { Mission } from "../lib/game/types.ts";

const load = (path: string) => new Uint8Array(readFileSync(join(ROOT, path)));

test("data/decode-observed.json khớp lần quét hiện tại (chạy npm run decode:scan nếu lệch)", () => {
  const fresh = serializeObserved(scanObserved(loadCameraFiles(ROOT), loadRounds(ROOT)));
  const committed = readFileSync(join(ROOT, "data/decode-observed.json"), "utf8");
  assert.strictEqual(committed, fresh, "data/decode-observed.json đã cũ: chạy npm run decode:scan");
});

test("file máy thật: 05N/06N của ZV-E10 không đọc được, 01P đọc được", () => {
  const o = scanObserved(loadCameraFiles(ROOT));
  const readable = Object.fromEntries(o.files.map((f) => [f.file, f.readable]));
  assert.strictEqual(readable["test/fixtures/zve10/CAMPR05N.DAT"], false);
  assert.strictEqual(readable["test/fixtures/zve10/CAMPR06N.DAT"], false);
  assert.strictEqual(readable["test/fixtures/zve10/CAMPR01P.DAT"], true);
});

test("scanObserved là hàm thuần: cùng đầu vào cho cùng kết quả và không đổi byte đầu vào", () => {
  const files = loadCameraFiles(ROOT).filter((f) => f.model === "zve10");
  const before = files.map((f) => Uint8Array.from(f.bytes));
  const a = serializeObserved(scanObserved(files));
  const b = serializeObserved(scanObserved(files));
  assert.strictEqual(a, b);
  files.forEach((f, i) => assert.deepStrictEqual(f.bytes, before[i], f.file));
});

// Lượt chơi tổng hợp: ô 2 đổi một cài đặt chưa định vị (isoMin) bằng đúng một byte
test("vòng chơi: cài đặt chưa định vị đổi đúng một byte cho ứng viên locate với candidates là byte đó", () => {
  const a = load("public/dat/zve10-base-pal.dat");
  const b = Uint8Array.from(a);
  b[0x100] = a[0x100] ^ 1;
  const isoMin = getCatalog().zve10.settings.find((s) => s.id === "isoMin")!.values[0].id;
  const mission: Mission = {
    id: "learn-1",
    model: "zve10",
    seed: 1,
    createdAt: 0,
    slots: [
      { slot: 1, steps: [] },
      { slot: 2, steps: [{ settingId: "isoMin", valueId: isoMin, role: "target" }] },
    ],
  };
  const round: RoundInput = {
    model: "zve10",
    missionId: "learn-1",
    mission,
    files: [
      { slot: 1, bytes: a },
      { slot: 2, bytes: b },
    ],
  };
  const c = scanObserved([], [round]).candidates;
  assert.strictEqual(c.length, 1);
  const first = c[0];
  if (first.kind !== "locate") throw new Error(`cần locate, được ${first.kind}`);
  assert.strictEqual(first.settingId, "isoMin");
  assert.deepStrictEqual(first.candidates, [{ where: "0x0100", from: a[0x100], to: a[0x100] ^ 1 }]);
  assert.strictEqual(first.missionId, "learn-1");
});

// Lượt chơi tổng hợp: ô 2 ghi đo sáng Điểm giữa (center), cài đặt đã định vị cho ứng viên confirm (isNew là boolean)
test("vòng chơi: cài đặt đã định vị đọc đúng giá trị đề bài cho ứng viên confirm", () => {
  const headers = [1, 2, 3, 4].map((i) => load(`public/dat/zve10-pal-m${i}.dat`));
  const base = load("public/dat/zve10-base-pal.dat");
  const built = buildSet(base, [{ metering: "multi" }, { metering: "center" }, { metering: "center" }, { metering: "center" }] as any, undefined, undefined, headers);
  const mission: Mission = {
    id: "confirm-1",
    model: "zve10",
    seed: 1,
    createdAt: 0,
    slots: [
      { slot: 1, steps: [] },
      { slot: 2, steps: [{ settingId: "metering", valueId: "center", role: "control" }] },
    ],
  };
  const round: RoundInput = {
    model: "zve10",
    missionId: "confirm-1",
    mission,
    files: [
      { slot: 1, bytes: built[0].data },
      { slot: 2, bytes: built[1].data },
    ],
  };
  const c = scanObserved([], [round]).candidates;
  assert.strictEqual(c.length, 1);
  const first = c[0];
  if (first.kind !== "confirm") throw new Error(`cần confirm, được ${first.kind}`);
  assert.strictEqual(first.settingId, "metering");
  assert.strictEqual(first.valueId, "center");
  assert.strictEqual(typeof first.isNew, "boolean");
});
