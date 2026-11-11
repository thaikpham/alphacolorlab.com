// AIO/SEO structure and house-style checks for one article (the rules in AGENTS.md "Nội dung" and the alphaskill checklist).
//   node --experimental-strip-types scripts/article-check.ts <id | draft.json> [more…]   prints problems, exits 1 if any
// test/articles-aio.test.ts runs the same checks on every article in data/articles.json.
import { readFileSync } from 'node:fs'
import articles from '../data/articles.json' with { type: 'json' }
import { resolve } from '../lib/wikilinks.ts'

const plain = (s: string) => s.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1').replace(/\*\*/g, '')
const words = (s: string) => plain(s).split(/\s+/).filter(Boolean).length

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
  if (dek < 120 || dek > 155) out.push(`dek ${dek} ký tự, cần 120–155`)

  const tldr = blocks[0]?.t === 'tldr' ? blocks[0] : null
  if (!tldr) out.push('khối đầu tiên phải là tldr')
  else {
    const n = words(tldr.items.join(' '))
    if (tldr.items.length !== 3 || n < 40 || n > 70) out.push(`tldr ${tldr.items.length} ý, ${n} từ; cần 3 ý, 40–70 từ`)
  }

  const faq = blocks.at(-1)?.t === 'faq' ? blocks.at(-1) : null
  if (!faq) out.push('khối cuối phải là faq')
  else {
    if (faq.items.length < 4 || faq.items.length > 6) out.push(`faq ${faq.items.length} câu, cần 4–6`)
    for (const { q, a: ans } of faq.items) {
      if (!q.trim().endsWith('?')) out.push(`faq "${q}" không kết thúc bằng ?`)
      const n = words(ans)
      if (n < 40 || n > 70) out.push(`faq "${q}" trả lời ${n} từ, cần 40–70`)
      if (/xem ở trên|như đã nói|đã đề cập/i.test(ans)) out.push(`faq "${q}" không tự đứng được`)
    }
  }

  blocks.forEach((b, i) => {
    if (b.t !== 'h') return
    const next = blocks[i + 1]
    if (next?.t === 'faq' || /^(FAQ|Câu hỏi thường gặp|Hỏi đáp)/i.test(b.text)) out.push(`bỏ mục "${b.text}": khối faq cuối bài tự có tiêu đề`)
    else if (next?.t !== 'p') out.push(`mục "${b.text}" phải mở bằng một đoạn trả lời thẳng (p), đang là ${next?.t ?? 'trống'}`)
    else if (/^(Trong phần này|Hãy cùng|Ở phần này|Bài viết này)/i.test(next.text)) out.push(`mục "${b.text}" mở bằng câu sáo`)
  })

  const all = [a.title, a.dek ?? '', ...blocks.flatMap(texts)]
  for (const s of all) {
    if (/Creative (Look|Style)/i.test(s)) out.push(`có Creative Look/Style: "${s.slice(0, 60)}"`)
    if (/\bgiá (bán|niêm yết|tham khảo|hiện tại)|VNĐ|triệu đồng|\bUSD\b/i.test(s)) out.push(`có giá: "${s.slice(0, 60)}"`)
    if (/!/.test(plain(s))) out.push(`có dấu chấm than: "${s.slice(0, 60)}"`)
    if (/\p{Extended_Pictographic}/u.test(s)) out.push(`có emoji: "${s.slice(0, 60)}"`)
    if (/—/.test(s)) out.push(`có gạch dài (—), viết lại bằng dấu chấm, phẩy hoặc hai chấm: "${s.slice(0, 60)}"`)
    // Leftovers of mechanical edits: "rõ ,  một", "Kelvin tay,.", double spaces, a sentence cut mid-way
    if (/ ,|,\.|[^ ] {2,}\S|\s$|[,:;]$/.test(s)) out.push(`dấu câu lỗi (" ,", ",.", hai dấu cách, hoặc câu bị cắt): "${s.slice(0, 60)}"`)
    // Filler that adds length, not information
    const filler = s.match(/Điều này (rất )?quan trọng|Kỹ thuật này (yêu cầu|đòi hỏi)|Hiểu rõ các khía cạnh|đóng vai trò quan trọng|không chỉ .{1,40} mà còn|một cách hiệu quả|đơn giản nhưng (rất )?hiệu quả|hãy cùng|tuyệt vời/i)
    if (filler) out.push(`câu độn "${filler[0]}": "${s.slice(0, 60)}"`)
    // A dash swapped for a period leaves "Sony. xoay": the new sentence must start with a capital (M.M., v.v., F8... are fine)
    for (const m of plain(s).matchAll(/(?<![A-Z]\.[A-Z]|v\.v|\.\.|Prior)\. (\p{Ll}\S*)/gu)) out.push(`câu mới mở bằng chữ thường "${m[1]}": "${s.slice(0, 60)}"`)
    for (const m of s.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g))
      if (!resolve(m[1])) out.push(`wikilink hỏng: [[${m[1]}]]`)
  }

  if (!/^\d+ phút đọc$/.test(a.read ?? '')) out.push(`read "${a.read}" sai dạng "N phút đọc"`)
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
