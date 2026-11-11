// Every published article passes the AIO/SEO and house-style checks of scripts/article-check.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import articles from '../data/articles.json' with { type: 'json' }
import { checkArticle } from '../scripts/article-check.ts'

test('every article passes article-check', () => {
  for (const a of articles) assert.deepEqual(checkArticle(a), [], a.id)
})
