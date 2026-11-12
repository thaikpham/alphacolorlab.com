// Lập lượt giải mã trên server: trình duyệt gửi model, seed, focus và phát hiện trên máy; trả mission và yield.
// Bảng trạng thái đầy đủ và data/decode-observed.json không ra khỏi server; client chỉ nhận đúng một lượt.
// Production: /giai-ma trả 404, nơi gọi duy nhất là /admin/decode, nên route này cũng đòi verifyAdmin
// (ADMIN_EMAILS trống thì 404). Khi npm run dev thì mở, để trang /giai-ma trên máy dùng được.
import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { planMission, planYield } from "@/lib/game/plan";
import { parsePlanRequest } from "@/lib/game/planRequest";

const MAX_BODY = 65536;
const NO_STORE = { "Cache-Control": "no-store" };

function fail(status: 400 | 401 | 403 | 404 | 500 | 503) {
  return NextResponse.json({ ok: false }, { status, headers: NO_STORE });
}

export async function POST(req: Request) {
  // Chỉ nhận yêu cầu cùng nguồn; không có Origin (công cụ dòng lệnh) thì vẫn nhận
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return fail(403);

  if (process.env.NODE_ENV === "production") {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return fail(auth.status);
  }

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return fail(400);
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return fail(400);
    body = JSON.parse(text);
  } catch {
    return fail(400);
  }

  const request = parsePlanRequest(body);
  if (!request) return fail(400);

  try {
    const mission = planMission(request.model, { seed: request.seed, focus: request.focus, local: request.local, createdAt: Date.now() });
    return NextResponse.json({ ok: true, mission, yield: planYield(mission, request.local) }, { headers: NO_STORE });
  } catch {
    return fail(500);
  }
}
