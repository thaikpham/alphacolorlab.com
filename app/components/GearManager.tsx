"use client";

import { useId, useRef, useState } from "react";
import { gearManager as T } from "@/app/content";
import { useGear, toggleGear, writeGear, type GearBag } from "@/lib/gear";
import { findGear, gearCatalog, nearGear, suggestGear, type GearHit } from "@/lib/gearCatalog";

const CATS = ["body", "lens", "acc"] as const;

/** Quản lý túi đồ: gõ tên hoặc mã, bấm Thêm. Không giới hạn số món, không liệt kê cả catalog.
 * Món không có trong dự án thì báo "Sản phẩm này chưa được hỗ trợ". */
/** compact (landing): thay danh sách món bằng một dòng "Trong túi: …" cắt gọn, để thẻ không cao thêm; bỏ món thì sang /tai-khoan. */
export function GearManager({ title, compact }: { title: string; compact?: boolean }) {
  const bag = useGear();
  const catalog = gearCatalog();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [live, setLive] = useState("");
  const [missing, setMissing] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const uid = useId();

  const hits = suggestGear(query);
  const shown = open && hits.length > 0;
  const nameOf = (cat: keyof GearBag, id: string) => catalog[cat].find((i) => i.id === id)?.name ?? id;

  const add = (hit: GearHit | null) => {
    const q = query.trim();
    if (!q && !hit) return;
    if (!hit) {
      setMissing(q);
      dialog.current?.showModal();
      return;
    }
    if (bag[hit.cat].includes(hit.item.id)) setLive(T.already(hit.item.name));
    else {
      writeGear(toggleGear(bag, hit.cat, hit.item.id));
      setLive(T.added(hit.item.name));
    }
    setQuery("");
    setOpen(false);
    setActive(-1);
  };

  const addFromSuggestion = (hit: GearHit) => {
    writeGear(toggleGear(bag, hit.cat, hit.item.id));
    setLive(T.added(hit.item.name));
    dialog.current?.close();
  };
  const submit = () => add(shown && active >= 0 ? hits[active] : findGear(query));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "Enter") {
      e.preventDefault();
      return submit();
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    setOpen(true);
    if (hits.length) setActive((i) => (e.key === "ArrowDown" ? (i + 1) % hits.length : (i - 1 + hits.length) % hits.length));
  };

  const count = bag.body.length + bag.lens.length + bag.acc.length;

  return (
    <section aria-labelledby={`${uid}-title`} className="rounded-card bg-card p-5 shadow-card sm:p-6">
      <h2 id={`${uid}-title`} className="text-title3 font-medium">
        {title}
      </h2>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            role="combobox"
            aria-label={T.inputLabel}
            aria-autocomplete="list"
            aria-expanded={shown}
            aria-controls={`${uid}-list`}
            aria-activedescendant={shown && active >= 0 ? `${uid}-o${active}` : undefined}
            autoComplete="off"
            placeholder={T.placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            className="h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent"
          />
          <ul id={`${uid}-list`} role="listbox" aria-label={T.inputLabel} hidden={!shown} className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-card border border-separator bg-card py-1 shadow-thumb">
            {hits.map((h, i) => (
              <li
                key={h.item.id}
                id={`${uid}-o${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(h)}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 ${i === active ? "bg-fill" : ""}`}
              >
                <span className="text-callout font-medium text-label">{h.item.name}</span>
                <span className="text-footnote text-secondary">{T.groups[h.cat]}</span>
              </li>
            ))}
          </ul>
        </div>
        <button type="submit" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
          </svg>
          {T.add}
        </button>
      </form>

      {compact && count > 0 && (
        <p className="mt-4 truncate text-subhead font-semibold text-label">
          {T.inBag(CATS.flatMap((cat) => bag[cat].map((id) => nameOf(cat, id))).join(", "))}
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {live}
      </p>

      <dialog
        ref={dialog}
        aria-labelledby={`${uid}-miss`}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-full max-w-sm rounded-card bg-card p-6 text-label shadow-card"
      >
        <h2 id={`${uid}-miss`} className="text-title3 font-medium">
          {T.unsupportedTitle}
        </h2>
        <p className="mt-2 text-body text-secondary">{T.unsupported(missing)}</p>
        {(() => {
          const suggestions = nearGear(missing);
          return suggestions.length > 0 ? (
            <div className="mt-5">
              <p className="text-footnote font-semibold text-secondary">{T.suggest}</p>
              <ul className="mt-3 space-y-2">
                {suggestions.map((s) => (
                  <li key={s.item.id}>
                    <button
                      type="button"
                      onClick={() => addFromSuggestion(s)}
                      className="w-full rounded-control border border-separator bg-card px-3 py-2.5 text-left text-callout font-medium text-label transition-colors hover:bg-fill"
                    >
                      {s.item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}
        <div className="mt-5 flex flex-col gap-2">
          <a href="/wiki" className="inline-flex h-11 items-center justify-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong">
            {T.productWiki}
          </a>
          <form method="dialog">
            <button type="submit" className="w-full inline-flex h-11 items-center justify-center rounded-full px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill">
              {T.close}
            </button>
          </form>
        </div>
      </dialog>
    </section>
  );
}
