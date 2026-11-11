// Matching for the nav typeahead and /search. Runs in the browser: no data imports here
// (lib/searchIndex.ts builds the index on the server, served as /search-index.json).
import { fold } from './fold.ts'
import { ROMAN, synonymGroups } from './searchSynonyms.ts'

export type SearchItem = {
  kind: 'guide' | 'note' | 'article' | 'product' | 'recipe'
  title: string
  extra: string
  summary: string
  href: string
}

// ---- Matching. Everything below runs in the browser on each keystroke over ~225 items.

const words = (s: string) => fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean)
/** "ZV-E10 II" → "zve10ii", "ILCE-7M4" → "ilce7m4": model codes typed without spaces or dashes. */
const compact = (s: string) => fold(s).replace(/[^\p{L}\p{N}]/gu, '')

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  return d[a.length][b.length]
}

const sameLetters = (a: string, b: string) => [...a].sort().join('') === [...b].sort().join('')
/** Typo budget: 2 edits from 8 letters, 1 from 4, and for 3 letters only a swap ("xao" → "xoa"). */
const allowed = (t: string, w: string) => (t.length >= 8 ? 2 : t.length >= 4 ? 1 : t.length === 3 && sameLetters(t, w) ? 1 : 0)
const near = (t: string, w: string) => {
  const max = allowed(t, w)
  return max > 0 && Math.abs(t.length - w.length) <= max && distance(t, w) <= max
}

type Prepared = { item: SearchItem; title: string[]; extra: string[]; summary: Set<string>; line: string; compacts: string[] }
const cache = new WeakMap<SearchItem[], Prepared[]>()
const prepare = (items: SearchItem[]) => {
  let p = cache.get(items)
  if (!p) {
    p = items.map((item) => {
      const title = words(item.title)
      return {
        item,
        title,
        extra: words(item.extra),
        summary: new Set(words(item.summary)),
        line: title.join(' '),
        compacts: [item.title, ...item.extra.split(',')].map(compact).filter(Boolean),
      }
    })
    cache.set(items, p)
  }
  return p
}

/** Exact word > word prefix > typo; title counts 3×, aliases/codes 2×, summary only for exact words. */
function tokenScore(t: string, last: boolean, p: Prepared): number {
  let best = 0
  for (const [list, weight] of [[p.title, 3], [p.extra, 2]] as const)
    for (const w of list) {
      if (w === t) best = Math.max(best, 10 * weight)
      else if ((last || t.length >= 3) && w.startsWith(t)) best = Math.max(best, 6 * weight)
      else if (best < 4 * weight && near(t, w)) best = 4 * weight
    }
  return best || (p.summary.has(t) ? 10 : 0)
}

/** Every token must match somewhere (AND). The last token may be half typed. */
function queryScore(tokens: string[], p: Prepared): number {
  let sum = 0
  for (let i = 0; i < tokens.length; i++) {
    const s = tokenScore(tokens[i], i === tokens.length - 1, p)
    if (!s) return 0
    sum += s
  }
  const q = tokens.join(' ')
  return sum + (p.line === q ? 50 : p.line.startsWith(q) ? 20 : 0)
}

function codeScore(variants: string[], p: Prepared): number {
  let best = 0
  for (const v of variants)
    for (const c of p.compacts) best = Math.max(best, c === v ? 60 : c.startsWith(v) ? 30 : c.includes(v) ? 15 : 0)
  return best
}

/** The query again with one synonym phrase swapped for each other phrase of its group. */
function alternatives(tokens: string[]): string[][] {
  const out: string[][] = []
  for (const group of synonymGroups)
    for (const phrase of group) {
      const ph = phrase.split(' ')
      for (let i = 0; i + ph.length <= tokens.length; i++)
        if (ph.every((w, k) => tokens[i + k] === w))
          for (const other of group) if (other !== phrase) out.push([...tokens.slice(0, i), ...other.split(' '), ...tokens.slice(i + ph.length)])
    }
  return out
}

const KIND_ORDER = { product: 0, guide: 1, note: 2, article: 3, recipe: 4 }

export function searchIndex(items: SearchItem[], query: string): SearchItem[] {
  const tokens = words(query)
  if (!tokens.length) return []
  const qc = compact(query)
  // Codes need a digit: "a7m4" → also "a7iv"; "zve10m2" → also "zve10ii"; shorthand "a74", "a7c2", "a7r5" → "a7iv", "a7cii", "a7rv"
  const codes = qc.length >= 3 && /\d/.test(qc)
    ? [qc, qc.replace(/m([2-6])(?![0-9])/g, (_, d) => ROMAN[d]), qc.replace(/^(a[179][crs]?)([2-6])$/, (_, m, d) => m + ROMAN[d])]
    : []
  const alts = alternatives(tokens)

  const scored: { item: SearchItem; score: number }[] = []
  for (const p of prepare(items)) {
    const own = queryScore(tokens, p) + (codes.length ? codeScore(codes, p) : 0)
    const alt = Math.max(0, ...alts.map((a) => queryScore(a, p)))
    const score = own + 0.9 * alt
    if (score > 0) scored.push({ item: p.item, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || KIND_ORDER[a.item.kind] - KIND_ORDER[b.item.kind] || a.item.title.localeCompare(b.item.title, 'vi'))
    .map((s) => s.item)
}

/** Vocabulary of titles and aliases: folded word → its most common written form (with diacritics). */
const vocabCache = new WeakMap<SearchItem[], Map<string, string>>()
function vocabulary(items: SearchItem[]) {
  let v = vocabCache.get(items)
  if (!v) {
    const counts = new Map<string, Map<string, number>>()
    for (const it of items)
      for (const raw of `${it.title} ${it.extra}`.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)) {
        const forms = counts.get(fold(raw)) ?? new Map<string, number>()
        forms.set(raw, (forms.get(raw) ?? 0) + 1)
        counts.set(fold(raw), forms)
      }
    v = new Map([...counts].map(([k, forms]) => [k, [...forms].sort((a, b) => b[1] - a[1])[0][0]]))
    vocabCache.set(items, v)
  }
  return v
}

/** "khua do" → "khẩu độ". Null when every word is already known or nothing close exists. */
export function suggestQuery(items: SearchItem[], query: string): string | null {
  const vocab = vocabulary(items)
  let changed = false
  const out: string[] = []
  for (const t of words(query)) {
    if (vocab.has(t) || t.length < 4 || /\d/.test(t)) {
      out.push(vocab.get(t) ?? t)
      continue
    }
    // Closest known word; ties go to a swap of the same letters, then to the more common form
    let best: { w: string; d: number; swap: boolean } | null = null
    for (const w of vocab.keys()) {
      if (!near(t, w)) continue
      const c = { w, d: distance(t, w), swap: sameLetters(t, w) }
      if (!best || c.d < best.d || (c.d === best.d && c.swap && !best.swap)) best = c
    }
    if (!best) return null
    changed = true
    out.push(vocab.get(best.w)!)
  }
  return changed ? out.join(' ') : null
}
