"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { blog } from "@/app/content";
import type { IndexItem } from "@/lib/blog";
import { useIndexView } from "@/lib/indexView";
import { IndexRow } from "./IndexRow";

export type ArticleGroup = { key: string; label: string; items: IndexItem[] };

// Lộ trình học chỉ có danh sách, không vào lưới
const LIST_ONLY = "lo-trinh";

const detailOf = (i: IndexItem) => i.read ?? (i.steps ? blog.split.steps(i.steps) : undefined);

/** Cột index của /blog: bài theo cấp độ (rồi lộ trình). Lưới: thẻ thay danh sách dưới md. */
export function ArticleIndex({ groups }: { groups: ArticleGroup[] }) {
  const view = useIndexView();
  const pathname = usePathname();
  const grid = view === "grid";
  return (
    <div className="space-y-6">
      {groups.map((g, gi) => {
        const cards = grid && g.key !== LIST_ONLY;
        return (
          <section key={g.key}>
            <h2 className={`mb-2 text-footnote text-secondary ${cards ? "md:px-4" : "px-4"}`}>{g.label}</h2>
            {cards && (
              <ul className="grid grid-cols-2 gap-4 md:hidden">
                {g.items.map((i, n) => (
                  <li key={i.href}>
                    <ArticleCard item={i} active={i.href === pathname} eager={gi === 0 && n < 2} />
                  </li>
                ))}
              </ul>
            )}
            <div className={`overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator ${cards ? "hidden md:block" : ""}`}>
              {g.items.map((i) => (
                <IndexRow key={i.href} href={i.href} title={i.title} detail={detailOf(i)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Lưới bài ở cột phải /blog (md+) khi chưa chọn bài và đang chọn Lưới. Lộ trình không vào lưới. */
export function ArticleGrid({ groups }: { groups: ArticleGroup[] }) {
  const view = useIndexView();
  if (view !== "grid") return null;
  const shown = groups.filter((g) => g.key !== LIST_ONLY && g.items.length);
  return (
    <div className="space-y-6">
      {shown.map((g, gi) => (
        <section key={g.key}>
          <h2 className="mb-2 text-footnote text-secondary">{g.label}</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {g.items.map((i, n) => (
              <li key={i.href}>
                <ArticleCard item={i} active={false} eager={gi === 0 && n < 2} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ArticleCard({ item, active, eager }: { item: IndexItem; active: boolean; eager: boolean }) {
  const img = item.image;
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className="group block overflow-hidden rounded-card bg-card shadow-card">
      {img && (
        <div className="relative aspect-[3/2] bg-card">
          <Image
            src={img.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 22vw, 45vw"
            preload={eager}
            unoptimized={img.svg}
            className={img.svg ? "object-contain p-4" : "object-cover"}
          />
        </div>
      )}
      <div className={`px-4 py-3 transition-colors ${img ? "border-t border-separator" : ""} ${active ? "bg-fill" : "group-hover:bg-fill"}`}>
        <p className="line-clamp-2 text-subhead font-semibold text-label">{item.title}</p>
        {item.read && <p className="mt-1 text-footnote text-secondary">{item.read}</p>}
      </div>
    </Link>
  );
}
