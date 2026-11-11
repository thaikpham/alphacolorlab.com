/**
 * Wikilink resolver: [[Title]] → href for notes, articles, cameras and Color Bank recipes.
 * Keys are folded titles and aliases. A key that points at two pages throws when the module loads, so a clash fails the build.
 */

import knowledge from '../data/knowledge.json' with { type: 'json' }
import articles from '../data/articles.json' with { type: 'json' }
import products from '../data/products.json' with { type: 'json' }
import presets from './zve10/presets.json' with { type: 'json' }
import { entryHref as entryHrefFn, productHref } from './wiki.ts'
import { fold } from './fold.ts'

export { entryHrefFn as entryHref }

export type WikiLinkTarget = { href: string; title: string }

/** NFD, strip marks, đ/Đ → d, lowercase, trim: the same rule as ColorLab and alphaskill. */
export { fold }

const registry = new Map<string, WikiLinkTarget>()

function add(name: string, href: string, title = name) {
  const key = fold(name)
  const at = registry.get(key)
  if (at && at.href !== href) throw new Error(`Wikilink collision: "${name}" (folded "${key}") → ${at.href} and ${href}`)
  if (!at) registry.set(key, { href, title })
}

for (const n of knowledge) for (const name of [n.title, ...(n.aliases || [])]) add(name, entryHrefFn(n.slug), n.title)
// Id too: a link written as [[id|chữ hiển thị]] survives a title rewrite
for (const a of articles) for (const name of [a.title, a.id]) add(name, `/blog/${a.id}`, a.title)

// Register all products by name and code
for (const p of products) {
  // Register by name and code
  add(p.name, productHref(p.slug), p.name)
  add(p.code, productHref(p.slug), p.name)
}

for (const p of presets) add(p.name, `/colors/${p.id}`)

export const resolve = (title: string): WikiLinkTarget | null => registry.get(fold(title)) ?? null
