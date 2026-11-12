"use client";

import { AUTH_KEY, AUTH_URL, getSession } from "./auth.ts";
import { parseCart, writeCart } from "./cart.ts";
import { parseCompare, writeCompare } from "./compare.ts";
import { setModel, type ModelId } from "./model.ts";
import { loadGearIds, parseGear, writeGear } from "./gear.ts";
import { parseProfileRaw, writeProfile } from "./profile.ts";
import { parseSaved, writeSaved } from "./savedSets.ts";
import { parseMods, writeMods } from "./ppMods.ts";

// What a signed-in reader did, kept per Google account: the M1–M4 cart, the compare pick, gear bag, profile (username, bio, links), chosen camera, saved M1–M4 sets and PP mods.
// localStorage stays the working copy; this mirrors it to the AUTH project's user_state table (supabase/community.sql).
// Conflicts: the newer side wins as a whole (last change on any device).

/** localStorage key = the event each store fires on change. */
export const SYNCED = ["color-bank-cart", "wiki-compare", "gear-bag", "user-profile", "camera-model", "saved-sets", "pp-mods"] as const;
export type Snapshot = Partial<Record<(typeof SYNCED)[number], string>>;
const STAMP = "user-state-updated-at";

export function plan(localAt: number, serverAt: number | null): "pull" | "push" | "none" {
  if (serverAt === null) return localAt > 0 ? "push" : "none";
  return serverAt > localAt ? "pull" : localAt > serverAt ? "push" : "none";
}

const readLocal = (): Snapshot => Object.fromEntries(SYNCED.flatMap((k) => (localStorage.getItem(k) == null ? [] : [[k, localStorage.getItem(k)!]])));

let applying = 0;
async function applyLocal(s: Snapshot) {
  applying++;
  try {
    // The gear bag is checked against the catalog before it is written; the catalog loads only when a bag is synced.
    const gear = s["gear-bag"];
    const gearIds = gear != null ? await loadGearIds() : null;
    // Through each store's own writer, so values are validated and every open view updates.
    if (s["color-bank-cart"] != null) writeCart(parseCart(s["color-bank-cart"]));
    if (s["wiki-compare"] != null) writeCompare(parseCompare(s["wiki-compare"]));
    if (gear != null && gearIds) writeGear(parseGear(gear, gearIds));
    if (s["user-profile"] != null) writeProfile(parseProfileRaw(s["user-profile"]));
    if (s["camera-model"] != null) setModel(s["camera-model"] as ModelId);
    if (s["saved-sets"] != null) writeSaved(parseSaved(s["saved-sets"]));
    if (s["pp-mods"] != null) writeMods(parseMods(s["pp-mods"]));
  } finally {
    applying--;
  }
}

async function request(method: "GET" | "POST", body?: object) {
  const { session } = await getSession();
  if (!session) return null;
  const r = await fetch(`${AUTH_URL}/rest/v1/user_state${method === "GET" ? "?select=data,updated_at" : "?on_conflict=user_id"}`, {
    method,
    headers: {
      apikey: AUTH_KEY,
      Authorization: `Bearer ${session.accessToken}`,
      ...(body && { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
    },
    body: body && JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`user_state ${r.status}`);
  return method === "GET" ? ((await r.json()) as { data: Snapshot; updated_at: string }[])[0] ?? null : null;
}

const push = () => {
  const at = Number(localStorage.getItem(STAMP) ?? 0) || Date.now();
  return request("POST", { data: readLocal(), updated_at: new Date(at).toISOString() });
};

async function reconcile() {
  const row = await request("GET");
  const serverAt = row ? Date.parse(row.updated_at) : null;
  const step = plan(Number(localStorage.getItem(STAMP) ?? 0), serverAt);
  if (step === "pull" && row) {
    await applyLocal(row.data);
    localStorage.setItem(STAMP, String(serverAt));
  } else if (step === "push") await push();
}

/** Starts mirroring for the signed-in reader; returns the stop function (call it on sign-out). */
export function startSync(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const onChange = () => {
    if (applying) return;
    localStorage.setItem(STAMP, String(Date.now()));
    clearTimeout(timer);
    timer = setTimeout(() => push().catch(() => {}), 1500);
  };
  // Another device may have changed things while this tab was in the background.
  const onVisible = () => document.visibilityState === "visible" && reconcile().catch(() => {});
  for (const e of SYNCED) window.addEventListener(e, onChange);
  document.addEventListener("visibilitychange", onVisible);
  reconcile().catch(() => {});
  return () => {
    clearTimeout(timer);
    for (const e of SYNCED) window.removeEventListener(e, onChange);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
