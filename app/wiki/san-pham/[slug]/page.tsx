import { notFound } from "next/navigation";
import Link from "next/link";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { productBySlug, products, knowledge, knowledgeBySlug, entryHref, productHref } from "@/lib/wiki";
import { resolve } from "@/lib/wikilinks";
import { productSummary, specRows } from "@/lib/productSpecs";
import { wiki, seo, sonyBodies, alphaConsole } from "@/app/content";
import { BackLink } from "@/app/components/BackLink";
import { LinkRow } from "@/app/components/LinkRow";
import { Markdown } from "@/app/components/Markdown";
import { NotePage } from "@/app/components/NotePage";
import { CompareToggle } from "@/app/components/Compare";
import { Community } from "@/app/components/Community";
import Image from "next/image";
import { SITE_URL } from "@/lib/site";
import { JsonLdScript } from "@/app/components/JsonLdScript";
import { breadcrumbLd } from "@/lib/jsonld";

// Product pages plus notes that live in the Product Wiki (e.g. the ZV-E10 / A6400 / A7C II comparison)
const productNote = (slug: string) => {
  const note = knowledgeBySlug(slug);
  return note && (note as any).home === "product" ? note : undefined;
};

export async function generateStaticParams() {
  return [
    ...products().map((p) => ({ slug: p.slug })),
    ...knowledge().filter((k) => (k as any).home === "product").map((k) => ({ slug: k.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const product = productBySlug(slug);
  if (product) return { title: `${product.name === product.code ? product.name : `${product.name} (${product.code})`} · Thông số`, description: productSummary(product), alternates: { canonical: `${SITE_URL}/wiki/san-pham/${slug}` } };
  const note = productNote(slug);
  return note ? { title: `${note.title}${seo.wikiSuffix}`, description: note.summary, alternates: { canonical: `${SITE_URL}/wiki/san-pham/${slug}` } } : {};
}

export default async function ProductSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const product = productBySlug(slug);
  if (!product) {
    const note = productNote(slug);
    if (!note) notFound();
    return <NotePage note={note} back={{ href: "/wiki", label: wiki.product.title }} />;
  }

  const reviewPath = join(process.cwd(), `data/reviews/${slug}.md`);
  const review = existsSync(reviewPath) ? readFileSync(reviewPath, "utf-8") : null;
  const href = productHref(slug);
  // Cameras with a guide in Alpha Console (sonyBodies id): link there with that camera picked
  const guided = sonyBodies.find((b) => b.code === product.code && b.id)?.id;
  // Notes whose [[wikilinks]] point at this product
  const mentions = knowledge().filter((k) => [...((k as any).body ?? "").matchAll(/\[\[([^\]|]+)/g)].some(([, t]) => resolve(t)?.href === href));

  return (
    <div className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 md:px-8 xl:px-12 pt-16 pb-24 sm:pt-24 md:pt-6">
        <BackLink href="/wiki">{wiki.product.title}</BackLink>
        {/* One column, full width of the detail pane: title, summary, photo, specs, review, mentions, comments. Text before the photo keeps text the LCP on phones. */}
        <div className="flex flex-wrap items-end justify-between gap-4 mt-4 mb-6">
          <div>
            <h1 className="text-display font-light">{product.name}</h1>
            <p className="text-subhead text-secondary">{product.code}</p>
          </div>
          {(product.kind === "camera" || product.kind === "lens") && (
            <CompareToggle item={{ slug: product.slug, kind: product.kind, name: product.name }} />
          )}
        </div>
        <p className="mb-6 text-body">{productSummary(product)}</p>
        {guided && (
          <Link href={`/console?model=${guided}`} className="mb-6 inline-flex h-11 items-center rounded-full bg-accent/10 px-5 text-subhead font-semibold text-accent-text transition-colors hover:bg-accent/15">
            {alphaConsole.productCta}
          </Link>
        )}
        {/* Phones: a smaller photo than the summary above, so text stays the LCP (an image LCP waits on all JS in Lighthouse's mobile model) */}
        <div className="relative mb-8 mx-auto w-1/2 aspect-[4/3] rounded-card bg-card shadow-card sm:mx-0 sm:w-full sm:aspect-[21/9]">
          <Image src={product.image} alt={wiki.product.photo(product.name, product.code)} fill loading="eager" fetchPriority="high" sizes="(min-width: 768px) 70vw, (min-width: 640px) 100vw, 50vw" className="object-contain p-3 sm:p-6" />
        </div>

        <section>
          <h2 className="text-title3 font-medium mb-3">{wiki.product.specs}</h2>
          <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
            {specRows(product).map(({ label, note, value }) => {
              const target = note ? resolve(note) : null;
              return (
                <div key={label} className="flex items-start gap-3 px-4 py-3 min-h-11">
                  <span className="w-2/5 flex-shrink-0 text-subhead text-secondary">
                    {target ? (
                      <Link href={target.href} className="text-accent-text hover:underline">{label}</Link>
                    ) : (
                      label
                    )}
                  </span>
                  <span className="flex-1 min-w-0 text-right text-subhead">{value}</span>
                </div>
              );
            })}
          </div>
          <a href={product.source} target="_blank" rel="noopener" className="inline-flex items-center min-h-11 mt-1 text-footnote text-accent-text hover:underline">
            {wiki.product.source}
          </a>
        </section>

        {review && (
          <section className="mt-8">
            <h2 className="text-title3 font-medium mb-3">{wiki.product.review}</h2>
            <Markdown body={review} />
          </section>
        )}

        {mentions.length > 0 && (
          <section className="mt-8">
            <h2 className="text-title3 font-medium mb-3">{wiki.product.mentions}</h2>
            <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
              {mentions.map((n) => (
                <LinkRow key={n.slug} href={entryHref(n.slug)} title={n.title} detail={n.summary} />
              ))}
            </div>
          </section>
        )}
        <Community page={`product/${product.slug}`} title={product.name} />
        <JsonLdScript schema={breadcrumbLd([wiki.list.title, "/wiki"], [product.name, `/wiki/san-pham/${product.slug}`])} />
      </div>

    </div>
  );
}
