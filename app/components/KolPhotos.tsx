"use client";

import { useEffect, useId, useRef, useState } from "react";
import { kol, kolStudio } from "@/app/content";
import { imageProblem, KOL_IMAGE_TYPES, KOL_LIMITS, photoNote, photoUrl, savePhotos, uploadImage, type KolPhoto, type PhotoNote } from "@/lib/kol";
import { InfoTip } from "./InfoTip";
import { KolLoadState, noteTooLong, useKol } from "./KolContext";
import { PhotoNoteEditor } from "./PhotoNoteEditor";

const card = "rounded-card bg-card p-5 shadow-card sm:p-6";
const field = "h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const secondary = "inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";
// Nút dưới mỗi ảnh mẫu: ô hẹp (3 cột trên điện thoại) nên đệm ngang nhỏ hơn secondary.
const tile = "inline-flex h-11 w-full min-w-0 items-center justify-center rounded-full bg-fill px-2 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";

/** Link có mở được như ảnh không: tải thử bằng Image, không gửi Referer. Quá 10 giây hoặc lỗi thì false. */
function loadsAsImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const finish = (ok: boolean) => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), 10000);
    img.referrerPolicy = "no-referrer";
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
  });
}

/**
 * Tab Ảnh mẫu của /tai-khoan (chỉ KOL, tối đa 12 ảnh). Thêm bằng link (https, tải thử được) hoặc tải lên; ghi chú mở ngay dưới lưới.
 * Mỗi thay đổi ghi ngay qua run, không cần nút Lưu. Chưa có hồ sơ thì một câu chỉ dẫn lên mục Giới thiệu.
 */
export function KolPhotos() {
  const uid = useId();
  const { status, userId, profile, update, run, writing } = useKol();
  const photoInput = useRef<HTMLInputElement>(null);
  const noteOpener = useRef<HTMLElement | null>(null); // nút Ghi chú vừa bấm
  const [photoLink, setPhotoLink] = useState("");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoState, setPhotoState] = useState<"idle" | "checking" | "saving" | "saved">("idle");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [noteUrl, setNoteUrl] = useState<string | null>(null); // theo url để xóa ảnh khác không làm lệch
  // Đóng ô ghi chú thì trả focus về nút đã mở. Sau effect, nút đã enable lại; nếu nút đã bị xóa khỏi DOM thì focus() không làm gì.
  useEffect(() => {
    if (noteUrl === null) noteOpener.current?.focus();
  }, [noteUrl]);

  if (status === "loading" || status === "failed") return <section className={card}><KolLoadState /></section>;
  if (!userId || !profile) {
    return (
      <section className={card}>
        <p className="text-body text-secondary">{kolStudio.photosNoProfile}</p>
      </section>
    );
  }

  const photos = profile.photos;
  const photosFull = photos.length >= KOL_LIMITS.photos;
  // Ảnh mẫu và lưu hồ sơ không chạy chồng nhau (run khóa chung): hồ sơ gửi cả danh sách ảnh, ghi chồng sẽ đè mất ảnh mới.
  const busy = writing || uploading || photoState === "checking" || photoState === "saving";
  const noteAt = photos.findIndex((p) => p.url === noteUrl);

  // Ghi danh sách ảnh; người gọi đã giữ khóa run. Lỗi thì trả danh sách cũ và báo. Trả true khi ảnh được giữ.
  const commit = async (next: KolPhoto[]): Promise<boolean> => {
    const prev = photos;
    update((p) => ({ ...p, photos: next }));
    setPhotoState("saving");
    setPhotoError(null);
    try {
      await savePhotos(userId, next);
      setPhotoState("saved");
      return true;
    } catch (e) {
      update((p) => ({ ...p, photos: prev }));
      setPhotoState("idle");
      setPhotoError(noteTooLong(e) ? kolStudio.noteTooLong : kolStudio.saveFailed);
      return false;
    }
  };

  const persist = async (next: KolPhoto[]): Promise<boolean> => {
    let ok = false;
    const ran = await run(async () => {
      ok = await commit(next);
    });
    if (!ran) setPhotoState("idle");
    return ok;
  };

  // Tải ảnh lên rồi ghi ngay, trong cùng một lượt khóa.
  const pickPhoto = async (file: File | undefined) => {
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
        const url = await uploadImage(userId, file);
        await commit([...photos, { url }]);
      } catch {
        setImageError(kolStudio.uploadFailed);
      } finally {
        setUploading(false);
      }
    });
  };

  // Thêm từ link: https, không trùng, chưa đầy, và tải được như ảnh. Enter cũng gọi đây, không gửi form.
  const addLink = async () => {
    if (busy) return;
    const url = photoUrl(photoLink.trim());
    if (!url) {
      setPhotoError(kolStudio.photoNeedsHttps);
      return;
    }
    if (photos.some((p) => p.url === url)) {
      setPhotoError(kolStudio.photoDuplicate);
      return;
    }
    if (photosFull) {
      setPhotoError(kolStudio.photoLimit);
      return;
    }
    setPhotoError(null);
    setPhotoState("checking");
    if (!(await loadsAsImage(url))) {
      setPhotoState("idle");
      setPhotoError(kolStudio.photoNotImage);
      return;
    }
    if (await persist([...photos, { url }])) setPhotoLink("");
  };

  // Ghi chú: nháp đi qua photoNote (làm sạch từng trường) rồi mới ghi; nháp rỗng thì ảnh chỉ còn là link.
  const saveNote = async (draft: PhotoNote) => {
    if (noteUrl === null) return;
    const next: KolPhoto[] = photos.map((p) => (p.url === noteUrl ? { url: p.url, ...photoNote({ url: p.url, ...draft }) } : p));
    if (await persist(next)) setNoteUrl(null);
  };
  const openNote = (url: string, opener: HTMLElement) => {
    noteOpener.current = opener;
    setNoteUrl(url);
  };
  const removePhoto = (url: string) => {
    if (url === noteUrl) setNoteUrl(null);
    void persist(photos.filter((p) => p.url !== url));
  };

  return (
    <section aria-labelledby={`${uid}-h`} className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <h2 id={`${uid}-h`} className="text-title3 font-medium">
            {kolStudio.photoList}
          </h2>
          <InfoTip entry={kolStudio.photoTip} />
        </div>
        <span className="text-footnote text-secondary tabular-nums">{kolStudio.photoCount(photos.length, KOL_LIMITS.photos)}</span>
      </div>

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p, i) => (
            <li key={`${i}-${p.url}`} className="min-w-0">
              <img src={p.url} alt={kol.photoAlt(i + 1, profile.name || profile.handle)} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="aspect-square w-full rounded-control bg-fill object-cover" />
              <button type="button" aria-label={kolStudio.noteOf(i + 1)} disabled={busy} onClick={(e) => openNote(p.url, e.currentTarget)} className={`${tile} mt-1`}>
                {kolStudio.note}
              </button>
              <button type="button" aria-label={kolStudio.removePhoto(i + 1)} disabled={busy} onClick={() => removePhoto(p.url)} className={`${tile} mt-1`}>
                {kolStudio.remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      {noteAt >= 0 && (
        <PhotoNoteEditor
          key={photos[noteAt].url}
          n={noteAt + 1}
          photo={photos[noteAt]}
          busy={busy}
          onSave={(draft) => void saveNote(draft)}
          onCancel={() => setNoteUrl(null)}
        />
      )}

      <div className="mt-6">
        <label htmlFor={`${uid}-p`} className="text-subhead font-semibold text-label">
          {kolStudio.photoLink}
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id={`${uid}-p`}
            type="url"
            inputMode="url"
            value={photoLink}
            aria-invalid={Boolean(photoError)}
            aria-describedby={photoError ? `${uid}-pe` : undefined}
            onChange={(e) => {
              setPhotoLink(e.target.value);
              setPhotoError(null);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              void addLink();
            }}
            className={`${field} min-w-0 sm:flex-1`}
          />
          <button type="button" onClick={() => void addLink()} disabled={busy || photosFull} className={`${secondary} w-full justify-center sm:w-auto`}>
            {kolStudio.addPhoto}
          </button>
        </div>
        {photoError && (
          <p id={`${uid}-pe`} className="mt-2 text-footnote font-medium text-danger">
            {photoError}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => photoInput.current?.click()} disabled={busy || photosFull} className={secondary}>
          {kolStudio.pickImage}
        </button>
        {photosFull && <span className="text-footnote text-secondary">{kolStudio.photoLimit}</span>}
      </div>
      <p aria-live="polite" className="mt-3 text-footnote text-secondary">
        {photoState === "checking" ? kolStudio.photoChecking : photoState === "saving" ? kolStudio.saving : photoState === "saved" ? kolStudio.photosSaved : null}
      </p>
      {uploading && (
        <p aria-live="polite" className="mt-3 text-footnote text-secondary">
          {kolStudio.uploading}
        </p>
      )}
      {imageError && (
        <p role="alert" className="mt-3 text-footnote font-medium text-danger">
          {imageError}
        </p>
      )}

      <input
        ref={photoInput}
        type="file"
        accept={KOL_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          void pickPhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </section>
  );
}
