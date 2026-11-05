import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseMarkdown } from './markdown'

describe('parseMarkdown', () => {
  it('parses h2 and h3 headings', () => {
    const blocks = parseMarkdown('## Title\n### Subtitle')
    expect(blocks[0]).toEqual({ t: 'h2', text: 'Title' })
    expect(blocks[1]).toEqual({ t: 'h3', text: 'Subtitle' })
  })

  it('parses paragraphs', () => {
    const blocks = parseMarkdown('Paragraph text')
    expect(blocks[0].t).toBe('p')
    if (blocks[0].t === 'p') {
      expect(blocks[0]).toHaveProperty('inline')
    }
  })

  it('parses bold and em inline formatting', () => {
    const blocks = parseMarkdown('**bold** and *em* text')
    expect(blocks[0].t).toBe('p')
    if (blocks[0].t === 'p') {
      const inlines = blocks[0].inline
      expect(inlines).toContainEqual({ t: 'strong', text: 'bold' })
      expect(inlines).toContainEqual({ t: 'em', text: 'em' })
      expect(inlines).toContainEqual({ t: 'text', text: ' and ' })
      expect(inlines).toContainEqual({ t: 'text', text: ' text' })
    }
  })

  it('parses wikilinks [[Title]]', () => {
    const blocks = parseMarkdown('See [[Note Title]] here')
    expect(blocks[0].t).toBe('p')
    if (blocks[0].t === 'p') {
      const inlines = blocks[0].inline
      expect(inlines).toContainEqual({ t: 'wiki', title: 'Note Title', display: 'Note Title' })
    }
  })

  it('parses wikilinks with display [[Title|display]]', () => {
    const blocks = parseMarkdown('See [[Note Title|custom text]] here')
    expect(blocks[0].t).toBe('p')
    if (blocks[0].t === 'p') {
      const inlines = blocks[0].inline
      expect(inlines).toContainEqual({ t: 'wiki', title: 'Note Title', display: 'custom text' })
    }
  })

  it('parses wikilinks with fragments [[Title#frag]]', () => {
    const blocks = parseMarkdown('See [[Note Title#section]] here')
    expect(blocks[0].t).toBe('p')
    if (blocks[0].t === 'p') {
      const inlines = blocks[0].inline
      expect(inlines).toContainEqual({ t: 'wiki', title: 'Note Title', display: 'Note Title' })
    }
  })

  it('parses external links [text](url)', () => {
    const blocks = parseMarkdown('See [external](https://example.com) link')
    expect(blocks[0].t).toBe('p')
    if (blocks[0].t === 'p') {
      const inlines = blocks[0].inline
      expect(inlines).toContainEqual({ t: 'link', text: 'external', href: 'https://example.com' })
    }
  })

  it('parses bullet lists', () => {
    const blocks = parseMarkdown('- Item 1\n- Item 2\n- Item 3')
    expect(blocks[0].t).toBe('ul')
    if (blocks[0].t === 'ul') {
      expect(blocks[0].items).toHaveLength(3)
    }
  })

  it('flattens nested bullet items into one list', () => {
    const blocks = parseMarkdown('- Item 1\n  - Nested\n- Item 2')
    expect(blocks[0].t).toBe('ul')
    if (blocks[0].t === 'ul') {
      expect(blocks[0].items).toHaveLength(3)
      expect(blocks[0].items[1][0]).toEqual({ t: 'text', text: 'Nested' })
    }
  })

  it('does not include ** or [[ in text nodes', () => {
    const blocks = parseMarkdown('Text with **bold** and [[link]]')
    // Verify no text node contains the raw markdown
    for (const block of blocks) {
      if (block.t === 'p') {
        for (const inline of block.inline) {
          if (inline.t === 'text') {
            expect(inline.text).not.toMatch(/\*\*/)
            expect(inline.text).not.toMatch(/\[\[/)
          }
        }
      }
    }
  })

  it('parses a real note body (Bố cục)', () => {
    const body = `**Bố cục là cách sắp xếp các thành phần tạo ảnh trong một khung cố định để dẫn mắt người xem tới chủ thể và tạo cảm giác mình muốn.**

## Các bố cục cơ bản
- **Trung tâm / đối xứng**: chủ thể giữa khung hoặc hai bên một trục. Vững chãi, trang trọng, nhưng dễ nhàm nếu chủ thể không đủ mạnh. (Ví dụ kinh điển: chân dung của Irving Penn.)
- **Một phần ba (1/3)**: chia khung 3×3, đặt chủ thể ở giao điểm hoặc dọc đường kẻ. Ảnh sống động hơn. Đường chân trời hoặc ranh giới màu chia khung theo tỷ lệ 1:2.
  - Để **khoảng trống về phía chủ thể nhìn hoặc đi tới** (line of sight).
- **Đường chéo**: đặt đường thẳng nghiêng hoặc dòng phối cảnh theo đường chéo. Tạo chiều sâu, tính liên tục, cảm giác lạ; tận dụng tối đa góc nhìn của ống kính.

## Cắt hay không cắt (crop)
- Chân dung: **lệch khỏi tâm**, **đừng chừa quá nhiều khoảng trống trên đầu**; cắt một phần đầu/mặt vẫn được nếu có chủ đích (quảng cáo TV hay làm vậy để tập trung vào phần muốn khoe).
- Xem [[Khung trong khung]] và [[Săn màu, phối màu và lớp cảnh]].`

    const blocks = parseMarkdown(body)
    expect(blocks.length).toBeGreaterThan(0)
    expect(blocks[0].t).toBe('p')
    expect(blocks[1].t).toBe('h2')
    expect(blocks[2].t).toBe('ul')

    // Verify no text nodes contain raw markdown markers
    const walkBlocks = (bs: typeof blocks) => {
      for (const block of bs) {
        if (block.t === 'p' || block.t === 'ul') {
          const inlines = block.t === 'p' ? block.inline : block.items.flat()
          for (const inline of inlines) {
            if (inline.t === 'text') {
              expect(inline.text).not.toMatch(/\*\*/)
              expect(inline.text).not.toMatch(/\[\[/)
            }
          }
        }
      }
    }
    walkBlocks(blocks)
  })

  it('treats a task box or a lone asterisk as text and keeps advancing', () => {
    /* `- [ ]` once looped forever: `[` opened nothing, the cursor stayed. */
    const [ul] = parseMarkdown('- [ ] **Số f:** sửa chiều\n- [x] xong * rồi')
    expect(ul.t).toBe('ul')
    if (ul.t !== 'ul') return
    const strongAt = ul.items[0].findIndex((n) => n.t === 'strong')
    expect(ul.items[0].slice(0, strongAt).map((n) => ('text' in n ? n.text : '')).join('')).toBe('[ ] ')
    expect(ul.items[0][strongAt]).toEqual({ t: 'strong', text: 'Số f:' })
    expect(ul.items[1].map((n) => ('text' in n ? n.text : '')).join('')).toBe('[x] xong * rồi')
  })

  it('parses every note in the snapshot', () => {
    const notes = JSON.parse(readFileSync('data/alphaskill-knowledge.seed.json', 'utf8')) as { slug: string; body: string }[]
    for (const n of notes) expect(parseMarkdown(n.body).length, n.slug).toBeGreaterThan(0)
  })
})
