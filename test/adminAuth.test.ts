import { test } from "node:test";
import assert from "node:assert/strict";
import { adminEmails, verifyAdmin } from "../lib/adminAuth.ts";

// Địa chỉ giả chỉ dùng trong test (miền example.test)
const OWNER = "owner@example.test";
const GUEST = "guest@example.test";
const TOKEN = "header.payload-example_0123456789";
const AUTH = {
  NEXT_PUBLIC_AUTH_SUPABASE_URL: "https://auth.example.test",
  NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY: "anon-example-key",
};
const ENV = { ...AUTH, ADMIN_EMAILS: ` ${OWNER.toUpperCase()} , other@example.test,` };

const req = (authorization?: string) =>
  new Request("https://site.example.test/admin/decode/data", {
    headers: authorization === undefined ? {} : { authorization },
  });

function goTrue(status: number, body: unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = async (input: string, init?: RequestInit) => {
    calls.push({ url: input, init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  return { fn, calls };
}

const googleUser = (email: string, extra: Record<string, unknown> = {}) => ({
  email,
  email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "google", providers: ["google"] },
  ...extra,
});

test("adminEmails: tách dấu phẩy, cắt khoảng trắng, hạ chữ thường, bỏ mục rỗng", () => {
  assert.deepEqual(adminEmails({ ADMIN_EMAILS: " A@Example.test , ,b@example.test,," }), ["a@example.test", "b@example.test"]);
  assert.deepEqual(adminEmails({ ADMIN_EMAILS: "  " }), []);
  assert.deepEqual(adminEmails({}), []);
});

test("verifyAdmin: ADMIN_EMAILS thiếu hoặc rỗng thì 404 và không gọi mạng", async () => {
  const f = goTrue(200, googleUser(OWNER));
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: AUTH, fetch: f.fn }), { ok: false, status: 404 });
  assert.deepEqual(
    await verifyAdmin(req(`Bearer ${TOKEN}`), { env: { ...AUTH, ADMIN_EMAILS: " , " }, fetch: f.fn }),
    { ok: false, status: 404 },
  );
  assert.equal(f.calls.length, 0);
});

test("verifyAdmin: thiếu URL hoặc khóa của Auth thì 503", async () => {
  const f = goTrue(200, googleUser(OWNER));
  const noUrl = { ...ENV, NEXT_PUBLIC_AUTH_SUPABASE_URL: "" };
  const noKey = { ...ENV, NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY: undefined };
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: noUrl, fetch: f.fn }), { ok: false, status: 503 });
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: noKey, fetch: f.fn }), { ok: false, status: 503 });
  assert.equal(f.calls.length, 0);
});

test("verifyAdmin: thiếu hoặc sai dạng Bearer thì 401 và không gọi mạng", async () => {
  const f = goTrue(200, googleUser(OWNER));
  const bad = [undefined, "", "Basic abc", "Bearer", "Bearer short", "Bearer has spaces in it 0123456789", "Bearer bad$token-with-chars-0123456789"];
  for (const h of bad) {
    assert.deepEqual(await verifyAdmin(req(h), { env: ENV, fetch: f.fn }), { ok: false, status: 401 }, String(h));
  }
  assert.equal(f.calls.length, 0);
});

test("verifyAdmin: GoTrue trả 401 thì 401", async () => {
  const f = goTrue(401, { msg: "invalid JWT" });
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: f.fn }), { ok: false, status: 401 });
});

test("verifyAdmin: lỗi mạng hoặc hết giờ thì 503", async () => {
  const boom = async () => {
    throw new Error("socket closed");
  };
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: boom }), { ok: false, status: 503 });
});

test("verifyAdmin: dịch vụ đăng nhập trả 5xx thì 503, phiên đã bị hủy (403) thì 401", async () => {
  const down = async () => new Response("{}", { status: 502 });
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: down }), { ok: false, status: 503 });
  const gone = async () => new Response('{"error_code":"session_not_found"}', { status: 403 });
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: gone }), { ok: false, status: 401 });
});

test("verifyAdmin: 200 mà body không phải JSON thì 401", async () => {
  const raw = async () => new Response("not json", { status: 200 });
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: raw }), { ok: false, status: 401 });
});

test("verifyAdmin: chưa xác nhận email thì 403", async () => {
  const f = goTrue(200, googleUser(OWNER, { email_confirmed_at: null }));
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: f.fn }), { ok: false, status: 403 });
});

test("verifyAdmin: không phải Google thì 403", async () => {
  const f = goTrue(200, googleUser(OWNER, { app_metadata: { provider: "email", providers: ["email"] } }));
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: f.fn }), { ok: false, status: 403 });
});

test("verifyAdmin: email không có trong danh sách thì 403", async () => {
  const f = goTrue(200, googleUser(GUEST));
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: f.fn }), { ok: false, status: 403 });
});

test("verifyAdmin: email khác chữ hoa và danh sách có khoảng trắng, nhiều mục thì ok", async () => {
  const f = goTrue(200, googleUser(OWNER.toUpperCase()));
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: f.fn }), { ok: true });
  const g = goTrue(200, googleUser("other@example.test"));
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: g.fn }), { ok: true });
});

test("verifyAdmin: providers có google (không có provider) thì ok", async () => {
  const f = goTrue(200, googleUser(OWNER, { app_metadata: { providers: ["email", "google"] } }));
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: f.fn }), { ok: true });
});

test("verifyAdmin: gọi GoTrue đúng URL, header, no-store, timeout; không gửi email đi", async () => {
  const f = goTrue(200, googleUser(OWNER));
  assert.deepEqual(await verifyAdmin(req(`Bearer ${TOKEN}`), { env: ENV, fetch: f.fn }), { ok: true });
  assert.equal(f.calls.length, 1);
  const [call] = f.calls;
  assert.equal(call.url, "https://auth.example.test/auth/v1/user");
  const headers = call.init?.headers as Record<string, string>;
  assert.equal(headers.apikey, "anon-example-key");
  assert.equal(headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(call.init?.cache, "no-store");
  assert.ok(call.init?.signal instanceof AbortSignal);
  assert.ok(!JSON.stringify(call).toLowerCase().includes(OWNER), "email không được xuất hiện trong yêu cầu gửi GoTrue");
});
