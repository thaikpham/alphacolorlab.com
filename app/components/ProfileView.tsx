"use client";

import Image from "next/image";
import Link from "next/link";
import { gearManager, profile as T } from "@/app/content";
import type { GearBag } from "@/lib/gear";
import { gearCatalog, type Item } from "@/lib/gearCatalog";

const CATS = ["body", "lens", "acc"] as const;
const AF = ["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"];

export interface ProfileData {
  name: string;
  avatar: string | null;
  username: string;
  bio: string;
  links: string[];
  gear: GearBag;
}

const host = (url: string) => {
  const u = new URL(url);
  return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
};

/** Hồ sơ người dùng: avatar trong khung lấy nét, tên, @username, giới thiệu, liên kết, đếm túi đồ, rồi lưới các món có ảnh.
 * Dùng cho /tai-khoan (chủ hồ sơ: actions, onRemove, children = form sửa và ô thêm đồ) và /ho-so (link chia sẻ, chỉ xem). */
export function ProfileView({ data, actions, onRemove, children }: { data: ProfileData; actions?: React.ReactNode; onRemove?: (cat: keyof GearBag, id: string) => void; children?: React.ReactNode }) {
  const catalog = gearCatalog();
  const items = (cat: keyof GearBag) => data.gear[cat].flatMap((id) => catalog[cat].filter((i) => i.id === id));
  const total = data.gear.body.length + data.gear.lens.length + data.gear.acc.length;
  const stats = T.stats(data.gear.body.length, data.gear.lens.length, data.gear.acc.length);

  return (
    <main className="mx-auto max-w-page px-4 pt-8 pb-16 sm:px-6 lg:pt-12">
      <section aria-labelledby="profile-name" className="rounded-card bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative size-28 shrink-0 p-2">
            {AF.map((c) => (
              <span key={c} aria-hidden="true" className={`pointer-events-none absolute size-5 border-accent ${c}`} />
            ))}
            {data.avatar ? (
              <img src={data.avatar} alt="" width={96} height={96} referrerPolicy="no-referrer" className="size-24 rounded-full bg-fill object-cover" />
            ) : (
              <span aria-hidden="true" className="grid size-24 place-items-center rounded-full bg-fill text-title font-normal text-label">
                {data.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 id="profile-name" className="text-title font-normal text-balance">
              {data.name}
            </h1>
            {data.username && <p className="mt-1 text-callout font-semibold text-secondary">@{data.username}</p>}
            {data.bio && <p className="mt-4 max-w-2xl text-body text-label">{data.bio}</p>}
            {data.links.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {data.links.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex h-11 items-center gap-2 rounded-full bg-fill px-4 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 014 4l-1 1M9 11.5l-1 1a2.8 2.8 0 01-4-4l1-1" />
                      </svg>
                      {host(url)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-subhead font-semibold text-label tabular-nums">
              {stats.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </p>
            {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
          </div>
        </div>
      </section>

      {children}

      {total === 0 ? (
        <p role="status" className="mt-12 text-center text-callout text-label">
          {T.empty}
        </p>
      ) : (
        CATS.filter((cat) => data.gear[cat].length).map((cat) => (
          <section key={cat} aria-labelledby={`bag-${cat}`} className="mt-12">
            <h2 id={`bag-${cat}`} className="text-title3 font-medium">
              {gearManager.groups[cat]} <span className="text-secondary tabular-nums">{data.gear[cat].length}</span>
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items(cat).map((item) => (
                <GearCard key={item.id} item={item} cat={cat} onRemove={onRemove} />
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}

function GearCard({ item, cat, onRemove }: { item: Item; cat: keyof GearBag; onRemove?: (cat: keyof GearBag, id: string) => void }) {
  // Món có trang trong Product Wiki (máy, ống kính, phụ kiện) thì có ảnh và link; phụ kiện thêm tay chỉ có tên
  const body = (
    <>
      <div className="relative aspect-[4/3] bg-card">
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw" className="object-contain p-4" />
        ) : (
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="absolute inset-0 m-auto size-12 text-tertiary">
            <rect x="8" y="14" width="32" height="22" rx="4" />
            <circle cx="24" cy="25" r="6" />
          </svg>
        )}
      </div>
      <div className="border-t border-separator px-4 py-3">
        <p className="truncate text-subhead font-semibold text-label">{item.name}</p>
        <p className="truncate text-footnote text-secondary">{item.code}</p>
      </div>
    </>
  );
  return (
    <li className="relative overflow-hidden rounded-card bg-card shadow-card">
      {item.image ? (
        <Link href={`/wiki/san-pham/${item.id}`} aria-label={T.view(item.name)} className="block transition-colors hover:bg-fill">
          {body}
        </Link>
      ) : (
        body
      )}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(cat, item.id)}
          aria-label={T.remove(item.name)}
          className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-card text-label shadow-thumb transition-colors hover:bg-fill"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
          </svg>
        </button>
      )}
    </li>
  );
}
