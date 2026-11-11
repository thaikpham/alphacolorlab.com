import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { splitWiki } from '../lib/markdown.ts'
import { fold, resolve } from '../lib/wikilinks.ts'

const knowledge = JSON.parse(readFileSync('data/knowledge.json', 'utf8'))
const articles = JSON.parse(readFileSync('data/articles.json', 'utf8'))
const products = JSON.parse(readFileSync('data/products.json', 'utf8'))

/** Every text field of an article block that can hold [[wikilinks]]. */
function blockTexts(b: any): string[] {
  return [b.text, b.label, b.caption, b.old, b.new, ...(b.items ?? []), ...(b.head ?? []), ...(b.rows ?? []).flat()].filter((s) => typeof s === 'string')
}

const unresolved = (where: string, text: string) =>
  splitWiki(text).flatMap((s) => (s.t === 'wiki' && !resolve(s.title) ? [`${where}: [[${s.title}]]`] : []))

test('fold: accents, đ/Đ and case', () => {
  assert.equal(fold(' Độ sâu trường ảnh '), 'do sau truong anh')
  assert.equal(fold('ĐO SÁNG'), fold('đo sáng'))
})

test('resolve: notes by title and alias, cameras, recipes, unknown', () => {
  assert.equal(resolve('Đo sáng')?.href, '/blog/kien-thuc/do-sang')
  assert.equal(resolve('đo sáng')?.href, '/blog/kien-thuc/do-sang')
  assert.equal(resolve('zv-e10')?.href, '/wiki/san-pham/zv-e10')
  assert.equal(resolve('A6400')?.href, '/wiki/san-pham/a6400')
  assert.equal(resolve('Không có trang này'), null)
})

test('no product slug equals a note slug', () => {
  const slugs = new Set(knowledge.map((n: any) => n.slug))
  assert.deepEqual(products.map((p: any) => p.slug).filter((slug: string) => slugs.has(slug)), [])
})

test('every wikilink in knowledge bodies resolves', () => {
  assert.deepEqual(knowledge.flatMap((n: any) => unresolved(n.slug, n.body ?? '')), [])
})

test('every wikilink in article blocks resolves', () => {
  assert.deepEqual(articles.flatMap((a: any) => a.blocks.flatMap((b: any, i: number) => blockTexts(b).flatMap((t) => unresolved(`${a.id} block[${i}]`, t)))), [])
})

test('no Creative Look or Creative Style anywhere', () => {
  const all = JSON.stringify([knowledge, articles]).toLowerCase()
  assert(!all.includes('creative look'), 'Found "Creative Look"')
  assert(!all.includes('creative style'), 'Found "Creative Style"')
})

test('product names and codes resolve to /wiki/san-pham/…', () => {
  // Test a few product names and codes
  const a6400 = resolve('A6400')
  assert(a6400?.href === '/wiki/san-pham/a6400', `A6400 should resolve to /wiki/san-pham/a6400, got ${a6400?.href}`)
  const ilce6400 = resolve('ILCE-6400')
  assert(ilce6400?.href === '/wiki/san-pham/a6400', `ILCE-6400 should resolve to /wiki/san-pham/a6400`)
})

test('merged-note titles resolve to /blog/<article id>', () => {
  const merged = knowledge.find((n: any) => n.group === 'merged')
  if (merged) {
    const resolved = resolve(merged.title)
    assert(resolved?.href.startsWith('/blog/'), `Merged note ${merged.slug} did not resolve to /blog/`)
    assert.equal(resolved?.href, `/blog/${merged.mergedInto}`)
  }
})
