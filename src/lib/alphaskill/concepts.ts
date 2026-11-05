import type { ConceptKey } from '@/lib/content/concepts'
import type { AlphaNote } from './parse'

/**
 * Map concept keys to alphaskill note slugs.
 *
 * Only verified concept group heads are included. Individual parameter concepts
 * (e.g., `wb.temperature`, `cl.contrast`) are not yet mapped — they will be
 * added as needed.
 */
export const CONCEPT_NOTES: Partial<Record<ConceptKey, string>> = {
  wb: 'can-bang-trang-va-nhiet-do-mau',
  cl: 'creative-look',
  'cl.look': 'creative-look',
}

/**
 * Resolve a list of concept keys to their corresponding notes.
 * Deduped and in the order of first appearance.
 */
export function notesForConcepts(
  keys: readonly ConceptKey[],
  notes: readonly AlphaNote[],
): AlphaNote[] {
  const seen = new Set<string>()
  const result: AlphaNote[] = []

  for (const key of keys) {
    const slug = CONCEPT_NOTES[key]
    if (slug && !seen.has(slug)) {
      const note = notes.find((n) => n.slug === slug)
      if (note) {
        seen.add(slug)
        result.push(note)
      }
    }
  }

  return result
}
