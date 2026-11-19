/**
 * Quan sát từ file máy thật: giá trị nào đã thấy trong file do máy lưu (test/fixtures/camera-saved.json),
 * và phát hiện từ lượt giải mã trong test/fixtures/rounds/ (analyzeRound tạo ra).
 * scanObserved là hàm thuần: nhận byte đã đọc sẵn, không đụng ổ đĩa. lib/decode/scanFs.ts đọc file và ghi data/decode-observed.json.
 */
import type { Finding, DecodeModel, Mission, RoundFile } from "./types.ts";
import { analyzeRound } from "./analyze.ts";
import { adaptersFor } from "./adapters.ts";

export type CameraFile = { file: string; model: DecodeModel; bytes: Uint8Array };
export type RoundInput = { model: DecodeModel; missionId: string; mission: Mission; files: RoundFile[] };

// Phát hiện từ một lượt giải mã, kèm mã lượt
export type Candidate = Finding & { missionId: string };

type ValueMap = Record<string, Record<string, string[]>>; // settingId → khóa → các file

export type Observed = {
  version: 1;
  files: { file: string; model: DecodeModel; readable: boolean }[];
  // settingId → valueId → file đã đọc ra giá trị đó
  values: Record<DecodeModel, ValueMap>;
  // settingId → raw (khi valueId là null) → file
  raws: Record<DecodeModel, ValueMap>;
  candidates: Candidate[];
};

const MODELS: DecodeModel[] = ["zve10", "a6400", "a7c2"];

const byModel = (): Record<DecodeModel, ValueMap> => ({ zve10: {}, a6400: {}, a7c2: {} });

function addTo(map: ValueMap, settingId: string, key: string, file: string): void {
  const byKey = (map[settingId] ??= {});
  const files = (byKey[key] ??= []);
  if (!files.includes(file)) files.push(file);
}

function sortMap(map: ValueMap): ValueMap {
  const out: ValueMap = {};
  for (const s of Object.keys(map).sort()) {
    out[s] = {};
    for (const k of Object.keys(map[s]).sort()) out[s][k] = [...map[s][k]].sort();
  }
  return out;
}

export function scanObserved(files: CameraFile[], rounds: RoundInput[] = []): Observed {
  const values = byModel();
  const raws = byModel();
  const list: Observed["files"] = [];

  for (const f of [...files].sort((x, y) => (x.file < y.file ? -1 : x.file > y.file ? 1 : 0))) {
    let readable = false;
    for (const a of adaptersFor(f.model)) {
      const r = a.read(f.bytes);
      if (!r) continue;
      readable = true;
      if (r.valueId !== null) addTo(values[f.model], a.settingId, r.valueId, f.file);
      else if (r.raw !== null) addTo(raws[f.model], a.settingId, String(r.raw), f.file);
    }
    list.push({ file: f.file, model: f.model, readable });
  }

  const keyed = rounds
    .flatMap((r) => analyzeRound(r.mission, r.files).map((f): Candidate => ({ ...f, missionId: r.missionId })))
    .map((c) => ({ c, key: stableJson(c, 0) }));
  const candidates = keyed.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0)).map((k) => k.c);

  const sortedValues = {} as Record<DecodeModel, ValueMap>;
  const sortedRaws = {} as Record<DecodeModel, ValueMap>;
  for (const m of MODELS) {
    sortedValues[m] = sortMap(values[m]);
    sortedRaws[m] = sortMap(raws[m]);
  }
  return { version: 1, files: list, values: sortedValues, raws: sortedRaws, candidates };
}

// Khóa sắp xếp tăng dần ở mọi cấp để file JSON không đổi giữa các lần quét
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const rec = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(rec).sort().map((k) => [k, sortKeys(rec[k])]));
  }
  return v;
}

// JSON với khóa đã sắp xếp: cùng dữ liệu thì cùng chuỗi, không phụ thuộc thứ tự chèn
export function stableJson(v: unknown, indent: number | undefined = 2): string {
  return JSON.stringify(sortKeys(v), null, indent);
}

export function serializeObserved(o: Observed): string {
  return stableJson(o) + "\n";
}
