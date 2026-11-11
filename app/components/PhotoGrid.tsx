"use client";

import { useRef, useState } from "react";
import { kol } from "@/app/content";

/** Lưới ảnh mẫu (ô vuông, vùng chạm tối thiểu 44px). Bấm ô mở hộp xem lớn: Esc đóng, mũi tên trái/phải hoặc nút chữ để đổi ảnh. */
export function PhotoGrid({ photos, name }: { photos: string[]; name: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const last = photos.length - 1;

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (d: number) => setIndex((i) => (i === null ? null : Math.min(last, Math.max(0, i + d))));
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      step(e.key === "ArrowLeft" ? -1 : 1);
    }
  };

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((src, i) => (
          <li key={`${i}-${src}`}>
            <button type="button" onClick={() => open(i)} className="block aspect-square min-h-11 w-full overflow-hidden rounded-control bg-fill">
              <img src={src} alt={kol.photoAlt(i + 1, name)} loading="lazy" className="size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={kol.photos}
        onClose={() => setIndex(null)}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        onKeyDown={keys}
        className="m-auto flex max-h-dvh w-full max-w-4xl flex-col gap-3 rounded-card bg-card p-4 text-label shadow-card"
      >
        {index !== null && (
          <>
            <img src={photos[index]} alt={kol.photoAlt(index + 1, name)} className="min-h-0 w-full flex-1 object-contain" />
            <div className="flex shrink-0 items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={index === 0}
                className="inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40"
              >
                {kol.prev}
              </button>
              <span className="text-footnote text-secondary tabular-nums">
                {index + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={index === last}
                className="inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40"
              >
                {kol.next}
              </button>
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong"
              >
                {kol.close}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
