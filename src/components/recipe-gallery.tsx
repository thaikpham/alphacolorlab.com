'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { communityErrorOf } from '@/lib/community/errors';
import { isExpiringImageHost } from '@/lib/community/image-hosts';
import { useAuth } from '@/components/auth-context';
import catalogueImageLoader from '@/lib/images/catalogue-loader';
import {
  getLocalCredits,
  getLocalPhotos,
  getServerCredits,
  getServerPhotos,
  setLocalCredit,
  setLocalPhotos,
  subscribeLocalPhotos,
  type PhotoCredit,
} from '@/lib/community/local-photos';

interface RecipeGalleryProps {
  slug: string;
  title: string;
}

/** Narrower than this and a contributed photograph is a smudge in the large tile. */
const MIN_PREVIEW_WIDTH = 320;

/**
 * The preview of the URL being contributed, once the browser has tried it.
 * `width` is the decoded natural width, 0 when it did not decode at all.
 */
type PreviewState = { src: string; ok: boolean; width: number };

/*
 * The contribute tile's glyph, drawn in `currentColor` so it takes the
 * `community` signal of the offer it belongs to. Depth comes from opacity,
 * and the cut-outs are the ground colour.
 */

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden focusable="false">
      {/* Viewfinder bump */}
      <path
        d="M17 12C17 9.79086 18.7909 8 21 8H27C29.2091 8 31 9.79086 31 12V14H17V12Z"
        fill="currentColor"
        opacity="0.55"
      />
      {/* Body */}
      <rect x="6" y="12" width="36" height="26" rx="7" fill="currentColor" opacity="0.9" />
      {/* Shutter lamp */}
      <circle cx="35" cy="19" r="2" fill="var(--color-void)" opacity="0.7" />
      {/* Lens barrel, then the element inside it */}
      <circle cx="24" cy="25" r="9.5" fill="var(--color-void)" opacity="0.65" />
      <circle cx="24" cy="25" r="5.5" fill="currentColor" />
    </svg>
  );
}

/**
 * The lightbox's own images, sized.
 *
 * Every photograph here is a reader's contribution — an arbitrary third-party
 * URL that `next/image` refuses because it is not in `remotePatterns` — so the
 * lightbox draws raw `<img>`. Routed through the catalogue loader by hand all
 * the same, so a source the loader does know how to size (a B&H or article
 * rung) comes back at the right width, and anything else comes back untouched.
 */
const sized = (src: string, width: number) => catalogueImageLoader({ src, width });

/**
 * The last cell of the photo grid: the way to add one (owner, 2026-10-28). It
 * was one of three offers under the grid, beside "propose a version" and
 * "tweak with AI", both since removed. In the grid it is where a reader
 * looks for photographs, and an empty grid is this tile alone — a title and
 * a button, nothing between.
 *
 * Sunken rather than raised: it is a slot waiting for a photograph, not a
 * photograph. The glyph carries `community` cyan, the signal for what
 * readers contribute.
 */
function ContributeTile({ open, label, onClick }: { open: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="contribute-photo-form"
      className="surface-sunken group flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-lg px-3 text-center cursor-pointer text-community"
    >
      <CameraIcon className="w-9 h-9 sm:w-11 sm:h-11 transition-transform duration-200 ease-out group-hover:-translate-y-0.5" />
      <span className="text-body-sm sm:text-body font-semibold text-ink">{label}</span>
    </button>
  );
}

/**
 * The recipe's photographs: readers' contributions only, newest first, the
 * first one the large tile, with author credits and a full-screen lightbox.
 * The catalogue carries no photograph of its own any more.
 */
export function RecipeGallery({ slug, title }: RecipeGalleryProps) {
  const t = useTranslations('recipe');
  const { user, openLoginModal, accessToken } = useAuth();
  /* Deliberately the whole `community` namespace, not `community.errors`:
     messages.test.ts asserts the layout ships `<ns>: messages.<ns>` for every
     namespace a client asks for, and a dotted one has no such entry to ship. */
  const tCommunity = useTranslations('community');

  const localPhotos = useSyncExternalStore(
    subscribeLocalPhotos,
    useCallback(() => getLocalPhotos(slug), [slug]),
    getServerPhotos,
  );

  /* Read through the store like the photos are, not with a bare call during
     render: that returned `{}` on the server and real data on the client, and
     never re-rendered when a credit was added. */
  const localCredits = useSyncExternalStore(
    subscribeLocalPhotos,
    useCallback(() => getLocalCredits(slug), [slug]),
    getServerCredits,
  );

  const [remotePhotos, setRemotePhotos] = useState<string[]>([]);
  const [remoteCredits, setRemoteCredits] = useState<Record<string, PhotoCredit>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Contribution Form state
  const [inputUrl, setInputUrl] = useState('');
  const [authorSocial, setAuthorSocial] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  /* What the browser made of `previewUrl`. Keyed by src, so an answer for an
     address the reader has since edited cannot vouch for the new one. */
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /* The form now stays open while its request is in flight, so a second click
     could send a second POST. A ref for the guard, because two clicks land
     before a re-render; state for the busy button it draws. */
  const sharingRef = useRef(false);
  const [isSharing, setIsSharing] = useState(false);
  const setSharing = (sharing: boolean) => {
    sharingRef.current = sharing;
    setIsSharing(sharing);
  };

  /* The open photo, by src. It was an index into `allPhotos`, which shrinks
     when a tile fails to load and reorders when the community fetch lands: the
     open photo could vanish, the dialog unmounted while the index stayed set,
     the keydown handler below went on swallowing arrow keys page-wide, and the
     next arrow reopened a different photo. Derived, a src that leaves the list
     simply closes the lightbox. */
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  /* Which slug's first answer has arrived — ok, refused or unreachable. Until
     it has, the grid shows placeholder tiles rather than "No photos yet", so a
     photographed recipe never flashes empty. Keyed by slug rather than a bare
     boolean, so moving to another recipe starts loading again without a
     synchronous reset inside the effect. */
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const loaded = loadedSlug === slug;

  // Pull community photos & credits shared by other people from Supabase
  useEffect(() => {
    const controller = new AbortController();
    /* This device's own shares as the request leaves — see the prune below. */
    const askedWith = getLocalPhotos(slug);
    /* An outage is a 503 whose body is an error, not a list: the gallery
       settles empty rather than waiting for an answer that will not come. */
    fetch(`/api/community-photos?slug=${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setLoadedSlug(slug);
        if (data?.ok && Array.isArray(data.photos)) {
          const served: string[] = data.photos.filter((p: unknown): p is string => typeof p === 'string');
          setRemotePhotos(served);
          /* A photo a moderator has hidden is no longer served, but the
             contributor's device kept its own copy in localStorage and went
             on showing it. Forget the ones a live answer left out. Only those
             already stored when the request left: one shared since may have
             been inserted after the server read. Never offline, where the
             server serves nothing and this list is all there is. */
          if (data.source === 'supabase') {
            const gone = new Set(askedWith.filter((p) => !served.includes(p)));
            if (gone.size) setLocalPhotos(slug, getLocalPhotos(slug).filter((p) => !gone.has(p)));
          }
        }
        if (data?.ok && Array.isArray(data.credits)) {
          const map: Record<string, PhotoCredit> = {};
          for (const c of data.credits) {
            if (c?.url && typeof c.url === 'string') map[c.url] = c;
          }
          setRemoteCredits(map);
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setLoadedSlug(slug);
          console.error('Failed to load community photos:', err);
        }
      });
    return () => controller.abort();
  }, [slug]);

  const userPhotos = useMemo(
    () => [...new Set([...remotePhotos, ...localPhotos])],
    [remotePhotos, localPhotos],
  );

  /* Photographs whose bytes never arrived. A contribution is an arbitrary
     third-party URL that can rot at any time, so none can be trusted to still
     resolve. A dead src is dropped
     rather than drawn as a broken tile: the collage, the lightbox, its
     filmstrip and the frame counter all derive from `allPhotos`, so removing it
     here keeps every one of them consistent — and when the last photograph
     goes, the section stops rendering instead of standing empty. */
  const [failedPhotos, setFailedPhotos] = useState<ReadonlySet<string>>(() => new Set());

  const markPhotoFailed = useCallback((src: string) => {
    setFailedPhotos((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);

  const allPhotos = useMemo(
    () => userPhotos.filter((src) => !failedPhotos.has(src)),
    [userPhotos, failedPhotos],
  );

  const at = lightboxSrc === null ? -1 : allPhotos.indexOf(lightboxSrc);
  const lightboxIndex = at === -1 ? null : at;

  const openPhoto = useCallback((index: number | null) => {
    setLightboxSrc(index === null ? null : (allPhotos[index] ?? null));
  }, [allPhotos]);

  const nextPhoto = useCallback(() => {
    if (lightboxIndex !== null) openPhoto((lightboxIndex + 1) % allPhotos.length);
  }, [lightboxIndex, allPhotos.length, openPhoto]);

  const prevPhoto = useCallback(() => {
    if (lightboxIndex !== null) openPhoto((lightboxIndex - 1 + allPhotos.length) % allPhotos.length);
  }, [lightboxIndex, allPhotos.length, openPhoto]);

  // Keyboard navigation (Arrow keys to slide, Escape to close)
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        openPhoto(null);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextPhoto();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevPhoto();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxIndex, nextPhoto, prevPhoto, openPhoto]);

  /* The browser is still fetching the preview of the URL in the box. Submit
     waits for it rather than calling a photo that is merely slow "could not
     load" — the button is disabled meanwhile, which also stops Enter. */
  const previewPending = previewUrl !== null && preview?.src !== previewUrl;

  const handleUrlChange = (val: string) => {
    setInputUrl(val);
    setErrorMsg(null);
    const trimmed = val.trim();
    setPreviewUrl(
      trimmed.startsWith('https://') ? trimmed : null,
    );
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sharingRef.current) return;
    /* The route 401s without a session, so a signed-out submit could only be
       refused a round trip later. Ask for sign-in first. */
    if (!user) {
      openLoginModal();
      return;
    }
    const cleanUrl = inputUrl.trim();
    const cleanSocial = authorSocial.trim();

    if (!cleanUrl) {
      setErrorMsg(t('errUrlRequired'));
      return;
    }
    // https only, like the route: it refuses http://, and the page could not
    // load a mixed-content image anyway.
    if (!cleanUrl.startsWith('https://')) {
      setErrorMsg(t('errUrlScheme'));
      return;
    }
    // The route's list too: a Facebook or Instagram CDN link expires.
    if (isExpiringImageHost(cleanUrl)) {
      setErrorMsg(tCommunity('errors.expiringImageHost'));
      return;
    }
    if (cleanSocial && !cleanSocial.startsWith('http://') && !cleanSocial.startsWith('https://')) {
      setErrorMsg(t('errSocialScheme'));
      return;
    }
    /* Only a photograph the browser has actually decoded, at a size the large
       tile can use. A link to a web page, a dead file or a thumbnail would be
       stored and then dropped from the grid by its `onError`, or drawn as a
       smudge. Not yet decoded counts as not loaded. */
    if (previewPending && previewUrl === cleanUrl) return;
    const decoded = preview?.src === cleanUrl ? preview : null;
    if (!decoded?.ok) {
      setErrorMsg(decoded && decoded.width > 0 ? t('errPreviewSmall') : t('errPreviewLoad'));
      return;
    }

    /* The request first, and nothing local until it succeeds. This used to
       save the photo and close the form before asking, so a refusal set its
       error inside a form that was no longer on screen, and the photo stayed
       in the collage looking shared when nothing was. Now a refusal keeps the
       form open, with the reason in it. */
    setErrorMsg(null);
    setSharing(true);
    let body: { duplicate?: boolean } | null = null;
    try {
      const token = accessToken();
      const res = await fetch('/api/community-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          slug,
          imageUrl: cleanUrl,
          authorSocial: cleanSocial || undefined,
        }),
      });
      if (!res.ok) {
        /* The body carries a code, never a sentence. Rendering `data.error`
           directly is what put a Vietnamese string in front of English readers
           on every rate-limited share. Anything unrecognised falls back rather
           than reaching the screen raw. */
        const code = await communityErrorOf(res);
        setErrorMsg(tCommunity(`errors.${code}`));
        if (res.status === 401) openLoginModal();
        return;
      }
      body = await res.json().catch(() => null);
    } catch {
      setErrorMsg(tCommunity('errors.unknown'));
      return;
    } finally {
      setSharing(false);
    }

    // Save credit & photo locally, under the same name the server stored, so
    // it shows now and the credit does not change when the page is reloaded
    // from Supabase. A duplicate is a photo someone else already shared: the
    // server kept their credit, and a local one here would name this reader
    // over them on this device.
    setLocalPhotos(slug, [...new Set([cleanUrl, ...localPhotos])]);
    if (!body?.duplicate) {
      setLocalCredit(slug, {
        url: cleanUrl,
        authorName: user.name,
        authorSocial: cleanSocial || undefined,
      });
    }

    setInputUrl('');
    setAuthorSocial('');
    setPreviewUrl(null);
    setPreview(null);
    setIsFormOpen(false);
  };

  /* No remove control. A photo reaches `localPhotos` only after its POST
     succeeded, so every one of them is already a public `community_photos`
     row, and the route has no DELETE. The ✕ that used to sit here filtered
     localStorage and nothing else: the contributor saw the photo go while
     every other reader still saw it. An owner-scoped delete needs an author
     identity on the row, which the table does not have. */

  const handleContributePhotoClick = () => {
    const willOpen = !isFormOpen;
    setIsFormOpen(willOpen);
    if (!willOpen) return;
    // One frame, so the form exists to scroll to.
    requestAnimationFrame(() => {
      document
        .getElementById('contribute-photo-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const allCredits = useMemo(() => ({ ...remoteCredits, ...localCredits }), [remoteCredits, localCredits]);
  const currentLightboxSrc = lightboxIndex !== null ? allPhotos[lightboxIndex] : null;
  const currentLightboxCredit: PhotoCredit | undefined = currentLightboxSrc
    ? allCredits[currentLightboxSrc]
    : undefined;

  return (
    <section aria-labelledby="sample-photos" className="flex flex-col gap-4">
      <h2 id="sample-photos" className="text-title-3 font-semibold tracking-[-0.02em] text-ink">
        {t('samplePhotos')}
      </h2>

      {/* One grid: the readers' photographs, newest first and the first one
          the large tile, then the tile that adds one. Two columns on a phone,
          so the add tile sits beside a photograph instead of filling a screen
          of its own. Until the first answer arrives, neutral tiles hold the
          grid's shape; with none at all, the add tile is the whole grid. */}
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
        {allPhotos.map((src, i) => {
          const isHeroTile = i === 0;
          const credit = allCredits[src];

          return (
            <li key={src} className={`group relative ${isHeroTile ? 'col-span-2 sm:row-span-2' : ''}`}>
              <button
                type="button"
                onClick={() => openPhoto(i)}
                aria-label={t('zoomPhoto', { index: i + 1, title })}
                className={`group relative block w-full overflow-hidden rounded-lg cursor-zoom-in shadow-[var(--elevation-1)] transition-transform duration-300 ${
                  isHeroTile ? 'aspect-[4/3] sm:aspect-[16/10] h-full' : 'aspect-[4/3]'
                }`}
              >
                <Image
                  src={src}
                  alt={t('photoAlt', { title, index: i + 1 })}
                  fill
                  sizes={isHeroTile ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 1024px) 50vw, 33vw'}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  /* Every tile is a reader's URL: nothing to size, and
                     nothing preloaded on a third party's behalf. */
                  unoptimized
                  onError={() => markPhotoFailed(src)}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-void/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 sm:p-4">
                  <span className="self-start text-label font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-sm bg-void/70 text-ink backdrop-blur-[30px]">
                    {/* Every photograph is a reader's, the hero included:
                        the large slot is positional, not a featured shot. */}
                    {t('tagCommunity')}
                  </span>

                  <div className="flex items-end justify-between text-meta text-ink">
                    <div>
                      <span className="block truncate max-w-[80%] font-semibold">{title}</span>
                      {credit?.authorName && (
                        <span className="block mt-0.5 text-community">
                          {t('photoBy')} {credit.authorName}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold underline underline-offset-2 shrink-0">
                      {t('zoom')} ↗
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}

        {/* Still asking: neutral tiles in the grid's own shape, no copy. */}
        {!loaded && allPhotos.length === 0
          ? [0, 1].map((i) => (
              <li
                key={`placeholder-${i}`}
                aria-hidden
                className={`bg-glass rounded-lg ${i === 0 ? 'col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-[16/10] h-full' : 'aspect-[4/3]'}`}
              />
            ))
          : null}

        <li>
          <ContributeTile
            open={isFormOpen}
            label={isFormOpen ? t('cancel') : t('contributePhoto')}
            onClick={handleContributePhotoClick}
          />
        </li>
      </ul>

      {/* User Image Contribution Form with Author Credit & Social Link Inputs */}
      {isFormOpen && (
        <form
          id="contribute-photo-form"
          noValidate
          onSubmit={handleAddPhoto}
          className="surface p-5 sm:p-6 animate-fade-in flex flex-col gap-4"
        >
          {/* `noValidate`: `type="url"` stays for the phone keyboard, but the
              browser's own bubble — in the browser's language, not the page's —
              used to block the submit before the localised checks in
              `handleAddPhoto` could run. */}
          <h3 className="text-body-lg font-semibold text-ink">{t('formTitle')}</h3>

          {/* 1. Image URL (Required) */}
          <div>
            <label
              htmlFor="photo-url-input"
              className="block mb-1.5 text-body-sm font-semibold text-ink-muted"
            >
              {t('urlLabel')} <span className="text-danger">*</span>
            </label>
            <input
              id="photo-url-input"
              type="url"
              value={inputUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={t('urlPlaceholder')}
              className="surface-sunken w-full px-4 py-2.5 min-h-[var(--layout-touch-target)] text-body text-ink placeholder:text-ink-faint"
              required
            />
          </div>

          {/* 2. Credit — the name is the signed-in account, not a free-text
              field, so a photo cannot be credited to someone who did not post
              it. Only the social link is the contributor's to fill in. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block mb-1.5 text-body-sm font-semibold text-ink-muted">
                {t('authorLabel')}
              </span>
              <p className="surface-sunken w-full px-4 py-2.5 min-h-[var(--layout-touch-target)] flex items-center text-body text-ink-muted">
                {user?.name ?? ''}
              </p>
            </div>

            <div>
              <label
                htmlFor="author-social-input"
                className="block mb-1.5 text-body-sm font-semibold text-ink-muted"
              >
                {t('socialLabel')}
              </label>
              <input
                id="author-social-input"
                type="url"
                value={authorSocial}
                onChange={(e) => setAuthorSocial(e.target.value)}
                placeholder="https://instagram.com/username"
                className="surface-sunken w-full px-4 py-2.5 min-h-[var(--layout-touch-target)] text-body text-ink placeholder:text-ink-faint"
              />
            </div>
          </div>

          {errorMsg && (
            <p role="alert" className="text-body-sm text-danger mt-1">
              {errorMsg}
            </p>
          )}

          {/* Live Preview Card */}
          {previewUrl && (
            <div className="flex flex-col gap-1.5">
              <span className="text-body-sm text-ink-muted">{t('previewLabel')}</span>
              <div className="relative w-full aspect-[16/9] max-h-48 overflow-hidden rounded-md bg-void/60 shadow-[var(--elevation-1)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user URL */}
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt={t('previewAlt')}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    const width = e.currentTarget.naturalWidth;
                    const ok = width >= MIN_PREVIEW_WIDTH;
                    setPreview({ src: previewUrl, ok, width });
                    if (!ok) setErrorMsg(t('errPreviewSmall'));
                  }}
                  onError={() => {
                    setPreview({ src: previewUrl, ok: false, width: 0 });
                    setErrorMsg(t('errPreviewLoad'));
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setErrorMsg(null);
                setPreviewUrl(null);
                setPreview(null);
              }}
              className="min-h-[var(--layout-touch-target)] px-3 text-body font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSharing || previewPending}
              aria-busy={isSharing || previewPending || undefined}
              className="btn-accent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('addToGallery')}
            </button>
          </div>
        </form>
      )}

      {/* Lightbox Zoom Filmstrip Slider Modal */}
      {lightboxIndex !== null && currentLightboxSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('lightboxLabel')}
          onClick={() => openPhoto(null)}
          className="fixed inset-0 z-50 bg-void/85 backdrop-blur-[30px] animate-fade-in flex flex-col items-center justify-between p-4 sm:p-8 cursor-zoom-out select-none"
        >
          {/* Header Bar */}
          <div
            className="surface w-full max-w-5xl flex items-center justify-between z-20 px-4 py-2.5 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-body font-semibold text-ink truncate">{title}</span>
              <span className="text-label font-medium px-2.5 py-1 rounded-sm bg-white/8 text-ink shrink-0 shadow-[var(--elevation-spec)]">
                {t('frame', { index: lightboxIndex + 1 })} / {allPhotos.length}
              </span>
            </div>

            <button
              type="button"
              autoFocus
              onClick={() => openPhoto(null)}
              aria-label={t('close')}
              className="btn-glass w-11 h-11 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          {/* Filmstrip Carousel Container */}
          <div className="relative w-full max-w-7xl max-h-[78dvh] flex items-center justify-center gap-3 sm:gap-6 my-auto px-2">
            {/* Left Preview Film Tile (Previous Photo) */}
            {allPhotos.length > 1 && (
              <button
                type="button"
                aria-label={t('prev')}
                title={t('prev')}
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                className="hidden md:flex flex-col items-center justify-center shrink-0 w-32 lg:w-44 aspect-[4/3] rounded-lg overflow-hidden bg-void/60 opacity-40 hover:opacity-85 scale-80 hover:scale-90 transition-all duration-300 ease-out cursor-pointer shadow-[var(--elevation-2)] group backdrop-blur-[30px] relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary URL */}
                <img
                  src={sized(
                    allPhotos[(lightboxIndex - 1 + allPhotos.length) % allPhotos.length],
                    256,
                  )}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-void/70 to-transparent flex items-center justify-start p-3">
                  <span className="text-ink text-title-2 font-semibold group-hover:-translate-x-0.5 transition-transform">
                    ‹
                  </span>
                </div>
                <span className="absolute bottom-2 left-2 text-meta px-2 py-0.5 rounded-sm bg-void/70 text-ink">
                  #{(lightboxIndex - 1 + allPhotos.length) % allPhotos.length + 1}
                </span>
              </button>
            )}

            {/* Mobile Previous Button */}
            {allPhotos.length > 1 && (
              <button
                type="button"
                aria-label={t('prev')}
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                className="btn-glass md:hidden absolute left-2 z-30 w-11 h-11 flex items-center justify-center text-title-3 active:scale-95 cursor-pointer"
              >
                ‹
              </button>
            )}

            {/* Main Center Active High-Res Photo */}
            <div
              className="relative flex-1 max-w-4xl h-full flex flex-col items-center justify-center z-20 cursor-zoom-out"
              onClick={() => openPhoto(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary URL */}
              <img
                key={currentLightboxSrc}
                src={sized(currentLightboxSrc, 1200)}
                alt={t('photoAlt', { title, index: lightboxIndex + 1 })}
                decoding="async"
                className="max-w-full max-h-[72dvh] object-contain rounded-lg shadow-[var(--elevation-3)]"
              />

              {/* Author Credit Badge Overlay in Lightbox */}
              {currentLightboxCredit?.authorName && (
                <div
                  className="surface mt-3 px-4 py-2 text-body-sm flex items-center gap-2 cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-community">{t('photoBy')}</span>
                  {currentLightboxCredit.authorSocial ? (
                    <a
                      href={currentLightboxCredit.authorSocial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-community underline underline-offset-2 font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>{currentLightboxCredit.authorName}</span>
                      <span aria-hidden>↗</span>
                    </a>
                  ) : (
                    <span className="text-ink font-semibold">{currentLightboxCredit.authorName}</span>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Next Button */}
            {allPhotos.length > 1 && (
              <button
                type="button"
                aria-label={t('next')}
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                className="btn-glass md:hidden absolute right-2 z-30 w-11 h-11 flex items-center justify-center text-title-3 active:scale-95 cursor-pointer"
              >
                ›
              </button>
            )}

            {/* Right Preview Film Tile (Next Photo) */}
            {allPhotos.length > 1 && (
              <button
                type="button"
                aria-label={t('next')}
                title={t('next')}
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                className="hidden md:flex flex-col items-center justify-center shrink-0 w-32 lg:w-44 aspect-[4/3] rounded-lg overflow-hidden bg-void/60 opacity-40 hover:opacity-85 scale-80 hover:scale-90 transition-all duration-300 ease-out cursor-pointer shadow-[var(--elevation-2)] group backdrop-blur-[30px] relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary URL */}
                <img
                  src={sized(allPhotos[(lightboxIndex + 1) % allPhotos.length], 256)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-void/70 to-transparent flex items-center justify-end p-3">
                  <span className="text-ink text-title-2 font-semibold group-hover:translate-x-0.5 transition-transform">
                    ›
                  </span>
                </div>
                <span className="absolute bottom-2 right-2 text-meta px-2 py-0.5 rounded-sm bg-void/70 text-ink">
                  #{(lightboxIndex + 1) % allPhotos.length + 1}
                </span>
              </button>
            )}
          </div>

          {/* Filmstrip Thumbnail Track & Navigation Bar */}
          <div
            className="surface w-full max-w-5xl flex items-center justify-between flex-wrap gap-3 z-20 px-4 py-2 text-meta text-ink-muted cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Filmstrip Thumbnails Row.

                A rail that must never advertise its overflow — the indicator is
                hidden, the scrolling is not. */}
            <div className="scroll-silent flex items-center gap-2 overflow-x-auto py-0.5 max-w-full">
              {allPhotos.map((thumbSrc, idx) => (
                <button
                  key={thumbSrc}
                  type="button"
                  aria-label={t('goTo', { index: idx + 1 })}
                  aria-current={idx === lightboxIndex ? 'true' : undefined}
                  onClick={() => openPhoto(idx)}
                  /* The current frame is a fill and a lift, never a ring. */
                  className={`relative shrink-0 w-12 h-9 rounded-sm overflow-hidden transition-all duration-300 cursor-pointer ${
                    idx === lightboxIndex
                      ? 'scale-110 shadow-[var(--elevation-2)]'
                      : 'opacity-40 hover:opacity-80 hover:scale-105'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary URL */}
                  <img
                    src={sized(thumbSrc, 256)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
