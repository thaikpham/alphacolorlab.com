import { findNoteByTitle, fold, wikilinkTargets, type AlphaNote } from '@/lib/alphaskill/parse'
import { validateForPublish } from '../parse'
import type { Article, ContentRefKind } from '../types'

export const PACK_NAME_RE = /^[a-z0-9-]+$/
export const PACK_LICENCES = ['CC0', 'Public domain', 'CC BY 2.0', 'CC BY 3.0', 'CC BY 4.0', 'CC BY-SA 2.0', 'CC BY-SA 3.0', 'CC BY-SA 4.0'] as const

export type PackImage = {
  readonly blockIndex: number
  readonly file: string
  readonly title: string
  readonly author: string
  readonly licence: (typeof PACK_LICENCES)[number]
  readonly sourceUrl: string
}

export type Known = {
  readonly takenIds: ReadonlySet<string>
  readonly refIds: Readonly<Record<ContentRefKind, ReadonlySet<string>>>
  readonly notes: readonly AlphaNote[]
  /** `"<pageId>#<blockIndex>"` của mỗi figure có ảnh sidecar. */
  readonly images: ReadonlySet<string>
}

export const imageKeys = (pageId: string, manifest: readonly PackImage[]) => manifest.map((m) => `${pageId}#${m.blockIndex}`)

function noteFor(title: string, notes: readonly AlphaNote[]): AlphaNote | undefined {
  return findNoteByTitle(title, notes) ?? notes.find((n) => n.aliases.some((a) => fold(a) === fold(title)))
}

/** Every reason this pack cannot be pushed, `<page id>: <code>`; empty when it can. */
export function packProblems(name: string, pages: readonly Article[], known: Known): string[] {
  const problems: string[] = []
  if (!PACK_NAME_RE.test(name)) problems.push('packName')
  const seen = new Set<string>()
  for (const page of pages) {
    const at = (code: string) => problems.push(`${page.id}: ${code}`)
    for (const p of validateForPublish(page)) at(p)
    if (seen.has(page.id)) at('duplicateId')
    seen.add(page.id)
    if (known.takenIds.has(page.id)) at('idTaken')
    for (const ref of page.meta.related) {
      if (!known.refIds[ref.kind]?.has(ref.id)) at(`unknownRef ${ref.kind}:${ref.id}`)
    }
    for (const id of page.meta.prerequisites) {
      if (!known.refIds.article.has(id) && !known.refIds.knowledge.has(id)) at(`unknownPrerequisite ${id}`)
    }
    if (page.meta.sources.length === 0) at('noSource')
    if (page.meta.sources.some((s) => !s.checkedAt)) at('sourceNeedsDate')
    const related = new Set(page.meta.related.filter((r) => r.kind === 'knowledge').map((r) => r.id))
    page.blocks.forEach((b, i) => {
      if (b.t === 'figure' && !b.assetId && !known.images.has(`${page.id}#${i}`)) at('figureNeedsUpload')
      const text = 'text' in b ? b.text : b.t === 'tldr' ? b.items.join(' ') : b.t === 'table' ? b.caption : b.t === 'checklist' ? b.items.join(' ') : ''
      const targets = wikilinkTargets(text)
      if (targets.length && b.t !== 'p' && b.t !== 'callout') at('wikilinkOutsideProse')
      for (const t of targets) {
        const note = noteFor(t, known.notes)
        if (!note) at(`unknownWikilink ${t}`)
        else if (!related.has(note.slug)) at(`wikilinkNotRelated ${note.slug}`)
      }
    })
  }
  return problems
}
