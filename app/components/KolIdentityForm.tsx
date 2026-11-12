"use client";

import { useEffect, useId, useRef, useState } from "react";
import { kolStudio, profile as T } from "@/app/content";
import { useSession } from "@/lib/auth";
import { cleanLink, LIMITS, useProfile, writeProfile } from "@/lib/profile";
import { draftIdentity, HANDLE, HANDLE_MAX, imageProblem, type IdentityDraft, KOL_IMAGE_TYPES, KOL_LIMITS, KolError, saveProfile, uploadImage } from "@/lib/kol";
import { InfoTip } from "./InfoTip";
import { useKol } from "./KolContext";
import { toSlug } from "@/lib/slug";

// Đường dẫn /kol/sua đã thành chuyển hướng, nhưng tên này vẫn bị giữ (xem lib/legacyRedirects.ts).
const RESERVED = "sua";

const field = "h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const secondary = "inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";

type Draft = IdentityDraft & { linkError: boolean };

/**
 * Form Giới thiệu của KOL trên /tai-khoan: tên đường dẫn, tên hiển thị, giới thiệu, liên kết, ảnh đại diện. Không có ảnh bìa (nút Đổi ảnh bìa lo việc đó).
 * Điền sẵn bằng draftIdentity. Lưu một lần: saveProfile trước (ảnh bìa và ảnh mẫu lấy từ hồ sơ hiện có), chỉ khi thành công mới writeProfile trên máy.
 * Ảnh đại diện tải qua run, cùng cờ bận với lưu. Mở form thì con trỏ vào ô tên đường dẫn.
 */
export function KolIdentityForm({ userId, onDone, onCancel }: { userId: string; onDone: () => void; onCancel: () => void }) {
  const uid = useId();
  const session = useSession();
  const local = useProfile();
  const { profile: current, setProfile, run, writing } = useKol();
  const [d, setD] = useState<Draft>(() => {
    const init = draftIdentity(local, current, session?.user ?? null);
    return { ...init, links: init.links.length ? init.links : [""], linkError: false };
  });
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const handleInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    handleInput.current?.focus();
  }, []);

  const set = (patch: Partial<Draft>) => setD((p) => ({ ...p, ...patch }));

  const reserved = d.handle === RESERVED;
  const handleMessage = reserved ? kolStudio.handleReserved : handleError;
  const canSave = HANDLE.test(d.handle) && !reserved && d.name.trim() !== "" && !writing;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      setImageError(problem === "type" ? kolStudio.imageType : kolStudio.imageSize);
      return;
    }
    await run(async () => {
      setUploading(true);
      setImageError(null);
      try {
        set({ avatar: await uploadImage(userId, file) });
      } catch {
        setImageError(kolStudio.uploadFailed);
      } finally {
        setUploading(false);
      }
    });
  };

  const save = async () => {
    if (!canSave) return;
    const links: string[] = [];
    for (const l of d.links.map((x) => x.trim()).filter(Boolean)) {
      const url = cleanLink(l);
      if (!url) {
        set({ linkError: true });
        return;
      }
      links.push(url);
    }
    const handle = d.handle;
    const name = d.name.trim();
    const bio = d.bio.trim();
    setNote(null);
    setHandleError(null);
    await run(async () => {
      try {
        const saved = await saveProfile(userId, { handle, name, bio, link: links[0], avatar: d.avatar, cover: current?.cover, photos: current?.photos ?? [] });
        setProfile(saved);
        writeProfile({ username: handle, bio, links });
        onDone();
      } catch (e) {
        if (e instanceof KolError && e.status === 409) setHandleError(kolStudio.handleTaken);
        else setNote(kolStudio.saveFailed);
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      aria-label={T.edit}
      className="mt-4 space-y-5"
    >
      <div>
        <div className="flex items-center gap-1">
          <label htmlFor={`${uid}-u`} className="text-subhead font-semibold text-label">
            {kolStudio.handle}
          </label>
          <InfoTip entry={kolStudio.handleTip} />
        </div>
        <div className="relative mt-2">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-callout text-secondary">
            @
          </span>
          <input
            ref={handleInput}
            id={`${uid}-u`}
            value={d.handle}
            maxLength={HANDLE_MAX}
            aria-invalid={Boolean(handleMessage)}
            aria-describedby={handleMessage ? `${uid}-uh` : undefined}
            autoComplete="off"
            onChange={(e) => {
              set({ handle: toSlug(e.target.value, HANDLE_MAX) });
              setHandleError(null);
            }}
            className={`${field} pl-7`}
          />
        </div>
        {handleMessage && (
          <p id={`${uid}-uh`} className="mt-2 text-footnote font-medium text-danger">
            {handleMessage}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${uid}-m`} className="block text-subhead font-semibold text-label">
          {kolStudio.name}
        </label>
        <input id={`${uid}-m`} value={d.name} maxLength={KOL_LIMITS.name} onChange={(e) => set({ name: e.target.value })} className={`${field} mt-2`} />
      </div>

      <div>
        <label htmlFor={`${uid}-b`} className="block text-subhead font-semibold text-label">
          {T.bio}
        </label>
        <textarea
          id={`${uid}-b`}
          rows={3}
          value={d.bio}
          maxLength={KOL_LIMITS.bio}
          placeholder={T.bioPlaceholder}
          onChange={(e) => set({ bio: e.target.value })}
          className="mt-2 block w-full rounded-control border border-separator bg-card px-3 py-2.5 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>

      <fieldset>
        <legend className="text-subhead font-semibold text-label">{T.links}</legend>
        <ul className="mt-2 space-y-2">
          {d.links.map((l, i) => (
            <li key={i} className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                aria-label={`${T.links} ${i + 1}`}
                aria-invalid={d.linkError && !!l.trim() && !cleanLink(l)}
                maxLength={KOL_LIMITS.link}
                value={l}
                placeholder={T.linkPlaceholder}
                onChange={(e) => set({ linkError: false, links: d.links.map((x, j) => (j === i ? e.target.value : x)) })}
                className={field}
              />
              <button type="button" aria-label={T.removeLink} onClick={() => set({ links: d.links.filter((_, j) => j !== i) })} className="grid size-11 shrink-0 place-items-center rounded-full text-label transition-colors hover:bg-fill">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        {d.linkError && <p className="mt-2 text-footnote font-medium text-danger">{T.badLink}</p>}
        {d.links.length < LIMITS.links && (
          <button type="button" onClick={() => set({ links: [...d.links, ""] })} className={`${secondary} mt-3`}>
            {T.addLink}
          </button>
        )}
      </fieldset>

      <div>
        <span className="block text-subhead font-semibold text-label">{kolStudio.avatar}</span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {d.avatar ? (
            <img src={d.avatar} alt="" width={64} height={64} referrerPolicy="no-referrer" className="size-16 shrink-0 rounded-full bg-fill object-cover" />
          ) : (
            <span aria-hidden="true" className="size-16 shrink-0 rounded-full bg-fill" />
          )}
          <button type="button" onClick={() => avatarInput.current?.click()} disabled={writing} className={secondary}>
            {kolStudio.pickImage}
          </button>
          {d.avatar && (
            <button type="button" onClick={() => set({ avatar: undefined })} disabled={writing} className={secondary}>
              {kolStudio.removeImage}
            </button>
          )}
        </div>
        {imageError && (
          <p role="alert" className="mt-2 text-footnote font-medium text-danger">
            {imageError}
          </p>
        )}
      </div>

      <input
        ref={avatarInput}
        type="file"
        accept={KOL_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="flex flex-col gap-3 border-t border-separator pt-5">
        <p aria-live="polite" className={`text-footnote font-semibold ${note ? "text-danger" : "text-secondary"}`}>
          {uploading ? kolStudio.uploading : writing ? kolStudio.saving : note}
        </p>
        <div className="flex gap-3">
          <button type="submit" disabled={!canSave} className={secondary}>
            {T.save}
          </button>
          <button type="button" onClick={onCancel} disabled={writing} className="inline-flex h-11 items-center rounded-full px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill disabled:opacity-40">
            {T.cancel}
          </button>
        </div>
      </div>
    </form>
  );
}
