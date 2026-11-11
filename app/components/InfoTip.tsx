"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { GlossaryEntry } from "../content";

// Nút "i" mở bảng giải thích thuật ngữ. Chuột: rê vào là hiện, rời ra là ẩn; bấm thì ghim lại.
// Chạm/bàn phím: bấm để mở, bấm lại, chạm ra ngoài hoặc Esc để đóng.
// Dùng Popover API: bảng nằm ở top layer nên không bị khung console (overflow-clip) cắt.
export function InfoTip({ entry }: { entry: GlossaryEntry }) {
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const pinned = useRef(false);
  const [open, setOpen] = useState(false);

  const isOpen = () => pop.current?.matches(":popover-open") ?? false;

  // Đặt bảng dưới nút (hoặc trên nếu thiếu chỗ), luôn nằm trong màn hình
  const place = () => {
    const b = btn.current!.getBoundingClientRect();
    const p = pop.current!;
    const gap = 8;
    const margin = 12;
    const left = Math.min(Math.max(b.left + b.width / 2 - p.offsetWidth / 2, margin), innerWidth - p.offsetWidth - margin);
    const below = b.bottom + gap;
    const top = below + p.offsetHeight > innerHeight - margin ? Math.max(b.top - gap - p.offsetHeight, margin) : below;
    p.style.left = `${left}px`;
    p.style.top = `${top}px`;
  };

  const show = (pin: boolean) => {
    pinned.current = pin;
    if (!isOpen()) pop.current!.showPopover();
    place();
  };
  const hide = () => {
    if (isOpen()) pop.current!.hidePopover();
  };

  useEffect(() => {
    const p = pop.current!;
    const onScroll = () => hide(); // bảng cố định theo màn hình, cuộn thì đóng để không lệch khỏi nút
    const onToggle = (e: Event) => {
      const opened = (e as ToggleEvent).newState === "open";
      setOpen(opened);
      if (opened) addEventListener("scroll", onScroll, { passive: true, capture: true });
      else {
        pinned.current = false;
        removeEventListener("scroll", onScroll, { capture: true });
      }
    };
    p.addEventListener("toggle", onToggle);
    return () => {
      p.removeEventListener("toggle", onToggle);
      removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={`Giải thích: ${entry.term}`}
        aria-describedby={id}
        aria-expanded={open}
        aria-controls={id}
        onPointerEnter={(e) => e.pointerType === "mouse" && !isOpen() && show(false)}
        onPointerLeave={(e) => e.pointerType === "mouse" && !pinned.current && hide()}
        onClick={() => (isOpen() && pinned.current ? hide() : show(true))}
        className="relative inline-grid size-5 shrink-0 place-items-center rounded-full text-secondary transition-colors hover:text-accent-text after:absolute after:-inset-3"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7.25v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="5.1" r="0.9" fill="currentColor" />
        </svg>
      </button>
      <div
        ref={pop}
        id={id}
        popover="auto"
        role="tooltip"
        className="infotip fixed inset-auto m-0 w-72 space-y-1.5 rounded-control border border-separator bg-card p-3 text-left text-footnote font-normal text-label shadow-card"
      >
        <p className="text-subhead font-semibold">{entry.term}</p>
        {entry.lines.map((l, i) => (
          <p key={i} className="text-pretty">
            {l.k && <span className="font-semibold">{l.k} </span>}
            {l.t}
          </p>
        ))}
      </div>
    </>
  );
}
