// Lượt đã lưu (test/fixtures/rounds/<model>/<missionId>/) phải được quét như file máy lưu,
// để lưu một lượt là bảng tham số và tiến độ tự cập nhật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCameraFiles, loadRounds, ROOT } from "../lib/decode/scanFs.ts";
import { scanObserved } from "../lib/decode/observed.ts";

test("file trong rounds/ được quét như file máy lưu", () => {
  const root = mkdtempSync(join(tmpdir(), "decode-rounds-"));
  try {
    mkdirSync(join(root, "test/fixtures"), { recursive: true });
    writeFileSync(join(root, "test/fixtures/camera-saved.json"), "[]");
    const dir = join(root, "test/fixtures/rounds/a7c2/round_1");
    mkdirSync(dir, { recursive: true });
    for (const n of ["CAMPR01P.DAT", "CAMPR02P.DAT"]) copyFileSync(join(ROOT, "test/fixtures/a7c2/run9", n), join(dir, n));
    writeFileSync(join(dir, "mission.json"), JSON.stringify({ id: "round_1", model: "a7c2", seed: 1, createdAt: 0, slots: [] }));
    // Thư mục lạ không phải tên máy thì bỏ qua
    mkdirSync(join(root, "test/fixtures/rounds/khac/x"), { recursive: true });

    const files = loadCameraFiles(root);
    assert.deepEqual(files.map((f) => f.file), [
      "test/fixtures/rounds/a7c2/round_1/CAMPR01P.DAT",
      "test/fixtures/rounds/a7c2/round_1/CAMPR02P.DAT",
    ]);
    assert.equal(files.every((f) => f.model === "a7c2"), true);

    const observed = scanObserved(files, loadRounds(root).filter((r) => r.model === "a7c2"));
    const seen = Object.values(observed.values.a7c2).flatMap((v) => Object.values(v).flat());
    assert.ok(seen.length > 0, "giá trị đọc từ file của lượt phải vào observed.values");
    assert.ok(seen.every((p) => p.startsWith("test/fixtures/rounds/a7c2/round_1/")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
