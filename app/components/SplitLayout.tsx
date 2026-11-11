"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegments } from "next/navigation";

/**
 * Master–detail like iPadOS Settings. md+: index column (sticky, scrolls on its own) beside the selected item.
 * Phones: the list route shows `header` + index; a detail route shows only the detail (its own back link leads to the list).
 * lg+: the index leaves the grid and sits in the vertical nav, fixed right under its app links (AppSidebar).
 * The whole split is the page's <main> (pages under it render a <div>), so phones on the list route still have a main landmark.
 */
export function SplitLayout({ header, index, children, lists = [] }: { header: ReactNode; index: ReactNode; children: ReactNode; lists?: string[] }) {
  // `lists`: child routes that are another list (e.g. /blog/kien-thuc), shown like the index route on phones
  const segments = useSelectedLayoutSegments();
  const detail = segments.length > 0 && !(segments.length === 1 && lists.includes(segments[0]));
  return (
    <main className="max-w-page mx-auto md:grid md:grid-cols-[17rem_1fr] md:gap-2 md:px-6 lg:block">
      <div className={`${detail ? "hidden md:block" : ""} px-4 pt-16 pb-16 sm:px-6 sm:pt-24 md:sticky md:top-14 md:h-split md:overflow-y-auto md:px-0 md:pt-6 md:pb-6 lg:fixed lg:top-sidebar-head lg:bottom-0 lg:left-0 lg:z-40 lg:block lg:h-auto lg:w-sidebar lg:border-r lg:border-separator lg:bg-bg lg:px-3 lg:pt-3`}>
        <div className="mb-8 md:hidden">{header}</div>
        {index}
      </div>
      <div className={`${detail ? "" : "hidden md:block"} min-w-0`}>{children}</div>
    </main>
  );
}
