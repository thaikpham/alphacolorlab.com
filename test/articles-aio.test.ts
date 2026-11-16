// Every published article passes the AIO/SEO and house-style checks of scripts/article-check.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import articles from '../data/articles.json' with { type: 'json' }
import { checkArticle } from '../scripts/article-check.ts'

test('every article passes article-check', () => {
  for (const a of articles) assert.deepEqual(checkArticle(a), [], a.id)
})

test('khối set chỉ trỏ tới bộ công khai', () => {
  const withSet = (id: string) => ({ ...articles[0], blocks: [{ t: 'set', id }, ...articles[0].blocks] })
  const setProblems = (id: string) => checkArticle(withSet(id)).filter((p) => p.startsWith('khối set'))
  assert.deepEqual(setProblems('zv-e10-hybrid'), [])
  assert.deepEqual(setProblems('shoot-easy'), ['khối set: không có bộ "shoot-easy" trong danh sách công khai'])
  assert.deepEqual(setProblems('khong-co'), ['khối set: không có bộ "khong-co" trong danh sách công khai'])
})
