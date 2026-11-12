/**
 * Phân tích một lượt chơi: so từng file đã lưu với đề bài và trả về danh sách phát hiện (Finding).
 * - confirm: cài đặt đã định vị, file có đúng giá trị đề bài (isNew: giá trị này chưa có trong dữ liệu tĩnh).
 * - code: cài đặt đã định vị nhưng chưa có mã; file có một mã (raw) mới cho đúng giá trị đề bài.
 * - mismatch: cài đặt đã định vị, file có giá trị khác đề bài.
 * - locate: đúng một cài đặt chưa định vị đổi giá trị trong ô; candidates là mọi byte (ZV-E10, α6400)
 *   hoặc bản ghi (A7C II) đổi trong ô, trừ phần đã thuộc cài đặt đã định vị. fromValueId là giá trị lượt trước (null nếu chưa có).
 * - ambiguous: nhiều cài đặt chưa định vị cùng đổi giá trị trong một ô, chưa quy được; settingIds là các cài đặt đó.
 * Ô đổi nhưng không có cài đặt chưa định vị nào đổi giá trị thì không sinh phát hiện.
 * Byte hoặc bản ghi mà cài đặt đã định vị chiếm bị bỏ trước khi quy cho cài đặt chưa định vị.
 * localFindings: confirm và code thành values; locate thành located cùng values (valueId và fromValueId nếu có).
 * Không ném lỗi: đầu vào hỏng thì bỏ qua phần đó. Adapter truyền vào để kiểm thử; mặc định là adapter của máy.
 */
import type { Finding, FindingChange, GameModel, Mission, RoundFile } from "../game/types.ts";
import { adaptersFor } from "../decode/adapters.ts";
import type { SettingAdapter } from "../decode/adapters.ts";
import { statusRows } from "../decode/status.ts";
import type { LocalFindings } from "../decode/status.ts";
import { parseA7c2, diffA7c2 } from "../a7c2/dat.ts";
import type { A7c2Dat } from "../a7c2/dat.ts";

export type { Finding, RoundFile };

// Vùng byte được so: thân file từ 0x40 đến 0x1000. Header 0x00–0x3F đổi mỗi lần lưu; 512 byte cuối (từ 0x1000) chưa giải mã trên α6400.
const BODY_FROM = 0x40;
const BODY_TO = 0x1000;

const hex = (n: number, width: number) => `0x${n.toString(16).toUpperCase().padStart(width, "0")}`;
const hexBytes = (v: Uint8Array | undefined): string => (v ? Array.from(v, (b) => b.toString(16).padStart(2, "0")).join(" ") : "");

function tryParse(bytes: Uint8Array): A7c2Dat | null {
  try {
    return parseA7c2(bytes);
  } catch {
    return null;
  }
}

// Các thay đổi giữa hai ô, bỏ phần đã thuộc cài đặt đã định vị (owned)
function changesBetween(model: GameModel, prev: Uint8Array, cur: Uint8Array, owned: ReadonlySet<number>): FindingChange[] {
  if (model === "a7c2") {
    const a = tryParse(prev);
    const b = tryParse(cur);
    if (!a || !b) return [];
    return diffA7c2(a, b)
      .filter((id) => !owned.has(id))
      .map((id) => ({
        where: `ID ${hex(id, 4)}`,
        from: hexBytes(a.records.find((r) => r.id === id)?.value) || null,
        to: hexBytes(b.records.find((r) => r.id === id)?.value),
      }));
  }
  const out: FindingChange[] = [];
  for (let o = BODY_FROM; o < Math.min(BODY_TO, prev.length, cur.length); o++) {
    if (owned.has(o) || prev[o] === cur[o]) continue;
    out.push({ where: hex(o, 4), from: prev[o], to: cur[o] });
  }
  return out;
}

// Giá trị của cài đặt ở lượt đi trước ô này (bước gần nhất trong đề bài, mọi vai trò); null nếu chưa có
function fromValueOf(mission: Mission, settingId: string, slot: number): string | null {
  let from: string | null = null;
  for (const task of mission.slots) {
    if (task.slot >= slot) break;
    for (const step of task.steps) if (step.settingId === settingId) from = step.valueId;
  }
  return from;
}

export function analyzeRound(
  mission: Mission,
  files: readonly RoundFile[],
  before?: readonly RoundFile[],
  adapters?: readonly SettingAdapter[]
): Finding[] {
  if (!mission || !Array.isArray(mission.slots)) return [];
  const model = mission.model;
  const list: readonly SettingAdapter[] = Array.isArray(adapters) ? adapters : adaptersFor(model);
  const fileList: readonly RoundFile[] = Array.isArray(files) ? files : [];
  const beforeList: readonly RoundFile[] = Array.isArray(before) ? before : [];
  const bySlot = new Map<number, Uint8Array>();
  for (const f of fileList) {
    if (f && f.bytes instanceof Uint8Array) bySlot.set(f.slot, f.bytes);
  }
  // Ảnh trước lượt là đáy so sánh của ô 1: mục đúng ô 1, rồi mục ô 0, rồi mục đầu tiên. Ô k>1 so với ô k-1.
  const beforeBySlot = new Map<number, Uint8Array>();
  for (const f of beforeList) {
    if (f && f.bytes instanceof Uint8Array) beforeBySlot.set(f.slot, f.bytes);
  }
  const beforeFirst = beforeList.find((f) => f && f.bytes instanceof Uint8Array)?.bytes;
  const beforeSlot1 = beforeBySlot.get(1) ?? beforeBySlot.get(0) ?? beforeFirst;

  const byId = new Map(list.map((a) => [a.settingId, a] as const));
  const owned = new Set(list.filter((a) => a.located).flatMap((a) => a.owns));
  const confirmedBefore = new Map(
    statusRows(model, {}, false).map((r) => [r.settingId, new Map(r.cells.map((c) => [c.valueId, c.status === "confirmed"] as const))] as const)
  );
  const isNew = (settingId: string, valueId: string) => !confirmedBefore.get(settingId)?.get(valueId);
  const out: Finding[] = [];

  for (const task of mission.slots) {
    const cur = bySlot.get(task.slot);
    if (!cur) continue;
    const prev = task.slot === 1 ? beforeSlot1 : bySlot.get(task.slot - 1);
    const base = { model, slot: task.slot };

    // Cài đặt đã định vị: so giá trị đọc được với đề bài
    for (const step of task.steps) {
      const a = byId.get(step.settingId);
      if (!a || !a.located) continue;
      const read = a.read(cur);
      if (!read) continue;
      const id = { ...base, settingId: step.settingId };
      const expectedCode = a.codeOf(step.valueId);
      if (read.valueId === step.valueId) {
        out.push({ kind: "confirm", ...id, valueId: step.valueId, isNew: isNew(step.settingId, step.valueId) });
      } else if (read.valueId === null && read.raw !== null) {
        if (read.raw === expectedCode) {
          out.push({ kind: "confirm", ...id, valueId: step.valueId, isNew: isNew(step.settingId, step.valueId) });
        } else if (expectedCode === null && !a.codecValues.some((v) => v !== step.valueId && a.codeOf(v) === read.raw)) {
          out.push({ kind: "code", ...id, valueId: step.valueId, raw: read.raw, where: a.where ?? "" });
        } else {
          out.push({ kind: "mismatch", ...id, valueId: step.valueId, actual: null, raw: read.raw });
        }
      } else if (read.valueId !== null) {
        out.push({ kind: "mismatch", ...id, valueId: step.valueId, actual: read.valueId, raw: read.raw });
      }
    }

    // Cài đặt chưa định vị đổi giá trị trong ô (so với lượt trước): ô trước là đáy so sánh;
    // mọi thay đổi ngoài vùng đã định vị quy cho cài đặt chưa định vị đổi giá trị đó
    if (!prev) continue;
    const changers = task.steps.filter((s) => {
      const a = byId.get(s.settingId);
      return !!a && !a.located && fromValueOf(mission, s.settingId, task.slot) !== s.valueId;
    });
    const changes = changesBetween(model, prev, cur, owned);
    if (changes.length === 0 || changers.length === 0) continue;
    if (changers.length === 1) {
      const s = changers[0];
      out.push({
        kind: "locate",
        ...base,
        settingId: s.settingId,
        valueId: s.valueId,
        fromValueId: fromValueOf(mission, s.settingId, task.slot),
        candidates: changes,
      });
    } else {
      out.push({ kind: "ambiguous", ...base, settingIds: changers.map((s) => s.settingId), candidates: changes });
    }
  }
  return out;
}

// Chuyển phát hiện thành LocalFindings để statusRows (và nhờ đó planner và số liệu) dùng ngay
export function localFindings(findings: readonly Finding[]): LocalFindings {
  const values: { model: GameModel; settingId: string; valueId: string }[] = [];
  const located: { model: GameModel; settingId: string }[] = [];
  for (const f of findings) {
    if (f.kind === "confirm" || f.kind === "code") {
      values.push({ model: f.model, settingId: f.settingId, valueId: f.valueId });
    } else if (f.kind === "locate") {
      located.push({ model: f.model, settingId: f.settingId });
      values.push({ model: f.model, settingId: f.settingId, valueId: f.valueId });
      if (f.fromValueId !== null) values.push({ model: f.model, settingId: f.settingId, valueId: f.fromValueId });
    }
  }
  return mergeLocal({ values, located }, { values: [], located: [] });
}

// Hợp của hai LocalFindings, bỏ trùng (model + settingId + valueId, hoặc model + settingId)
export function mergeLocal(a: LocalFindings, b: LocalFindings): LocalFindings {
  const values = new Map<string, { model: GameModel; settingId: string; valueId: string }>();
  for (const v of [...(a.values ?? []), ...(b.values ?? [])]) {
    values.set(`${v.model}|${v.settingId}|${v.valueId}`, { model: v.model, settingId: v.settingId, valueId: v.valueId });
  }
  const located = new Map<string, { model: GameModel; settingId: string }>();
  for (const l of [...(a.located ?? []), ...(b.located ?? [])]) {
    located.set(`${l.model}|${l.settingId}`, { model: l.model, settingId: l.settingId });
  }
  return { values: [...values.values()], located: [...located.values()] };
}
