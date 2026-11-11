"use client";

import { useSyncExternalStore } from "react";

// Google sign-in on the AUTH Supabase project with the PKCE flow over plain fetch (same calls supabase-js makes, without the bundle).
// The session lives in localStorage, like supabase-js does by default; every change fires the "auth-session" event.

export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL ?? "";
export const AUTH_KEY = process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY ?? "";
export const authReady = Boolean(AUTH_URL && AUTH_KEY);

export type User = { id: string; name: string | null; avatar: string | null };
export type Session = { accessToken: string; refreshToken: string; expiresAt: number; user: User };
type Resolved = { session: Session | null; failed: boolean; returned: boolean };

const SESSION = "auth-session";
const VERIFIER = "auth-pkce-verifier";
const EVENT = "auth-session";

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function store(s: Session | null) {
  if (s) localStorage.setItem(SESSION, JSON.stringify(s));
  else localStorage.removeItem(SESSION);
  window.dispatchEvent(new Event(EVENT));
}

async function token(grant: "pkce" | "refresh_token", body: object): Promise<Session | null> {
  const r = await fetch(`${AUTH_URL}/auth/v1/token?grant_type=${grant}`, {
    method: "POST",
    headers: { apikey: AUTH_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    // A rejected refresh token will never work again; a 5xx might, so keep the session for the next try.
    if (r.status < 500) store(null);
    return null;
  }
  const t = await r.json();
  const meta = t.user?.user_metadata ?? {};
  const s: Session = {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: t.expires_at ?? Math.floor(Date.now() / 1000) + t.expires_in,
    user: { id: t.user.id, name: meta.full_name ?? meta.name ?? null, avatar: meta.avatar_url ?? meta.picture ?? null },
  };
  store(s);
  return s;
}

/** Leaves for Google; Supabase sends the reader back to this page with ?code=. */
export async function signIn() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  localStorage.setItem(VERIFIER, verifier);
  const q = new URLSearchParams({
    provider: "google",
    redirect_to: location.origin + location.pathname,
    code_challenge: challenge,
    code_challenge_method: "s256",
  });
  location.assign(`${AUTH_URL}/auth/v1/authorize?${q}`);
}

async function resolve(): Promise<Resolved> {
  const url = new URL(location.href);
  const code = url.searchParams.get("code");
  const failed = url.searchParams.has("error");
  if (code || failed) {
    for (const k of ["code", "error", "error_code", "error_description"]) url.searchParams.delete(k);
    history.replaceState(history.state, "", url);
  }
  const verifier = localStorage.getItem(VERIFIER);
  if (code && verifier) {
    localStorage.removeItem(VERIFIER);
    const session = await token("pkce", { auth_code: code, code_verifier: verifier }).catch(() => null);
    return { session, failed: !session, returned: true };
  }
  let session = read();
  if (session && session.expiresAt * 1000 - 60_000 < Date.now())
    session = await token("refresh_token", { refresh_token: session.refreshToken }).catch(() => null);
  return { session, failed, returned: failed };
}

let inflight: Promise<Resolved> | null = null;
/**
 * Current session: finishes a Google round trip if the URL carries ?code=, refreshes an expiring token.
 * Concurrent callers (nav button, comments) share one run, so the one-time code is exchanged once.
 */
export function getSession(): Promise<Resolved> {
  inflight ??= resolve().finally(() => (inflight = null));
  return inflight;
}

export async function signOut() {
  const s = read();
  store(null);
  if (s) await fetch(`${AUTH_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: AUTH_KEY, Authorization: `Bearer ${s.accessToken}` } }).catch(() => {});
}

let raw: string | null | undefined;
let cached: Session | null = null;
function read(): Session | null {
  const r = localStorage.getItem(SESSION);
  if (r !== raw) {
    raw = r;
    try {
      cached = r ? JSON.parse(r) : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** The stored session as React state (may be expired; call getSession() before writing). */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
