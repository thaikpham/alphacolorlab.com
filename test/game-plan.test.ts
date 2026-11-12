import { test } from "node:test";
import assert from "node:assert";
import { planMission, planYield, yieldTargets } from "../lib/game/plan.ts";
import { allowsControl, prerequisitesMet } from "../lib/game/rules.ts";
import { catalogRows, statusRows } from "../lib/decode/status.ts";
import { modelSummary } from "../lib/decode/matrix.ts";
import { getCatalog } from "../lib/game/catalog.ts";
import type { GameModel, SlotStep } from "../lib/game/types.ts";

const MODELS: GameModel[] = ["zve10", "a6400", "a7c2"];
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const MANY = Array.from({ length: 200 }, (_, i) => i + 1);

// Bước hợp lệ với các bước khác trong ô: luật điều khiển và điều kiện cần
function stepValid(step: SlotStep, steps: SlotStep[]): boolean {
  const others = new Map(steps.filter((s) => s !== step).map((s) => [s.settingId, s.valueId] as const));
  return allowsControl(step.settingId, step.valueId, others) && prerequisitesMet(step.settingId, step.valueId, others);
}

// Số lượt để mọi giá trị đã xác nhận, giả định mọi mục tiêu thành công (cùng quy tắc với matrix.ts)
function exhaustionRound(m: GameModel): number {
  const state = { values: [] as { model: GameModel; settingId: string; valueId: string }[], located: [] as { model: GameModel; settingId: string }[] };
  for (let round = 1; round <= 12; round++) {
    const remaining = catalogRows(m, state).flatMap((r) => r.cells).filter((c) => c.status !== "confirmed").length;
    if (remaining === 0) return round - 1;
    const hits = yieldTargets(planMission(m, { seed: round, local: state }), state);
    if (hits.length === 0) return 12;
    for (const t of hits) {
      state.values.push({ model: m, settingId: t.settingId, valueId: t.valueId });
      state.located.push({ model: m, settingId: t.settingId });
    }
  }
  return 12;
}

test("planMission giống nhau khi cùng seed và cùng trạng thái", () => {
  for (const m of MODELS) {
    for (const seed of SEEDS) {
      assert.deepStrictEqual(planMission(m, { seed }), planMission(m, { seed }), `${m}/${seed}`);
    }
  }
});

test("cấu trúc: 4 ô, id theo model và seed, createdAt mặc định 0", () => {
  const mission = planMission("a7c2", { seed: 3 });
  assert.strictEqual(mission.id, "plan_a7c2_3");
  assert.strictEqual(mission.model, "a7c2");
  assert.strictEqual(mission.seed, 3);
  assert.strictEqual(mission.createdAt, 0);
  assert.deepStrictEqual(mission.slots.map((s) => s.slot), [1, 2, 3, 4]);
});

test("mỗi ô: tối đa 3 mục tiêu, tối đa một mục chưa định vị (ô 1 cũng vậy), không cài đặt trùng trong ô", () => {
  for (const m of MODELS) {
    const located = new Map(statusRows(m).map((r) => [r.settingId, r.located] as const));
    for (const seed of MANY) {
      for (const slot of planMission(m, { seed }).slots) {
        const targets = slot.steps.filter((s) => s.role === "target");
        const unlocated = slot.steps.filter((s) => !located.get(s.settingId));
        assert.ok(targets.length <= 3, `${m}/${seed} ô ${slot.slot} có ${targets.length} mục tiêu`);
        assert.ok(unlocated.length <= 1, `${m}/${seed} ô ${slot.slot} có ${unlocated.length} bước chưa định vị`);
        const names = slot.steps.map((s) => s.settingId);
        assert.strictEqual(new Set(names).size, names.length, `${m}/${seed} ô ${slot.slot} trùng cài đặt`);
      }
    }
  }
});

test("mỗi cặp (cài đặt, giá trị) làm mục tiêu nhiều nhất một lần trong lượt", () => {
  for (const m of MODELS) {
    for (const seed of MANY) {
      const targets = planMission(m, { seed }).slots.flatMap((s) => s.steps.filter((x) => x.role === "target").map((x) => `${x.settingId}|${x.valueId}`));
      assert.strictEqual(new Set(targets).size, targets.length, `${m}/${seed}`);
    }
  }
});

test("điều khiển chỉ lấy từ giá trị đã xác nhận và đã định vị, không dùng steady-shot", () => {
  for (const m of MODELS) {
    const rows = statusRows(m);
    const confirmed = new Set(rows.filter((r) => r.located).flatMap((r) => r.cells.filter((c) => c.status === "confirmed").map((c) => `${r.settingId}|${c.valueId}`)));
    for (const seed of SEEDS) {
      for (const slot of planMission(m, { seed }).slots) {
        for (const s of slot.steps.filter((x) => x.role === "control")) {
          assert.ok(confirmed.has(`${s.settingId}|${s.valueId}`), `${m}/${seed} ô ${slot.slot} ${s.settingId}=${s.valueId}`);
          assert.notStrictEqual(s.settingId, "steady-shot");
        }
      }
    }
  }
});

test("luật điều khiển và điều kiện cần đúng cho mọi bước trong mọi ô (200 seed mỗi máy)", () => {
  for (const m of MODELS) {
    for (const seed of MANY) {
      for (const slot of planMission(m, { seed }).slots) {
        for (const step of slot.steps) {
          assert.ok(stepValid(step, slot.steps), `${m}/${seed} ô ${slot.slot} ${step.settingId}=${step.valueId}`);
        }
      }
    }
  }
});

test("focus được ưu tiên: mục tiêu đầu tiên của ô 1 thuộc cài đặt focus", () => {
  const rows = statusRows("a7c2");
  const focusRow = rows.find((r) => r.located && r.cells.some((c) => c.status === "predicted"));
  assert.ok(focusRow, "cần một cài đặt đã định vị có giá trị predicted");
  const mission = planMission("a7c2", { seed: 5, focus: [focusRow.settingId] });
  const first = mission.slots[0].steps.find((s) => s.role === "target");
  assert.strictEqual(first?.settingId, focusRow.settingId);
});

test("planYield: đối tượng khớp yieldTargets (learn + confirm), locate là số cài đặt học được, steps là tổng bước", () => {
  for (const m of MODELS) {
    for (const seed of SEEDS) {
      const mission = planMission(m, { seed });
      const hits = yieldTargets(mission);
      const y = planYield(mission);
      const learns = hits.filter((h) => h.kind === "learn");
      assert.strictEqual(y.learn, learns.length, `${m}/${seed} learn`);
      assert.strictEqual(y.confirm, hits.length - learns.length, `${m}/${seed} confirm`);
      assert.strictEqual(y.locate, new Set(learns.map((h) => h.settingId)).size, `${m}/${seed} locate`);
      assert.strictEqual(y.steps, mission.slots.reduce((n, s) => n + s.steps.length, 0), `${m}/${seed} steps`);
    }
  }
});

test("mỗi cài đặt có ít nhất bốn giá trị chưa xác nhận thì ô 1–4 thử bốn giá trị khác nhau (đã định vị)", () => {
  for (const m of MODELS) {
    const rows = catalogRows(m);
    const wide = rows.filter((r) => r.located && r.cells.filter((c) => c.status !== "confirmed").length >= 4);
    for (const seed of MANY) {
      const mission = planMission(m, { seed });
      for (const r of wide) {
        const tried = new Set(mission.slots.flatMap((s) => s.steps.filter((x) => x.role === "target" && x.settingId === r.settingId).map((x) => x.valueId)));
        assert.ok(tried.size >= 4, `${m}/${seed} ${r.settingId} thử ${tried.size}`);
      }
    }
  }
});

test("ô có mục chưa xác nhận thì luôn có ít nhất một mục tiêu (planner, không dùng ô dự phòng)", () => {
  for (const m of MODELS) {
    for (const seed of MANY) {
      const mission = planMission(m, { seed });
      for (const slot of mission.slots) {
        const targets = slot.steps.filter((s) => s.role === "target");
        assert.ok(targets.length >= 1, `${m}/${seed} ô ${slot.slot} không có mục tiêu`);
      }
    }
  }
});

test("roundsLeft của matrix bằng số lượt mô phỏng để hết giá trị chưa xác nhận", () => {
  for (const m of MODELS) {
    assert.strictEqual(modelSummary(m).roundsLeft, exhaustionRound(m), m);
  }
});

test("catalog: mỗi bước dùng cài đặt và giá trị có trong danh mục", () => {
  for (const m of MODELS) {
    const cat = getCatalog()[m].settings;
    for (const slot of planMission(m, { seed: 4 }).slots) {
      for (const s of slot.steps) {
        const setting = cat.find((x) => x.id === s.settingId);
        assert.ok(setting, `${m} ${s.settingId}`);
        assert.ok(setting.values.some((v) => v.id === s.valueId), `${m} ${s.settingId}=${s.valueId}`);
      }
    }
  }
});

test("yieldTargets chỉ đếm confirm (predicted hoặc pending) và learn (unknown ở ô 2–4)", () => {
  for (const m of MODELS) {
    const rows = statusRows(m);
    for (const seed of SEEDS) {
      const mission = planMission(m, { seed });
      for (const h of yieldTargets(mission)) {
        const st = rows.find((r) => r.settingId === h.settingId)?.cells.find((c) => c.valueId === h.valueId)?.status;
        if (h.kind === "confirm") assert.ok(st === "predicted" || st === "pending", `${m} ${h.settingId}=${h.valueId} ${st}`);
        else assert.strictEqual(st, "unknown", `${m} ${h.settingId}=${h.valueId} ${st}`);
      }
    }
  }
});
