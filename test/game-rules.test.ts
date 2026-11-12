import { test } from "node:test";
import assert from "node:assert";
import { allowsControl, baselineSkips, baselineValues, BASELINE_ORDER, needsAfC } from "../lib/game/rules.ts";
import type { CatalogValue } from "../lib/game/types.ts";

const pend = (...pairs: [string, string][]) => new Map(pairs);
const vals = (...ids: string[]): CatalogValue[] => ids.map((id) => ({ id, label: id }) as unknown as CatalogValue);

test("face-needs-multi: Ưu tiên mặt chỉ đi cùng Đo sáng Đa điểm", () => {
  assert.strictEqual(allowsControl("facePriority", "on", pend(["metering", "multi"])), true);
  assert.strictEqual(allowsControl("facePriority", "on", pend(["metering", "spot-standard"])), false);
  assert.strictEqual(allowsControl("facePriority", "on", pend()), false);
  assert.strictEqual(allowsControl("metering", "spot-standard", pend()), true);
});

test("focus-area-needs-af: Vùng lấy nét cần AF, Theo dõi cần AF-C", () => {
  assert.strictEqual(allowsControl("focusArea", "wide", pend()), false);
  assert.strictEqual(allowsControl("focusArea", "wide", pend(["focusMode", "MF"])), false);
  assert.strictEqual(allowsControl("focusArea", "wide", pend(["focusMode", "AF-S"])), true);
  assert.strictEqual(allowsControl("focusArea", "tracking-wide", pend(["focusMode", "AF-S"])), false);
  assert.strictEqual(allowsControl("focusArea", "tracking-wide", pend(["focusMode", "AF-C"])), true);
});

test("mf-excludes-focus-area: MF không đi cùng Vùng lấy nét", () => {
  assert.strictEqual(allowsControl("focusMode", "MF", pend(["focusArea", "wide"])), false);
  assert.strictEqual(allowsControl("focusMode", "MF", pend()), true);
  assert.strictEqual(allowsControl("focusMode", "AF-S", pend(["focusArea", "wide"])), true);
});

test("needsAfC chỉ đúng với Vùng lấy nét Theo dõi", () => {
  assert.strictEqual(needsAfC({ settingId: "focusArea", valueId: "tracking-wide" }), true);
  assert.strictEqual(needsAfC({ settingId: "focusArea", valueId: "wide" }), false);
  assert.strictEqual(needsAfC({ settingId: "focusMode", valueId: "AF-C" }), false);
});

test("baselineSkips: không đặt nền cho chính mục tiêu, và MF bỏ Vùng lấy nét", () => {
  assert.strictEqual(baselineSkips("metering", { settingId: "metering", valueId: "multi" }), true);
  assert.strictEqual(baselineSkips("focusArea", { settingId: "focusMode", valueId: "MF" }), true);
  assert.strictEqual(baselineSkips("focusArea", { settingId: "focusMode", valueId: "AF-S" }), false);
  assert.deepStrictEqual([...BASELINE_ORDER], ["focusMode", "focusArea", "metering"]);
});

test("baselineValues: giữ nền hợp lệ theo mục tiêu", () => {
  const modes = vals("AF-S", "AF-C", "MF");
  const target = { settingId: "focusArea", valueId: "tracking-wide" };
  const ctx = { target, faceTarget: false, mode: null };
  assert.deepStrictEqual(baselineValues("focusMode", modes, ctx).map((v) => v.id), ["AF-C"]);
  assert.deepStrictEqual(baselineValues("focusMode", modes, { ...ctx, target: { settingId: "metering", valueId: "multi" } }).map((v) => v.id), ["AF-S", "AF-C"]);

  const areas = vals("wide", "tracking-wide");
  assert.deepStrictEqual(baselineValues("focusArea", areas, { ...ctx, mode: "AF-S" }).map((v) => v.id), ["wide"]);
  assert.deepStrictEqual(baselineValues("focusArea", areas, { ...ctx, mode: "AF-C" }).map((v) => v.id), ["wide", "tracking-wide"]);

  const meter = vals("multi", "spot-standard");
  assert.deepStrictEqual(baselineValues("metering", meter, { ...ctx, faceTarget: true }).map((v) => v.id), ["multi"]);
  assert.deepStrictEqual(baselineValues("metering", meter, { ...ctx, faceTarget: false }).map((v) => v.id), ["multi", "spot-standard"]);
});
