import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { importDat } from "@/lib/datImport";
import { verifyAdmin } from "@/lib/adminAuth";
import { writeScan } from "@/lib/decode/scanFs";
import type { GameModel, Mission, SlotTask } from "@/lib/game/types";

// Lưu một lượt mini game (mission + 4 file máy đã lưu) vào test/fixtures/rounds/<model>/<id>/ rồi quét lại dự án. Chỉ chạy khi npm run dev
// và khi verifyAdmin xác nhận tài khoản quản trị (Bearer là phiên Google).
// Mọi đầu vào được kiểm tra trước khi ghi đĩa. Lượt đã có thư mục thì trả 409, không ghi đè.

const MODEL_IDS: readonly GameModel[] = ["zve10", "a6400", "a7c2"];
const MISSION_ID = /^[A-Za-z0-9_-]{1,64}$/;
const SETTING_ID = /^[A-Za-z0-9._-]{1,64}$/;
const FILE_NAME = /^CAMPR0[1-4][NP]\.DAT$/;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
const MAX_FILE = 64 * 1024;
const MAX_FILES = 4;
const MAX_BODY = 512 * 1024;
const MAX_BASE64 = Math.ceil(MAX_FILE / 3) * 4;

type Checked = { mission: Mission; files: { name: string; bytes: Uint8Array }[] };
type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function isLocalhost(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function parseSlots(v: unknown): SlotTask[] | null {
  if (!Array.isArray(v) || v.length < 1 || v.length > 4) return null;
  const seen = new Set<number>();
  const out: SlotTask[] = [];
  for (const s of v) {
    if (!isObj(s) || !Number.isInteger(s.slot) || (s.slot as number) < 1 || (s.slot as number) > 4) return null;
    if (seen.has(s.slot as number) || !Array.isArray(s.steps)) return null;
    seen.add(s.slot as number);
    const steps = s.steps.map((st: unknown) => {
      if (!isObj(st) || typeof st.settingId !== "string" || !SETTING_ID.test(st.settingId)) return null;
      if (typeof st.valueId !== "string" || !SETTING_ID.test(st.valueId)) return null;
      if (st.role !== "control" && st.role !== "target") return null;
      return { settingId: st.settingId, valueId: st.valueId, role: st.role } as const;
    });
    if (steps.some((st) => st === null)) return null;
    out.push({ slot: s.slot as SlotTask["slot"], steps: steps as SlotTask["steps"] });
  }
  return out;
}

// Kiểm tra toàn bộ đầu vào; trả về bản đã làm sạch (chỉ các trường đã biết) hoặc lý do từ chối
function check(body: unknown): Checked | { error: string } {
  if (!isObj(body) || !isObj(body.mission) || !Array.isArray(body.files)) return { error: "Thiếu mission hoặc files." };
  const m = body.mission;
  if (!MODEL_IDS.includes(m.model as GameModel)) return { error: "Máy của lượt không hợp lệ." };
  const model = m.model as GameModel;
  if (typeof m.id !== "string" || !MISSION_ID.test(m.id)) return { error: "Mã lượt không hợp lệ." };
  if (typeof m.seed !== "number" || typeof m.createdAt !== "number") return { error: "Thiếu seed hoặc createdAt." };
  const slots = parseSlots(m.slots);
  if (!slots) return { error: "Đề bài (slots) không hợp lệ." };

  const list = body.files;
  if (list.length < 1 || list.length > MAX_FILES) return { error: "Cần từ 1 đến 4 file." };
  const names = new Set<string>();
  const ones = new Set<string>();
  const files: Checked["files"] = [];
  for (const f of list) {
    if (!isObj(f) || typeof f.name !== "string" || typeof f.base64 !== "string") return { error: "File không hợp lệ." };
    if (!FILE_NAME.test(f.name)) return { error: "Tên file không đúng (CAMPR01P.DAT đến CAMPR04P.DAT, hoặc N)." };
    const slot = f.name.charAt(6);
    if (names.has(f.name) || ones.has(slot)) return { error: "Trùng file hoặc trùng ô." };
    names.add(f.name);
    ones.add(slot);
    if (f.base64.length > MAX_BASE64 || f.base64.length % 4 !== 0 || !BASE64.test(f.base64)) {
      return { error: `File ${f.name} quá lớn hoặc không phải base64.` };
    }
    const bytes = new Uint8Array(Buffer.from(f.base64, "base64"));
    if (bytes.length === 0 || bytes.length > MAX_FILE) return { error: `File ${f.name} vượt 64 KB.` };
    const read = importDat(bytes, f.name);
    if (read.kind !== model) return { error: `File ${f.name} không đọc được như máy ${model}.` };
    files.push({ name: f.name, bytes });
  }

  return {
    mission: { id: m.id, model, seed: m.seed, createdAt: m.createdAt, slots },
    files,
  };
}

function fail(status: 400 | 403 | 404 | 409 | 500, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status });

  // CSRF guard: như app/admin/api/route.ts, chỉ nhận Origin localhost hoặc 127.0.0.1
  const origin = req.headers.get("origin");
  if (origin && !isLocalhost(origin)) {
    return fail(403, "CORS not allowed");
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return fail(400, "Dữ liệu quá lớn.");
    body = JSON.parse(text);
  } catch {
    return fail(400, "Dữ liệu không phải JSON.");
  }

  const checked = check(body);
  if ("error" in checked) return fail(400, checked.error);
  const { mission, files } = checked;

  const root = process.cwd();
  const dir = path.join(root, "test", "fixtures", "rounds", mission.model, mission.id);
  if (fs.existsSync(dir)) return fail(409, "Lượt này đã được lưu, không ghi đè.");

  try {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    fs.mkdirSync(dir);
    for (const f of files) fs.writeFileSync(path.join(dir, f.name), f.bytes);
    fs.writeFileSync(path.join(dir, "mission.json"), JSON.stringify(mission, null, 2) + "\n");
  } catch {
    return fail(500, "Không ghi được thư mục lượt.");
  }

  try {
    writeScan(root);
    const summary = JSON.parse(fs.readFileSync(path.join(root, "data", "decode-summary.json"), "utf8")) as {
      models: Record<string, unknown>;
    };
    return NextResponse.json({
      ok: true,
      dir: path.relative(root, dir),
      summary: summary.models[mission.model] ?? null,
    });
  } catch {
    return fail(500, "Đã lưu file nhưng quét lại dự án lỗi. Chạy npm run decode:scan để xem nguyên nhân.");
  }
}
