import type { GameModel, Mission, SlotTask, SlotStep } from "./types.ts";
import { getCatalog } from "./catalog.ts";
import { allowsControl, baselineSkips, baselineValues, BASELINE_ORDER } from "./rules.ts";
import type { BaselineContext } from "./rules.ts";

// Mulberry32 PRNG: seeded, deterministic
export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateMission(
  model: GameModel,
  seed: number = Date.now(),
  counts?: Record<string, number>,
  createdAt: number = Date.now()
): Mission {
  const rng = mulberry32(seed);
  const catalog = getCatalog();
  const modelCat = catalog[model];
  const slots: SlotTask[] = [];

  const isZVE10 = model === "zve10";

  // For ZV-E10: targets from decoded:false, controls from decoded:true
  // For A6400: targets from all settings
  const targetSettingIds = isZVE10
    ? modelCat.settings.filter(s => !s.decoded).map(s => s.id)
    : modelCat.settings.map(s => s.id);

  // Collect all possible (setting, value) targets from target settings only
  const allTargets: Array<{ settingId: string; valueId: string }> = [];
  for (const settingId of targetSettingIds) {
    const setting = modelCat.settings.find(s => s.id === settingId);
    if (setting) {
      for (const value of setting.values) {
        allTargets.push({ settingId, valueId: value.id });
      }
    }
  }

  // Pick 4 distinct targets from different settings, preferring rarer ones
  const targets: Array<{ settingId: string; valueId: string }> = [];
  const usedSettingIds = new Set<string>();
  const usedTargetIndices = new Set<number>();

  for (let i = 0; i < 4; i++) {
    let best = -1;
    let bestScore = -Infinity;

    for (let j = 0; j < allTargets.length; j++) {
      if (usedTargetIndices.has(j)) continue;
      if (usedSettingIds.has(allTargets[j].settingId)) continue; // Different setting per target

      const target = allTargets[j];
      const key = `${target.settingId}:${target.valueId}`;
      const count = counts?.[key] ?? 0;
      const score = -count + rng();
      if (score > bestScore) {
        bestScore = score;
        best = j;
      }
    }

    if (best >= 0) {
      usedTargetIndices.add(best);
      usedSettingIds.add(allTargets[best].settingId);
      targets.push(allTargets[best]);
    }
  }

  // Ensure exactly 4 targets
  while (targets.length < 4) {
    const j = Math.floor(rng() * allTargets.length);
    if (!usedTargetIndices.has(j) && !usedSettingIds.has(allTargets[j].settingId)) {
      usedTargetIndices.add(j);
      usedSettingIds.add(allTargets[j].settingId);
      targets.push(allTargets[j]);
    }
  }

  // Generate slots
  for (let slot = 1; slot <= 4; slot++) {
    const slotTarget = targets[slot - 1];
    const steps: SlotStep[] = [];

    if (isZVE10) {
      // ZV-E10: 2–3 distinct control steps from decoded settings, never including the target
      // Note: steady-shot is excluded from controls (only selectable with OSS lenses), but may still be a target
      const decodedSettings = modelCat.settings.filter(s => s.decoded && s.id !== slotTarget.settingId && s.id !== "steady-shot");
      const numControls = 2 + Math.floor(rng() * 2);
      const usedControlSettings = new Set<string>();

      let controlsAdded = 0;
      while (controlsAdded < numControls && decodedSettings.length > 0) {
        const setting = decodedSettings[Math.floor(rng() * decodedSettings.length)];
        if (usedControlSettings.has(setting.id)) continue;

        // Pick a value
        let value = setting.values[Math.floor(rng() * setting.values.length)];

        // Enforce dependencies (rules.ts)
        const pendingSteps = new Map<string, string>();
        for (const step of steps) {
          pendingSteps.set(step.settingId, step.valueId);
        }

        if (!allowsControl(setting.id, value.id, pendingSteps)) continue;

        usedControlSettings.add(setting.id);
        steps.push({
          settingId: setting.id,
          valueId: value.id,
          role: "control"
        });
        controlsAdded++;
      }
    } else {
      // Máy chưa giải mã (A6400, A7C II): ô 1 đặt giá trị nền, các ô sau giữ nguyên rồi đổi thêm mục tiêu.
      // Không đặt nền trùng mục tiêu ô 1; Vùng lấy nét cần chế độ AF (Theo dõi cần AF-C), máy làm mờ mục này khi đang MF;
      // Ưu tiên mặt (đa điểm) chỉ chọn được khi đo sáng là Đa điểm
      if (slot === 1) {
        const ctx: BaselineContext = {
          target: slotTarget,
          faceTarget: targets.some((t) => t.settingId === "facePriority"),
          mode: slotTarget.settingId === "focusMode" ? slotTarget.valueId : null,
        };
        for (const settingId of BASELINE_ORDER) {
          if (baselineSkips(settingId, slotTarget)) continue;
          const setting = modelCat.settings.find(s => s.id === settingId);
          if (!setting) continue;
          const values = baselineValues(settingId, setting.values, ctx);
          const value = values[Math.floor(rng() * values.length)];
          if (settingId === "focusMode") ctx.mode = value.id;
          steps.push({
            settingId,
            valueId: value.id,
            role: "control"
          });
        }
      }
    }

    // Add target step last (after sorting steps by catalog order)
    steps.sort((a, b) => {
      const aIdx = modelCat.settings.findIndex(s => s.id === a.settingId);
      const bIdx = modelCat.settings.findIndex(s => s.id === b.settingId);
      return aIdx - bIdx;
    });

    steps.push({
      settingId: slotTarget.settingId,
      valueId: slotTarget.valueId,
      role: "target"
    });

    slots.push({ slot: slot as 1 | 2 | 3 | 4, steps });
  }

  return {
    id: `mission_${seed}`,
    model,
    seed,
    createdAt,
    slots
  };
}
