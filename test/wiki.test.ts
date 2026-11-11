import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseMarkdown } from '../lib/markdown.ts'
import { wiki } from '../app/content.ts'
import { backlinks, entryHref } from '../lib/wiki.ts'
import { specRows } from '../lib/productSpecs.ts'
import { resolve } from '../lib/wikilinks.ts'

const products = JSON.parse(readFileSync('data/products.json', 'utf8'))
const knowledge = JSON.parse(readFileSync('data/knowledge.json', 'utf8'))

// Accessories without spec fields (adapters, cases, cards...) show a single row too.
test('every product renders clean spec rows whose label notes exist', () => {
  for (const p of products) {
    const rows = specRows(p)
    assert(rows.length >= (p.kind === 'accessory' ? 1 : 2), p.code)
    for (const r of rows) {
      assert(!/null|undefined|NaN/.test(r.value), `${p.code} ${r.label}: ${r.value}`)
      if (r.note) assert(resolve(r.note), `${p.code}: note "${r.note}" not found`)
    }
  }
  const value = (code: string, label: string) => specRows(products.find((p: { code: string }) => p.code === code)).find((r) => r.label === label)?.value
  assert.equal(value('ILCE-7CM2', 'Video 4K'), '60p · 30p · 24p')
  assert.equal(value('ILCE-7CM2', 'Độ phân giải ảnh'), '33 MP')
  assert.equal(value('ZV-E10', 'Độ phân giải ảnh'), '24,2 MP')
  assert.equal(value('SEL400F28GM', 'Filter sau'), '40,5 mm (drop-in)')
  assert.equal(value('SEL2070G', 'Khẩu độ lớn nhất'), 'F4')
})

test('every knowledge body parses without a leftover "# " title line', () => {
  const leftovers = knowledge.flatMap((note: { slug: string; body: string }) =>
    parseMarkdown(note.body).flatMap((b) => (b.t === 'p' && b.inline[0]?.t === 'text' && b.inline[0].text.startsWith('# ') ? [note.slug] : [])),
  )
  assert.deepEqual(leftovers, [])
})

test('backlinks mirror links: every linked note lists the linking note', () => {
  const slugOf = new Map<string, string>(knowledge.map((n: { slug: string; title: string }) => [n.title, n.slug]))
  for (const n of knowledge) {
    for (const title of n.links) {
      const target = slugOf.get(title)
      assert(target, `${n.slug} links to unknown note "${title}"`)
      assert(backlinks(target).some((b) => b.slug === n.slug), `${target} is missing backlink from ${n.slug}`)
    }
  }
  assert.deepEqual(backlinks('khong-co-ghi-chu-nay'), [])
})

test('entryHref covers all notes', () => {
  for (const note of knowledge) {
    const href = entryHref(note.slug)
    assert(href, `No href for note ${note.slug}`)
    assert(typeof href === 'string', `href for ${note.slug} is not a string`)
  }
})

test('knowledge home entries are listed in exactly one group', () => {
  const knowledgeNotes = knowledge.filter((k: any) => k.home === 'knowledge')
  const groupCounts = new Map<string, number>()
  for (const note of knowledgeNotes) {
    const group = note.group
    assert(group, `Knowledge note ${note.slug} has no group`)
    // every group must be one the /blog/kien-thuc page renders
    assert(wiki.knowledge.groups.some((g) => g.id === group), `Unknown group "${group}" for ${note.slug}`)
    groupCounts.set(note.slug, (groupCounts.get(note.slug) || 0) + 1)
  }
  for (const [slug, count] of groupCounts) {
    assert.equal(count, 1, `Note ${slug} appears in ${count} groups`)
  }
})
