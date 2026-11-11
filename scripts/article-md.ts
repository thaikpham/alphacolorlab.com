// Prints an article as Markdown for the alphaskill audit tools (aio_audit, seo_audit, style_lint).
//   node --experimental-strip-types scripts/article-md.ts <id>            article from data/articles.json
//   node --experimental-strip-types scripts/article-md.ts path/to/a.json  a single article object (e.g. a rewrite draft)
import { readFileSync } from 'node:fs'
import articles from '../data/articles.json' with { type: 'json' }

const arg = process.argv[2]
if (!arg) throw new Error('usage: article-md.ts <id | file.json>')
const a: any = arg.endsWith('.json') ? JSON.parse(readFileSync(arg, 'utf8')) : (articles as any[]).find((x) => x.id === arg)
if (!a) throw new Error(`no article ${arg}`)

// [[Target|label]] → label, [[Target]] → Target
const plain = (s: string) => s.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
const row = (cells: string[]) => `| ${cells.map(plain).join(' | ')} |`

export function toMarkdown(a: any): string {
  // Same date line the article page shows under the title (blog.detail.updatedLabel)
  const out = [`# ${plain(a.title)}`, plain(a.dek ?? ''), a.updatedAt ? `Cập nhật ${new Date(a.updatedAt).toLocaleDateString('vi-VN')}` : '']
  for (const b of a.blocks) {
    if (b.t === 'tldr') out.push(`**TL;DR**\n\n${b.items.map((i: string) => `- ${plain(i)}`).join('\n')}`)
    else if (b.t === 'h') out.push(`## ${plain(b.text)}`)
    else if (b.t === 'p') out.push(plain(b.text))
    else if (b.t === 'menu') out.push(`Menu: ${b.oldVi ?? b.old}${b.old && b.oldVi ? ` (${b.old})` : ''}`)
    else if (b.t === 'table') out.push([row(b.head), row(b.head.map(() => '---')), ...b.rows.map(row), b.caption ? `\n${plain(b.caption)}` : ''].join('\n'))
    else if (b.t === 'callout') out.push(`> **${plain(b.label ?? '')}** ${plain(b.text)}`)
    else if (b.t === 'checklist') out.push(`**${plain(b.label ?? '')}**\n${b.items.map((i: string) => `- [ ] ${plain(i)}`).join('\n')}`)
    else if (b.t === 'figure') out.push(`![${plain(b.caption ?? '')}](${b.src})`)
    else if (b.t === 'compare') out.push(`So sánh ${plain(b.beforeLabel)} / ${plain(b.afterLabel)}: ${plain(b.caption ?? '')}`)
    else if (b.t === 'faq') out.push(`## Câu hỏi thường gặp\n\n${b.items.map((i: { q: string; a: string }) => `### ${plain(i.q)}\n\n${plain(i.a)}`).join('\n\n')}`)
  }
  return out.filter(Boolean).join('\n\n')
}

console.log(toMarkdown(a))
