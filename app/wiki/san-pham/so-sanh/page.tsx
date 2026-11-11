import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { wiki } from "@/app/content";
import { productBySlug, productHref } from "@/lib/wiki";
import { compareRows } from "@/lib/productSpecs";
import { resolve } from "@/lib/wikilinks";
import { BackLink } from "@/app/components/BackLink";
import { CompareSync } from "@/app/components/Compare";
import { SITE_URL } from "@/lib/site";

const t = wiki.product.compare;
type Search = Promise<{ sp?: string | string[] }>;

export const metadata: Metadata = { title: t.title, description: t.description, alternates: { canonical: `${SITE_URL}/wiki/san-pham/so-sanh` } };

export default function ComparePage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 md:px-8 pt-16 pb-24 sm:pt-24 md:pt-6">
        <BackLink href="/wiki">{wiki.product.title}</BackLink>
        <h1 className="text-display font-light mt-4 mb-8">{t.title}</h1>
        <Suspense fallback={null}>
          <CompareTable searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function CompareTable({ searchParams }: { searchParams: Search }) {
  const sp = (await searchParams).sp;
  const found = [...new Set(String(sp ?? "").split(","))]
    .map((s) => productBySlug(s))
    .filter((p) => p?.kind === "camera" || p?.kind === "lens") as NonNullable<ReturnType<typeof productBySlug>>[];
  // Mixed kinds: keep the first product's kind; at most 4 columns.
  const ps = found.filter((p) => p.kind === found[0].kind).slice(0, 4);
  const href = (slugs: string[]) => `/wiki/san-pham/so-sanh?sp=${slugs.join(",")}`;
  // Only a URL that names products (or an emptied ?sp=) rewrites the stored pick; a bare /so-sanh leaves it alone.
  const sync = sp !== undefined && <CompareSync items={ps.map((p) => ({ slug: p.slug, kind: p.kind as "camera" | "lens", name: p.name }))} />;

  if (ps.length === 0) return <>{sync}<p className="text-body text-secondary max-w-2xl">{t.empty}</p></>;

  return (
    <>
      {sync}
      <div className="overflow-x-auto rounded-card bg-card shadow-card">
        <table className="w-full text-subhead">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-28 bg-card sm:w-44">
                <span className="sr-only">{wiki.product.specs}</span>
              </th>
              {ps.map((p) => (
                <th key={p.slug} scope="col" className="min-w-40 p-3 text-left align-top font-normal">
                  <div className="relative aspect-[4/3]">
                    <Image src={p.image} alt={wiki.product.photo(p.name, p.code)} fill loading="eager" fetchPriority="high" sizes="220px" className="object-contain" />
                  </div>
                  <Link href={productHref(p.slug)} className="mt-2 block text-callout font-semibold hover:text-accent-text">
                    {p.name}
                  </Link>
                  <p className="text-footnote text-secondary">{p.code}</p>
                  <Link href={href(ps.filter((x) => x !== p).map((x) => x.slug))} className="inline-flex min-h-11 items-center text-footnote text-accent-text hover:underline">
                    {t.remove}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-separator border-t border-separator">
            {compareRows(ps).map((r) => {
              const target = r.note ? resolve(r.note) : null;
              return (
                <tr key={r.label}>
                  <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left align-top text-footnote font-normal text-secondary sm:text-subhead">
                    {target ? <Link href={target.href} className="text-accent-text hover:underline">{r.label}</Link> : r.label}
                  </th>
                  {r.values.map((v, i) => (
                    <td key={ps[i].slug} className="p-3 align-top">{v ?? t.missing}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
