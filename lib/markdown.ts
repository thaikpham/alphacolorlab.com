/**
 * Parse AlphaNote markdown bodies into structured blocks.
 * Port from ColorLab src/lib/alphaskill/markdown.ts
 *
 * Supports: ## / ### headings, paragraphs, bullet lists (one level),
 * **bold**, *em*, [[wikilinks]], and [text](url) links.
 */

export type WikiSegment = { t: 'text'; text: string } | { t: 'wiki'; title: string; display: string }

export type Inline =
  | { t: 'text'; text: string }
  | { t: 'strong'; text: string }
  | { t: 'em'; text: string }
  | { t: 'link'; href: string; text: string }
  | { t: 'wiki'; title: string; display: string }

export type MdBlock =
  | { t: 'h2' | 'h3'; text: string }
  | { t: 'p'; inline: Inline[] }
  | { t: 'ul'; items: Inline[][] }
  | { t: 'ol'; items: Inline[][] }
  | { t: 'table'; head: string[]; rows: string[][] }

/** Parse inline markdown: **bold**, *em*, [[wikilinks]], [links](url). */
export function parseInline(text: string): Inline[] {
  const result: Inline[] = []
  let pos = 0

  while (pos < text.length) {
    // Wikilink: [[Title]] or [[Title|display]] or [[Title#frag]]
    const wikiMatch = text.slice(pos).match(/^\[\[([^\]|#]+)(?:\|([^\]]*)|#[^\]]*)*\]\]/)
    if (wikiMatch) {
      const title = wikiMatch[1].trim()
      const display = wikiMatch[2]?.trim() || title
      result.push({ t: 'wiki', title, display })
      pos += wikiMatch[0].length
      continue
    }

    // Link: [text](url)
    const linkMatch = text.slice(pos).match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      result.push({ t: 'link', text: linkMatch[1], href: linkMatch[2] })
      pos += linkMatch[0].length
      continue
    }

    // Strong: **text**
    const strongMatch = text.slice(pos).match(/^\*\*([^*]+)\*\*/)
    if (strongMatch) {
      result.push({ t: 'strong', text: strongMatch[1] })
      pos += strongMatch[0].length
      continue
    }

    // Em: *text* (not followed by another *)
    const emMatch = text.slice(pos).match(/^\*([^*]+)\*(?!\*)/)
    if (emMatch) {
      result.push({ t: 'em', text: emMatch[1] })
      pos += emMatch[0].length
      continue
    }

    // Plain text until next special char
    const nextSpecial = text.slice(pos).search(/[\[\*]/)
    if (nextSpecial === -1) {
      result.push({ t: 'text', text: text.slice(pos) })
      break
    }
    const step = nextSpecial === 0 ? 1 : nextSpecial
    result.push({ t: 'text', text: text.slice(pos, pos + step) })
    pos += step
  }

  return result.length === 0 ? [{ t: 'text', text: '' }] : result
}

export function parseMarkdown(body: string): MdBlock[] {
  const blocks: MdBlock[] = []
  let lines = body.split('\n')

  // Drop leading # h1 line
  if (lines[0]?.match(/^#\s+/)) {
    lines = lines.slice(1)
  }

  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Heading: ## or ###
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length as 2 | 3
      blocks.push({ t: `h${level}` as const, text: headingMatch[2].trim() })
      i++
      continue
    }

    // Table: | ...
    if (line.trim().startsWith('|')) {
      const headerLine = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
      i++
      // Skip separator row: |---|---|...
      if (i < lines.length && lines[i].trim().match(/^\|[\s\-|]+\|?$/)) {
        i++
      }
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowLine = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
        rows.push(rowLine)
        i++
      }
      blocks.push({ t: 'table', head: headerLine, rows })
      continue
    }

    // Ordered list: 1. 2. etc
    if (line.match(/^\d+\.\s/)) {
      const items: Inline[][] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '').trim()
        if (itemText) {
          items.push(parseInline(itemText))
        }
        i++
      }
      if (items.length > 0) {
        blocks.push({ t: 'ol', items })
      }
      continue
    }

    // Bullet list: - item
    if (line.match(/^[\s-]/)) {
      const items: Inline[][] = []
      while (i < lines.length && lines[i].match(/^[\s-]/)) {
        const itemLine = lines[i].trim()
        if (!itemLine) {
          i++
          continue
        }
        if (itemLine.match(/^#{2,3}\s/)) {
          break
        }
        const itemText = itemLine.replace(/^[\s-]+/, '').trim()
        if (itemText) {
          items.push(parseInline(itemText))
        }
        i++
      }
      if (items.length > 0) {
        blocks.push({ t: 'ul', items })
      }
      continue
    }

    // Paragraph
    if (line.trim()) {
      blocks.push({ t: 'p', inline: parseInline(line.trim()) })
      i++
      continue
    }

    i++
  }

  return blocks
}

const WIKI_RE = /\[\[([^\]|#]+)(?:\|([^\]]*)|#[^\]]*)*\]\]/g

export function splitWiki(text: string): WikiSegment[] {
  const out: WikiSegment[] = []
  let last = 0
  for (const m of text.matchAll(WIKI_RE)) {
    const at = m.index ?? 0
    if (at > last) out.push({ t: 'text', text: text.slice(last, at) })
    const title = m[1].trim()
    out.push({ t: 'wiki', title, display: m[2]?.trim() || title })
    last = at + m[0].length
  }
  if (last < text.length) out.push({ t: 'text', text: text.slice(last) })
  return out
}

export function stripWiki(text: string): string {
  return splitWiki(text)
    .map((s) => (s.t === 'wiki' ? s.display : s.text))
    .join('')
}
