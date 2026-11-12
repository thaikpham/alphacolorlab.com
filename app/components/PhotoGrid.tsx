"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { kol, kolSets } from "@/app/content";
import { photoNote, type KolPhoto } from "@/lib/kol";
import type { PresetSet } from "@/lib/presetSets";
import { baseRecipe, changesOf, cleanPatch } from "@/lib/ppMods";

const SWIPE = 48;

/** Lưới ảnh mẫu (ô vuông, vùng chạm tối thiểu 44px). Ô có ghi chú hiện nhãn. Bấm ô mở hộp xem toàn màn hình: Esc hoặc Đóng thoát, Trước/Sau, mũi tên trái/phải, Home/End, vuốt ngang trên ảnh.
 * Ghi chú nằm cạnh ảnh từ lg, dưới ảnh trên màn nhỏ. Ảnh lỗi thì bỏ khỏi lưới lẫn dãy xem; số đếm và số thứ tự tính lại theo ảnh còn lại.
 * set: bộ của KOL, dùng để gọi tên ô M1–M4 trong ghi chú. */
export function PhotoGrid({ photos, name, set }: { photos: KolPhoto[]; name: string; set?: PresetSet }) {
  const [open, setOpen] = useState<number | null>(null); // chỉ số trong photos
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const dialog = useRef<HTMLDialogElement>(null);
  const tile = useRef<HTMLElement | null>(null); // ô vừa mở, nhận lại focus khi đóng
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false); // vừa vuốt thì cú bấm sau đó (nếu có) không đóng hộp

  // Dãy ảnh còn hiện (chỉ số trong photos). Ảnh đang mở vừa lỗi thì lấy ảnh còn lại gần nhất sau nó, không có thì ảnh trước.
  const shown = photos.flatMap((p, i) => (failed.has(p.url) ? [] : [i]));
  const found = shown.findIndex((i) => i >= (open ?? 0));
  const pos = open === null || shown.length === 0 ? -1 : found === -1 ? shown.length - 1 : found;
  const current = pos >= 0 ? photos[shown[pos]] : undefined;
  const before = pos > 0 ? photos[shown[pos - 1]].url : undefined;
  const after = pos >= 0 && pos < shown.length - 1 ? photos[shown[pos + 1]].url : undefined;

  useEffect(() => {
    for (const src of [before, after]) if (src) new Image().src = src;
  }, [before, after]);
  useEffect(() => {
    if (shown.length === 0) dialog.current?.close();
  }, [shown.length]);

  const fail = (url: string) => setFailed((f) => (f.has(url) ? f : new Set(f).add(url)));
  const openAt = (i: number, el: HTMLElement) => {
    tile.current = el;
    setOpen(i);
    dialog.current?.showModal();
  };
  const go = (n: number) => {
    if (n >= 0 && n < shown.length) setOpen(shown[n]);
  };
  const keys = (e: KeyboardEvent) => {
    const to = e.key === "ArrowLeft" ? pos - 1 : e.key === "ArrowRight" ? pos + 1 : e.key === "Home" ? 0 : e.key === "End" ? shown.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    go(to);
  };
  const down = (e: PointerEvent) => {
    swiped.current = false;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const up = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    // Vuốt dọc (hoặc quá ngắn) bỏ qua: để trang cuộn, không đổi ảnh.
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
    swiped.current = true;
    go(pos + (dx < 0 ? 1 : -1));
  };

  const navButton = "inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {shown.map((i, n) => {
          const p = photos[i];
          return (
            <li key={`${i}-${p.url}`}>
              <button type="button" onClick={(e) => openAt(i, e.currentTarget)} className="relative block aspect-square min-h-11 w-full overflow-hidden rounded-control bg-fill">
                <img
                  src={p.url}
                  alt={kol.photoAlt(n + 1, name)}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => fail(p.url)}
                  className="size-full object-cover"
                />
                {photoNote(p) !== undefined && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-badge bg-card px-2 py-0.5 text-footnote font-medium text-label shadow-thumb">{kol.noteBadge}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialog}
        aria-label={kol.photos}
        onClose={() => {
          setOpen(null);
          tile.current?.focus();
        }}
        onClick={(e) => {
          if (swiped.current) {
            swiped.current = false;
            return;
          }
          if (e.target === dialog.current) dialog.current?.close();
        }}
        onKeyDown={keys}
        className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none flex-col gap-3 border-0 bg-card p-4 text-label open:flex"
      >
        {current !== undefined && (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
              <div onPointerDown={down} onPointerUp={up} onPointerCancel={() => (swipe.current = null)} className="relative min-h-0 min-w-0 flex-1 touch-pan-y">
                <img
                  key={current.url}
                  src={current.url}
                  alt={kol.photoAlt(pos + 1, name)}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => fail(current.url)}
                  className="absolute inset-0 size-full object-contain transition-opacity duration-200 ease-ios starting:opacity-0 motion-reduce:transition-none"
                />
              </div>
              <NotePanel photo={current} set={set} />
            </div>
            <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 pb-safe">
              <div className="col-start-2 flex items-center gap-3">
                <button type="button" onClick={() => go(pos - 1)} disabled={pos <= 0} aria-disabled={pos <= 0} className={navButton}>
                  {kol.prev}
                </button>
                <span aria-live="polite" className="min-w-12 text-center text-subhead text-secondary tabular-nums">
                  {pos + 1}/{shown.length}
                </span>
                <button type="button" onClick={() => go(pos + 1)} disabled={pos >= shown.length - 1} aria-disabled={pos >= shown.length - 1} className={navButton}>
                  {kol.next}
                </button>
              </div>
              <button type="button" onClick={() => dialog.current?.close()} className={`${navButton} justify-self-end`}>
                {kol.close}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

type Row = { label: string; value: ReactNode };

/** Thông tin ảnh: chỉ hiện trường có giá trị. Ghi chú đi qua photoNote (lib/kol.ts); mod kiểm bằng cleanPatch, công thức chỉ hiện khi còn trong Color Bank. */
function NotePanel({ photo, set }: { photo: KolPhoto; set?: PresetSet }) {
  const uid = useId();
  const note = photoNote(photo);
  const rows: Row[] = [];
  if (note?.aperture) rows.push({ label: kol.aperture, value: note.aperture });
  if (note?.shutter) rows.push({ label: kol.shutter, value: note.shutter });
  if (note?.iso) rows.push({ label: kol.iso, value: note.iso });
  if (note?.lens) rows.push({ label: kol.lens, value: note.lens });
  const slot = note?.slot;
  if (slot !== undefined) {
    const slotLabel = set?.slots[slot - 1].label;
    rows.push({
      label: kol.slot,
      value: (
        <>
          {kolSets.slotName(slot)}
          {slotLabel && <span className="block text-footnote font-normal text-secondary">{slotLabel}</span>}
        </>
      ),
    });
  }
  const recipe = note?.recipe ? baseRecipe(note.recipe) : null;
  if (recipe && !recipe.blocked) rows.push({ label: kol.recipe, value: recipe.name });
  const patch = note?.mod ? cleanPatch(note.mod.base, note.mod.patch) : null;
  if (note?.mod && patch) {
    const base = baseRecipe(note.mod.base);
    rows.push({
      label: kol.mod,
      value: (
        <>
          {note.mod.name}
          <span className="block text-footnote font-normal text-secondary">{kol.modFrom(base?.name ?? note.mod.base)}</span>
        </>
      ),
    });
    for (const c of changesOf(note.mod.base, patch)) {
      rows.push({
        label: c.label,
        value: (
          <>
            {String(c.to)}
            {c.from !== undefined && <span className="ml-2 text-footnote font-normal text-secondary">{kol.modFrom(String(c.from))}</span>}
          </>
        ),
      });
    }
  }
  const text = note?.text;

  return (
    <aside aria-labelledby={`${uid}-h`} className="shrink-0 overflow-y-auto max-h-64 lg:max-h-none lg:w-80 lg:border-l lg:border-separator lg:pl-5">
      <h3 id={`${uid}-h`} className="text-title3 font-medium">
        {kol.info}
      </h3>
      {rows.length === 0 && !text ? (
        <p className="mt-3 text-body text-secondary">{kol.noteEmpty}</p>
      ) : (
        <>
          {rows.length > 0 && (
            <dl className="mt-3 divide-y divide-separator">
              {rows.map((r, i) => (
                <div key={i} className="flex items-baseline gap-4 py-2.5">
                  <dt className="w-24 shrink-0 text-footnote font-medium text-secondary">{r.label}</dt>
                  <dd className="min-w-0 text-body font-semibold text-label">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {text && (
            <div className="mt-3">
              <p className="text-footnote font-medium text-secondary">{kol.text}</p>
              <p className="mt-1 whitespace-pre-line text-body text-label">{text}</p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
