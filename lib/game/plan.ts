/**
 * Lập lượt chơi (4 ô) từ trạng thái giá trị (status.ts). Chỉ dùng hàng và ô trong danh mục (inCatalog).
 * Mục tiêu là mọi giá trị chưa xác nhận: pending (đã định vị, chưa có mã), predicted (đã có mã, chưa thấy), unknown (chưa định vị).
 * Thứ tự ưu tiên: mục focus trước; đã định vị thì cài đặt còn cần nhiều lần đặt nhất (để đủ min(4, số chưa xác nhận) giá trị
 * khác nhau trong 4 ô), rồi nhiều giá trị còn lại, rồi pending trước predicted; chưa định vị thì cài đặt ít giá trị còn lại trước;
 * cuối cùng là seed.
 * Ràng buộc: tối đa maxTargetsPerSlot mục tiêu mỗi ô (đã tính mục chưa định vị); mỗi cài đặt một lần trong một ô;
 * mỗi cặp (cài đặt, giá trị) một lần trong lượt; tối đa một mục chưa định vị mỗi ô (nên mỗi lần đổi giữa hai ô chỉ có
 * tối đa một cài đặt chưa biết vị trí đổi); ô 1 có thể có mục chưa định vị làm mục nền.
 * Điều khiển: tối đa hai giá trị đã xác nhận và đã định vị ngẫu nhiên mỗi ô, cộng điều kiện cần của mục tiêu (ít hơn nếu không đủ).
 * Mọi bước qua allowsControl và prerequisites. Thiếu điều kiện cần: thêm điều khiển đáp ứng khi đặt mục tiêu, không có thì không đặt mục tiêu đó.
 * Khi ô không lập được mục tiêu nào: lấy ô tương ứng của generateMission (ô dự phòng).
 * Cùng seed và cùng trạng thái thì cùng kết quả.
 */
import type { GameModel, Mission, SlotStep, SlotTask } from "./types.ts";
import { getCatalog } from "./catalog.ts";
import { generateMission, mulberry32 } from "./mission.ts";
import { allowsControl, prerequisitesMet } from "./rules.ts";
import type { Target } from "./rules.ts";
import { catalogRows } from "../decode/status.ts";
import type { LocalFindings, ValueStatus } from "../decode/status.ts";

export type PlanOptions = {
  seed?: number; // mặc định 1
  local?: LocalFindings;
  focus?: readonly string[]; // settingId được ưu tiên làm mục tiêu
  maxTargetsPerSlot?: number; // mặc định 3
  createdAt?: number; // mặc định 0 để kết quả giữ nguyên giữa các lần chạy
};

export type PlanYield = { learn: number; confirm: number; locate: number; steps: number };

export type YieldHit = Target & { kind: "confirm" | "learn" };

// need: số lần còn cần đặt để đủ min(4, số chưa xác nhận) giá trị khác nhau trong 4 ô; left: số chưa xác nhận chưa đặt trong lượt (tính lại mỗi ô)
type Candidate = Target & { located: boolean; focus: boolean; untested: number; need: number; left: number; status: ValueStatus; tie: number };

const RANK: Record<ValueStatus, number> = { pending: 0, predicted: 1, unknown: 2, confirmed: 3 };
const key = (t: Target) => `${t.settingId}|${t.valueId}`;
const plain = (t: Target): Target => ({ settingId: t.settingId, valueId: t.valueId });

// Bước hợp lệ với các bước khác trong ô: luật điều khiển và điều kiện cần
function stepOk(step: Target, others: readonly Target[]): boolean {
  const p = new Map(others.map((x) => [x.settingId, x.valueId] as const));
  return allowsControl(step.settingId, step.valueId, p) && prerequisitesMet(step.settingId, step.valueId, p);
}

// Mọi bước trong tập đều hợp lệ với các bước còn lại (mỗi cài đặt một bước)
const valid = (set: readonly Target[]): boolean =>
  set.every((s) => stepOk(s, set.filter((x) => x.settingId !== s.settingId)));

// Thứ tự chọn: focus trước; đã định vị thì cài đặt có từ 4 giá trị chưa xác nhận trước, rồi cài đặt còn cần nhiều lần đặt nhất,
// rồi nhiều giá trị còn lại trước; chưa định vị thì ít giá trị còn lại trước; rồi pending trước predicted; cuối cùng là seed
function better(a: Candidate, b: Candidate): number {
  if (a.focus !== b.focus) return a.focus ? -1 : 1;
  if (a.located) {
    if ((a.untested >= 4) !== (b.untested >= 4)) return a.untested >= 4 ? -1 : 1;
    if (a.need !== b.need) return b.need - a.need;
    if (a.left !== b.left) return b.left - a.left;
  } else if (a.left !== b.left) return a.left - b.left;
  if (RANK[a.status] !== RANK[b.status]) return RANK[a.status] - RANK[b.status];
  return a.tie - b.tie;
}

export function planMission(model: GameModel, opts: PlanOptions = {}): Mission {
  const seed = opts.seed ?? 1;
  const rng = mulberry32(seed);
  const maxTargets = opts.maxTargetsPerSlot ?? 3;
  const focus = new Set(opts.focus ?? []);
  const rows = catalogRows(model, opts.local);
  const catalogIndex = (settingId: string) => getCatalog()[model].settings.findIndex((s) => s.id === settingId);

  const located: Candidate[] = [];
  const unlocated: Candidate[] = [];
  const controlPool: Target[] = [];
  for (const r of rows) {
    const untested = r.cells.filter((c) => c.status !== "confirmed").length;
    for (const c of r.cells) {
      if (c.status === "confirmed") {
        if (r.located && r.settingId !== "steady-shot") controlPool.push({ settingId: r.settingId, valueId: c.valueId });
        continue;
      }
      const cand: Candidate = {
        settingId: r.settingId,
        valueId: c.valueId,
        located: r.located,
        focus: focus.has(r.settingId),
        untested,
        need: 0,
        left: untested,
        status: c.status,
        tie: rng(),
      };
      (r.located ? located : unlocated).push(cand);
    }
  }

  const usedValues = new Set<string>();
  const usedBy = new Map<string, number>(); // số giá trị đã đặt của mỗi cài đặt trong lượt
  const markUsed = (t: Target) => {
    usedValues.add(key(t));
    usedBy.set(t.settingId, (usedBy.get(t.settingId) ?? 0) + 1);
  };
  const slots: SlotTask[] = [];
  let fallback: Mission["slots"] | null = null;

  for (let slot = 1; slot <= 4; slot++) {
    for (const c of [...located, ...unlocated]) {
      const used = usedBy.get(c.settingId) ?? 0;
      c.need = Math.min(4, c.untested) - used;
      c.left = c.untested - used;
    }
    located.sort(better);
    unlocated.sort(better);

    const targets: Target[] = [];
    const controls: Target[] = [];
    const free = (c: Target) =>
      !usedValues.has(key(c)) && !targets.some((t) => t.settingId === c.settingId) && !controls.some((t) => t.settingId === c.settingId);

    // Đặt mục tiêu c nếu hợp lệ. Chưa hợp lệ (điều kiện cần hoặc luật điều khiển) thì thêm đúng một điều khiển từ pool
    // làm cho đủ (chọn theo seed); không có điều khiển nào thì không đặt
    const place = (c: Target): boolean => {
      if (!free(c)) return false;
      const added: Target[] = [];
      if (!valid([...targets, ...controls, c])) {
        const cands = controlPool.filter(
          (x) =>
            x.settingId !== c.settingId &&
            !targets.some((t) => t.settingId === x.settingId) &&
            !controls.some((t) => t.settingId === x.settingId) &&
            valid([...targets, ...controls, plain(x), c])
        );
        if (cands.length === 0) return false;
        added.push(plain(cands[Math.floor(rng() * cands.length)]));
      }
      targets.push(plain(c));
      controls.push(...added);
      return true;
    };

    // Mục focus đã định vị trước; rồi mục đã định vị đến khi đủ maxTargets; cuối cùng một mục chưa định vị nếu còn chỗ
    // (ưu tiên đã định vị: cài đặt cần nhiều lần thử không bị chiếm chỗ bởi mục chưa định vị).
    // Lặp đến khi không đặt thêm được, vì mục tiêu có điều kiện cần có thể chỉ đặt được sau mục tiêu khác trong ô
    for (const c of located) if (c.focus) place(c);
    for (let changed = true; changed && targets.length < maxTargets; ) {
      changed = false;
      for (const c of located) if (targets.length < maxTargets && place(c)) changed = true;
    }
    for (const c of unlocated) if (targets.length < maxTargets && place(c)) break;

    // Điều khiển: tối đa hai giá trị đã xác nhận và đã định vị, cài đặt chưa dùng trong ô, mọi bước hợp lệ
    for (let tries = 0; tries < 60 && controls.length < 2 && controlPool.length > 0; tries++) {
      const c = controlPool[Math.floor(rng() * controlPool.length)];
      if (controls.some((x) => x.settingId === c.settingId) || targets.some((t) => t.settingId === c.settingId)) continue;
      if (valid([...targets, ...controls, c])) controls.push(plain(c));
    }

    // Bỏ bước không còn hợp lệ với các bước khác trong ô (lặp đến khi ổn định)
    for (let changed = true; changed; ) {
      changed = false;
      for (const s of [...targets, ...controls]) {
        const all = [...targets, ...controls];
        if (stepOk(s, all.filter((x) => x.settingId !== s.settingId))) continue;
        const list = targets.includes(s) ? targets : controls;
        list.splice(list.indexOf(s), 1);
        changed = true;
      }
    }

    // Ô không lập được mục tiêu nào: ô tương ứng của generateMission (ô dự phòng)
    if (targets.length === 0) {
      fallback ??= generateMission(model, seed, undefined, opts.createdAt ?? 0).slots;
      const steps = fallback.find((s) => s.slot === slot)?.steps ?? [];
      for (const s of steps) if (s.role === "target") markUsed(s);
      slots.push({ slot: slot as 1 | 2 | 3 | 4, steps: steps.map((s) => ({ ...s })) });
      continue;
    }

    for (const t of targets) markUsed(t);
    const steps: SlotStep[] = controls
      .map((c): SlotStep => ({ settingId: c.settingId, valueId: c.valueId, role: "control" }))
      .sort((a, b) => catalogIndex(a.settingId) - catalogIndex(b.settingId));
    for (const t of targets) steps.push({ settingId: t.settingId, valueId: t.valueId, role: "target" });
    slots.push({ slot: slot as 1 | 2 | 3 | 4, steps });
  }

  return { id: `plan_${model}_${seed}`, model, seed, createdAt: opts.createdAt ?? 0, slots };
}

// Mục tiêu của lượt mà đọc file sau lượt sẽ xác nhận (confirm: predicted hoặc pending) hoặc học được (learn: unknown ở ô 2–4, khi ô đổi một cài đặt chưa định vị)
export function yieldTargets(mission: Mission, local?: LocalFindings): YieldHit[] {
  const rows = catalogRows(mission.model, local);
  const status = (settingId: string, valueId: string) =>
    rows.find((r) => r.settingId === settingId)?.cells.find((c) => c.valueId === valueId)?.status;
  const out: YieldHit[] = [];
  for (const slot of mission.slots) {
    for (const t of slot.steps.filter((s) => s.role === "target")) {
      const st = status(t.settingId, t.valueId);
      if (st === "predicted" || st === "pending") out.push({ settingId: t.settingId, valueId: t.valueId, kind: "confirm" });
      else if (st === "unknown" && slot.slot >= 2) out.push({ settingId: t.settingId, valueId: t.valueId, kind: "learn" });
    }
  }
  return out;
}

export function planYield(mission: Mission, local?: LocalFindings): PlanYield {
  const hits = yieldTargets(mission, local);
  const learns = hits.filter((h) => h.kind === "learn");
  return {
    learn: learns.length,
    confirm: hits.length - learns.length,
    locate: new Set(learns.map((h) => h.settingId)).size,
    steps: mission.slots.reduce((n, s) => n + s.steps.length, 0),
  };
}
