// schema.org JSON-LD for search engines and AI answers. Rendered by app/components/JsonLdScript.tsx.
// No Product schema: Google flags it invalid without offers or reviews, and the site shows no prices.
import { nav, seo } from "../app/content.ts";
import { SITE_URL } from "./site.ts";

const abs = (path: string) => new URL(path, SITE_URL).href;
/** [[Target|label]] → label, [[Target]] → Target, **bold** → bold */
const plain = (s: string) => s.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1").replace(/\*\*/g, "");
const publisher = { "@type": "Organization", name: seo.siteName, url: SITE_URL };

export const webSiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: seo.siteName,
  url: SITE_URL,
  inLanguage: "vi",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

/** Home › section › … › page. Each crumb is [name, path]. */
export const breadcrumbLd = (...crumbs: [name: string, path: string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [[nav.apps[0].label, "/"], ...crumbs].map(([name, path], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: abs(path),
  })),
});

// Loose on purpose: accepts lib/blog.ts blocks without importing them (keeps this file node-testable).
type Block = { readonly t: string; readonly src?: string; readonly items?: readonly unknown[] };
type ArticleLike = {
  title: string;
  description: string;
  path: string;
  blocks?: readonly Block[];
  updatedAt?: string;
  reviewedAt?: string | null;
  authorName?: string | null;
};

/** Raster (photo) figures in order. SVG diagrams are skipped so og:image and Article.image stay photos. */
const photoSrcs = (blocks: readonly Block[] = []) =>
  blocks.flatMap((b) => (b.t === "figure" && b.src && !b.src.endsWith(".svg") ? [b.src] : []));

/** First photo of an article, as an absolute URL (for og:image). */
export const leadImage = (blocks: readonly Block[] = []) => {
  const src = photoSrcs(blocks)[0];
  return src ? abs(src) : undefined;
};

export function articleLd(a: ArticleLike) {
  const photos = photoSrcs(a.blocks).map(abs);
  const image = photos.length > 1 ? photos : photos[0];
  const published = a.reviewedAt ?? a.updatedAt;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    inLanguage: "vi",
    mainEntityOfPage: abs(a.path),
    publisher,
    author: a.authorName ? { "@type": "Person", name: a.authorName } : publisher,
    ...(image && { image }),
    ...(published && { datePublished: published }),
    ...(a.updatedAt && { dateModified: a.updatedAt }),
  };
}

/** FAQPage from the article's faq block, or null when it has none. */
export function faqLd(blocks: readonly Block[] = []) {
  const items = blocks.find((b) => b.t === "faq")?.items as { q: string; a: string }[] | undefined;
  if (!items?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: plain(q),
      acceptedAnswer: { "@type": "Answer", text: plain(a) },
    })),
  };
}
