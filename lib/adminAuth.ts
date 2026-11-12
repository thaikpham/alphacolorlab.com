// Quyền quản trị cho /admin/decode/data và route dev-save. Chỉ chạy trên máy chủ (route handler), không import từ mã client.
// Danh sách ADMIN_EMAILS (server only, cách nhau bằng dấu phẩy) không được đưa vào NEXT_PUBLIC_*. Không ghi email hay token ra log hay phản hồi.
// ADMIN_EMAILS trống hoặc thiếu thì mọi yêu cầu nhận 404 (mặc định từ chối).

export type AdminCheck = { ok: true } | { ok: false; status: 401 | 403 | 404 | 503 };

type Env = Record<string, string | undefined>;
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type AdminDeps = { fetch?: FetchLike; env?: Env };

const BEARER = /^bearer (\S+)$/i;
const TOKEN_SHAPE = /^[A-Za-z0-9._-]{20,4096}$/;
const TIMEOUT_MS = 5000;

export function adminEmails(env: Env = process.env): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

type GoTrueUser = {
  email?: unknown;
  email_confirmed_at?: unknown;
  app_metadata?: { provider?: unknown; providers?: unknown } | null;
};

export async function verifyAdmin(req: Request, deps: AdminDeps = {}): Promise<AdminCheck> {
  const env = deps.env ?? process.env;
  const allowed = adminEmails(env);
  if (allowed.length === 0) return { ok: false, status: 404 };

  const authUrl = env.NEXT_PUBLIC_AUTH_SUPABASE_URL;
  const authKey = env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY;
  if (!authUrl || !authKey) return { ok: false, status: 503 };

  const token = BEARER.exec((req.headers.get("authorization") ?? "").trim())?.[1];
  if (!token || !TOKEN_SHAPE.test(token)) return { ok: false, status: 401 };

  const doFetch: FetchLike = deps.fetch ?? fetch;
  let res: Response;
  try {
    res = await doFetch(`${authUrl}/auth/v1/user`, {
      headers: { apikey: authKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Không gọi được dịch vụ đăng nhập (mạng, hết giờ): chưa biết token đúng hay sai, báo 503 để trang cho thử lại
    return { ok: false, status: 503 };
  }
  // 5xx là lỗi phía dịch vụ; còn lại (401, 403 session_not_found…) là token không còn dùng được
  if (res.status >= 500) return { ok: false, status: 503 };
  if (!res.ok) return { ok: false, status: 401 };

  let user: GoTrueUser | null;
  try {
    user = (await res.json()) as GoTrueUser | null;
  } catch {
    return { ok: false, status: 401 };
  }

  const email = typeof user?.email === "string" ? user.email.toLowerCase() : "";
  if (!email) return { ok: false, status: 403 };
  const meta = user?.app_metadata ?? {};
  const google = meta.provider === "google" || (Array.isArray(meta.providers) && meta.providers.includes("google"));
  if (!user?.email_confirmed_at || !google) return { ok: false, status: 403 };
  if (!allowed.includes(email)) return { ok: false, status: 403 };
  return { ok: true };
}
