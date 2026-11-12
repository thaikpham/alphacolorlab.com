// AIO/SEO structure and house-style checks for one article (the rules in AGENTS.md "Nội dung" and the alphaskill checklist).
//   node --experimental-strip-types scripts/article-check.ts <id | draft.json> [more…]   prints problems, exits 1 if any
// Giới hạn và cụm cấm nằm ở data/article-rules.json (cùng file với công cụ colorlab_article của alphaskill).
// test/articles-aio.test.ts runs the same checks on every article in data/articles.json.
import { readFileSync } from 'node:fs'
import articles from '../data/articles.json' with { type: 'json' }
import rules from '../data/article-rules.json' with { type: 'json' }
import { resolve } from '../lib/wikilinks.ts'

type Rule = {
  id: string
  pattern: string
  flags: string
  message: string
  /** 'plain': kiểm tra sau khi bỏ wikilink và **. Mặc định 'raw'. */
  on?: 'plain' | 'raw'
  /** Có max thì là luật đếm: tổng số lần khớp không được vượt max. */
  max?: number
  /** Phạm vi đếm: 'blocks' (mặc định, không gồm tiêu đề và tóm tắt) hoặc 'all'. */
  scope?: 'all' | 'blocks'
}

const banned = rules.bannedPhrases as Rule[]
const faqAnswerBanned = rules.faqAnswerBanned as Rule[]
const sectionLeadBanned = rules.sectionLeadBanned as Rule[]
const headingBanned = rules.headingBanned as Rule[]
const { limits: L } = rules

const plain = (s: string) => s.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1').replace(/\*\*/g, '')
const words = (s: string) => plain(s).split(/\s+/).filter(Boolean).length
const subject = (r: Rule, s: string) => (r.on === 'plain' ? plain(s) : s)
const matches = (r: Rule, s: string) => new RegExp(r.pattern, r.flags).test(subject(r, s))

/** Every reader-visible string of a block, for the style checks. */
function texts(b: any): string[] {
  switch (b.t) {
    case 'p': case 'h': return [b.text]
    case 'tldr': return b.items
    case 'callout': return [b.label ?? '', b.text]
    case 'checklist': return [b.label ?? '', ...b.items]
    case 'table': return [...b.head, ...b.rows.flat(), b.caption ?? '']
    case 'faq': return b.items.flatMap((i: any) => [i.q, i.a])
    case 'figure': case 'compare': return [b.caption ?? '']
    default: return []
  }
}

export function checkArticle(a: any): string[] {
  const out: string[] = []
  const blocks: any[] = a.blocks
  const dek = (a.dek ?? '').length
  if (dek < L.dekChars[0] || dek > L.dekChars[1]) out.push(`dek ${dek} ký tự, cần ${L.dekChars[0]}–${L.dekChars[1]}`)

  const tldr = blocks[0]?.t === 'tldr' ? blocks[0] : null
  if (!tldr) out.push('khối đầu tiên phải là tldr')
  else {
    const n = words(tldr.items.join(' '))
    if (tldr.items.length !== L.tldrItems || n < L.tldrWords[0] || n > L.tldrWords[1])
      out.push(`tldr ${tldr.items.length} ý, ${n} từ; cần ${L.tldrItems} ý, ${L.tldrWords[0]}–${L.tldrWords[1]} từ`)
  }

  const faq = blocks.at(-1)?.t === 'faq' ? blocks.at(-1) : null
  if (!faq) out.push('khối cuối phải là faq')
  else {
    if (faq.items.length < L.faqItems[0] || faq.items.length > L.faqItems[1])
      out.push(`faq ${faq.items.length} câu, cần ${L.faqItems[0]}–${L.faqItems[1]}`)
    for (const { q, a: ans } of faq.items) {
      if (!q.trim().endsWith('?')) out.push(`faq "${q}" không kết thúc bằng ?`)
      const n = words(ans)
      if (n < L.faqAnswerWords[0] || n > L.faqAnswerWords[1]) out.push(`faq "${q}" trả lời ${n} từ, cần ${L.faqAnswerWords[0]}–${L.faqAnswerWords[1]}`)
      for (const r of faqAnswerBanned) if (matches(r, ans)) out.push(`faq "${q}" ${r.message}`)
    }
  }

  blocks.forEach((b, i) => {
    if (b.t !== 'h') return
    const next = blocks[i + 1]
    const dup = headingBanned.find((r) => matches(r, b.text))
    if (next?.t === 'faq' || dup) out.push(`bỏ mục "${b.text}": ${dup?.message ?? 'khối faq cuối bài tự có tiêu đề'}`)
    else if (next?.t !== 'p') out.push(`mục "${b.text}" phải mở bằng một đoạn trả lời thẳng (p), đang là ${next?.t ?? 'trống'}`)
    else for (const r of sectionLeadBanned) if (matches(r, next.text)) out.push(`mục "${b.text}" ${r.message}`)
  })

  const blockTexts = blocks.flatMap(texts)
  const all = [a.title, a.dek ?? '', ...blockTexts]
  for (const s of all) {
    for (const r of banned) if (r.max === undefined && matches(r, s)) out.push(`${r.message}: "${s.slice(0, 60)}"`)
    // A dash swapped for a period leaves "Sony. xoay": the new sentence must start with a capital (M.M., v.v., F8... are fine)
    for (const m of plain(s).matchAll(/(?<![A-Z]\.[A-Z]|v\.v|\.\.|Prior)\. (\p{Ll}\S*)/gu)) out.push(`câu mới mở bằng chữ thường "${m[1]}": "${s.slice(0, 60)}"`)
    for (const m of s.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g))
      if (!resolve(m[1])) out.push(`wikilink hỏng: [[${m[1]}]]`)
  }

  for (const r of banned) {
    if (r.max === undefined) continue
    const pool = r.scope === 'all' ? all : blockTexts
    const n = pool.reduce((k, s) => k + [...subject(r, s).matchAll(new RegExp(r.pattern, r.flags + 'g'))].length, 0)
    if (n > r.max) out.push(`${r.message}: ${n} lần, tối đa ${r.max}`)
  }

  if (!new RegExp(rules.readPattern).test(a.read ?? '')) out.push(`read "${a.read}" sai dạng "N phút đọc"`)
  return out
}

const load = (arg: string) =>
  arg.endsWith('.json') ? JSON.parse(readFileSync(arg, 'utf8')) : (articles as any[]).find((x) => x.id === arg)

if (process.argv[1]?.endsWith('article-check.ts')) {
  let bad = 0
  for (const arg of process.argv.slice(2)) {
    const a = load(arg)
    if (!a) throw new Error(`no article ${arg}`)
    const problems = checkArticle(a)
    bad += problems.length
    console.log(problems.length ? `✗ ${a.id}\n${problems.map((p) => `  - ${p}`).join('\n')}` : `✓ ${a.id}`)
  }
  process.exitCode = bad ? 1 : 0
}
