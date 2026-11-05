import { findNoteByTitle, wikilinkTargets, type AlphaNote } from '@/lib/alphaskill/parse'
import { noteHref } from '@/lib/alphaskill/knowledge'
import type { Block } from './types'

export type WikiHrefs = Readonly<Record<string, string>>

/** Mỗi `[[…]]` trong p/callout resolve được → href. Đích lạ không có khóa: render thành chữ. */
export function wikiHrefs(blocks: readonly Block[], notes: readonly AlphaNote[]): WikiHrefs {
  const out: Record<string, string> = {}
  for (const b of blocks) {
    if (b.t !== 'p' && b.t !== 'callout') continue
    for (const title of wikilinkTargets(b.text)) {
      const note = findNoteByTitle(title, notes)
      if (note) out[title] = noteHref(note.slug)
    }
  }
  return out
}
