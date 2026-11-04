import { z } from 'zod'
import { slugify } from '@/lib/lab/parse'

export type AlphaNote = {
  slug: string
  path: string
  title: string
  summary: string
  section: string
  kind: 'knowledge' | 'lesson'
  aliases: readonly string[]
  level?: string
  headings: readonly string[]
  body: string
  links: readonly string[]
}

/**
 * API response shape for a single note.
 */
export type RawNote = {
  path: string
  title: string
  props?: {
    title?: string
    aliases?: string[]
    level?: string
    sources?: string[]
    menu?: string[]
    tags?: string[]
  }
  text: string
}

/**
 * Lowercase, strip diacritics, convert đ→d.
 * Used for case-insensitive matching in findNoteByTitle.
 */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
}

/**
 * Extract wikilinks from markdown text.
 * Handles [[Title]], [[Title|display]], and [[Title#frag]].
 * Returns unique titles in order.
 */
export function wikilinkTargets(text: string): string[] {
  const links: string[] = []
  const seen = new Set<string>()
  const re = /\[\[([^\]|#]+)(?:[|#][^\]]*)*\]\]/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const target = match[1].trim()
    if (!seen.has(target)) {
      seen.add(target)
      links.push(target)
    }
  }
  return links
}

/**
 * Extract ## and ### heading texts from markdown.
 */
export function extractHeadings(text: string): string[] {
  const headings: string[] = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      const heading = line.replace(/^#+\s+/, '').trim()
      if (heading) headings.push(heading)
    }
  }
  return headings
}

/**
 * Remove YAML frontmatter (--- to ---), the leading # Title line,
 * and the ## Liên quan section.
 */
export function stripMarkdownArtifacts(text: string): string {
  let content = text

  // Remove frontmatter: --- at start, then everything until next ---
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('\n---', 4)
    if (endIndex !== -1) {
      content = content.slice(endIndex + 4).trim()
    }
  }

  // Remove leading # Title line
  const lines = content.split('\n')
  if (lines[0]?.startsWith('# ')) {
    lines.shift()
    content = lines.join('\n').trim()
  }

  // Remove ## Liên quan section and everything after
  const lienQuanIndex = content.indexOf('\n## Liên quan')
  if (lienQuanIndex !== -1) {
    content = content.slice(0, lienQuanIndex).trim()
  }

  return content
}

/**
 * Strip leading digit+space from folder labels.
 * "1 Kiến thức" → "Kiến thức"
 * "2 Giáo án" → "Giáo án"
 */
export function cleanSectionLabel(label: string): string {
  return label.replace(/^\d+\s+/, '')
}

/**
 * Parse a note from raw API response.
 * `folders` is the path from root to parent (filename excluded).
 * `summary` is the clean summary from the tree response.
 */
export function parseNote(
  raw: RawNote,
  folders: string[],
  summary: string = '',
): AlphaNote {
  const title = raw.title.trim()
  const slug = slugify(title)

  // Determine section and kind
  let section: string
  let kind: 'knowledge' | 'lesson'

  if (folders.length > 0) {
    const topFolder = folders[0]
    kind = topFolder.startsWith('2 ') ? 'lesson' : 'knowledge'
    section = cleanSectionLabel(folders[folders.length - 1])
  } else {
    kind = 'knowledge'
    section = ''
  }

  // Parse body and extract headings
  const body = stripMarkdownArtifacts(raw.text)
  const headings = extractHeadings(body)

  // Use summary from the tree (passed as parameter), verbatim
  const finalSummary = typeof summary === 'string' ? summary : ''

  // Extract links from original text (before stripping artifacts)
  const allLinks = wikilinkTargets(raw.text)

  const aliases = raw.props?.aliases ?? []

  return {
    slug,
    path: raw.path,
    title,
    summary: finalSummary,
    section,
    kind,
    aliases: Array.isArray(aliases) ? aliases : [],
    level: raw.props?.level,
    headings,
    body,
    links: allLinks,
  }
}

/**
 * Flatten nested tree into a flat list with paths.
 */
export function flattenTree(
  tree: Record<string, unknown>,
): Array<{ path: string; title: string; summary: string; folders: string[] }> {
  const result: Array<{ path: string; title: string; summary: string; folders: string[] }> = []

  function traverse(obj: Record<string, unknown>, folders: string[]) {
    for (const [key, value] of Object.entries(obj)) {
      if (key === '_notes' && Array.isArray(value)) {
        for (const note of value) {
          if (
            note &&
            typeof note === 'object' &&
            'path' in note &&
            'title' in note &&
            'summary' in note
          ) {
            result.push({
              path: note.path as string,
              title: note.title as string,
              summary: note.summary as string,
              folders,
            })
          }
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        traverse(value as Record<string, unknown>, [...folders, key])
      }
    }
  }

  traverse(tree, [])
  return result
}

/**
 * Validation schemas.
 */
export const AlphaNoteSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  path: z.string(),
  title: z.string().min(1),
  summary: z.string(),
  section: z.string(),
  kind: z.enum(['knowledge', 'lesson']),
  aliases: z.array(z.string()).readonly(),
  level: z.string().optional(),
  headings: z.array(z.string()).readonly(),
  body: z.string(),
  links: z.array(z.string()).readonly(),
})

/**
 * Find a note by title or alias (case-insensitive, diacritic-insensitive).
 */
export function findNoteByTitle(title: string, notes: readonly AlphaNote[]): AlphaNote | undefined {
  const folded = fold(title)
  for (const note of notes) {
    if (fold(note.title) === folded) return note
    for (const alias of note.aliases) {
      if (fold(alias) === folded) return note
    }
  }
  return undefined
}

/**
 * Find notes that link to a given slug (backlinks).
 */
export function notesLinkingTo(slug: string, notes: readonly AlphaNote[]): AlphaNote[] {
  const targetNote = notes.find((n) => n.slug === slug)
  if (!targetNote) return []

  const results: AlphaNote[] = []
  for (const note of notes) {
    for (const link of note.links) {
      const linkedNote = findNoteByTitle(link, notes)
      if (linkedNote && linkedNote.slug === slug) {
        results.push(note)
        break
      }
    }
  }
  return results
}

/**
 * Sort notes by section then title with Vietnamese locale.
 */
export function sortNotes(notes: AlphaNote[]): AlphaNote[] {
  return [...notes].sort((a, b) => {
    const sectionCmp = a.section.localeCompare(b.section, 'vi')
    if (sectionCmp !== 0) return sectionCmp
    return a.title.localeCompare(b.title, 'vi')
  })
}

/**
 * Check for slug collisions and throw if found.
 */
export function checkSlugCollisions(notes: AlphaNote[]): void {
  const slugMap = new Map<string, string>()
  for (const note of notes) {
    if (slugMap.has(note.slug)) {
      throw new Error(
        `Slug collision: "${note.title}" and "${slugMap.get(note.slug)}" both slugify to "${note.slug}"`,
      )
    }
    slugMap.set(note.slug, note.title)
  }
}
