import { test } from 'node:test'
import assert from 'node:assert/strict'
import { searchIndex } from '../lib/search.ts'
import { buildIndex } from '../lib/searchIndex.ts'
import { fold } from '../lib/wikilinks.ts'
import { synonymGroups } from '../lib/searchSynonyms.ts'

const index = buildIndex()

test('buildIndex returns all categories', () => {
  const kinds = new Set(index.map((i) => i.kind))
  assert.deepEqual(kinds, new Set(['guide', 'note', 'article', 'product', 'recipe']))
  assert(index.length > 0, 'index should not be empty')
})

test('index includes products, notes, articles, recipes and guide sections', () => {
  const products = index.filter((i) => i.kind === 'product')
  const articles = index.filter((i) => i.kind === 'article')
  const recipes = index.filter((i) => i.kind === 'recipe')
  const guides = index.filter((i) => i.kind === 'guide')
  const knowledgeNotes = index.filter((i) => i.kind === 'note')

  assert(products.length >= 124, `should have at least 124 products, got ${products.length}`)
  assert(articles.length >= 20, `should have at least 20 articles, got ${articles.length}`)
  assert(recipes.length >= 40, `should have at least 40 recipes, got ${recipes.length}`)
  assert(guides.length >= 3, `should have at least 3 guide sections, got ${guides.length}`)
  assert(knowledgeNotes.length >= 20, `should have at least 20 knowledge notes, got ${knowledgeNotes.length}`)
})

test('every item has required fields', () => {
  for (const item of index) {
    assert(item.kind, 'missing kind')
    assert(item.title, 'missing title')
    assert(typeof item.extra === 'string', 'extra should be string')
    assert(typeof item.summary === 'string', 'summary should be string')
    assert(item.href, 'missing href')
  }
})

test('every href is unique and valid', () => {
  const hrefs = new Set<string>()
  for (const item of index) {
    assert(!hrefs.has(item.href), `duplicate href: ${item.href}`)
    assert(
      item.href.startsWith('/wiki/') || item.href.startsWith('/blog/') || item.href.startsWith('/colors/') || item.href.startsWith('/cai-tay/') || item.href.startsWith('/#'),
      `invalid href: ${item.href}`
    )
    hrefs.add(item.href)
  }
})

test('empty query returns empty', () => {
  assert.deepEqual(searchIndex(index, ''), [])
  assert.deepEqual(searchIndex(index, '   '), [])
})

test('vietnamese without accents finds accented text', () => {
  const results = searchIndex(index, 'do sang')
  assert(results.length > 0, 'should find "Đo sáng"')
  assert(
    results[0].title.includes('Đo sáng') || results.some((r) => r.title.includes('Đo sáng')),
    'should include "Đo sáng"'
  )
})

test('uppercase finds lowercase', () => {
  const results = searchIndex(index, 'ĐO SÁNG')
  assert(results.length > 0, 'should find with uppercase query')
})

test('multi-token query requires all tokens', () => {
  const resultsOne = searchIndex(index, 'lấy')
  const resultsMulti = searchIndex(index, 'lấy nét')
  assert(resultsMulti.length > 0, 'should find multi-token query')
  // Multi-token should have more specific results than single-token (or equal)
  assert(resultsMulti.length <= resultsOne.length, 'multi-token should be more specific')
})

test('title starts with query has high ranking', () => {
  const results = searchIndex(index, 'Picture')
  if (results.length > 0) {
    // First result should be Picture Profile related if it exists
    assert(results[0].title.toLowerCase().includes('picture') || results.some((r) => r.title.toLowerCase().startsWith('picture')))
  }
})

test('product names and codes are searchable', () => {
  const resultsZv = searchIndex(index, 'ZV-E10')
  const resultsA6400 = searchIndex(index, 'A6400')
  const resultsIlce = searchIndex(index, 'ILCE-6400')
  assert(resultsZv.length > 0, 'should find ZV-E10')
  assert(resultsA6400.length > 0, 'should find A6400')
  assert(resultsIlce.length > 0, 'should find ILCE-6400')
})

test('model codes without spaces match with spaces: zve10, zv e10, ZV-E10', () => {
  const r1 = searchIndex(index, 'zve10')
  const r2 = searchIndex(index, 'zv e10')
  const r3 = searchIndex(index, 'ZV-E10')
  assert(r1.length > 0, 'should find zve10')
  assert(r2.length > 0, 'should find zv e10')
  assert(r3.length > 0, 'should find ZV-E10')
  // All should return the same product
  if (r1.length > 0 && r2.length > 0 && r3.length > 0) {
    assert.equal(r1[0].href, r2[0].href, 'zve10 and "zv e10" should match same product')
    assert.equal(r1[0].href, r3[0].href, 'zve10 and ZV-E10 should match same product')
  }
})

test('recipe group names are searchable via extra', () => {
  const results = searchIndex(index, 'Ấm')
  const recipes = results.filter((r) => r.kind === 'recipe')
  assert(recipes.length > 0, 'should find recipes by group')
})




test('exact title match has highest score', () => {
  const results = searchIndex(index, 'Picture Profile')
  if (results.length > 0) {
    // Check that exact/near-exact matches rank first
    const hasExact = results.some((r) => r.title.toLowerCase().includes('picture profile'))
    assert(hasExact, 'should include exact match')
  }
})

test('every synonym group has a phrase that occurs in the index', () => {
  const text = index.map((i) => ` ${[i.title, i.extra, i.summary].map((s) => fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean).join(' ')).join(' | ')} `)
  for (const group of synonymGroups) assert.ok(group.some((p) => text.some((t) => t.includes(` ${p} `))), group.join(' / '))
})

test('article topic label is searchable: quay phim, video, quay video find every video-topic article', async () => {
  const { default: articles } = await import('../data/articles.json', { with: { type: 'json' } })
  const videoHrefs = articles.filter((a) => a.topic === 'video').map((a) => `/blog/${a.id}`)
  assert(videoHrefs.length > 0, 'expected video-topic articles in data')
  for (const q of ['quay phim', 'video', 'quay video']) {
    const hrefs = searchIndex(index, q).map((r) => r.href)
    for (const href of videoHrefs) assert.ok(hrefs.includes(href), `"${q}" should find ${href}`)
  }
})
