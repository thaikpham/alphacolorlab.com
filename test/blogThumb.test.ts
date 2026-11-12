import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { blogIndex, list, thumbOf } from '../lib/blog.ts'

const root = fileURLToPath(new URL('..', import.meta.url))

test('mọi bài có ảnh đầu, và file nằm trong public/', () => {
  const articles = list()
  assert.ok(articles.length > 0)
  for (const a of articles) {
    const thumb = thumbOf(a)
    assert.ok(thumb, `${a.id} thiếu ảnh đầu`)
    assert.equal(thumb.svg, thumb.src.endsWith('.svg'), `${a.id} sai cờ svg`)
    assert.ok(existsSync(join(root, 'public', thumb.src)), `${a.id}: không có ${thumb.src}`)
  }
})

test('blogIndex: bài có ảnh đầu, mục khác (bài viết ngắn, lộ trình) thì không', () => {
  const byHref = new Map(list().map((a) => [`/blog/${a.id}`, a]))
  for (const item of blogIndex().flatMap((g) => g.items)) {
    const article = byHref.get(item.href)
    if (article) assert.deepEqual(item.image, thumbOf(article), article.id)
    else assert.equal(item.image, undefined, item.href)
  }
})
