// Gọi /giai-ma/plan để lấy đúng một lượt. Ném lỗi khi mạng hỏng hoặc server trả lỗi; signal để hủy khi lượt đã cũ.
// Có phiên đăng nhập thì gửi kèm token: bản production chỉ lập lượt cho tài khoản quản trị (verifyAdmin trên server).
import { authReady, getSession } from "@/lib/auth";
import type { Mission } from "@/lib/game/types";
import type { PlanYield } from "@/lib/game/plan";
import type { PlanRequest } from "@/lib/game/planRequest";

export type PlanResponse = { mission: Mission; yield: PlanYield };

async function authHeader(): Promise<Record<string, string>> {
  if (!authReady) return {};
  try {
    const token = (await getSession()).session?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function fetchPlan(req: PlanRequest, signal?: AbortSignal): Promise<PlanResponse> {
  const auth = await authHeader();
  const res = await fetch("/giai-ma/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(req),
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; mission?: Mission; yield?: PlanYield } | null;
  if (!res.ok || !data?.ok || !data.mission || !data.yield) throw new Error("plan-failed");
  return { mission: data.mission, yield: data.yield };
}
