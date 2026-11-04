import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import {
  AlphaNote,
  flattenTree,
  parseNote,
  wikilinkTargets,
  extractHeadings,
  stripMarkdownArtifacts,
  fold,
  findNoteByTitle,
  notesLinkingTo,
} from './parse'
import { listNotes } from './knowledge'
import { slugify } from '@/lib/lab/parse'

describe('alphaskill knowledge', () => {
  describe('wikilinkTargets', () => {
    it('extracts wikilinks with display text', () => {
      const text = 'See [[Title|display here]] for more.'
      expect(wikilinkTargets(text)).toEqual(['Title'])
    })

    it('extracts wikilinks with fragments', () => {
      const text = 'Read [[Title#section]] about this.'
      expect(wikilinkTargets(text)).toEqual(['Title'])
    })

    it('de-duplicates links', () => {
      const text = 'See [[A]] and [[A]] and [[B]] and [[A]].'
      expect(wikilinkTargets(text)).toEqual(['A', 'B'])
    })

    it('handles complex combinations', () => {
      const text = '[[A]] [[B|show B]] [[A#frag]] [[C|D#E]]'
      expect(wikilinkTargets(text)).toEqual(['A', 'B', 'C'])
    })

    it('returns empty array when no links', () => {
      expect(wikilinkTargets('Just plain text')).toEqual([])
    })
  })

  describe('extractHeadings', () => {
    it('extracts ## and ### headings', () => {
      const text = '# Title\n## Section\n### Subsection\nText\n## Another'
      expect(extractHeadings(text)).toEqual(['Section', 'Subsection', 'Another'])
    })

    it('ignores # title line', () => {
      const text = '# My Title\n## Heading'
      expect(extractHeadings(text)).toEqual(['Heading'])
    })

    it('returns empty for no headings', () => {
      expect(extractHeadings('Just text')).toEqual([])
    })
  })

  describe('stripMarkdownArtifacts', () => {
    it('removes YAML frontmatter', () => {
      const text = '---\ntitle: Test\n---\n# Title\nContent'
      const result = stripMarkdownArtifacts(text)
      expect(result).not.toContain('---')
      expect(result).not.toContain('title:')
    })

    it('removes leading # Title line', () => {
      const text = '# My Title\nContent here'
      const result = stripMarkdownArtifacts(text)
      expect(result).not.toContain('# My Title')
      expect(result).toContain('Content here')
    })

    it('removes ## Liên quan section', () => {
      const text = '# Title\nContent\n## Liên quan\n[[Link]]'
      const result = stripMarkdownArtifacts(text)
      expect(result).not.toContain('## Liên quan')
      expect(result).not.toContain('[[Link]]')
      expect(result).toContain('Content')
    })

    it('handles all three together', () => {
      const text =
        '---\ntags: test\n---\n# Title\nFirst paragraph\n## Liên quan\n[[A]] [[B]]'
      const result = stripMarkdownArtifacts(text)
      expect(result).toContain('First paragraph')
      expect(result).not.toContain('tags')
      expect(result).not.toContain('# Title')
      expect(result).not.toContain('Liên quan')
    })
  })

  describe('fold', () => {
    it('lowercases text', () => {
      expect(fold('HELLO')).toBe('hello')
    })

    it('strips Vietnamese diacritics', () => {
      expect(fold('Tối ưu hóa Khẩu Độ')).toContain('toi')
    })

    it('converts đ to d', () => {
      expect(fold('Độ sâu đều')).toContain('do')
    })

    it('handles mixed case and diacritics', () => {
      expect(fold('Cân Bằng Trắng')).toContain('can')
    })
  })

  describe('parseNote', () => {
    it('creates a note with all fields', () => {
      const raw = {
        path: '1 Kiến thức/Màu sắc/Test Note.md',
        title: 'Test Note',
        props: {
          aliases: ['alias1', 'alias2'],
          level: 'cơ bản',
          summary: 'Test summary here.',
        },
        text: '---\ntitle: Test Note\n---\n# Test Note\n## Section\nContent\n## Liên quan\n[[Related]]',
      }
      const folders = ['1 Kiến thức', 'Màu sắc']
      const note = parseNote(raw, folders, 'Test summary here.')

      expect(note.slug).toBe(slugify('Test Note'))
      expect(note.title).toBe('Test Note')
      expect(note.kind).toBe('knowledge')
      expect(note.section).toBe('Màu sắc')
      expect(note.level).toBe('cơ bản')
      expect(note.aliases).toEqual(['alias1', 'alias2'])
      expect(note.summary).toBe('Test summary here.')
      expect(note.headings).toContain('Section')
      expect(note.body).toContain('Content')
      expect(note.body).not.toContain('Liên quan')
      expect(note.links).toContain('Related')
    })

    it('marks notes under "2 Giáo án" as lessons', () => {
      const raw = {
        path: '2 Giáo án/Lesson.md',
        title: 'Lesson',
        props: {},
        text: '# Lesson\nContent',
      }
      const note = parseNote(raw, ['2 Giáo án'])

      expect(note.kind).toBe('lesson')
      expect(note.section).toBe('Giáo án')
    })

    it('uses folders from flattenTree (excludes filename)', () => {
      const raw = {
        path: '1 Kiến thức/Màu sắc/Creative Look.md',
        title: 'Creative Look',
        props: {},
        text: '# Creative Look\nContent',
      }
      // flattenTree returns folders as parent path, not including filename
      const folders = ['1 Kiến thức', 'Màu sắc']
      const note = parseNote(raw, folders, 'Test summary here.')

      expect(note.section).toBe('Màu sắc')
      expect(note.section).not.toContain('.md')
    })

    it('handles notes with no folders', () => {
      const raw = {
        path: 'Root Note.md',
        title: 'Root Note',
        props: {},
        text: '# Root Note\nContent',
      }
      const note = parseNote(raw, [])

      expect(note.kind).toBe('knowledge')
      expect(note.section).toBe('')
    })
  })

  describe('flattenTree', () => {
    it('flattens nested folder structure', () => {
      const tree = {
        '1 Kiến thức': {
          'Màu sắc': {
            _notes: [
              {
                path: '1 Kiến thức/Màu sắc/Note1.md',
                title: 'Note1',
                summary: 'Summary 1',
              },
            ],
          },
          'Khác': {
            _notes: [
              {
                path: '1 Kiến thức/Khác/Note2.md',
                title: 'Note2',
                summary: 'Summary 2',
              },
            ],
          },
        },
      }

      const result = flattenTree(tree)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        path: '1 Kiến thức/Màu sắc/Note1.md',
        title: 'Note1',
        summary: 'Summary 1',
        folders: ['1 Kiến thức', 'Màu sắc'],
      })
      expect(result[1]).toEqual({
        path: '1 Kiến thức/Khác/Note2.md',
        title: 'Note2',
        summary: 'Summary 2',
        folders: ['1 Kiến thức', 'Khác'],
      })
    })
  })

  describe('findNoteByTitle', () => {
    const notes: AlphaNote[] = [
      {
        slug: 'creative-look',
        path: '1 Kiến thức/Màu sắc/Creative Look.md',
        title: 'Creative Look',
        summary: 'Summary',
        section: 'Màu sắc',
        kind: 'knowledge',
        aliases: ['màu máy', 'Creative Style'],
        level: 'cơ bản',
        headings: [],
        body: 'Content',
        links: [],
      },
    ]

    it('finds by exact title', () => {
      const found = findNoteByTitle('Creative Look', notes)
      expect(found?.slug).toBe('creative-look')
    })

    it('finds by alias', () => {
      const found = findNoteByTitle('màu máy', notes)
      expect(found?.slug).toBe('creative-look')
    })

    it('is case-insensitive', () => {
      const found = findNoteByTitle('CREATIVE LOOK', notes)
      expect(found?.slug).toBe('creative-look')
    })

    it('returns undefined for no match', () => {
      expect(findNoteByTitle('Unknown', notes)).toBeUndefined()
    })
  })

  describe('notesLinkingTo', () => {
    const notes: AlphaNote[] = [
      {
        slug: 'note-a',
        path: 'a.md',
        title: 'Note A',
        summary: '',
        section: '',
        kind: 'knowledge',
        aliases: [],
        headings: [],
        body: '',
        links: ['Note B', 'Note C'],
      },
      {
        slug: 'note-b',
        path: 'b.md',
        title: 'Note B',
        summary: '',
        section: '',
        kind: 'knowledge',
        aliases: [],
        headings: [],
        body: '',
        links: ['Note A'],
      },
      {
        slug: 'note-c',
        path: 'c.md',
        title: 'Note C',
        summary: '',
        section: '',
        kind: 'knowledge',
        aliases: [],
        headings: [],
        body: '',
        links: [],
      },
    ]

    it('finds notes linking to a target', () => {
      const result = notesLinkingTo('note-a', notes)
      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('note-b')
    })

    it('finds notes that link to a given note', () => {
      const result = notesLinkingTo('note-c', notes)
      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('note-a')
    })
  })

  describe('snapshot validation', () => {
    let snapshot: AlphaNote[]

    beforeEach(() => {
      const snapshotPath = path.join(process.cwd(), 'data', 'alphaskill-knowledge.seed.json')
      const content = readFileSync(snapshotPath, 'utf-8')
      snapshot = JSON.parse(content)
    })

    it('contains 29 notes', () => {
      expect(snapshot).toHaveLength(29)
    })

    it('has unique slugs', () => {
      const slugs = new Set(snapshot.map((n) => n.slug))
      expect(slugs.size).toBe(29)
    })

    it('all slugs match the regex', () => {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      for (const note of snapshot) {
        expect(note.slug).toMatch(slugRegex)
      }
    })

    it('all titles slug correctly', () => {
      for (const note of snapshot) {
        const expectedSlug = slugify(note.title)
        expect(note.slug).toBe(expectedSlug)
      }
    })

    it('has expected sections', () => {
      const expectedSections = new Set([
        'Màu sắc',
        'Phơi sáng',
        'Bố cục và góc nhìn',
        'Kỹ thuật sáng tạo',
        'Lấy nét và xóa phông',
        'Quy trình làm việc',
        'Giáo án',
      ])

      const actualSections = new Set(snapshot.map((n) => n.section).filter((s) => s !== ''))

      expect(actualSections).toEqual(expectedSections)
    })

    it('Vietnamese examples slug correctly', () => {
      expect(slugify('Tối ưu hóa Khẩu Độ')).toContain('toi')
      expect(slugify('Độ sâu trường ảnh và xóa phông')).toContain('do')
    })

    it('has non-empty summaries', () => {
      for (const note of snapshot) {
        expect(note.summary).toBeTruthy()
        expect(note.summary.length).toBeGreaterThan(0)
      }
    })
  })

  describe('caching', () => {
    const originalEnv = process.env.ALPHASKILL_API_URL

    afterEach(() => {
      if (originalEnv) {
        process.env.ALPHASKILL_API_URL = originalEnv
      } else {
        delete process.env.ALPHASKILL_API_URL
      }
    })

    it('respects offline mode when env var is unset', async () => {
      delete process.env.ALPHASKILL_API_URL

      const notes = await listNotes()
      expect(notes.length).toBeGreaterThan(0)
      expect(Array.isArray(notes)).toBe(true)
    })
  })
})
