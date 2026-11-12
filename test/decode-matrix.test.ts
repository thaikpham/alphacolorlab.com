import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { decodeMatrix, modelSummary, MODELS, ROUNDS_CAP } from "../lib/decode/matrix.ts";
import { catalogRows, statusRows } from "../lib/decode/status.ts";
import { getCatalog } from "../lib/game/catalog.ts";
import type { GameModel } from "../lib/game/types.ts";
import type { LocalFindings } from "../lib/decode/status.ts";

// Điền đủ mọi giá trị (cả giá trị chỉ có trong codec) và định vị mọi cài đặt của một máy
function everything(model: GameModel): LocalFindings {
  const rows = statusRows(model, {}, false);
  return {
    values: rows.filter((r) => !r.numeric).flatMap((r) => r.cells.map((c) => ({ model, settingId: r.settingId, valueId: c.valueId }))),
    located: rows.map((r) => ({ model, settingId: r.settingId })),
  };
}

test("modelSummary: đếm khớp với ma trận và danh mục", () => {
  for (const m of MODELS) {
    const cat = getCatalog()[m].settings;
    const rows = catalogRows(m);
    const s = modelSummary(m);
    // Giá trị: ô danh mục, cộng mọi ô (không numeric) của cài đặt chỉ có trong codec
    const codecOnly = statusRows(m).filter((r) => !r.inCatalog && !r.numeric).reduce((n, r) => n + r.cells.length, 0);
    assert.strictEqual(s.settings, cat.length, m);
    assert.strictEqual(s.values, cat.reduce((n, x) => n + x.values.length, 0) + codecOnly, m);
    assert.strictEqual(s.located, rows.filter((r) => r.located).length, m);
    assert.strictEqual(s.confirmed + s.pending + s.predicted + s.unknown, s.values, m);
    assert.ok(s.located <= s.settings, m);
    assert.ok(Number.isInteger(s.roundsLeft) && s.roundsLeft >= 0 && s.roundsLeft <= ROUNDS_CAP, `${m} roundsLeft=${s.roundsLeft}`);
  }
});

test("decodeMatrix: hàng danh mục đứng trước theo thứ tự danh mục, mỗi ô đúng số giá trị; hàng codec-only đứng sau", () => {
  const matrix = decodeMatrix();
  assert.deepStrictEqual(Object.keys(matrix).sort(), [...MODELS].sort());
  for (const m of MODELS) {
    const cat = getCatalog()[m].settings;
    const head = matrix[m].slice(0, cat.length);
    assert.deepStrictEqual(head.map((r) => r.settingId), cat.map((s) => s.id), m);
    assert.ok(head.every((r) => r.inCatalog), `${m} hàng danh mục`);
    head.forEach((row, i) => {
      assert.deepStrictEqual(row.cells.filter((c) => c.inCatalog).map((c) => c.valueId), cat[i].values.map((v) => v.id), `${m}/${row.settingId}`);
    });
    const tail = matrix[m].slice(cat.length);
    assert.ok(tail.every((r) => !r.inCatalog && r.cells.every((c) => !c.inCatalog)), `${m} hàng codec-only`);
  }
});

test("local findings: giá trị phát hiện trên máy người dùng thành confirmed và tăng số liệu", () => {
  const before = modelSummary("a7c2");
  const open = statusRows("a7c2").flatMap((r) => r.cells.map((c) => ({ settingId: r.settingId, valueId: c.valueId, status: c.status })))
    .find((c) => c.status !== "confirmed")!;
  const local: LocalFindings = {
    values: [{ model: "a7c2", settingId: open.settingId, valueId: open.valueId }],
    located: [{ model: "a7c2", settingId: open.settingId }],
  };
  const after = modelSummary("a7c2", local);
  assert.strictEqual(after.confirmed, before.confirmed + 1);
  assert.ok(after.located >= before.located);
  const cell = statusRows("a7c2", local).find((r) => r.settingId === open.settingId)!.cells.find((c) => c.valueId === open.valueId)!;
  assert.strictEqual(cell.status, "confirmed");
});

test("local findings của model khác không ảnh hưởng model này", () => {
  const base = modelSummary("a6400");
  const other = modelSummary("a6400", everything("zve10"));
  assert.strictEqual(other.confirmed, base.confirmed);
});

test("roundsLeft bằng 0 khi mọi giá trị đã xác nhận hoặc không còn mục tiêu", () => {
  for (const m of MODELS) {
    const s = modelSummary(m, everything(m));
    assert.strictEqual(s.roundsLeft, 0, m);
    assert.strictEqual(s.confirmed, s.values, m);
  }
});

test("roundsLeft không vượt ROUNDS_CAP", () => {
  assert.strictEqual(ROUNDS_CAP, 12);
  for (const m of MODELS) assert.ok(modelSummary(m).roundsLeft <= ROUNDS_CAP, m);
});

test("status.ts không import matrix.ts hay plan.ts (tránh vòng lặp import)", () => {
  const src = readFileSync(new URL("../lib/decode/status.ts", import.meta.url), "utf8");
  const imports = src.split("\n").filter((l) => /^\s*(import|export)\b.*from\s/.test(l));
  assert.ok(!imports.some((l) => /matrix\.ts|plan\.ts/.test(l)), imports.join("\n"));
});
