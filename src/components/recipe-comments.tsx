'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useAuth } from './auth-context';
import { communityErrorOf, type CommunityAlertCode } from '@/lib/community/errors';
import type { CommentItem } from '@/app/api/comments/route';

/**
 * The recipe page's discussion.
 *
 * It shared a panel with "propose & vote on a new version" behind two tabs
 * until the owner removed proposals and voting, with "tweak with AI", on
 * 2026-10-28. What is left is the comments, the one place a reader writes
 * prose about a recipe, so the panel is them and nothing else.
 */

/** An error line. Copy is the code's, looked up in `community.errors`. */
const ALERT = 'text-body-sm text-danger';

/** A text field. Sunken, and its validation is a hint — never a red field. */
const FIELD = 'w-full surface-sunken px-3.5 py-2.5 text-body text-ink placeholder:text-ink-faint';

/**
 * One community error, in the reader's locale.
 *
 * `read` marks a failed load. `errors.*` is written for writes — its outage
 * copy says nothing was saved, which is news to a reader who only opened the
 * page — so a read outage has its own line.
 */
export function CommunityAlert({ code, read = false }: { code: CommunityAlertCode; read?: boolean }) {
  const t = useTranslations('community');
  return (
    <p role="alert" className={ALERT}>
      {read && code === 'controlUnavailable' ? t('loadUnavailable') : t(`errors.${code}`)}
    </p>
  );
}

const AVATAR_SIZE = { md: 'w-6 h-6', lg: 'w-7 h-7' } as const;

/**
 * A reader's avatar, or their initial on a token colour.
 *
 * A dead Google avatar used to be swapped for a generated image from a
 * third-party service, with a raw hex in its URL. `no-referrer` because
 * Google's avatar host refuses some referrers outright.
 */
export function Avatar({
  src,
  name,
  size,
}: {
  src: string | null | undefined;
  name: string;
  size: keyof typeof AVATAR_SIZE;
}) {
  // Keyed to the URL, so a new src gets its own chance to load.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (src && failedSrc !== src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- Google avatar, arbitrary host */
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className={`${AVATAR_SIZE[size]} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${AVATAR_SIZE[size]} rounded-full bg-white/20 text-ink flex items-center justify-center text-label font-semibold shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** One comment. Its line breaks are the reader's, so they are kept. */
export function CommentCard({ comment }: { comment: CommentItem }) {
  const format = useFormatter();
  return (
    <div className="row-tint p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar src={comment.authorAvatar} name={comment.authorName} size="md" />
          <span className="text-body-sm font-semibold text-ink truncate">{comment.authorName}</span>
        </div>

        <span className="meta shrink-0 tabular-nums">
          {/* Formatted in the reader's locale, not a fixed 'vi-VN', and pinned
              to one time zone so the server and client render the
              same string. */}
          {format.dateTime(new Date(comment.createdAt), {
            timeZone: 'Asia/Ho_Chi_Minh',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <p className="text-body leading-relaxed text-ink-muted pl-8 whitespace-pre-line break-words">
        {comment.content}
      </p>
    </div>
  );
}

/**
 * The comments, or why they could not be read.
 *
 * A failed read used to look exactly like an empty one — "be the first"
 * during an outage — so "no comments" is drawn only for a list that loaded.
 * Comments already on screen stay there when a later load fails.
 */
export function CommentList({
  comments,
  loaded,
  loadError,
}: {
  comments: CommentItem[];
  loaded: boolean;
  loadError: CommunityAlertCode | null;
}) {
  const t = useTranslations('community');
  return (
    <div className="flex flex-col gap-3">
      {loadError && <CommunityAlert code={loadError} read />}
      {comments.length > 0
        ? comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
        : loaded &&
          !loadError && <p className="meta italic py-4 text-center">{t('noComments')}</p>}
    </div>
  );
}

export function RecipeComments({ recipeSlug }: { recipeSlug: string }) {
  const t = useTranslations('community');
  /* `isReady` separates "signed out" from "still restoring". Branching on
     `user` alone flashed the sign-in prompt at a reader who was signed in. */
  const { user, isReady, openLoginModal, accessToken } = useAuth();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<CommunityAlertCode | null>(null);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<CommunityAlertCode | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(recipeSlug)}`);
      if (!res.ok) {
        /* 503 controlUnavailable carries an empty list beside its code. It is
           not "no comments", and is not rendered as one. */
        setLoadError(await communityErrorOf(res));
        return;
      }
      const data = await res.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setLoaded(true);
      setLoadError(null);
    } catch {
      setLoadError('unknown');
    }
  }, [recipeSlug]);

  /* Recipe pages are statically generated, so comments cannot be
     server-rendered without serving them stale — the load belongs on the
     client. `set-state-in-effect` cannot see through `useCallback` that the
     fetcher suspends on `await fetch(...)` before touching state, so no
     setState here is synchronous. Remove the disable if it gains one. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchComments();
  }, [fetchComments]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !draft.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setPostError(null);
    try {
      /* Identity is not in the body: the route reads it from the session JWT,
         so a forged author name has nowhere to land. */
      const token = accessToken();
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipeSlug, content: draft.trim() }),
      });

      /* A refusal resolves; it does not throw. Say why, keep the draft for
         the retry, and open the sign-in dialog on an expired session. */
      if (!res.ok) {
        setPostError(await communityErrorOf(res));
        if (res.status === 401) openLoginModal();
        return;
      }
      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setDraft('');
    } catch {
      setPostError('unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="surface p-5 sm:p-6 flex flex-col gap-5 text-ink"
    >
      <h2 id="comments-title" className="text-title-3 font-semibold tracking-[-0.02em] text-ink">
        {/* A count only for a list that has loaded and holds something. */}
        {loaded && comments.length > 0 ? t('titleCount', { count: comments.length }) : t('title')}
      </h2>

      {/* The form or the sign-in prompt — neither until the session is known. */}
      {!isReady ? null : user ? (
        <form onSubmit={handlePost} className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar src={user.avatarUrl || null} name={user.name} size="lg" />
            <span className="text-body-sm font-semibold text-ink">{user.name}</span>
            <span className="meta truncate">({user.email})</span>
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t('title')}
            placeholder={t('commentPlaceholder')}
            rows={2}
            maxLength={2000}
            className={`${FIELD} resize-y`}
          />

          {postError && <CommunityAlert code={postError} />}

          <div className="flex flex-wrap justify-end items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !draft.trim()}
              className="btn-accent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('commentSending') : t('commentSubmit')}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-body-sm text-ink-muted">
          {t.rich('loginPrompt', {
            /* The dialog, not a bare sign-in call: Google sign-in reports an
               outage or a misconfiguration inside the dialog, so a click from
               here used to fail with nothing on screen. */
            a: (chunks) => (
              <button
                type="button"
                onClick={openLoginModal}
                className="text-accent-400 font-semibold underline underline-offset-2 cursor-pointer"
              >
                {chunks}
              </button>
            ),
          })}
        </p>
      )}

      <CommentList comments={comments} loaded={loaded} loadError={loadError} />
    </section>
  );
}
