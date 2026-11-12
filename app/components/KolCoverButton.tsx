"use client";

import { useRef, useState } from "react";
import { kolStudio } from "@/app/content";
import { imageProblem, KOL_IMAGE_TYPES, saveProfile, uploadImage } from "@/lib/kol";
import { useKol } from "./KolContext";

/**
 * Nút "Đổi ảnh bìa" ở góc dưới phải ảnh bìa, chỉ khi có hồ sơ KOL. Chọn ảnh thì tải lên, hiện ngay (lạc quan), rồi lưu hồ sơ với ảnh bìa mới;
 * lưu lỗi thì trả ảnh cũ. Trạng thái ở aria-live. Cả lượt nằm trong run nên không chồng với ghi ảnh mẫu hay lưu hồ sơ ở mục Giới thiệu.
 */
export function KolCoverButton() {
  const { userId, profile, setProfile, update, run, writing } = useKol();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!userId || !profile) return null;

  const change = (file: File | undefined) => {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      setMessage(problem === "type" ? kolStudio.imageType : kolStudio.imageSize);
      return;
    }
    void run(async () => {
      setMessage(kolStudio.uploading);
      const url = await uploadImage(userId, file).catch(() => null);
      if (!url) {
        setMessage(kolStudio.uploadFailed);
        return;
      }
      const before = profile.cover;
      update((p) => ({ ...p, cover: url }));
      try {
        setProfile(await saveProfile(userId, { ...profile, cover: url }));
        setMessage(kolStudio.saved);
      } catch {
        update((p) => ({ ...p, cover: before }));
        setMessage(kolStudio.saveFailed);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={writing}
        onClick={() => input.current?.click()}
        className="inline-flex h-11 items-center rounded-full bg-card px-5 text-subhead font-semibold text-label shadow-thumb transition-colors hover:bg-fill disabled:opacity-40"
      >
        {kolStudio.coverChange}
      </button>
      <span aria-live="polite" className={message ? "rounded-badge bg-card px-3 py-1 text-footnote font-semibold text-label shadow-thumb" : "sr-only"}>
        {message}
      </span>
      <input
        ref={input}
        type="file"
        accept={KOL_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          change(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
