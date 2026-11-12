import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { analyzeRound, localFindings, mergeLocal } from "../lib/game/analyze.ts";
import type { Finding } from "../lib/game/analyze.ts";
import { planMission } from "../lib/game/plan.ts";
import { getCatalog } from "../lib/game/catalog.ts";
import type { GameModel, Mission, SlotStep, SlotTask } from "../lib/game/types.ts";
import { adaptersFor } from "../lib/decode/adapters.ts";
import type { SettingAdapter } from "../lib/decode/adapters.ts";
import type { LocalFindings } from "../lib/decode/status.ts";
import { diffA7c2, parseA7c2 } from "../lib/a7c2/dat.ts";

const load = (path: string) => new Uint8Array(readFileSync(path));

// Adapter giả đọc một byte tại offset theo bảng mã (codes). Byte không có trong bảng: valueId null, raw là byte đó.
// Cài đặt chưa định vị: read trả null và không sở hữu byte nào (như adapter thật).
function byteAdapter(settingId: string, offset: number, codes: Record<string, number>, located = true): SettingAdapter {
  const values = Object.keys(codes);
  return {
    settingId,
    located,
    where: located ? `test-${settingId}` : null,
    owns: located ? [offset] : [],
    inCatalog: true,
    codecValues: values,
    staticConfirmed: [],
    read: (b) => {
      if (!located || b.length <= offset) return null;
      const raw = b[offset];
      return { valueId: values.find((v) => codes[v] === raw) ?? null, raw };
    },
    codeOf: (v) => codes[v] ?? null,
  };
}

const seen = byteAdapter("seen", 0x50, { on: 1, off: 2 });
const pend = byteAdapter("pend", 0x60, { off: 2 }); // "on" chưa có mã: codeOf("on") là null
const ctl = byteAdapter("ctl", 0x70, { a: 1, b: 2 });
const hidden = byteAdapter("hidden", 0x80, { on: 1, off: 2 }, false);
const hidden2 = byteAdapter("hidden2", 0x90, { on: 1, off: 2 }, false);
const ADAPTERS = [seen, pend, ctl, hidden, hidden2];

const file = (fill: Record<number, number>): Uint8Array => {
  const b = new Uint8Array(4608);
  for (const [o, v] of Object.entries(fill)) b[Number(o)] = v;
  return b;
};

const step = (settingId: string, valueId: string, role: "control" | "target"): SlotStep => ({ settingId, valueId, role });
const missionOf = (slots: SlotTask[], model: GameModel = "zve10"): Mission => ({ id: "t", model, seed: 1, createdAt: 0, slots });

test("a) confirm: cài đặt đã định vị, file đúng giá trị đề bài", () => {
  const m = missionOf([{ slot: 1, steps: [step("seen", "on", "control")] }]);
  const findings = analyzeRound(m, [{ slot: 1, bytes: file({ 0x50: 1 }) }], undefined, ADAPTERS);
  assert.deepStrictEqual(findings, [{ kind: "confirm", model: "zve10", slot: 1, settingId: "seen", valueId: "on", isNew: true }]);
});

test("b) mismatch: cài đặt đã định vị, file có giá trị khác đề bài", () => {
  const m = missionOf([{ slot: 1, steps: [step("seen", "on", "control")] }]);
  const findings = analyzeRound(m, [{ slot: 1, bytes: file({ 0x50: 2 }) }], undefined, ADAPTERS);
  assert.deepStrictEqual(findings, [{ kind: "mismatch", model: "zve10", slot: 1, settingId: "seen", valueId: "on", actual: "off", raw: 2 }]);
});

test("c) code: cài đặt đã định vị, codeOf không có mã cho giá trị đề bài, file có một mã mới", () => {
  const m = missionOf([{ slot: 1, steps: [step("pend", "on", "target")] }]);
  const findings = analyzeRound(m, [{ slot: 1, bytes: file({ 0x60: 3 }) }], undefined, ADAPTERS);
  assert.deepStrictEqual(findings, [{ kind: "code", model: "zve10", slot: 1, settingId: "pend", valueId: "on", raw: 3, where: "test-pend" }]);
});

// (i) Hai điều khiển, một mục tiêu đã định vị, một mục tiêu chưa định vị: chỉ byte của mục chưa định vị đổi được quy cho nó
test("d) locate: 2 điều khiển + 1 mục tiêu đã định vị + 1 mục tiêu chưa định vị; byte của cài đặt đã định vị bị bỏ", () => {
  const m = missionOf([
    { slot: 1, steps: [step("seen", "on", "control"), step("ctl", "a", "control")] },
    { slot: 2, steps: [step("seen", "on", "control"), step("ctl", "a", "control"), step("pend", "off", "target"), step("hidden", "on", "target")] },
  ]);
  const findings = analyzeRound(
    m,
    [
      { slot: 1, bytes: file({ 0x50: 1, 0x60: 2, 0x70: 1 }) },
      { slot: 2, bytes: file({ 0x50: 1, 0x60: 2, 0x70: 1, 0x80: 1 }) },
    ],
    undefined,
    ADAPTERS
  );
  const confirm = (slot: number, settingId: string, valueId: string): Finding => ({ kind: "confirm", model: "zve10", slot, settingId, valueId, isNew: true });
  assert.deepStrictEqual(findings, [
    confirm(1, "seen", "on"),
    confirm(1, "ctl", "a"),
    confirm(2, "seen", "on"),
    confirm(2, "ctl", "a"),
    confirm(2, "pend", "off"),
    { kind: "locate", model: "zve10", slot: 2, settingId: "hidden", valueId: "on", fromValueId: null, candidates: [{ where: "0x0080", from: 0, to: 1 }] },
  ]);
});

test("e) ambiguous: nhiều cài đặt chưa định vị cùng đổi trong ô; không có cài đặt chưa định vị đổi thì không có phát hiện", () => {
  const two = missionOf([
    { slot: 1, steps: [step("seen", "on", "control")] },
    { slot: 2, steps: [step("seen", "on", "control"), step("hidden", "on", "target"), step("hidden2", "on", "target")] },
  ]);
  const findings = analyzeRound(two, [{ slot: 1, bytes: file({ 0x50: 1 }) }, { slot: 2, bytes: file({ 0x50: 1, 0x80: 1, 0x90: 1 }) }], undefined, ADAPTERS);
  assert.deepStrictEqual(findings.filter((f) => f.kind === "ambiguous" || f.kind === "locate"), [
    {
      kind: "ambiguous",
      model: "zve10",
      slot: 2,
      settingIds: ["hidden", "hidden2"],
      candidates: [
        { where: "0x0080", from: 0, to: 1 },
        { where: "0x0090", from: 0, to: 1 },
      ],
    },
  ]);

  const none = missionOf([
    { slot: 1, steps: [step("seen", "on", "control")] },
    { slot: 2, steps: [step("seen", "on", "control")] },
  ]);
  const quiet = analyzeRound(none, [{ slot: 1, bytes: file({ 0x50: 1 }) }, { slot: 2, bytes: file({ 0x50: 1, 0x80: 1 }) }], undefined, ADAPTERS);
  assert.ok(!quiet.some((f) => f.kind === "locate" || f.kind === "ambiguous"));
});

test("f) before: ô 1 so với file trước lượt (cài đặt chưa định vị)", () => {
  const m = missionOf([{ slot: 1, steps: [step("hidden", "on", "target")] }]);
  const findings = analyzeRound(m, [{ slot: 1, bytes: file({ 0x80: 1 }) }], [{ slot: 1, bytes: file({}) }], ADAPTERS);
  assert.deepStrictEqual(findings, [
    { kind: "locate", model: "zve10", slot: 1, settingId: "hidden", valueId: "on", fromValueId: null, candidates: [{ where: "0x0080", from: 0, to: 1 }] },
  ]);
});

// (iii) A7C II trên file máy thật: run2 03P → 04P chỉ đổi bản ghi của wb. wb bị ép thành chưa định vị:
// ứng viên locate phải đúng bằng các bản ghi của wb đã đổi, không thiếu, không thừa
test("A7C II: cài đặt chưa định vị đổi trên file máy thật, ứng viên là đúng các bản ghi của cài đặt đó", () => {
  const prev = load("test/fixtures/a7c2/run2/CAMPR03P.DAT");
  const cur = load("test/fixtures/a7c2/run2/CAMPR04P.DAT");
  const real = adaptersFor("a7c2");
  const wb = real.find((a) => a.settingId === "wb")!;
  const adapters = real.map((a) => (a.settingId === "wb" ? { ...a, located: false } : a));
  const value = getCatalog().a7c2.settings.find((s) => s.id === "wb")!.values[0].id;
  const m = missionOf([{ slot: 1, steps: [] }, { slot: 2, steps: [step("wb", value, "target")] }], "a7c2");

  const changed = diffA7c2(parseA7c2(prev), parseA7c2(cur));
  const own = changed.filter((id) => wb.owns.includes(id));
  assert.ok(own.length > 0, "run2 03P→04P phải đổi bản ghi của wb");
  assert.strictEqual(own.length, changed.length, "mọi bản ghi đổi phải thuộc wb");

  const findings = analyzeRound(m, [{ slot: 1, bytes: prev }, { slot: 2, bytes: cur }], undefined, adapters);
  const fmt = (id: number) => `ID 0x${id.toString(16).toUpperCase().padStart(4, "0")}`;
  assert.strictEqual(findings.length, 1);
  const f = findings[0];
  if (f.kind !== "locate") throw new Error(`cần locate, được ${f.kind}`);
  assert.strictEqual(f.settingId, "wb");
  assert.strictEqual(f.fromValueId, null);
  assert.deepStrictEqual(f.candidates.map((c) => c.where), own.map(fmt));
});

test("không ném lỗi với đầu vào hỏng và trả về danh sách rỗng", () => {
  const base = missionOf([{ slot: 1, steps: [step("seen", "on", "control")] }]);
  assert.deepStrictEqual(analyzeRound(undefined as unknown as Mission, [], undefined, ADAPTERS), []);
  assert.deepStrictEqual(analyzeRound({ ...base, slots: undefined } as unknown as Mission, [], undefined, ADAPTERS), []);
  const junk = [{ slot: 1, bytes: "không phải byte" as unknown as Uint8Array }, null as unknown as { slot: number; bytes: Uint8Array }];
  assert.deepStrictEqual(analyzeRound(base, junk, undefined, ADAPTERS), []);
  assert.deepStrictEqual(analyzeRound(base, [{ slot: 1, bytes: new Uint8Array(3) }], undefined, ADAPTERS), []);
  for (const m of ["zve10", "a6400", "a7c2"] as const) {
    const findings = analyzeRound(planMission(m, { seed: 1 }), [{ slot: 1, bytes: new Uint8Array(3) }]);
    assert.ok(Array.isArray(findings), m);
    assert.ok(!findings.some((f) => f.kind === "confirm"), m);
  }
});

test("mặc định dùng adapter của máy: file rỗng không sinh confirm", () => {
  const p = planMission("a7c2", { seed: 2 });
  const findings = analyzeRound(p, [{ slot: 1, bytes: new Uint8Array(4608) }]);
  assert.ok(!findings.some((f) => f.kind === "confirm"));
});

test("localFindings: confirm và code thành values; locate thành located và values (cả giá trị lượt trước); mismatch và ambiguous bỏ qua", () => {
  const findings: Finding[] = [
    { kind: "confirm", model: "zve10", slot: 1, settingId: "seen", valueId: "on", isNew: true },
    { kind: "code", model: "zve10", slot: 1, settingId: "pend", valueId: "on", raw: 3, where: "test-pend" },
    { kind: "locate", model: "zve10", slot: 2, settingId: "hidden", valueId: "on", fromValueId: "off", candidates: [] },
    { kind: "locate", model: "zve10", slot: 2, settingId: "hidden2", valueId: "on", fromValueId: null, candidates: [] },
    { kind: "mismatch", model: "zve10", slot: 1, settingId: "seen", valueId: "on", actual: "off", raw: 2 },
    { kind: "ambiguous", model: "zve10", slot: 2, settingIds: ["x", "y"], candidates: [] },
  ];
  assert.deepStrictEqual(localFindings(findings), {
    values: [
      { model: "zve10", settingId: "seen", valueId: "on" },
      { model: "zve10", settingId: "pend", valueId: "on" },
      { model: "zve10", settingId: "hidden", valueId: "on" },
      { model: "zve10", settingId: "hidden", valueId: "off" },
      { model: "zve10", settingId: "hidden2", valueId: "on" },
    ],
    located: [
      { model: "zve10", settingId: "hidden" },
      { model: "zve10", settingId: "hidden2" },
    ],
  });
});

test("mergeLocal: hợp hai LocalFindings, bỏ trùng theo model + cài đặt + giá trị (hoặc model + cài đặt)", () => {
  const a: LocalFindings = {
    values: [{ model: "zve10", settingId: "seen", valueId: "on" }],
    located: [{ model: "zve10", settingId: "seen" }],
  };
  const b: LocalFindings = {
    values: [
      { model: "zve10", settingId: "seen", valueId: "on" },
      { model: "a6400", settingId: "wb", valueId: "auto" },
    ],
    located: [{ model: "zve10", settingId: "seen" }],
  };
  const merged = mergeLocal(a, b);
  assert.deepStrictEqual(merged.values, [
    { model: "zve10", settingId: "seen", valueId: "on" },
    { model: "a6400", settingId: "wb", valueId: "auto" },
  ]);
  assert.deepStrictEqual(merged.located, [{ model: "zve10", settingId: "seen" }]);
});
