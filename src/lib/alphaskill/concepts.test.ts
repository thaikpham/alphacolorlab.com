import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { CONCEPT_NOTES, notesForConcepts } from './concepts'
import type { AlphaNote } from './parse'

describe('alphaskill concepts', () => {
  let snapshot: AlphaNote[]

  beforeEach(() => {
    const snapshotPath = path.join(process.cwd(), 'data', 'alphaskill-knowledge.seed.json')
    const content = readFileSync(snapshotPath, 'utf-8')
    snapshot = JSON.parse(content) as AlphaNote[]
  })

  describe('CONCEPT_NOTES mapping', () => {
    it('maps wb to a valid slug', () => {
      const slug = CONCEPT_NOTES.wb
      expect(slug).toBeDefined()
      expect(typeof slug).toBe('string')
      const note = snapshot.find((n) => n.slug === slug)
      expect(note).toBeDefined()
      expect(note?.title).toBe('Cân bằng trắng và nhiệt độ màu')
    })


    it('all mapped slugs exist in snapshot', () => {
      const slugSet = new Set(snapshot.map((n) => n.slug))
      for (const [, slug] of Object.entries(CONCEPT_NOTES)) {
        if (slug) {
          expect(slugSet.has(slug)).toBe(true)
        }
      }
    })
  })

  describe('notesForConcepts', () => {
    it('returns notes for given concept keys', () => {
      const result = notesForConcepts(['wb'], snapshot)
      expect(result).toHaveLength(1)
      expect(result.map((n) => n.slug)).toContain('can-bang-trang-va-nhiet-do-mau')
    })

    it('ignores unknown keys', () => {
      const result = notesForConcepts(['wb', 'unknown-key' as never], snapshot)
      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('can-bang-trang-va-nhiet-do-mau')
    })

    it('returns empty for no valid keys', () => {
      const result = notesForConcepts([], snapshot)
      expect(result).toHaveLength(0)
    })
  })
})
