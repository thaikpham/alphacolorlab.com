"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { wiki } from "@/app/content";
import { blocked, compareHref, readCompare, toggle, useCompare, writeCompare, type CompareItem } from "@/lib/compare";
import { useWideBrowse } from "@/lib/indexView";

const t = wiki.product.compare;

/** So sánh / Đã chọn button; disabled with the reason when the pick is full or holds the other kind. */
export function CompareToggle({ item }: { item: CompareItem }) {
  const compare = useCompare();
  const picked = compare.items.some((i) => i.slug === item.slug);
  const reason = picked ? null : blocked(compare, item.kind);
  return (
    <button
      type="button"
      onClick={() => writeCompare(toggle(readCompare(), item))}
      disabled={reason !== null}
      aria-pressed={picked}
      className={`h-11 px-4 rounded-control text-subhead font-medium transition disabled:text-tertiary ${
        picked ? "bg-accent text-on-accent font-semibold" : "bg-fill text-label hover:bg-fill-strong disabled:hover:bg-fill"
      }`}
    >
      {picked ? t.added : reason === "full" ? t.full : reason === "kind" ? t.otherKind : t.add}
    </button>
  );
}

/** Bottom tray with the current pick, shown only when something is picked (same pattern as CartTray). */
export function CompareDock() {
  const compare = useCompare();
  const wide = useWideBrowse(usePathname()); // Blog/Wiki ở Lưới và /admin không có thanh dọc: khay chạy từ mép trái
  if (compare.items.length === 0) return null;
  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-separator pb-safe ${wide ? "" : "lg:left-sidebar"}`}>
        <div className="max-w-page mx-auto px-4 sm:px-6 py-3 space-y-3">
          <p className="text-subhead text-secondary truncate">
            <span className="font-semibold text-label">{t.count(compare.items.length)}</span> · {compare.items.map((i) => i.name).join(", ")}
          </p>
          <div className="flex gap-2">
            <Link
              href={compareHref(compare)}
              className="flex-1 flex items-center justify-center h-11 px-4 rounded-full bg-accent text-on-accent text-subhead font-semibold transition hover:bg-accent/90 active:scale-98"
            >
              {t.open}
            </Link>
            <button
              type="button"
              onClick={() => writeCompare({ items: [] })}
              className="flex-1 h-11 rounded-full text-accent-text text-subhead font-semibold hover:bg-accent/10 transition"
            >
              {t.clear}
            </button>
          </div>
        </div>
      </div>
      <div className="h-32 sm:h-36" aria-hidden="true" />
    </>
  );
}

/** The compare page's URL is the truth: copy what it shows into the stored pick. */
export function CompareSync({ items }: { items: CompareItem[] }) {
  const key = JSON.stringify(items);
  useEffect(() => writeCompare({ items: JSON.parse(key) }), [key]);
  return null;
}
