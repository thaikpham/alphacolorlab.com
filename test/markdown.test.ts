import { test } from 'node:test'
import assert from 'node:assert'
import { parseMarkdown, splitWiki, stripWiki } from '../lib/markdown.ts'

test('markdown parser', async (t) => {
  await t.test('parses headings', () => {
    const blocks = parseMarkdown('## Heading 2\n### Heading 3')
    assert.equal(blocks.length, 2)
    assert.equal(blocks[0].t, 'h2')
    assert.equal(blocks[1].t, 'h3')
  })

  await t.test('parses paragraphs', () => {
    const blocks = parseMarkdown('Some text\n\nMore text')
    assert.equal(blocks.length, 2)
    assert.equal(blocks[0].t, 'p')
    assert.equal(blocks[1].t, 'p')
  })

  await t.test('parses inline formatting', () => {
    const blocks = parseMarkdown('Text with **bold** and *em* and [[wiki]].')
    assert.equal(blocks.length, 1)
    assert.equal(blocks[0].t, 'p')
    if (blocks[0].t === 'p') {
      const inline = blocks[0].inline
      assert(inline.some((i) => i.t === 'strong'))
      assert(inline.some((i) => i.t === 'em'))
      assert(inline.some((i) => i.t === 'wiki'))
    }
  })

  await t.test('parses bullet lists', () => {
    const blocks = parseMarkdown('- Item 1\n- Item 2\n- Item 3')
    assert.equal(blocks.length, 1)
    assert.equal(blocks[0].t, 'ul')
    if (blocks[0].t === 'ul') {
      assert.equal(blocks[0].items.length, 3)
    }
  })

  await t.test('parses ordered lists', () => {
    const blocks = parseMarkdown('1. First\n2. Second\n3. Third')
    assert.equal(blocks.length, 1)
    assert.equal(blocks[0].t, 'ol')
    if (blocks[0].t === 'ol') {
      assert.equal(blocks[0].items.length, 3)
    }
  })

  await t.test('parses tables', () => {
    const blocks = parseMarkdown('| Col 1 | Col 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n| Cell 3 | Cell 4 |')
    assert.equal(blocks.length, 1)
    assert.equal(blocks[0].t, 'table')
    if (blocks[0].t === 'table') {
      assert.equal(blocks[0].head.length, 2)
      assert.equal(blocks[0].rows.length, 2)
    }
  })

  await t.test('drops leading h1', () => {
    const blocks = parseMarkdown('# Title\n## Section\nPara')
    assert.equal(blocks[0].t, 'h2')
  })
})

test('wiki functions', async (t) => {
  await t.test('splitWiki extracts wikilinks', () => {
    const segs = splitWiki('Text with [[Link]] and [[Another|display]]')
    assert.equal(segs.length, 4) // text, wiki, text, wiki
    // Check for wiki segments
    const wikiCount = segs.filter((s) => s.t === 'wiki').length
    assert.equal(wikiCount, 2, 'Should have 2 wiki segments')
    // Verify the content includes expected wikilinks
    const content = JSON.stringify(segs)
    assert(content.includes('Link'), 'Should contain Link')
    assert(content.includes('display'), 'Should contain display')
  })

  await t.test('stripWiki removes wikilinks', () => {
    const text = stripWiki('Text with [[Link|display]] here')
    assert.equal(text, 'Text with display here')
  })

  await t.test('handles wikilink fragments', () => {
    const segs = splitWiki('[[Title#fragment]]')
    assert.equal(segs.length, 1)
    assert.equal(segs[0].t, 'wiki')
    if (segs[0].t === 'wiki') {
      assert.equal(segs[0].title, 'Title')
    }
  })
})
