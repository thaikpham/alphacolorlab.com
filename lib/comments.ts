// Comments on the AUTH Supabase project through PostgREST (schema + RLS: supabase/community.sql).
import { AUTH_KEY, AUTH_URL, type Session } from "./auth.ts";

export type Comment = {
  id: string;
  parent_id: string | null;
  user_id: string;
  author_name: string | null;
  author_avatar: string | null;
  body: string;
  like_count: number;
  created_at: string;
  liked: boolean;
};
export type Thread = Comment & { replies: Thread[] };

/** Same rule as the `page` check in supabase/community.sql. */
export const PAGE_KEY = /^(product|recipe|post|path|note)\/[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_BODY = 2000;

const COLS = "id,parent_id,user_id,author_name,author_avatar,body,like_count,created_at";
const headers = (s: Session | null, json = false): Record<string, string> => ({
  apikey: AUTH_KEY,
  ...(s && { Authorization: `Bearer ${s.accessToken}` }),
  ...(json && { "Content-Type": "application/json" }),
});

async function ok(r: Response) {
  if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => "")}`);
  return r;
}

export async function listComments(page: string, s: Session | null): Promise<Comment[]> {
  // comment_likes is filtered by RLS to the reader's own hearts, so a non-empty list means "liked by me".
  const q = new URLSearchParams({ page: `eq.${page}`, select: `${COLS},comment_likes(user_id)`, order: "created_at.asc" });
  const rows: (Omit<Comment, "liked"> & { comment_likes: unknown[] })[] = await (await ok(await fetch(`${AUTH_URL}/rest/v1/comments?${q}`, { headers: headers(s) }))).json();
  return rows.map(({ comment_likes, ...c }) => ({ ...c, liked: comment_likes.length > 0 }));
}

export async function addComment(page: string, parentId: string | null, body: string, s: Session): Promise<Comment> {
  const r = await ok(await fetch(`${AUTH_URL}/rest/v1/comments?select=${COLS}`, {
    method: "POST",
    headers: { ...headers(s, true), Prefer: "return=representation" },
    body: JSON.stringify({ page, parent_id: parentId, body: body.trim() }),
  }));
  return { ...(await r.json())[0], liked: false };
}

export async function deleteComment(id: string, s: Session) {
  await ok(await fetch(`${AUTH_URL}/rest/v1/comments?id=eq.${id}`, { method: "DELETE", headers: headers(s) }));
}

export async function setLike(id: string, liked: boolean, s: Session) {
  const r = liked
    ? await fetch(`${AUTH_URL}/rest/v1/comment_likes`, { method: "POST", headers: { ...headers(s, true), Prefer: "return=minimal" }, body: JSON.stringify({ comment_id: id }) })
    : await fetch(`${AUTH_URL}/rest/v1/comment_likes?comment_id=eq.${id}`, { method: "DELETE", headers: headers(s) });
  if (r.status !== 409) await ok(r); // 409: already liked in another tab
}

/** Top-level comments newest first, replies in the order they were written (like Facebook). */
export function buildThreads(list: Comment[]): Thread[] {
  const byId = new Map(list.map((c) => [c.id, { ...c, replies: [] as Thread[] }]));
  const roots: Thread[] = [];
  for (const t of [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at)))
    ((t.parent_id && byId.get(t.parent_id)?.replies) || roots).push(t);
  return roots.reverse();
}

/** Share targets with a web URL; Zalo, Messenger, Instagram and TikTok go through the phone's share sheet or a copied link. */
export function shareLinks(url: string, title: string) {
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    threads: `https://www.threads.com/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`,
  };
}
