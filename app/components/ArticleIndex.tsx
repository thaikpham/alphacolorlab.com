"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { blog } from "@/app/content";
import type { IndexItem } from "@/lib/blog";
import { useIndexView } from "@/lib/indexView";
import { keepRelated } from "@/lib/personal";
import { usePersonal } from "@/lib/usePersonal";
import { PersonalBar } from "./PersonalToggle";
import { IndexRow } from "./IndexRow";

export type ArticleGroup = { key: string; label: string; items: IndexItem[] };

// Lộ trình học chỉ có danh sách, không vào lưới
const LIST_ONLY = "lo-trinh";

const detailOf = (i: IndexItem) => i.read ?? (i.steps ? blog.split.steps(i.steps) : undefined);

/** Index của /blog: bài theo cấp độ (rồi lộ trình). Lưới: chỉ thẻ; Danh sách: chỉ dòng. */
export function ArticleIndex({ groups: all }: { groups: ArticleGroup[] }) {
  const view = useIndexView("blog");
  // Cá nhân hóa: chỉ giữ bài nối với túi đồ; không bài nào nối thì hiện đủ
  const personal = usePersonal();
  const kept = new Set(keepRelated(all.flatMap((g) => g.items), (i) => i.href, personal.hrefs));
  const groups = all.map((g) => ({ ...g, items: g.items.filter((i) => kept.has(i)) })).filter((g) => g.items.length);
  const pathname = usePathname();
  const grid = view === "grid";
  // Trang bài vẫn giữ index (ẩn) để không mất bộ lọc: chỉ tải sớm ảnh thẻ khi đang ở trang danh sách
  const onIndex = pathname === "/blog";
  return (
    <div className="space-y-6">
      <PersonalBar state={personal} />
      {groups.map((g, gi) => {
        const cards = grid && g.key !== LIST_ONLY;
        return (
          <section key={g.key}>
            <h2 className={`mb-2 text-footnote text-secondary ${cards ? "" : "px-4"}`}>{g.label}</h2>
            {cards ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {g.items.map((i, n) => (
                  <li key={i.href}>
                    <ArticleCard item={i} active={i.href === pathname} eager={onIndex && gi === 0 && n < 2} />
                  </li>
                ))}
              </ul>
            ) : (
              // Lộ trình trong Lưới: danh sách không kéo hết chiều rộng trang
              <div className={`overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator ${grid ? "md:max-w-2xl" : ""}`}>
                {g.items.map((i) => (
                  <IndexRow key={i.href} href={i.href} title={i.title} detail={detailOf(i)} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Thẻ bài. Dưới sm là thẻ ngang (ảnh 80px bên trái, cao bằng thẻ): tiêu đề lớn hơn ảnh nên LCP trên điện thoại là chữ có sẵn trong HTML.
 * Từ sm là thẻ dọc, ảnh `aspect-[3/2]` ở trên. */
function ArticleCard({ item, active, eager }: { item: IndexItem; active: boolean; eager: boolean }) {
  const img = item.image;
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className="group flex overflow-hidden rounded-card bg-card shadow-card sm:block">
      {img && (
        <div className="relative w-20 shrink-0 bg-card sm:aspect-[3/2] sm:w-auto">
          <Image
            src={img.src}
            alt=""
            fill
            sizes="(min-width: 1536px) 14vw, (min-width: 1280px) 18vw, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, (min-width: 640px) 46vw, 80px"
            preload={eager}
            unoptimized={img.svg}
            className={img.svg ? "object-contain p-2 sm:p-4" : "object-cover"}
          />
        </div>
      )}
      <div className={`min-w-0 flex-1 px-4 py-3 transition-colors ${img ? "border-l border-separator sm:border-t sm:border-l-0" : ""} ${active ? "bg-fill" : "group-hover:bg-fill"}`}>
        <p className="line-clamp-2 text-subhead font-semibold text-label">{item.title}</p>
        {item.read && <p className="mt-1 text-footnote text-secondary">{item.read}</p>}
      </div>
    </Link>
  );
}
