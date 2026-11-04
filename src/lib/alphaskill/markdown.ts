/**
 * Parse AlphaNote markdown bodies into structured blocks.
 *
 * Supports: ## / ### headings, paragraphs, bullet lists (one level),
 * **bold**, *em*, [[wikilinks]], and [text](url) links.
 * Nested bullets flatten to a single list (one level is enough).
 */

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

/**
 * Parse inline markdown: **bold**, *em*, [[wikilinks]], [links](url).
 * Shortcut: nested formatting (e.g. ***bold em***) is not supported;
 * upgrade when a note uses it.
 */
function parseInline(text: string): Inline[] {
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
    if (nextSpecial > 0) {
      result.push({ t: 'text', text: text.slice(pos, pos + nextSpecial) })
    }
    pos += nextSpecial
  }

  return result.length === 0 ? [{ t: 'text', text: '' }] : result
}

export function parseMarkdown(body: string): MdBlock[] {
  const blocks: MdBlock[] = []
  const lines = body.split('\n')
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

    // Bullet list: - item (may continue over multiple lines, next item or heading stops it)
    if (line.match(/^[\s-]/)) {
      const items: Inline[][] = []
      while (i < lines.length && lines[i].match(/^[\s-]/)) {
        const itemLine = lines[i].trim()
        // Skip empty lines within a list
        if (!itemLine) {
          i++
          continue
        }
        // Stop on heading
        if (itemLine.match(/^#{2,3}\s/)) {
          break
        }
        // Extract bullet item (- or stripped whitespace)
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

    // Paragraph: non-empty, non-heading line
    if (line.trim()) {
      blocks.push({ t: 'p', inline: parseInline(line.trim()) })
      i++
      continue
    }

    // Empty line: skip
    i++
  }

  return blocks
}
