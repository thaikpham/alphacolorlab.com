"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabItem = { id: string; label: string; count?: number | string };

/** Tab đang mở. Tab đã chọn không còn trong danh sách (ví dụ hết bộ đã sưu tầm) thì về tab đầu. */
export function useActiveTab(ids: string[]): [string, (id: string) => void] {
  const [picked, setPicked] = useState(ids[0] ?? "");
  return [ids.includes(picked) ? picked : (ids[0] ?? ""), setPicked];
}

/** Thanh tab gạch chân ở đáy thẻ tiêu đề hồ sơ (ARIA tabs, roving tabindex, Trái/Phải/Home/End). Chỉ cho mục con của trang hồ sơ; lựa chọn loại trừ dùng segmented control. */
export function ProfileTabs({ base, label, tabs, active, onSelect }: { base: string; label: string; tabs: TabItem[]; active: string; onSelect: (id: string) => void }) {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const list = useRef<HTMLDivElement>(null);
  // Màn hẹp: tab đang mở luôn nằm trong vùng cuộn ngang. Chỉ cuộn thanh tab, không cuộn trang.
  useEffect(() => {
    const box = list.current;
    const el = buttons.current[active];
    if (!box || !el) return;
    if (el.offsetLeft < box.scrollLeft) box.scrollLeft = el.offsetLeft;
    else if (el.offsetLeft + el.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollLeft = el.offsetLeft + el.offsetWidth - box.clientWidth;
  }, [active]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = tabs.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    onSelect(tabs[to].id);
    buttons.current[tabs[to].id]?.focus();
  };
  return (
    <div ref={list} role="tablist" aria-label={label} className="relative flex overflow-x-auto">
      {tabs.map((t, i) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              buttons.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={on}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`inline-flex h-12 shrink-0 items-center gap-1.5 border-b-2 px-4 text-subhead font-semibold transition-colors ${on ? "border-accent text-label" : "border-transparent text-secondary hover:bg-fill"}`}
          >
            {t.label}
            {t.count !== undefined && <span className="tabular-nums text-secondary">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Panel của một tab. Khi không có thanh tab thì chỉ là khối nội dung thường (không role tabpanel). Panel không đang mở vẫn được mount, chỉ ẩn bằng hidden. */
export function ProfileTabPanel({ base, id, tabbed, active, children }: { base: string; id: string; tabbed: boolean; active: boolean; children: ReactNode }) {
  if (!tabbed) return <>{children}</>;
  return (
    <div role="tabpanel" id={`${base}-panel-${id}`} aria-labelledby={`${base}-tab-${id}`} hidden={!active}>
      {children}
    </div>
  );
}
