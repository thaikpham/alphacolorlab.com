"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { blog } from "@/app/content";
import { useIndexView } from "@/lib/indexView";

type Part = keyof typeof blog.parts;
const HREF: Record<Part, string> = { articles: "/blog", knowledge: "/blog/kien-thuc" };

/** Segmented control between the two Blog parts; each part has its own URL. Only the open part's list is rendered (fewer links to hydrate);
 * the other list is on its own route, so crawlers still reach every link. Lưới: núm không kéo hết trang, ghi chú xếp nhiều cột. */
export function BlogParts({ lists }: { lists: Record<Part, ReactNode> }) {
  const active: Part = usePathname().startsWith(HREF.knowledge) ? "knowledge" : "articles";
  const grid = useIndexView() === "grid";
  const columns = grid && active === "knowledge";
  return (
    <>
      <nav aria-label={blog.list.title} className={`flex gap-1 rounded-control bg-fill p-1 mb-6 ${grid ? "md:max-w-md" : ""}`}>
        {(Object.keys(HREF) as Part[]).map((p) => (
          <Link
            key={p}
            href={HREF[p]}
            aria-current={active === p ? "page" : undefined}
            className={`flex-1 inline-flex h-11 items-center justify-center rounded-badge text-subhead transition ${
              active === p ? "bg-card shadow-thumb font-semibold text-label" : "font-medium text-label hover:bg-fill-strong"
            }`}
          >
            {blog.parts[p]}
          </Link>
        ))}
      </nav>
      <div className={columns ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start" : "space-y-6"}>{lists[active]}</div>
    </>
  );
}
