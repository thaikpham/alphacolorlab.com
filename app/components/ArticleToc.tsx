"use client";

import { useEffect, useRef, useState } from "react";
import { activeIndex, nearOf } from "@/lib/tocSpy";

/** Vạch đọc: đề mục đã qua mức này (tính từ mép trên khung nhìn, theo tỉ lệ chiều cao) là dòng đang đọc. */
const LINE = 0.3;
/** Mức tối thiểu của vạch đọc (px): bấm một dòng thì đề mục dừng ở 80px (`scroll-mt-20`), vẫn phải tính là đang đọc. */
const LINE_MIN = 120;

/** Mục lục bài viết (cột trái, dính). Dòng đang đọc nổi lên; các dòng cạnh nhỏ dần; kiểu nằm ở `.toc-row` trong app/globals.css. */
export function ArticleToc({ label, items }: { label: string; items: { id: string; text: string }[] }) {
  const [active, setActive] = useState(-1);
  const asideRef = useRef<HTMLElement>(null);

  // Theo dõi cuộn (kể cả khung lồng nhau, nhờ capture) và đổi cỡ khung nhìn; gộp mỗi khung hình một lần
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = Math.max(LINE_MIN, window.innerHeight * LINE);
      const tops = items.map((h) => document.getElementById(h.id)?.getBoundingClientRect().top ?? Infinity);
      setActive(activeIndex(tops, line));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  // Giữ dòng đang đọc ở giữa khung mục lục khi khung đó cuộn được (ẩn dưới @3xl thì bỏ qua)
  useEffect(() => {
    const aside = asideRef.current;
    const row = aside?.querySelector<HTMLElement>('[data-near="0"]');
    if (!aside || !row || aside.clientHeight === 0) return;
    const top = row.getBoundingClientRect().top - aside.getBoundingClientRect().top + aside.scrollTop;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    aside.scrollTo({ top: top - (aside.clientHeight - row.offsetHeight) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [active]);

  return (
    <aside
      ref={asideRef}
      className="hidden @3xl:block @3xl:sticky @3xl:top-navbar @3xl:self-start @3xl:max-h-split @3xl:overflow-y-auto"
    >
      <nav aria-labelledby="toc-heading">
        <h2 id="toc-heading" className="mb-2 text-footnote font-medium text-label">{label}</h2>
        {items.map((h, i) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            data-near={nearOf(i, active)}
            aria-current={i === active ? "location" : undefined}
            className="toc-row flex min-h-9 items-center text-subhead pointer-coarse:min-h-11"
          >
            {h.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
