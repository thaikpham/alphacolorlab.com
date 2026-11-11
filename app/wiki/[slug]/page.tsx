import { permanentRedirect, notFound } from "next/navigation";
import { knowledgeBySlug, products, knowledge, entryHref, productHref } from "@/lib/wiki";

// Old product slug mappings: id → slug
const OLD_PRODUCT_ID_MAP: Record<string, string> = {
  'sony-ilce-6400-b-ap2': 'a6400',
  'sony-zv-e10-bq-ap2': 'zv-e10',
}

export async function generateStaticParams() {
  const allProducts = products();
  const allKnowledge = knowledge();
  return [
    // Product slugs
    ...allProducts.map((p) => ({ slug: p.slug })),
    // Old product IDs → new slugs
    ...Object.entries(OLD_PRODUCT_ID_MAP).map(([id]) => ({ slug: id })),
    // Knowledge slugs
    ...allKnowledge.map((k) => ({ slug: k.slug })),
  ];
}

export default async function WikiSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;

  // Try old product ID
  const newSlug = OLD_PRODUCT_ID_MAP[slug];
  if (newSlug) {
    permanentRedirect(productHref(newSlug));
  }

  // Old product URL /wiki/<slug> → /wiki/san-pham/<slug>
  if (products().some((p) => p.slug === slug)) permanentRedirect(productHref(slug));

  // Try knowledge by slug
  const note = knowledgeBySlug(slug);
  if (note) {
    permanentRedirect(entryHref(note.slug));
  }

  notFound();
}
