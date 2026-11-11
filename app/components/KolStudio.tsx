"use client";

import { useEffect, useId, useRef, useState } from "react";
import { kol, kolSets, kolStudio, profile } from "@/app/content";
import { authReady, signIn, useSession } from "@/lib/auth";
import { cleanLink } from "@/lib/profile";
import { deleteSet, getMyKol, googleAvatar, imageProblem, KOL_IMAGE_TYPES, KOL_LIMITS, KolError, listMySets, saveProfile, uploadImage, useIsKol, type KolProfile, type RemoteSet } from "@/lib/kol";
import { validatePresetSets } from "@/lib/presetSets";
import presetSetsJson from "@/data/preset-sets.json";
import { InfoTip } from "./InfoTip";
import { KolSetEditor, toSlug } from "./KolSetEditor";

const HANDLE = /^[a-z0-9-]{1,30}$/;
const HANDLE_MAX = 30;
// Đường dẫn /kol/sua là trang quản lý nên KOL không được lấy tên này.
const RESERVED = "sua";
// Id bộ đã có trong repo: bộ KOL không được trùng.
const TAKEN: ReadonlySet<string> = new Set(validatePresetSets(presetSetsJson).map((s) => s.id));

const field = "h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const primary = "inline-flex h-11 items-center rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-40";
const secondary = "inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";
const card = "overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator";
const heading = "text-footnote font-medium text-secondary";
const segment = (on: boolean) => `flex-1 h-11 rounded-badge text-subhead font-medium transition ${on ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"}`;
const line = "mt-4 max-w-xl text-body text-secondary";

type Filter = "all" | "draft" | "public";
const FILTER_LABEL: Record<Filter, string> = { all: kolStudio.filterAll, draft: kolStudio.filterDraft, public: kolStudio.filterPublic };

/** /kol/sua: chưa đăng nhập thì mời đăng nhập; không phải KOL thì một dòng trung tính; là KOL thì quản lý hồ sơ và bộ. */
export function KolStudio() {
  const session = useSession();
  const userId = session?.user.id;
  const isKol = useIsKol(userId);

  return (
    <>
      <h1 className="text-title font-normal">{kolStudio.title}</h1>
      {!userId ? (
        <>
          <p className={line}>{kolStudio.signedOut}</p>
          {authReady && (
            <button type="button" onClick={signIn} className={`${primary} mt-4`}>
              {kolStudio.signIn}
            </button>
          )}
        </>
      ) : isKol === undefined ? (
        <p className={line}>{kol.loading}</p>
      ) : isKol ? (
        <Studio userId={userId} />
      ) : (
        <p className={line}>{kolStudio.notKol}</p>
      )}
    </>
  );
}

/**
 * Hồ sơ và danh sách bộ. Chưa có hồ sơ thì chỉ hiện form hồ sơ; lưu xong lần đầu thì hiện bộ ngay, không tải lại trang.
 * Lỗi tải hồ sơ thì báo và có nút thử lại, không hiện form. Khi soạn bộ thì ẩn hồ sơ (giữ nguyên chữ đang nhập).
 */
function Studio({ userId }: { userId: string }) {
  const [load, setLoad] = useState<{ status: "loading" } | { status: "error" } | { status: "ok"; profile: KolProfile | null }>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<{ set?: RemoteSet } | null>(null);

  useEffect(() => {
    let live = true;
    getMyKol(userId).then(
      (profile) => {
        if (live) setLoad({ status: "ok", profile });
      },
      () => {
        if (live) setLoad({ status: "error" });
      },
    );
    return () => {
      live = false;
    };
  }, [userId, attempt]);

  if (load.status === "loading") return <p className={line}>{kol.loading}</p>;
  if (load.status === "error")
    return (
      <>
        <p className={line}>{kolStudio.loadFailed}</p>
        <button
          type="button"
          onClick={() => {
            setLoad({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
          className={`${primary} mt-4`}
        >
          {kolStudio.retry}
        </button>
      </>
    );

  const profile = load.profile;
  return (
    <>
      <div hidden={editing !== null}>
        <ProfileForm userId={userId} initial={profile} onSaved={(saved) => setLoad({ status: "ok", profile: saved })} />
      </div>
      {profile &&
        (editing ? (
          <KolSetEditor key={editing.set?.id ?? "new"} userId={userId} initial={editing.set} taken={TAKEN} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
        ) : (
          <MySets userId={userId} onEdit={(set) => setEditing({ set })} onNew={() => setEditing({})} />
        ))}
    </>
  );
}

/** Hồ sơ KOL: tên đường dẫn, tên, giới thiệu, liên kết, ảnh đại diện, ảnh bìa, ảnh mẫu (tối đa 12). */
function ProfileForm({ userId, initial, onSaved }: { userId: string; initial: KolProfile | null; onSaved: (saved: KolProfile) => void }) {
  const uid = useId();
  const [handle, setHandle] = useState(initial?.handle ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const session = useSession();
  const [avatar, setAvatar] = useState(initial?.avatar ?? googleAvatar(session?.user.avatar));
  const [cover, setCover] = useState(initial?.cover);
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const reserved = handle === RESERVED;
  const canSave = HANDLE.test(handle) && !reserved && name.trim() !== "" && !saving && !uploading;
  const photosFull = photos.length >= KOL_LIMITS.photos;

  const pick = async (file: File | undefined, put: (url: string) => void) => {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      setImageError(problem === "type" ? kolStudio.imageType : kolStudio.imageSize);
      return;
    }
    setUploading(true);
    setImageError(null);
    try {
      put(await uploadImage(userId, file));
    } catch {
      setImageError(kolStudio.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!canSave) return;
    const url = link.trim() ? cleanLink(link) : null;
    if (link.trim() && !url) {
      setNote({ ok: false, text: profile.badLink });
      return;
    }
    setSaving(true);
    setNote(null);
    setHandleError(null);
    try {
      const saved = await saveProfile(userId, { handle, name: name.trim(), bio: bio.trim(), link: url ?? undefined, avatar, cover, photos });
      setNote({ ok: true, text: kolStudio.saved });
      onSaved(saved);
    } catch (e) {
      if (e instanceof KolError && e.status === 409) setHandleError(kolStudio.handleTaken);
      else setNote({ ok: false, text: kolStudio.saveFailed });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby={`${uid}-h`} className="mt-6">
      <h2 id={`${uid}-h`} className={`mb-1.5 px-4 ${heading}`}>
        {kolStudio.profileTitle}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-5 rounded-card bg-card p-6 shadow-card sm:p-8"
      >
        <div>
          <div className="flex items-center gap-1">
            <label htmlFor={`${uid}-u`} className="text-subhead font-semibold text-label">
              {kolStudio.handle}
            </label>
            <InfoTip entry={kolStudio.handleTip} />
          </div>
          <div className="relative mt-2 max-w-md">
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-callout text-secondary">
              @
            </span>
            <input
              id={`${uid}-u`}
              value={handle}
              maxLength={HANDLE_MAX}
              aria-invalid={reserved}
              autoComplete="off"
              onChange={(e) => {
                setHandle(toSlug(e.target.value, HANDLE_MAX));
                setHandleError(null);
              }}
              className={`${field} pl-7`}
            />
          </div>
          {reserved && <p className="mt-2 text-footnote font-medium text-danger">{kolStudio.handleReserved}</p>}
          {handleError && <p className="mt-2 text-footnote font-medium text-danger">{handleError}</p>}
        </div>

        <div>
          <label htmlFor={`${uid}-m`} className="text-subhead font-semibold text-label">
            {kolStudio.name}
          </label>
          <input id={`${uid}-m`} value={name} maxLength={KOL_LIMITS.name} onChange={(e) => setName(e.target.value)} className={`${field} mt-2 max-w-md`} />
        </div>

        <div>
          <label htmlFor={`${uid}-b`} className="text-subhead font-semibold text-label">
            {kolStudio.bio}
          </label>
          <textarea
            id={`${uid}-b`}
            rows={3}
            value={bio}
            maxLength={KOL_LIMITS.bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-2 block w-full max-w-2xl rounded-control border border-separator bg-card px-3 py-2.5 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-l`} className="text-subhead font-semibold text-label">
            {kolStudio.link}
          </label>
          <input id={`${uid}-l`} type="url" inputMode="url" value={link} maxLength={KOL_LIMITS.link} onChange={(e) => setLink(e.target.value)} className={`${field} mt-2 max-w-2xl`} />
        </div>

        <div>
          <span className="block text-subhead font-semibold text-label">{kolStudio.avatar}</span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="" width={64} height={64} referrerPolicy="no-referrer" className="size-16 shrink-0 rounded-full bg-fill object-cover" />
            ) : (
              <span aria-hidden="true" className="size-16 shrink-0 rounded-full bg-fill" />
            )}
            <button type="button" onClick={() => avatarInput.current?.click()} disabled={uploading} className={secondary}>
              {kolStudio.pickImage}
            </button>
            {avatar && (
              <button type="button" onClick={() => setAvatar(undefined)} className={secondary}>
                {kolStudio.removeImage}
              </button>
            )}
          </div>
        </div>

        <div>
          <span className="block text-subhead font-semibold text-label">{kolStudio.cover}</span>
          {cover && <img src={cover} alt="" referrerPolicy="no-referrer" className="mt-2 aspect-[3/1] w-full max-w-md rounded-card bg-fill object-cover" />}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => coverInput.current?.click()} disabled={uploading} className={secondary}>
              {kolStudio.pickImage}
            </button>
            {cover && (
              <button type="button" onClick={() => setCover(undefined)} className={secondary}>
                {kolStudio.removeImage}
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span className="text-subhead font-semibold text-label">{kolStudio.photoList}</span>
            <InfoTip entry={kolStudio.photoTip} />
          </div>
          {photos.length > 0 && (
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((src, i) => (
                <li key={`${i}-${src}`} className="min-w-0">
                  <img src={src} alt={kol.photoAlt(i + 1, name.trim() || handle)} loading="lazy" className="aspect-square w-full rounded-control bg-fill object-cover" />
                  <button type="button" aria-label={kolStudio.removePhoto(i + 1)} onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className={`${secondary} mt-1 w-full justify-center`}>
                    {kolStudio.remove}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => photoInput.current?.click()} disabled={uploading || photosFull} className={secondary}>
              {kolStudio.pickImage}
            </button>
            {photosFull && <span className="text-footnote text-secondary">{kolStudio.photoLimit}</span>}
          </div>
        </div>

        {uploading && (
          <p aria-live="polite" className="text-footnote text-secondary">
            {kolStudio.uploading}
          </p>
        )}
        {imageError && <p role="alert" className="text-footnote font-medium text-danger">{imageError}</p>}

        <input ref={avatarInput} type="file" accept={KOL_IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => { void pick(e.target.files?.[0], setAvatar); e.target.value = ""; }} />
        <input ref={coverInput} type="file" accept={KOL_IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => { void pick(e.target.files?.[0], setCover); e.target.value = ""; }} />
        <input ref={photoInput} type="file" accept={KOL_IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => { void pick(e.target.files?.[0], (url) => setPhotos((p) => [...p, url])); e.target.value = ""; }} />

        <div className="flex flex-wrap items-center gap-3 border-t border-separator pt-5">
          <button type="submit" disabled={!canSave} className={primary}>
            {kolStudio.save}
          </button>
          {note && <span aria-live="polite" className={`text-footnote font-semibold ${note.ok ? "text-success" : "text-danger"}`}>{note.text}</span>}
        </div>
      </form>
    </section>
  );
}

/** Bộ của tôi, gồm nháp. Mỗi lần mở trang tải lại; lỗi thì báo, không hiện danh sách rỗng. */
function MySets({ userId, onEdit, onNew }: { userId: string; onEdit: (set: RemoteSet) => void; onNew: () => void }) {
  const uid = useId();
  const [rev, setRev] = useState(0);
  const [loaded, setLoaded] = useState<{ rev: number; sets: RemoteSet[] | null } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<RemoteSet | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let live = true;
    listMySets(userId, TAKEN).then(
      (sets) => {
        if (live) setLoaded({ rev, sets });
      },
      () => {
        if (live) setLoaded({ rev, sets: null });
      },
    );
    return () => {
      live = false;
    };
  }, [userId, rev]);

  const sets = loaded?.rev === rev ? loaded.sets : undefined;
  const rows = (sets ?? []).filter((s) => filter === "all" || (filter === "public" ? s.published : !s.published));

  const ask = (set: RemoteSet) => {
    setPending(set);
    dialog.current?.showModal();
  };

  const remove = async () => {
    if (!pending) return;
    setRemoving(true);
    setError(null);
    try {
      await deleteSet(pending.id);
      setRev((r) => r + 1);
    } catch {
      setError(kolStudio.removeFailed);
    } finally {
      setRemoving(false);
      dialog.current?.close();
    }
  };

  return (
    <section aria-labelledby={`${uid}-s`} className="mt-8">
      <div className="mb-1.5 flex items-center justify-between gap-3 px-4">
        <h2 id={`${uid}-s`} className={heading}>
          {kolStudio.mySets}
        </h2>
        <button type="button" onClick={onNew} className={secondary}>
          {kolStudio.newSet}
        </button>
      </div>
      <div role="group" aria-labelledby={`${uid}-s`} className="mx-4 flex max-w-xs gap-1 rounded-control bg-fill p-1">
        {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={segment(filter === f)}>
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {sets === undefined ? (
          <p className="px-4 text-body text-secondary">{kolSets.loading}</p>
        ) : sets === null ? (
          <div className="px-4">
            <p className="text-body text-secondary">{kolStudio.loadFailed}</p>
            <button type="button" onClick={() => setRev((r) => r + 1)} className={`${secondary} mt-3`}>
              {kolStudio.retry}
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 text-body text-secondary">{kolStudio.emptySets}</p>
        ) : (
          <ul className={card}>
            {rows.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
                <span className="min-w-0 flex-1 text-body text-label">{s.name}</span>
                <span className="shrink-0 text-footnote text-secondary">{s.published ? kolStudio.public : kolStudio.draft}</span>
                <button type="button" onClick={() => onEdit(s)} className={secondary}>
                  {kolStudio.edit}
                </button>
                <button type="button" onClick={() => ask(s)} className={secondary}>
                  {kolStudio.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p role="alert" className="mt-3 px-4 text-footnote font-medium text-danger">{error}</p>}
      </div>

      <dialog
        ref={dialog}
        aria-labelledby={`${uid}-rm`}
        onClose={() => setPending(null)}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-full max-w-sm rounded-card bg-card p-6 text-label shadow-card"
      >
        {pending && (
          <>
            <h3 id={`${uid}-rm`} className="text-title3 font-normal">
              {kolStudio.removeTitle(pending.name)}
            </h3>
            <p className="mt-2 text-body text-label">{kolStudio.removeBody}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => dialog.current?.close()} className={secondary}>
                {kolStudio.keep}
              </button>
              <button type="button" onClick={remove} disabled={removing} className="inline-flex h-11 items-center rounded-full bg-danger-fill px-5 text-subhead font-semibold text-danger transition-colors hover:opacity-80 disabled:opacity-40">
                {kolStudio.removeConfirm}
              </button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
