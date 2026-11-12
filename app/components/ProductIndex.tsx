"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { wiki } from "@/app/content";
import { useIndexView } from "@/lib/indexView";
import { matchLenses } from "@/lib/lensTags";
import { InfoTip } from "./InfoTip";

const P = wiki.product;
const F = P.lensFilter;
type Kind = keyof typeof P.tabs;
export type IndexItem = { slug: string; href: string; kind: Kind; group: string; name: string; code: string; image: string; detail: string; tags: string[] };
type Group = { key: string; title: string; items: IndexItem[] };

const CAMERA_TITLE = { "full-frame": "fullframe", "aps-c": "apsc", compact: "compact", cinema: "cinema" } as const;
const row = "flex items-center gap-3 min-h-11 px-4 py-2 transition-colors hover:bg-fill active:bg-fill-strong";

type Browse = {
  items: IndexItem[];
  kind: Kind;
  setKind: (k: Kind) => void;
  on: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
};
const BrowseContext = createContext<Browse | null>(null);

function useBrowse(): Browse {
  const ctx = useContext(BrowseContext);
  if (!ctx) throw new Error("ProductBrowseProvider is missing");
  return ctx;
}

/** Trạng thái chung của Product Wiki (loại, bộ lọc ống kính) cho cột index và lưới ở cột phải. Layout bọc quanh cả hai. */
export function ProductBrowseProvider({ items, children }: { items: IndexItem[]; children: ReactNode }) {
  const pathname = usePathname();
  const current = items.find((i) => i.href === pathname);
  const [kind, setKind] = useState<Kind>(current?.kind ?? "camera");
  // Opening a product of another kind (search, compare, a link) switches the list to that kind
  const [seen, setSeen] = useState(current?.slug);
  if (current && current.slug !== seen) {
    setSeen(current.slug);
    if (current.kind !== kind) setKind(current.kind);
  }
  const [on, setOn] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  return <BrowseContext.Provider value={{ items, kind, setKind, on, toggle, clear: () => setOn(new Set()) }}>{children}</BrowseContext.Provider>;
}

/** Nhóm món theo loại và bộ lọc; dùng chung cho cột index và lưới. */
function browse(items: IndexItem[], kind: Kind, on: Set<string>) {
  const of = (k: Kind) => items.filter((i) => i.kind === k);
  const lenses = of("lens");
  const shown = matchLenses(lenses, on, F.groups);
  const groups: Group[] =
    kind === "camera"
      ? (["full-frame", "aps-c", "compact", "cinema"] as const).map((g) => ({
          key: g,
          title: P.cameras[CAMERA_TITLE[g]],
          items: of("camera").filter((i) => i.group === g),
        }))
      : kind === "accessory"
        ? Object.entries(P.accessoryGroups).map(([g, { title }]) => ({ key: g, title, items: of("accessory").filter((i) => i.group === g) }))
        : on.size
          ? [{ key: "filtered", title: F.count(shown.length), items: shown }]
          : P.lenses.series.flatMap((se) =>
              P.lenses.formats.map((f) => ({
                key: `${se.id}-${f.id}`,
                title: `${se.label} · ${f.label}`,
                items: lenses.filter((i) => i.group === f.id && i.tags.includes(se.id)),
              })),
            );
  return { lenses, shown, groups };
}

function ProductCard({ item, active, eager }: { item: IndexItem; active: boolean; eager: boolean }) {
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className="group block overflow-hidden rounded-card bg-card shadow-card">
      <div className="relative aspect-[4/3] bg-card">
        <Image src={item.image} alt="" fill sizes="(min-width: 1536px) 14vw, (min-width: 1280px) 18vw, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 46vw" preload={eager} className="object-contain p-4" />
      </div>
      <div className={`border-t border-separator px-4 py-3 transition-colors ${active ? "bg-fill" : "group-hover:bg-fill"}`}>
        <p className="truncate text-subhead font-semibold text-label">{item.name}</p>
        <p className="truncate text-footnote text-secondary">{item.code}</p>
      </div>
    </Link>
  );
}

/** Index của Product Wiki: núm loại, bộ lọc ống kính (thu gọn), nhóm món. Lưới: chỉ thẻ; Danh sách: chỉ dòng. Khi Lưới, cột này hiện ở mọi kích thước (SplitLayout browse). */
export function ProductIndex() {
  const { items, kind, setKind, on, toggle, clear } = useBrowse();
  const view = useIndexView("wiki");
  const pathname = usePathname();
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Chỉ một kiểu (thẻ hoặc dòng) được render; chỉ cuộn tới mục đang mở khi cột này hiện (ở chi tiết Lưới thì bị ẩn)
    const shown = Array.from(list.current?.querySelectorAll<HTMLElement>('[aria-current="page"]') ?? []);
    shown.find((el) => el.offsetParent !== null)?.scrollIntoView({ block: "nearest" });
  }, [pathname, kind, view]);

  const { lenses, shown, groups } = browse(items, kind, on);
  const grid = view === "grid";

  return (
    <div className="space-y-6">
      <div className={`flex gap-1 rounded-control bg-fill p-1 ${grid ? "md:max-w-md" : ""}`}>
        {(Object.keys(P.tabs) as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`flex-1 h-11 rounded-badge text-subhead transition ${
              kind === k ? "bg-card shadow-thumb font-semibold text-label" : "font-medium text-label hover:bg-fill-strong"
            }`}
          >
            {P.tabs[k]}
          </button>
        ))}
      </div>

      {kind === "lens" && (
        <details className={`disclosure group rounded-card bg-card shadow-card ${grid ? "md:max-w-2xl" : ""}`}>
          <summary className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2">
            <span className="flex-1 text-subhead font-semibold">{F.label}</span>
            {on.size > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-footnote font-semibold text-on-accent tabular-nums">{on.size}</span>}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-tertiary transition group-open:rotate-90">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="space-y-4 border-t border-separator px-4 pb-4 pt-3">
            {F.groups.map((g) => (
              <div key={g.id} role="group" aria-label={g.label}>
                <div className="mb-2 flex items-center gap-1.5">
                  <h3 className="text-footnote text-secondary">{g.label}</h3>
                  {g.id === "focal" && <InfoTip entry={{ term: g.label, lines: [{ t: F.focalHint }] }} />}
                  {g.id === "use" && <InfoTip entry={{ term: g.label, lines: [{ t: F.useHint }] }} />}
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.chips.map(([id, label]) => {
                    const pressed = on.has(id);
                    const n = pressed ? shown.length : matchLenses(lenses, new Set([...on, id]), F.groups).length;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={pressed}
                        disabled={!pressed && n === 0}
                        onClick={() => toggle(id)}
                        className={`relative h-9 rounded-full px-3 text-footnote transition after:absolute after:inset-x-0 after:-inset-y-1 disabled:cursor-not-allowed disabled:opacity-40 ${
                          pressed ? "bg-accent font-semibold text-on-accent" : "bg-fill font-medium text-label hover:bg-fill-strong"
                        }`}
                      >
                        {label} <span className={`tabular-nums ${pressed ? "" : "text-secondary"}`}>{n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {on.size > 0 && (
              <button type="button" onClick={clear} className="h-11 text-subhead font-semibold text-accent-text hover:underline">
                {F.clear}
              </button>
            )}
          </div>
        </details>
      )}

      {kind === "accessory" && (
        <div className="flex flex-wrap gap-2">
          {groups.filter((g) => g.items.length).map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => document.getElementById(`acc-${g.key}`)?.scrollIntoView({ block: "start" })}
              className="relative h-9 rounded-full bg-fill px-3 text-footnote font-medium text-label transition hover:bg-fill-strong after:absolute after:inset-x-0 after:-inset-y-1"
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      <div ref={list} className="space-y-6" aria-live={on.size ? "polite" : undefined}>
        {groups.some((g) => g.items.length) ? (
          groups.filter((g) => g.items.length).map((g, gi) => (
            <section key={g.key} id={kind === "accessory" ? `acc-${g.key}` : undefined}>
              <h2 className={`mb-2 text-footnote text-secondary ${grid ? "" : "px-4"}`}>{g.title}</h2>
              {grid ? (
                <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {g.items.map((i, n) => (
                    <li key={i.slug}>
                      <ProductCard item={i} active={i.href === pathname} eager={gi === 0 && n < 2} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
                  {g.items.map((i) => (
                    <Link key={i.slug} href={i.href} aria-current={i.href === pathname ? "page" : undefined} className={`${row} ${i.href === pathname ? "bg-fill" : ""}`}>
                      <Image src={i.image} alt="" width={96} height={72} sizes="48px" className="h-9 w-12 flex-shrink-0 object-contain" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-subhead font-semibold text-label">{i.name}</span>
                        <span className="block truncate text-footnote text-secondary">{i.detail ? `${i.code} · ${i.detail}` : i.code}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))
        ) : (
          <p className="rounded-card bg-card p-4 text-subhead text-secondary shadow-card">{F.empty}</p>
        )}
      </div>
    </div>
  );
}