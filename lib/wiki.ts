/**
 * Wiki data accessors for products and knowledge notes.
 */

import productsData from '../data/products.json' with { type: 'json' }
import knowledgeData from '../data/knowledge.json' with { type: 'json' }

export type Product = Readonly<typeof productsData[0]>
export type Knowledge = Readonly<typeof knowledgeData[0]> & {
  home?: string
  group?: string
  body?: string
}

export function products(): readonly Product[] {
  return productsData
}

export function productBySlug(slug: string): Product | undefined {
  return products().find((p) => p.slug === slug)
}

export function knowledge(): readonly Knowledge[] {
  return knowledgeData
}

export function knowledgeBySlug(slug: string): Knowledge | undefined {
  return knowledge().find((k) => k.slug === slug)
}

export function backlinks(slug: string): readonly Knowledge[] {
  const note = knowledgeBySlug(slug)
  if (!note) return []
  return knowledge().filter((k) => (k.links as any)?.includes((note as any).title) || false)
}

/** Single source of truth for note URLs. */
export function entryHref(slug: string): string {
  const note = knowledgeBySlug(slug)
  if (!note) throw new Error(`Unknown note slug: ${slug}`)

  switch ((note as any).home) {
    case 'knowledge':
      return `/blog/kien-thuc/${slug}`
    case 'product':
      return `/wiki/san-pham/${slug}`
    case 'blog': {
      const group = (note as any).group
      if (group === 'merged') {
        return `/blog/${(note as any).mergedInto}`
      } else if (group === 'post') {
        return `/blog/${slug}`
      }
      throw new Error(`Unknown blog group for note ${slug}`)
    }
    default:
      throw new Error(`Unknown home type for note ${slug}`)
  }
}

/** Single source of truth for product URLs. */
export function productHref(slug: string): string {
  const product = productBySlug(slug)
  if (!product) throw new Error(`Unknown product slug: ${slug}`)
  return `/wiki/san-pham/${slug}`
}
