// GET /admin/decode/data: bảng tham số, số liệu máy và ứng viên. Chỉ trả khi verifyAdmin xác nhận phiên Google nằm trong ADMIN_EMAILS.
// Mọi phản hồi (kể cả lỗi) là private, no-store. Route đọc header nên luôn chạy theo từng yêu cầu, không dùng cache.
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { decodeTable } from "@/lib/decode/table";
import { MODELS, modelSummary } from "@/lib/decode/matrix";
import type { ModelSummary } from "@/lib/decode/matrix";
import type { GameModel } from "@/lib/game/types";
import observedJson from "@/data/decode-observed.json";
import type { Candidate } from "../Candidates";

const NO_STORE = { "Cache-Control": "private, no-store" };
const candidates = (observedJson as unknown as { candidates: Candidate[] }).candidates;

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status, headers: NO_STORE });

  const summaries = Object.fromEntries(MODELS.map((m) => [m, modelSummary(m)])) as Record<GameModel, ModelSummary>;
  return NextResponse.json({ ok: true, rows: decodeTable(), summaries, candidates }, { headers: NO_STORE });
}
