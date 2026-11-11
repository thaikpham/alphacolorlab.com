import { test } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import fs from 'fs'

const projectRoot = process.cwd()

test('data validation', async (t) => {
  await t.test('articles.json has at least 27 articles with valid structure', () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, 'data/articles.json'), 'utf-8'))
    assert.ok(articles.length >= 27, `Expected at least 27 articles, got ${articles.length}`)
    const ids = new Set()
    for (const article of articles) {
      assert(article.id, 'Article missing id')
      assert(article.title, 'Article missing title')
      assert(article.blocks, 'Article missing blocks')
      assert(!ids.has(article.id), `Duplicate article id: ${article.id}`)
      ids.add(article.id)
    }
  })

  await t.test('article blocks have valid types', () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, 'data/articles.json'), 'utf-8'))
    const validTypes = new Set(['tldr', 'h', 'p', 'menu', 'table', 'callout', 'compare', 'checklist', 'figure', 'embed', 'faq'])
    for (const article of articles) {
      for (const block of article.blocks) {
        assert(validTypes.has(block.t), `Invalid block type: ${block.t}`)
      }
    }
  })

  await t.test('all figures have src under /blog/ with valid width/height', () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, 'data/articles.json'), 'utf-8'))
    for (const article of articles) {
      for (const block of article.blocks) {
        if (block.t === 'figure') {
          assert(block.src, `Figure in ${article.id} missing src`)
          assert(block.src.startsWith('/blog/'), `Figure src must start with /blog/: ${block.src}`)
          assert(!block.src.startsWith('http'), `Figure src must not be URL: ${block.src}`)
          assert(block.width && block.width > 0, `Figure src ${block.src} missing valid width`)
          assert(block.height && block.height > 0, `Figure src ${block.src} missing valid height`)

          // Check file exists
          const filePath = join(projectRoot, 'public', block.src)
          assert(
            fs.existsSync(filePath),
            `Figure image not found: ${filePath}`,
          )
        }
      }
    }
  })

  await t.test('knowledge.json has non-empty bodies', () => {
    const knowledge = JSON.parse(readFileSync(join(projectRoot, 'data/knowledge.json'), 'utf-8'))
    assert.equal(knowledge.length, 39, `Expected 39 knowledge entries, got ${knowledge.length}`)
    for (const note of knowledge) {
      assert(note.body, `Knowledge note "${note.title}" missing body`)
      assert(note.level, `Knowledge note "${note.title}" missing level`)
    }
  })

  await t.test('no Creative Look or Creative Style in data', () => {
    const dataDir = join(projectRoot, 'data')
    const files = ['products.json', 'articles.json', 'knowledge.json']
    for (const file of files) {
      const content = readFileSync(join(dataDir, file), 'utf-8').toLowerCase()
      assert(
        !content.includes('creative look') && !content.includes('creative style'),
        `Found Creative Look/Style in ${file}`,
      )
    }
  })
})
