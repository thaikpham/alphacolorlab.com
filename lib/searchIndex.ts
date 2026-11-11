// Server side of search: one SearchItem per note, article, product and recipe. Served as /search-index.json.
import knowledge from '../data/knowledge.json' with { type: 'json' }
import articles from '../data/articles.json' with { type: 'json' }
import products from '../data/products.json' with { type: 'json' }
import presets from './zve10/presets.json' with { type: 'json' }
import { sections } from '../app/content.ts'
import { entryHref, productHref } from './wiki.ts'
import type { SearchItem } from './search.ts'

export function buildIndex(): SearchItem[] {
  const items: SearchItem[] = []

  // Ghi chú gộp vào bài viết: tên và bí danh của nó thành từ khóa của bài viết
  const mergedTerms = new Map<string, string[]>()
  for (const n of knowledge) {
    const into = (n as { mergedInto?: string }).mergedInto
    if (into) mergedTerms.set(into, [...(mergedTerms.get(into) ?? []), n.title, ...n.aliases])
    else
      items.push({
        kind: n.home === 'blog' ? 'article' : 'note',
        title: n.title,
        extra: n.aliases.join(', '),
        summary: n.summary,
        href: entryHref(n.slug),
      })
  }

  for (const a of articles)
    items.push({ kind: 'article', title: a.title, extra: (mergedTerms.get(a.id) ?? []).join(', '), summary: a.dek, href: `/blog/${a.id}` })

  // Products: name, code, short spec summary
  for (const p of products) {
    const s = p.specs as any
    const focal = s.focalMin === s.focalMax ? `${s.focalMin}mm` : `${s.focalMin}–${s.focalMax}mm`
    const summary =
      p.kind === 'camera' ? [s.sensorType, `${s.megapixels} MP`].filter(Boolean).join(' · ')
      : p.kind === 'lens' ? [focal, `F${s.apertureMax}`].join(' · ')
      : ''
    items.push({ kind: 'product', title: p.name, extra: p.code, summary, href: productHref(p.slug) })
  }

  for (const p of presets) items.push({ kind: 'recipe', title: p.name, extra: p.group, summary: p.description_vi, href: `/colors/${p.id}` })

  // Guide sections with route per chapter
  for (const s of sections) {
    const stepTitles = s.steps.map(step => step.title).join(', ')
    items.push({ kind: 'guide', title: s.title, extra: '', summary: `${s.lead}. ${stepTitles}`, href: `/cai-tay/${s.id}` })
  }

  return items
}
