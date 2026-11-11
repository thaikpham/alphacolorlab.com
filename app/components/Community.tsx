"use client";

import { useEffect, useRef, useState } from "react";
import { community } from "@/app/content";
import { InfoTip } from "./InfoTip";
import { authReady, getSession, signIn, signOut, useSession, type Session } from "@/lib/auth";
import { addComment, buildThreads, deleteComment, listComments, MAX_BODY, setLike, shareLinks, type Comment, type Thread } from "@/lib/comments";

const t = community.comments;
const s = community.share;
const tinted = "inline-flex h-11 items-center rounded-full bg-accent/10 px-4 text-subhead font-semibold text-accent-text transition hover:bg-accent/15";
const plain = "inline-flex min-h-11 items-center text-footnote font-semibold transition hover:text-accent-text";

/** Share bar + Google-signed comments under a product, recipe, blog post, learning path or knowledge note. `page` = '<kind>/<slug>'. */
export function Community({ page, title }: { page: string; title: string }) {
  return (
    <section id="binh-luan" className="mt-12 scroll-mt-24">
      <ShareBar title={title} />
      {authReady && <Comments page={page} />}
    </section>
  );
}

export function ShareBar({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setUrl(location.origin + location.pathname);
    setCanShare(typeof navigator.share === "function");
  }, []);
  const links = shareLinks(url, title);
  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <h2 className="text-title3 font-medium">{s.title}</h2>
        <InfoTip entry={{ term: s.title, lines: [{ t: s.hint }] }} />
      </div>
      <div className="flex flex-wrap gap-2">
        {canShare && (
          <button type="button" className={tinted} onClick={() => navigator.share({ title, url }).catch(() => {})}>
            {s.native}
          </button>
        )}
        <a className={tinted} href={links.facebook} target="_blank" rel="noopener noreferrer">{s.facebook}</a>
        <a className={tinted} href={links.threads} target="_blank" rel="noopener noreferrer">{s.threads}</a>
        <button
          type="button"
          className={tinted}
          onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
        >
          <span aria-live="polite">{copied ? s.copied : s.copy}</span>
        </button>
      </div>
    </div>
  );
}

function Comments({ page }: { page: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const session = useSession();
  const [list, setList] = useState<Comment[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "failed" | "ready">("idle");
  const [authFailed, setAuthFailed] = useState(false);

  async function load() {
    setState("loading");
    try {
      const { session, failed, returned } = await getSession();
      setAuthFailed(failed);
      setList(await listComments(page, session));
      setState("ready");
      if (returned) ref.current?.scrollIntoView({ block: "start" });
    } catch {
      setState("failed");
    }
  }

  // Nothing is fetched until the section is near the screen, unless we are coming back from Google.
  useEffect(() => {
    if (/[?&](code|error)=/.test(location.search)) return void load();
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (io.disconnect(), load()), { rootMargin: "600px" });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [page]);

  // Signing in or out from the nav changes which hearts are "mine": reload once the list is showing.
  const shownFor = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (state === "ready" && shownFor.current !== session?.user.id) load();
    shownFor.current = session?.user.id;
  }, [session?.user.id]);

  const threads = list ? buildThreads(list) : [];
  const actions: Actions = {
    session,
    async add(parentId, body) {
      const c = await addComment(page, parentId, body, await fresh());
      setList((l) => [...(l ?? []), c]);
    },
    async remove(id) {
      if (!confirm(t.confirmDelete)) return;
      await deleteComment(id, await fresh());
      // Replies go with their parent (on delete cascade), so drop the whole branch.
      setList((l) => {
        const gone = new Set([id]);
        for (const c of l ?? []) if (c.parent_id && gone.has(c.parent_id)) gone.add(c.id);
        return (l ?? []).filter((c) => !gone.has(c.id));
      });
    },
    async like(c) {
      const flip = (x: Comment) => (x.id === c.id ? { ...x, liked: !c.liked, like_count: x.like_count + (c.liked ? -1 : 1) } : x);
      setList((l) => l?.map(flip) ?? l);
      await setLike(c.id, !c.liked, await fresh()).catch(() => setList((l) => l?.map((x) => (x.id === c.id ? c : x)) ?? l));
    },
  };

  return (
    <div ref={ref} className="mt-10 scroll-mt-24">
      <h2 className="mb-3 text-title3 font-medium">{t.count(list?.length ?? 0)}</h2>
      {state === "failed" ? (
        <p className="text-subhead text-secondary">
          {t.loadFailed}{" "}
          <button type="button" className="min-h-11 font-semibold text-accent-text" onClick={load}>{t.retry}</button>
        </p>
      ) : state !== "ready" ? (
        <p className="text-subhead text-secondary">{t.loading}</p>
      ) : (
        <>
          {session ? (
            <div className="mb-4">
              <Composer placeholder={t.placeholder} onSend={(body) => actions.add(null, body)} />
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-footnote text-secondary">
                {t.signedInAs(session.user.name ?? t.anonymous)}
                <button type="button" className={`${plain} text-secondary`} onClick={signOut}>{t.signOut}</button>
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <button type="button" onClick={signIn} className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent transition hover:bg-accent/90">
                {t.signIn}
              </button>
              {authFailed && <p className="mt-2 text-footnote text-danger">{t.signInFailed}</p>}
            </div>
          )}
          {threads.length === 0 ? (
            <p className="text-subhead text-secondary">{t.empty}</p>
          ) : (
            <ul className="rounded-card bg-card shadow-card divide-y divide-separator">
              {threads.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <CommentView c={c} depth={0} actions={actions} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/** A session with a token that is valid right now (refreshed if it was about to expire). */
async function fresh(): Promise<Session> {
  const { session } = await getSession();
  if (!session) throw new Error("signed out");
  return session;
}

type Actions = {
  session: Session | null;
  add: (parentId: string | null, body: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  like: (c: Comment) => Promise<void>;
};

const ago = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
function when(iso: string) {
  const sec = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]] as const)
    if (Math.abs(sec) >= size) return ago.format(Math.round(sec / size), unit);
  return ago.format(0, "second");
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  return src ? (
    // Google profile photos; next/image would proxy every avatar through the image optimizer for no gain at 32px.
    <img src={src} alt="" width={32} height={32} referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full bg-fill" />
  ) : (
    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fill text-footnote font-semibold text-secondary">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function CommentView({ c, depth, actions }: { c: Thread; depth: number; actions: Actions }) {
  const [replying, setReplying] = useState(false);
  const name = c.author_name ?? t.anonymous;
  const mine = actions.session?.user.id === c.user_id;
  return (
    <div>
      <div className="flex gap-3">
        <Avatar name={name} src={c.author_avatar} />
        <div className="min-w-0 flex-1">
          <p className="text-subhead">
            <span className="font-semibold">{name}</span>{" "}
            <time dateTime={c.created_at} className="text-footnote text-secondary">{when(c.created_at)}</time>
          </p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-callout">{c.body}</p>
          <div className="flex flex-wrap items-center gap-x-4">
            <button
              type="button"
              disabled={!actions.session}
              aria-pressed={c.liked}
              aria-label={c.liked ? t.unlike(c.like_count) : t.like(c.like_count)}
              onClick={() => actions.like(c)}
              className={`${plain} gap-1 ${c.liked ? "text-accent-text" : "text-secondary disabled:hover:text-secondary"}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill={c.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
              </svg>
              {c.like_count > 0 && c.like_count}
            </button>
            {actions.session && (
              <button type="button" className={`${plain} text-secondary`} onClick={() => setReplying((r) => !r)}>{t.reply}</button>
            )}
            {mine && (
              <button type="button" className={`${plain} text-secondary`} onClick={() => actions.remove(c.id).catch(() => alert(t.deleteFailed))}>{t.delete}</button>
            )}
          </div>
          {replying && (
            <Composer
              autoFocus
              placeholder={t.replyPlaceholder(name)}
              onCancel={() => setReplying(false)}
              onSend={(body) => actions.add(c.id, body).then(() => setReplying(false))}
            />
          )}
        </div>
      </div>
      {c.replies.length > 0 && (
        // Indent up to three levels; deeper replies stay at the third level so phones keep a readable width.
        <ul className={`mt-3 space-y-3 ${depth < 2 ? "ml-5 border-l border-separator pl-4 sm:ml-11" : ""}`}>
          {c.replies.map((r) => (
            <li key={r.id}>
              <CommentView c={r} depth={depth + 1} actions={actions} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Composer({ placeholder, onSend, onCancel, autoFocus }: { placeholder: string; onSend: (body: string) => Promise<void>; onCancel?: () => void; autoFocus?: boolean }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const tooLong = body.length > MAX_BODY;
  return (
    <form
      className="mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim() || tooLong || busy) return;
        setBusy(true);
        setFailed(false);
        onSend(body)
          .then(() => setBody(""))
          .catch(() => setFailed(true))
          .finally(() => setBusy(false));
      }}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        rows={3}
        className="w-full resize-y rounded-control border border-separator bg-card px-3 py-2.5 text-callout text-label placeholder:text-tertiary"
      />
      {(tooLong || failed) && <p className="text-footnote text-danger">{tooLong ? t.tooLong(MAX_BODY) : t.sendFailed}</p>}
      <div className="mt-2 flex gap-2">
        <button type="submit" disabled={!body.trim() || tooLong || busy} className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent transition hover:bg-accent/90 disabled:opacity-50">
          {t.send}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="inline-flex h-11 items-center rounded-full px-4 text-subhead font-semibold text-accent-text hover:bg-accent/10">
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
