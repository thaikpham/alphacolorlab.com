import { test } from "node:test";
import assert from "node:assert";
import { sections, cameraModels } from "../app/content.ts";

// Máy menu mới dùng tab khác hẳn Legacy Menu: bước nào cũng phải có đường dẫn riêng, hoặc ghi rõ bỏ qua
test("every guide step gives each new-menu camera its own path or a skip note", () => {
  const missing: string[] = [];
  for (const { id } of cameraModels.filter((m) => m.menu === "new")) {
    for (const step of sections.flatMap((s) => s.steps)) {
      const skipped = step.only && !step.only.includes(id);
      if (skipped ? !step.skipNote?.[id] : !step.pathBy?.[id]) missing.push(`${id} step ${step.n}`);
    }
  }
  assert.deepStrictEqual(missing, []);
});

test("legacy-only notes have a replacement note for the cameras they hide from", () => {
  const missing: string[] = [];
  for (const step of sections.flatMap((s) => s.steps)) {
    if (!step.noteFor) continue;
    for (const { id } of cameraModels) if (!step.noteFor.includes(id) && !step.noteBy?.[id]) missing.push(`${id} step ${step.n}`);
  }
  assert.deepStrictEqual(missing, []);
});

test("the Sony body list contains every selectable camera once, with the same name and menu", async () => {
  const { sonyBodies } = await import("../app/content.ts");
  for (const m of cameraModels) {
    const rows = sonyBodies.filter((b) => b.id === m.id);
    assert.strictEqual(rows.length, 1, m.id);
    assert.strictEqual(rows[0].name, m.name);
    assert.strictEqual(rows[0].menu, m.menu);
  }
  assert.strictEqual(new Set(sonyBodies.map((b) => b.code)).size, sonyBodies.length, "duplicate model code");
  // Chỉ máy có bộ tạo M1–M4 mới được ghi "Đã giải mã"
  assert.deepStrictEqual(sonyBodies.filter((b) => b.decoded).map((b) => b.id), ["zve10"]);
});
