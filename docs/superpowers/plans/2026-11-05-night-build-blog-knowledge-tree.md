# Night build: blog theo cây kiến thức — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Một PR chứa 12 bài `/blog` mới cho người mới cầm Sony, bám 24 note alphaskill ở `/learn`, có `[[wikilink]]` inline, ảnh Wikimedia Commons đi kèm pack, 3 bài live viết lại, 6 nháp pilot dọn lại, và `push:lab` biết upload ảnh và thay bài chưa ai sửa.

**Architecture:** Pillar = note alphaskill (đã live). Cluster = `Article` trong content pack `nen-tang-2026-11`, một file mỗi bài, gộp bởi `packs/nen-tang-2026-11.ts`. Wikilink resolve ở server (`ArticleView` → `wikiHrefs`) và được render bởi `Paragraph`/`Callout` qua một map `title → href` thuần, nên `blocks.tsx` không kéo zod vào client. Ảnh là sidecar `packs/<pack>.images/<page-id>/` với `manifest.json`; `push:lab` upload qua `uploadDraftAsset` rồi điền `assetId`.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · vitest · tsx scripts · Supabase storage (`lab-drafts`) · Wikimedia Commons API · MCP `sony-alpha-viet`.

Spec: `docs/superpowers/specs/2026-11-05-night-build-blog-knowledge-tree-design.md`.

## Global Constraints

- Giá trị máy (enum, khoảng, tên Creative Look, chế độ) chỉ từ `src/lib/camera/constants.ts`; đường menu chỉ từ trang Sony Help Guide đọc hôm nay qua `npx tsx scripts/research/sony-source.ts <url>` (AGENTS.md Rule 1).
- Mọi URL trích: `npx tsx scripts/research/check-urls.ts <url…>` phải 200. Mọi video: `npx tsx scripts/research/youtube.ts <id…>` phải `embeddable: true`. Không bao giờ bịa URL, id video, firmware, ngày, trích dẫn.
- Block vocabulary đóng: `tldr h p menu table callout compare checklist figure embed`. Không thêm block type, không đổi `validateForPublish`.
- Bài: 8–16 block, mở `tldr` rồi `p`, có `h`, đóng `checklist` hoặc `figure`, không hai block cùng loại liền nhau trừ `menu` (`validateArticleShape`, `src/lib/lab/parse.ts:499-536`). Nhà: menu bắt đầu `MENU` và có ` → `; table 3–6 dòng; checklist 3–6 mục; không emoji, không `!`, không `[CẦN BỔ SUNG`; không ngày tương lai; không tự tham chiếu (`houseRules`, `parse.ts:416-484`).
- Tiếng Việt (ADR 0004). Thuật ngữ máy giữ nguyên như in trên máy (`Creative Look`, `AF-C`, `Focus Area`). Không dòng giải thích thừa (CLAUDE.md "Copy").
- Giấy phép ảnh cho phép: `CC0`, `Public domain`, `CC BY 2.0/3.0/4.0`, `CC BY-SA 2.0/3.0/4.0`. Khác: loại.
- Không ai chạy `push:*`, không ai đụng `.env.local`, không publish. Agent nào cũng `isolation: 'worktree'`; orchestrator kiểm `git status` khi nhận kết quả.
- Trước commit UI: chạy 7 lệnh `rg` trong CLAUDE.md "Before committing UI"; 0 hit.
- Nhánh: `claude/blog-knowledge-tree` từ `origin/main`. Pack: `nen-tang-2026-11`.
- Commit message kết bằng `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## Phase A — Mã (một agent developer, worktree, ~2h)

### Task 1: `splitWiki` và `stripWiki` trong `markdown.ts`

**Files:**
- Modify: `src/lib/alphaskill/markdown.ts` (sau `parseInline`, dòng 26–80)
- Test: `src/lib/alphaskill/markdown.test.ts`

**Interfaces:**
- Produces: `export type WikiSegment = { t: 'text'; text: string } | { t: 'wiki'; title: string; display: string }`; `export function splitWiki(text: string): WikiSegment[]`; `export function stripWiki(text: string): string`. `title` được `trim()` giống `wikilinkTargets` (`parse.ts:53-66`), nên map `title → href` ở Task 2 khớp khóa.

- [ ] **Step 1: Test thất bại**

```ts
import { splitWiki, stripWiki } from './markdown'

describe('splitWiki', () => {
  it('cắt wikilink ra khỏi chữ thường, giữ display', () => {
    expect(splitWiki('Xem [[Tốc độ màn trập|tốc độ]] và [[ISO]].')).toEqual([
      { t: 'text', text: 'Xem ' },
      { t: 'wiki', title: 'Tốc độ màn trập', display: 'tốc độ' },
      { t: 'text', text: ' và ' },
      { t: 'wiki', title: 'ISO', display: 'ISO' },
      { t: 'text', text: '.' },
    ])
  })
  it('bỏ fragment, trim title', () => {
    expect(splitWiki('[[ Khẩu độ #Trên máy Sony]]')).toEqual([{ t: 'wiki', title: 'Khẩu độ', display: 'Khẩu độ' }])
  })
  it('không đụng markdown khác', () => {
    expect(splitWiki('**đậm** [a](b)')).toEqual([{ t: 'text', text: '**đậm** [a](b)' }])
  })
})

describe('stripWiki', () => {
  it('chỉ còn chữ hiển thị', () => {
    expect(stripWiki('Xem [[Tốc độ màn trập|tốc độ]] và [[ISO]].')).toBe('Xem tốc độ và ISO.')
  })
})
```

- [ ] **Step 2: Chạy, phải FAIL** — `npx vitest run src/lib/alphaskill/markdown.test.ts` → "splitWiki is not a function".

- [ ] **Step 3: Cài đặt**

```ts
export type WikiSegment = { t: 'text'; text: string } | { t: 'wiki'; title: string; display: string }

const WIKI_RE = /\[\[([^\]|#]+)(?:\|([^\]]*)|#[^\]]*)*\]\]/g

/** Chỉ tách `[[…]]`; mọi markdown khác giữ nguyên là chữ (bài blog không phải markdown). */
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

/** Chữ hiển thị thôi — cho précis, search, description. */
export function stripWiki(text: string): string {
  return splitWiki(text).map((s) => (s.t === 'wiki' ? s.display : s.text)).join('')
}
```

- [ ] **Step 4: Chạy, PASS.** `npx vitest run src/lib/alphaskill/markdown.test.ts`
- [ ] **Step 5: Commit** — `git add src/lib/alphaskill/markdown.ts src/lib/alphaskill/markdown.test.ts && git commit -m "alphaskill markdown: splitWiki and stripWiki for article prose"`

---

### Task 2: Wikilink render trong `Paragraph`/`Callout`, resolve ở `ArticleView`

**Files:**
- Create: `src/lib/lab/wiki.ts`, `src/lib/lab/wiki.test.ts`
- Modify: `src/components/lab/blocks.tsx:74-83` (Paragraph), `:175-182` (Callout), imports dòng 1–12
- Modify: `src/components/lab/article-view.tsx:44-60` (`renderBlock`), `:107` (`ArticleView`), `:225`
- Modify: `src/components/lab/editor/block-preview.tsx:38-45` (truyền `{}`)
- Test: `src/components/lab/blocks.test.ts`

**Interfaces:**
- Consumes: `splitWiki` (Task 1); `wikilinkTargets`, `findNoteByTitle` từ `@/lib/alphaskill/parse`; `listNotes`, `noteHref` từ `@/lib/alphaskill/knowledge`; `Link` từ `@/i18n/navigation`.
- Produces: `export type WikiHrefs = Readonly<Record<string, string>>` (khóa = title đã trim, giá trị = `/learn/<slug>`), `export function wikiHrefs(blocks: readonly Block[], notes: readonly AlphaNote[]): WikiHrefs` trong `src/lib/lab/wiki.ts`; `Paragraph({ block, hrefs })`, `Callout({ block, hrefs })` với `hrefs?: WikiHrefs`.

- [ ] **Step 1: Test `wikiHrefs` thất bại** (`src/lib/lab/wiki.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import notes from '../../../data/alphaskill-knowledge.seed.json'
import type { AlphaNote } from '@/lib/alphaskill/parse'
import type { Block } from './types'
import { wikiHrefs } from './wiki'

const all = notes as AlphaNote[]
const blocks: Block[] = [
  { t: 'p', text: 'Mở [[Tốc độ màn trập]] và [[Không có note này]].' },
  { t: 'callout', label: 'Khi trời tối', text: 'Tăng [[iso|ISO]].' },
  { t: 'h', text: '[[Khẩu độ]] không tính ở heading' },
]

describe('wikiHrefs', () => {
  it('resolve title và alias trong p/callout, bỏ qua đích lạ và block khác', () => {
    expect(wikiHrefs(blocks, all)).toEqual({
      'Tốc độ màn trập': '/learn/toc-do-man-trap',
      iso: '/learn/iso',
    })
  })
})
```

- [ ] **Step 2: Chạy, FAIL** — `npx vitest run src/lib/lab/wiki.test.ts`

- [ ] **Step 3: Cài đặt `src/lib/lab/wiki.ts`**

```ts
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
```

Nếu `findNoteByTitle` không khớp alias (đọc `parse.ts:233-245`): thêm so khớp `n.aliases.some((a) => fold(a) === fold(title))` ngay trong `wikiHrefs`, không sửa `parse.ts`.

- [ ] **Step 4: Chạy, PASS.**

- [ ] **Step 5: Test render thất bại** (thêm vào `src/components/lab/blocks.test.ts`, cạnh `const { Callout, … } = await import('./blocks')` — thêm `Paragraph` vào destructuring)

```ts
describe('wikilinks trong đoạn văn', () => {
  it('đích có href thành link gạch chân, đích lạ thành chữ', () => {
    const html = renderToStaticMarkup(
      createElement(Paragraph, {
        block: { t: 'p', text: 'Xem [[Tốc độ màn trập|tốc độ]] và [[Lạ]].' },
        hrefs: { 'Tốc độ màn trập': '/learn/toc-do-man-trap' },
      }),
    )
    expect(html).toContain('href="/learn/toc-do-man-trap"')
    expect(html).toMatch(/<a [^>]*class="[^"]*underline[^"]*"[^>]*>tốc độ<\/a>/)
    expect(html).toContain(' và Lạ.')
    expect(html).not.toContain('[[')
  })
  it('không có hrefs thì chữ thuần', () => {
    const html = renderToStaticMarkup(createElement(Paragraph, { block: { t: 'p', text: 'A [[B]] C' } }))
    expect(html).toContain('A B C')
  })
})
```

- [ ] **Step 6: Chạy, FAIL.** `npx vitest run src/components/lab/blocks.test.ts`

- [ ] **Step 7: Cài đặt trong `blocks.tsx`**

Thêm import: `import { Link } from '@/i18n/navigation'` và `import { splitWiki } from '@/lib/alphaskill/markdown'` và `import type { WikiHrefs } from '@/lib/lab/wiki'` (type-only: không kéo `knowledge.ts` vào client). Thêm:

```tsx
/* Cùng lớp link với note-view (`src/components/alphaskill/note-view.tsx:230`):
   gạch chân là gate axe link-in-text-block. */
const WIKI_LINK = 'text-accent-400 underline decoration-1 underline-offset-4 transition-colors hover:text-accent-500'

function Prose({ text, hrefs = {} }: { text: string; hrefs?: WikiHrefs }) {
  return splitWiki(text).map((s, i) =>
    s.t === 'wiki' && hrefs[s.title] ? (
      <Link key={i} href={hrefs[s.title]} className={WIKI_LINK}>{s.display}</Link>
    ) : (
      <span key={i}>{s.t === 'wiki' ? s.display : s.text}</span>
    ),
  )
}
```

`Paragraph`: chữ ký `({ block, hrefs }: { block: ParagraphBlock; hrefs?: WikiHrefs })`, thân `{block.text}` → `<Prose text={block.text} hrefs={hrefs} />`. `Callout` tương tự cho `block.text` (label giữ nguyên).

Nếu `Link` của `@/i18n/navigation` cần context khi render tĩnh trong test (lỗi "useLocale…"), thay bằng `<a href>` trong `Prose` với cùng className — `note-view.tsx` dùng `Link`, nhưng ở đây href đã là đường nội bộ không locale; kiểm tra bằng cách đọc `src/i18n/navigation.ts` trước khi chọn.

- [ ] **Step 8: Nối vào `article-view.tsx`**

`renderBlock(block, i, articleId, labels, checklistOrdinal, hrefs: WikiHrefs)`; `case 'p'` → `<Paragraph key={i} block={block} hrefs={hrefs} />`; `case 'callout'` → thêm `hrefs={hrefs}`. Trong `ArticleView` (async, dòng 107): 

```ts
import { listNotes } from '@/lib/alphaskill/knowledge'
import { wikiHrefs } from '@/lib/lab/wiki'
// …
const notes = await listNotes().catch(() => [])
const hrefs = wikiHrefs(article.blocks, notes)
```

và dòng 225 truyền `hrefs`. Trong `block-preview.tsx` không truyền gì (editor xem trước thấy chữ thuần; đúng ý: preview không gọi server).

- [ ] **Step 9: PASS + typecheck.** `npx vitest run src/components/lab src/lib/lab/wiki.test.ts && npm run typecheck`
- [ ] **Step 10: Client graph.** `npx vitest run src/design/client-graph.test.ts` (blocks.tsx được `block-preview.tsx` 'use client' import; `wiki.ts` chỉ import type nên không có chuỗi zod).
- [ ] **Step 11: Commit** — `git commit -am "Article prose: [[wikilinks]] resolve to /learn notes, rendered like note-view"`

---

### Task 3: `stripWiki` ở précis và search

**Files:**
- Modify: `src/lib/lab/outline.ts:61-66` (`precisSource`), `src/lib/search/documents.ts:155-175` (`blockText`)
- Test: `src/lib/lab/outline.test.ts`, `src/lib/search/documents.test.ts` (nếu chưa có file test cho documents, tạo)

**Interfaces:** Consumes `stripWiki` (Task 1). Không đổi chữ ký nào.

- [ ] **Step 1: Test thất bại**

```ts
// outline.test.ts
it('précis không mang ngoặc wikilink', () => {
  const o = buildOutline([
    { t: 'h', text: 'Mục' },
    { t: 'p', text: 'Đọc [[Tốc độ màn trập|tốc độ]] trước.' },
  ])
  expect(JSON.stringify(o)).toContain('Đọc tốc độ trước.')
  expect(JSON.stringify(o)).not.toContain('[[')
})
// documents.test.ts
it('body search không mang ngoặc wikilink', () => {
  const doc = articleDoc({ ...ARTICLES[0], blocks: [...ARTICLES[0].blocks, { t: 'p', text: 'Có [[ISO]] ở đây' }] })
  expect(doc.body).toContain('Có ISO ở đây')
  expect(doc.body).not.toContain('[[')
})
```

- [ ] **Step 2: FAIL.** `npx vitest run src/lib/lab/outline.test.ts src/lib/search/documents.test.ts`
- [ ] **Step 3: Cài đặt** — `outline.ts` `precisSource`: `return stripWiki(b.text)` cho `p` và `callout`. `documents.ts` `blockText`: `case 'p': return [stripWiki(b.text)]`, `case 'callout': return [b.label, stripWiki(b.text)]`.
- [ ] **Step 4: PASS.**
- [ ] **Step 5: Commit** — `git commit -am "Outline précis and search body read wikilink display text"`

Ghi chú cho PR #31 (AIO, chưa merge): khi merge, `.md` twin và JSON-LD `articleBody` cũng gọi `stripWiki` — ghi vào mô tả PR, không làm ở đây.

---

### Task 4: Gate pack biết note, wikilink và ảnh sidecar

**Files:**
- Modify: `src/lib/lab/packs/check.ts` (toàn bộ, 36 dòng)
- Modify: `src/lib/lab/packs/packs.test.ts:1-45` (`knownFor`)
- Test: `src/lib/lab/packs/packs.test.ts` (describe `packProblems`)

**Interfaces:**
- Consumes: `wikilinkTargets`, `findNoteByTitle`, `fold` (`@/lib/alphaskill/parse`); `AlphaNote`.
- Produces: `Known` thêm `notes: readonly AlphaNote[]` và `images: ReadonlySet<string>` (khóa `"<pageId>#<blockIndex>"` của mọi figure có file trong manifest). Mã lỗi mới: `unknownWikilink <title>`, `wikilinkNotRelated <slug>`, `wikilinkOutsideProse`, `figureNeedsUpload` giữ nguyên nghĩa (figure không `assetId` và không có trong `images`).
- Produces: `export type PackImage = { readonly blockIndex: number; readonly file: string; readonly title: string; readonly author: string; readonly licence: string; readonly sourceUrl: string }` và `export const PACK_LICENCES = ['CC0', 'Public domain', 'CC BY 2.0', 'CC BY 3.0', 'CC BY 4.0', 'CC BY-SA 2.0', 'CC BY-SA 3.0', 'CC BY-SA 4.0'] as const` trong `check.ts`; `export function imageKeys(pageId: string, manifest: readonly PackImage[]): string[]` → `["<pageId>#<blockIndex>", …]`.

- [ ] **Step 1: Test thất bại** (thêm vào `describe('packProblems')`, dùng `good`, `check` sẵn có ở dòng 57–59; `knownFor` đổi như Step 3)

```ts
it('cho related trỏ tới note alphaskill', () => {
  const p = { ...good, meta: { ...good.meta, related: [{ kind: 'knowledge', id: 'toc-do-man-trap' }] } }
  expect(check([p])).toEqual([])
})
it('đòi mỗi wikilink resolve và có trong related', () => {
  const blocks = [...good.blocks]
  blocks[1] = { t: 'p', text: 'Xem [[Tốc độ màn trập]] và [[Không có]].' }
  const p = { ...good, blocks }
  expect(check([p])).toContain('probe-page: unknownWikilink Không có')
  expect(check([p])).toContain('probe-page: wikilinkNotRelated toc-do-man-trap')
})
it('không cho wikilink ngoài p/callout', () => {
  const blocks = [...good.blocks]
  blocks[2] = { t: 'h', text: 'Về [[ISO]]' }
  expect(check([{ ...good, blocks }])).toContain('probe-page: wikilinkOutsideProse')
})
it('figure có ảnh sidecar thì qua, không có thì figureNeedsUpload', () => {
  const blocks = [...good.blocks, { t: 'figure', caption: 'Ảnh: A · CC BY 4.0 · Wikimedia Commons' }]
  const withFig = { ...good, blocks }
  expect(check([withFig])).toContain('probe-page: figureNeedsUpload')
  const known = { ...knownFor('probe', [withFig]), images: new Set([`probe-page#${blocks.length - 1}`]) }
  expect(packProblems('probe', [withFig], known)).toEqual([])
})
```

(`good.blocks[1]` là `p` mở đầu, `[2]` là `h` — xác nhận bằng `ARTICLES[0].blocks` trước khi chạy; chỉnh chỉ số nếu khác. Nếu `good` đóng bằng `checklist`, figure thêm sau checklist vẫn hợp lệ vì "đóng bằng checklist hoặc figure".)

- [ ] **Step 2: FAIL.** `npx vitest run src/lib/lab/packs`

- [ ] **Step 3: Cài đặt `check.ts`**

```ts
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
```

Nếu Task 2 cũng cần alias: chuyển `noteFor` vào `src/lib/lab/wiki.ts` và import từ đó ở cả hai nơi.

- [ ] **Step 4: `knownFor` trong `packs.test.ts`**

```ts
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import notesSeed from '../../../../data/alphaskill-knowledge.seed.json'
import type { AlphaNote } from '@/lib/alphaskill/parse'
import { PACK_NAME_RE, imageKeys, packProblems, type Known, type PackImage } from './check'

const NOTES = notesSeed as AlphaNote[]
const IMAGES_DIR = (pack: string) => join(__dirname, `${pack}.images`)

/** Mọi figure có file trong `<pack>.images/<pageId>/manifest.json`. */
function packImages(pack: string, pages: readonly Article[]): Set<string> {
  const out = new Set<string>()
  for (const page of pages) {
    const file = join(IMAGES_DIR(pack), page.id, 'manifest.json')
    if (!existsSync(file)) continue
    const manifest = JSON.parse(readFileSync(file, 'utf8')) as PackImage[]
    for (const m of manifest) {
      if (existsSync(join(IMAGES_DIR(pack), page.id, m.file))) out.add(`${page.id}#${m.blockIndex}`)
    }
  }
  return out
}

function knownFor(pack: string, extra: readonly Article[] = []): Known {
  const all = [...pages(), ...extra]
  return {
    takenIds: new Set([...ids(pages(pack)), ...RESERVED_IDS]),
    refIds: {
      recipe: ids(recipesSeed as { id: string }[]),
      product: new Set([...ids(camerasSeed as { id: string }[]), ...ids(audioSeed as { id: string }[])]),
      article: ids(all.filter((a) => a.kind === 'article')),
      knowledge: new Set([...ids(all.filter((a) => a.kind === 'knowledge')), ...NOTES.map((n) => n.slug)]),
    },
    notes: NOTES,
    images: packImages(pack, PACKS[pack] ?? extra),
  }
}
```

Thêm một test cho manifest: mỗi `manifest.json` trong mọi `<pack>.images/` có `licence` thuộc `PACK_LICENCES`, `sourceUrl` bắt đầu `https://commons.wikimedia.org/`, `file` tồn tại, và `blockIndex` trỏ vào một block `figure` của trang đó.

- [ ] **Step 5: PASS.** `npx vitest run src/lib/lab/packs`
- [ ] **Step 6: Commit** — `git commit -am "Pack gate: alphaskill notes as link targets, wikilinks must resolve and be related, figures may ship sidecar images"`

---

### Task 5: `scripts/research/commons.ts`

**Files:**
- Create: `scripts/research/commons.ts`
- Modify: `scripts/research/lib.ts` (thêm `pickCommons`)
- Test: `scripts/research/lib.test.ts`

**Interfaces:**
- Produces: `export type CommonsHit = { file: string; width: number; height: number; thumb: string; page: string; licence: string; artist: string; allowed: boolean }`; `export function pickCommons(json: unknown, allowed: readonly string[]): CommonsHit[]` (thuần, trong `lib.ts`). CLI: `npx tsx scripts/research/commons.ts "<query>" [--n 8] [--save <dir>/<n>.jpg <index>]` in một JSON mỗi hit; `--save` tải `thumb` (1024px) về đường dẫn và in `{ file, licence, artist, page, savedTo }`.

- [ ] **Step 1: Test thất bại** (`lib.test.ts`)

```ts
import { pickCommons } from './lib'
import { PACK_LICENCES } from '../../src/lib/lab/packs/check'

it('pickCommons đọc extmetadata và đánh dấu giấy phép được phép', () => {
  const json = { query: { pages: { 1: { title: 'File:A.jpg', imageinfo: [{ width: 2000, height: 1500, thumburl: 'https://t/a.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:A.jpg', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: '<a href="x">Ng. A</a>' } } }] },
    2: { title: 'File:B.jpg', imageinfo: [{ width: 800, height: 600, thumburl: 'https://t/b.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:B.jpg', extmetadata: { LicenseShortName: { value: 'Fair use' }, Artist: { value: 'B' } } }] } } } }
  const hits = pickCommons(json, PACK_LICENCES)
  expect(hits).toEqual([
    { file: 'File:A.jpg', width: 2000, height: 1500, thumb: 'https://t/a.jpg', page: 'https://commons.wikimedia.org/wiki/File:A.jpg', licence: 'CC BY-SA 4.0', artist: 'Ng. A', allowed: true },
    { file: 'File:B.jpg', width: 800, height: 600, thumb: 'https://t/b.jpg', page: 'https://commons.wikimedia.org/wiki/File:B.jpg', licence: 'Fair use', artist: 'B', allowed: false },
  ])
})
```

- [ ] **Step 2: FAIL.** `npx vitest run scripts/research/lib.test.ts`
- [ ] **Step 3: Cài đặt**

`lib.ts`:
```ts
export type CommonsHit = { file: string; width: number; height: number; thumb: string; page: string; licence: string; artist: string; allowed: boolean }

export function pickCommons(json: unknown, allowed: readonly string[]): CommonsHit[] {
  const pages = (json as { query?: { pages?: Record<string, unknown> } })?.query?.pages ?? {}
  const out: CommonsHit[] = []
  for (const p of Object.values(pages) as Array<{ title: string; imageinfo?: Array<Record<string, unknown>> }>) {
    const ii = p.imageinfo?.[0]
    if (!ii) continue
    const meta = (ii.extmetadata ?? {}) as Record<string, { value?: string }>
    const licence = text(meta.LicenseShortName?.value ?? '')
    out.push({
      file: p.title, width: Number(ii.width), height: Number(ii.height),
      thumb: String(ii.thumburl ?? ''), page: String(ii.descriptionurl ?? ''),
      licence, artist: text(meta.Artist?.value ?? '').slice(0, 80), allowed: allowed.includes(licence),
    })
  }
  return out
}
```
(`text` đã có trong `lib.ts`, dòng 24.)

`commons.ts`:
```ts
/**
 * Ảnh minh họa từ Wikimedia Commons, giấy phép đọc từ extmetadata. Usage:
 *   npx tsx scripts/research/commons.ts "<query>" [--n 8]
 *   npx tsx scripts/research/commons.ts "<query>" --save <path.jpg> <index>
 * Một JSON mỗi hit; --save tải bản 1024px của hit thứ <index> (0-based) và in nơi lưu.
 * Chỉ hit `allowed: true` được lưu; exit 1 nếu không.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { PACK_LICENCES } from '../../src/lib/lab/packs/check'
import { pickCommons } from './lib'

const UA = 'alphacolorlab-blog/1.0 (https://alphacolorlab.com)'

async function main() {
  const [query, ...rest] = process.argv.slice(2)
  if (!query) throw new Error('query required')
  const n = rest.includes('--n') ? Number(rest[rest.indexOf('--n') + 1]) : 8
  const save = rest.includes('--save') ? { path: rest[rest.indexOf('--save') + 1], index: Number(rest[rest.indexOf('--save') + 2]) } : null
  const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: `${query} filetype:bitmap`, gsrnamespace: '6', gsrlimit: String(n), prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1024', format: 'json' })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`commons ${res.status}`)
  const hits = pickCommons(await res.json(), PACK_LICENCES)
  if (!save) { for (const h of hits) console.log(JSON.stringify(h)); return }
  const hit = hits[save.index]
  if (!hit?.allowed) throw new Error(`hit ${save.index} is not allowed: ${hit?.licence ?? 'none'}`)
  const img = await fetch(hit.thumb, { headers: { 'User-Agent': UA } })
  if (!img.ok) throw new Error(`thumb ${img.status}`)
  mkdirSync(dirname(save.path), { recursive: true })
  writeFileSync(save.path, Buffer.from(await img.arrayBuffer()))
  console.log(JSON.stringify({ ...hit, savedTo: save.path }))
}
main().catch((e: unknown) => { console.error(`✗ ${e instanceof Error ? e.message : String(e)}`); process.exit(1) })
```

- [ ] **Step 4: PASS + chạy thử thật** — `npx tsx scripts/research/commons.ts "panning photography" --n 2` in 2 dòng JSON (đã kiểm 2026-11-05: API trả `CC BY-SA 4.0`, `CC BY-SA 3.0`).
- [ ] **Step 5: Commit** — `git add scripts/research && git commit -m "research: commons.ts finds CC-licensed pictures on Wikimedia Commons and saves a 1024px copy"`

---

### Task 6: `push:lab` upload ảnh sidecar và `--replace`

**Files:**
- Modify: `scripts/supabase/args.ts:24-120` (`ParsedArgs.replace?: string[]`, VALUE flag `--replace` lặp được)
- Modify: `scripts/lib/lab-candidates.ts` (thêm `images`)
- Modify: `scripts/push-lab-articles.ts` (toàn bộ)
- Test: `scripts/lib/lab-candidates.test.ts` (tạo), `scripts/supabase/args.test.ts` (có sẵn? nếu không, tạo)

**Interfaces:**
- Consumes: `uploadDraftAsset(articleId, image: ProcessedLabImage, editorEmail)` (`asset-store.ts:94`), `processLabImage(Uint8Array): Promise<ProcessResult>` (`image-process.ts:72`), `PackImage`, `imageKeys` (Task 4).
- Produces: `LabCandidate` thêm `images: readonly { blockIndex: number; path: string }[]`; `export function replaceable(row: { updated_by: string | null }): boolean` (true khi chưa người nào sửa); `export function withAssetIds(article: Article, ids: ReadonlyMap<number, string>): Article`.

Quy tắc `--replace <id>` (lặp được): chỉ ghi đè dòng có `updated_by IS NULL` (chưa ai sửa trong Sửa; `push:lab` insert với `updated_by: null`, dòng 76 hiện tại). Dòng đã sửa: in `✗ <id> đã được <email> sửa lúc <updated_at> — sửa tay trong /blog/<id>/edit` và bỏ qua, exit 0. Thứ tự: `uploadDraftAsset` cần dòng tồn tại (`articleExists`, `asset-store.ts:103`), nên **insert/update trước, upload sau, rồi update `blocks` với `assetId`**.

- [ ] **Step 1: Test thất bại** (`scripts/lib/lab-candidates.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { ARTICLES } from '../../src/lib/lab/articles'
import { labCandidates, replaceable, withAssetIds } from './lab-candidates'

describe('labCandidates', () => {
  it('đọc ảnh sidecar của pack theo manifest', () => {
    const page = { ...ARTICLES[0], id: 'probe', blocks: [...ARTICLES[0].blocks, { t: 'figure' as const, caption: 'x' }] }
    const out = labCandidates({ withPilotDrafts: false, pack: 'probe' }, { probe: [page] }, {
      probe: { probe: [{ blockIndex: page.blocks.length - 1, file: '1.jpg', title: 't', author: 'a', licence: 'CC0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:x' }] },
    })
    expect(out.at(-1)).toMatchObject({ status: 'draft', images: [{ blockIndex: page.blocks.length - 1, path: expect.stringMatching(/probe\.images\/probe\/1\.jpg$/) }] })
  })
})
describe('replaceable', () => {
  it('chỉ dòng chưa ai sửa', () => {
    expect(replaceable({ updated_by: null })).toBe(true)
    expect(replaceable({ updated_by: 'a@b.c' })).toBe(false)
  })
})
describe('withAssetIds', () => {
  it('điền assetId vào đúng figure', () => {
    const a = { ...ARTICLES[0], blocks: [{ t: 'figure' as const, caption: 'c' }, { t: 'p' as const, text: 'x' }] }
    expect(withAssetIds(a, new Map([[0, '11111111-1111-4111-8111-111111111111']])).blocks[0]).toEqual({ t: 'figure', caption: 'c', assetId: '11111111-1111-4111-8111-111111111111' })
  })
})
```

- [ ] **Step 2: FAIL.** `npx vitest run scripts/lib`
- [ ] **Step 3: Cài đặt `lab-candidates.ts`**

```ts
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { PackImage } from '../../src/lib/lab/packs/check'

export type LabCandidate = { article: Article; status: 'published' | 'draft'; images: readonly { blockIndex: number; path: string }[] }
export type PackManifests = Readonly<Record<string, Readonly<Record<string, readonly PackImage[]>>>>  // pack → pageId → manifest

const PACKS_DIR = join(__dirname, '../../src/lib/lab/packs')

/** `<pack>.images/<pageId>/manifest.json` cho mọi trang của pack; thiếu thư mục thì rỗng. */
export function readManifests(pack: string): Readonly<Record<string, readonly PackImage[]>> {
  const dir = join(PACKS_DIR, `${pack}.images`)
  if (!existsSync(dir)) return {}
  return Object.fromEntries(readdirSync(dir).flatMap((pageId) => {
    const file = join(dir, pageId, 'manifest.json')
    return existsSync(file) ? [[pageId, JSON.parse(readFileSync(file, 'utf8')) as PackImage[]]] : []
  }))
}

export function labCandidates(
  opts: { withPilotDrafts: boolean; pack?: string },
  packs: Readonly<Record<string, readonly Article[]>> = PACKS,
  manifests: PackManifests = opts.pack ? { [opts.pack]: readManifests(opts.pack) } : {},
): LabCandidate[] {
  const out: LabCandidate[] = ARTICLES.map((article) => ({ article, status: 'published', images: [] }))
  if (opts.withPilotDrafts) out.push(...PILOT_DRAFTS.map((article) => ({ article, status: 'draft' as const, images: [] })))
  if (opts.pack !== undefined) {
    const pack = packs[opts.pack]
    if (!pack) throw new Error(`Unknown pack "${opts.pack}". Packs: ${Object.keys(packs).join(', ') || '(none yet)'}`)
    const byPage = manifests[opts.pack] ?? {}
    out.push(...pack.map((article) => ({
      article, status: 'draft' as const,
      images: (byPage[article.id] ?? []).map((m) => ({ blockIndex: m.blockIndex, path: join(PACKS_DIR, `${opts.pack}.images`, article.id, m.file) })),
    })))
  }
  return out
}

export const replaceable = (row: { updated_by: string | null }) => row.updated_by === null

export function withAssetIds(article: Article, ids: ReadonlyMap<number, string>): Article {
  return { ...article, blocks: article.blocks.map((b, i) => (b.t === 'figure' && ids.has(i) ? { ...b, assetId: ids.get(i)! } : b)) }
}
```

- [ ] **Step 4: `args.ts`** — thêm `replace: string[]` vào `ParsedArgs` (mặc định `[]`), xử lý `--replace <id>` như `--pack` nhưng push vào mảng; `refuseUnimplemented` nhận `'--replace'` trong `allow` của `push:lab`. Test: `parseArgs(['--target','content','--replace','a','--replace','b']).replace` → `['a','b']`.

- [ ] **Step 5: `push-lab-articles.ts`** — thay thân `main()`:

```ts
const { args, target } = requireTarget(process.argv.slice(2), ['--with-pilot-drafts', '--pack', '--dry-run', '--replace'])
if (target !== 'content') throw new Error('This script seeds content tables. Pass --target content.')
const candidates = labCandidates({ withPilotDrafts: args.withPilotDrafts, pack: args.pack })
const db = adminClient(target)
const { data: existing, error: readError } = await db.from('lab_articles').select('id, updated_by, updated_at')
if (readError) throw new Error(`read lab_articles: ${readError.message}`)
const rows = new Map((existing ?? []).map((r) => [r.id as string, r as { id: string; updated_by: string | null; updated_at: string }]))

const toInsert = candidates.filter((c) => !rows.has(c.article.id))
const toReplace = candidates.filter((c) => rows.has(c.article.id) && args.replace.includes(c.article.id))
for (const c of toReplace) {
  const row = rows.get(c.article.id)!
  if (!replaceable(row)) console.log(`✗ ${c.article.id} đã được ${row.updated_by} sửa lúc ${row.updated_at} — sửa tay trong /blog/${c.article.id}/edit`)
}
const replacing = toReplace.filter((c) => replaceable(rows.get(c.article.id)!))

if (args.dryRun) {
  for (const c of toInsert) console.log(`  would insert  ${c.status.padEnd(9)} ${c.article.kind.padEnd(9)} ${c.article.id}  (${c.images.length} ảnh)`)
  for (const c of replacing) console.log(`  would replace ${c.status.padEnd(9)} ${c.article.kind.padEnd(9)} ${c.article.id}  (${c.images.length} ảnh)`)
  return
}
const now = new Date().toISOString()
const rowOf = ({ article: a, status }: LabCandidate) => ({ id: a.id, status, kind: a.kind, topic: a.topic, level: a.level, archetype: a.archetype, read: a.read, title: a.title, dek: a.dek, blocks: a.blocks, meta: a.meta, updated_at: now, updated_by: null })
if (toInsert.length) {
  const { error } = await db.from('lab_articles').insert(toInsert.map((c) => ({ ...rowOf(c), created_at: now })))
  if (error) throw new Error(`insert lab_articles: ${error.message}`)
}
for (const c of replacing) {
  const { error } = await db.from('lab_articles').update(rowOf(c)).eq('id', c.article.id).is('updated_by', null)
  if (error) throw new Error(`replace ${c.article.id}: ${error.message}`)
}
/* Ảnh sau khi dòng đã có: uploadDraftAsset đòi articleExists. */
for (const c of [...toInsert, ...replacing]) {
  if (c.images.length === 0) continue
  const ids = new Map<number, string>()
  for (const img of c.images) {
    const processed = await processLabImage(new Uint8Array(readFileSync(img.path)))
    if (!processed.ok) throw new Error(`${c.article.id} ảnh ${img.path}: ${processed.error}`)
    const up = await uploadDraftAsset(c.article.id, processed.image, 'push:lab')
    if (!up.ok) throw new Error(`${c.article.id} ảnh ${img.path}: ${up.error}`)
    ids.set(img.blockIndex, up.assetId)
  }
  const { error } = await db.from('lab_articles').update({ blocks: withAssetIds(c.article, ids).blocks }).eq('id', c.article.id)
  if (error) throw new Error(`assets ${c.article.id}: ${error.message}`)
}
console.log(`✓ ${toInsert.length} inserted, ${replacing.length} replaced`)
```

Đọc `asset-store.ts:94-176` trước: nếu `uploadDraftAsset` ghi `editorEmail` vào cột có CHECK email, dùng một địa chỉ hợp lệ của owner từ `admin_emails`? Không — truyền chuỗi `'push:lab'` chỉ khi cột không ràng buộc; nếu ràng buộc, lấy `process.env.PUSH_LAB_EDITOR` (bắt buộc khi có ảnh, báo lỗi rõ khi thiếu). Ghi nhận trong mô tả PR.

`uploadDraftAsset` dùng client server của app (`contentAdmin()`), đọc env từ `.env.local` qua `tsx --env-file` — đã là cách `push:lab` chạy (package.json:50). Nếu nó gọi `isDevStore()` và chọn nhánh local khi thiếu env: chạy `--dry-run` không chạm.

- [ ] **Step 6: PASS + typecheck.** `npx vitest run scripts && npm run typecheck`
- [ ] **Step 7: Cập nhật AGENTS/skill một dòng** — trong `.claude/skills/colorlab-blog-content/SKILL.md` §3 "No `figure` blocks" đổi thành: figure được phép khi có ảnh sidecar `packs/<pack>.images/<id>/manifest.json` (Commons, giấy phép trong `PACK_LICENCES`, caption kết bằng credit); §6 thêm `--replace <id>` cho bài live chưa ai sửa.
- [ ] **Step 8: Commit** — `git commit -am "push:lab uploads a pack's sidecar pictures and --replace rewrites a live page nobody has edited"`

---

## Phase B — Nội dung (4 agent writer song song + 1 agent bài cũ, ~4h)

### Task 7: Khung pack và quy trình một bài (đọc trước khi viết)

**Files (mỗi writer tạo riêng, không đụng của nhau):**
- Create: `src/lib/lab/packs/nen-tang-2026-11/<page-id>.ts` — `export const page: Article = { … }`
- Create: `src/lib/lab/packs/nen-tang-2026-11.images/<page-id>/1.jpg`, `2.jpg`…, `manifest.json`
- Orchestrator tạo sau cùng: `src/lib/lab/packs/nen-tang-2026-11.ts` (import mọi `page`, `export const NEN_TANG_2026_11: readonly Article[] = […]`) và thêm vào `PACKS` trong `packs/index.ts`: `'nen-tang-2026-11': NEN_TANG_2026_11`.

**Quy trình một bài, đúng thứ tự, không bỏ bước:**

1. Đọc note pillar trong `data/alphaskill-knowledge.seed.json` (trường `body`, `headings`, `aliases`, `links`). Bài không chép lại định nghĩa của note; câu định nghĩa mở bài là một câu mới, 40–60 từ, có `[[Tên note]]` đúng title.
2. Đọc khối liên quan trong `src/lib/camera/constants.ts` (ví dụ `CREATIVE_LOOKS`, `WB_PRESETS`, `ISO_*`, `STEADYSHOT_*` — tên thật lấy bằng `rg -n "export const" src/lib/camera/constants.ts`). Mỗi giá trị trong bài phải trace về một dòng ở đó hoặc một trang Sony đọc ở bước 3.
3. Tìm trang Help Guide a7 IV: mục lục `https://helpguide.sony.net/ilc/2110/v1/en/index.html` (200 ngày 2026-11-05) và các URL trong `constants.ts`; `npx tsx scripts/research/sony-source.ts <url>` → dán `SourceRef` nguyên văn vào `meta.sources`. Đường menu trong `menu`/`p` viết đúng như trang in. Không có trang → bài bị bỏ, ghi báo cáo.
4. MCP `sony-alpha-viet`: `lookup_prose_term` cho mỗi thuật ngữ xuất hiện; `paa_generator` với tiêu đề → chọn 2–3 câu cho FAQ.
5. Viết `page` theo cấu trúc ở spec "Cấu trúc một bài": `tldr` → `p` định nghĩa (có `[[pillar]]`) → `figure` (ảnh dẫn, caption kết `Ảnh: <author> · <licence> · Wikimedia Commons`) → 2–4 mục `h` + `p`/`menu`/`callout` → `table` "Thông số nhanh" (head 3 ô, 3–6 dòng) → FAQ 2–3 cặp `h`+`p` → `checklist` 3–6. Tổng 10–14 block. `[[…]]` ≥ 3, chỉ trong `p`/`callout`, mỗi đích có trong `related` (`{ kind: 'knowledge', id: '<slug>' }`); `related` đúng 3 mục; `prerequisites: ['<slug pillar>']`; `concepts` từ `src/lib/content/concepts.ts` khi khớp; `authorName: null`; `reviewedAt: null`; `updatedAt: '2026-11-06'` (ngày build, định dạng như `ARTICLES`); `read` theo cách `ARTICLES[0].read` tính.
6. Ảnh: `npx tsx scripts/research/commons.ts "<query tiếng Anh>" --n 8` → chọn hit `allowed: true`, rộng ≥ 1024, nội dung đúng chủ đề → `--save src/lib/lab/packs/nen-tang-2026-11.images/<page-id>/1.jpg <index>`. Ghi `manifest.json`: `[{ "blockIndex": <chỉ số figure>, "file": "1.jpg", "title": "<file>", "author": "<artist>", "licence": "<licence>", "sourceUrl": "<page>" }]`. Ảnh > 300 KB: `npx sharp-cli`? Không — dùng Node một dòng với `sharp` (đã là dependency): `node -e "require('sharp')('in.jpg').resize({width:1024}).jpeg({quality:82}).toFile('1.jpg')"`.
7. Video (tùy chọn): chỉ kênh Sony; `npx tsx scripts/research/youtube.ts <id>`; `embeddable: false` → bỏ.
8. Audit MCP: `style_lint` → `brand_voice_checker` → `aio_audit` → `citation_checker` với text của bài (ghép `p`/`h`/`tldr`). Sửa đến khi `style_lint` và `brand_voice_checker` không còn lỗi.
9. `npx tsx scripts/research/check-urls.ts` với mọi URL trong `meta.sources` và `manifest.sourceUrl`.
10. Tạm thời thêm trang vào một pack probe để chạy gate: `npx vitest run src/lib/lab/packs` với `PACKS` tạm (`'probe': [page]`) — hoặc đơn giản hơn: orchestrator gộp rồi chạy ở Task 12. Writer tự chạy ít nhất `validateForPublish(page)` qua `npx tsx -e "import('./src/lib/lab/packs/nen-tang-2026-11/<id>.ts').then(m=>import('./src/lib/lab/parse.ts').then(p=>console.log(p.validateForPublish(m.page))))"` → `[]`.
11. Commit từng bài: `git add src/lib/lab/packs/nen-tang-2026-11/<id>.ts src/lib/lab/packs/nen-tang-2026-11.images/<id> && git commit -m "Pack nen-tang-2026-11: <id>"`.

**Mẫu một trang** (điền thật, không giữ chữ trong ngoặc nhọn):

```ts
import type { Article } from '../../types'

export const page: Article = {
  id: 'panning-tren-sony',
  kind: 'article',
  topic: 'exposure',
  level: 'mid',
  archetype: 'technique',
  read: '5 phút',
  title: 'Panning trên Sony: chế độ S, tốc độ chậm và SteadyShot',
  dek: 'Lia máy theo chủ thể để nền thành vệt mà chủ thể vẫn nét: ba cài đặt trên máy và một cách tập trong 20 phút.',
  updatedAt: '2026-11-06',
  blocks: [
    { t: 'tldr', items: ['Chế độ S, tốc độ 1/30s đến 1/60s cho xe máy trong phố.', 'AF-C, Focus Area Tracking để máy bám chủ thể khi lia.', 'Lia từ trước khi bấm và tiếp tục sau khi màn trập đóng.'] },
    { t: 'p', text: 'Panning là cách lia máy cùng chiều chủ thể đang chuyển động trong lúc phơi sáng, để chủ thể nét trên nền kéo thành vệt. Nó là bài tập [[Tốc độ màn trập]] rõ nhất: tốc độ chậm vừa đủ để nền nhòe, tay lia đều để chủ thể đứng yên trong khung.' },
    { t: 'figure', caption: 'Xe đạp nét trên nền phố kéo vệt, 1/30s. Ảnh: Junyu-K · CC BY-SA 4.0 · Wikimedia Commons' },
    { t: 'h', text: 'Cài ba thứ trước khi ra phố' },
    { t: 'p', text: '…' },
    { t: 'menu', old: 'MENU → … (đúng như Help Guide)', new: 'MENU → …' },
    // … table, callout, FAQ, checklist
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'panning' },
      { kind: 'knowledge', id: 'toc-do-man-trap' },
      { kind: 'knowledge', id: 'lay-net' },
    ],
    prerequisites: ['panning'],
    concepts: [],
    sources: [/* SourceRef in từ sony-source.ts, nguyên văn */],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
```

(Ví dụ ảnh ở trên là hit thật của Commons ngày 2026-11-05; mỗi writer vẫn phải chạy lại `commons.ts` và ghi manifest từ kết quả của mình.)

### Task 8: Writer 1 — Phơi sáng + Lấy nét (3 bài)

| id | câu hỏi bài trả lời | pillar (`prerequisites`) | `related` gợi ý | ảnh Commons (query) |
|---|---|---|---|---|
| `che-do-a-cho-ngay-dau` | Ngày đầu cầm Sony, xoay về A và cài gì để chụp được ngay? | `che-do-chup-p-a-s-m` | `khau-do`, `iso`, `cai-dat-nhanh-truoc-buoi-chup` | "camera mode dial aperture priority" |
| `anh-toi-anh-chay-bu-sang` | Ảnh tối hoặc cháy, xoay bù sáng thế nào và đọc histogram ra sao? | `bu-sang` | `do-sang`, `tam-giac-phoi-sang`, `stop-va-ev` | "underexposed overexposed comparison photography" |
| `af-c-tracking-eye-af` | Ba cài đặt để máy tự bám mắt người | `lay-net` | `do-sau-truong-anh-va-xoa-phong`, `cai-dat-nhanh-truoc-buoi-chup`, `back-button-af` (article) | "portrait eye focus photography" |

Mỗi bài theo Task 7. Sony: trang Help Guide a7 IV cho `Exposure Comp.`, `Histogram`/`Display`, `Focus Mode`, `Focus Area`, `Face/Eye AF Set.`/`Subject Recognition`, `Shoot Mode`. Tên mục như trang in, không dịch.

### Task 9: Writer 2 — Màu sắc (3 bài)

| id | câu hỏi | pillar | related | ảnh |
|---|---|---|---|---|
| `creative-look-cho-ngay-dau` | Chọn Look nào cho ngày đầu, chỉnh gì trong 8 thông số | `creative-look` | `can-bang-trang-va-nhiet-do-mau`, `raw-jpeg-va-heif`, một recipe `CL-…` từ `data/recipes.seed.json` (`kind: 'recipe'`) | "Sony a7 IV camera back screen" hoặc ảnh phố màu "street color photography" |
| `khi-nao-roi-awb` | Ba tình huống AWB sai và chọn preset/Kelvin nào | `can-bang-trang-va-nhiet-do-mau` | `creative-look`, `raw-jpeg-va-heif`, `silhouette` | "white balance comparison tungsten daylight" |
| `raw-hay-jpeg-cho-nguoi-moi` | Người mới nên RAW, JPEG hay cả hai | `raw-jpeg-va-heif` | `dat-ten-va-loc-anh`, `creative-look`, `can-bang-trang-va-nhiet-do-mau` | "memory card SD camera" |

Tên Look, khoảng 8 thông số, `WB_PRESETS`, `WB_AUTO_MODES` **chỉ** từ `constants.ts` (Saturation Creative Look là −9…+9, không phải PP). Recipe trong `related` phải `published: true` trong seed.

### Task 10: Writer 3 — Bố cục + Kỹ thuật (3 bài)

| id | câu hỏi | pillar | related | ảnh |
|---|---|---|---|---|
| `bat-luoi-1-3-va-bon-bo-cuc` | Bật Grid Line và bốn bố cục dùng được ngay | `bo-cuc` | `chu-the-chinh`, `goc-may-va-khung-hinh`, `khung-trong-khung` | "rule of thirds photography example" |
| `mot-chu-the-ba-goc-may` | Bài tập 10 phút: một chủ thể, ngang mắt / cao / thấp | `chu-the-chinh` | `goc-may-va-khung-hinh`, `bo-cuc`, `8-bai-thuc-hanh` | "low angle photography street" |
| `chup-silhouette-tren-sony` | Đo sáng điểm, bù sáng âm, WB cho silhouette | `silhouette` | `do-sang`, `bu-sang`, `can-bang-trang-va-nhiet-do-mau` | "silhouette sunset photography" |

Sony: `Grid Line`, `Metering Mode`, `Exposure Comp.`, `White Balance`.

### Task 11: Writer 4 — Kỹ thuật + Quy trình (3 bài)

| id | câu hỏi | pillar | related | ảnh |
|---|---|---|---|---|
| `panning-tren-sony` | Chế độ S, tốc độ, SteadyShot, AF-C cho panning | `panning` | `toc-do-man-trap`, `lay-net`, `8-bai-thuc-hanh` | "panning photography motorcycle" |
| `xoa-phong-voi-ong-kit` | Ba cách xóa phông không mua ống mới | `do-sau-truong-anh-va-xoa-phong` | `khau-do`, `lay-net`, `chu-the-chinh` | "shallow depth of field bokeh portrait" |
| `loc-anh-sau-buoi-chup` | Rating trên máy, lọc trong Lightroom, đặt tên thư mục | `dat-ten-va-loc-anh` | `raw-jpeg-va-heif`, `cai-dat-nhanh-truoc-buoi-chup`, `8-bai-thuc-hanh` | "photographer culling photos laptop" |

Sony: `SteadyShot`/`SteadyShot Adjust.` (đọc trang thật; chế độ trên ống là công tắc OSS, trên thân là mục menu — viết đúng cái trang nói), `Rating`, `Shoot Mode` S.

### Task 12: Agent bài cũ — 3 bài live viết lại, 6 nháp pilot dọn

**Files:**
- Create: `src/lib/lab/packs/nen-tang-2026-11/back-button-af.ts`, `iso-auto-min-ss.ts`, `body-ev-vs-flash-ev-sony-flash-ttl.ts` (cùng id với `ARTICLES`)
- Modify: `src/lib/lab/pilot-drafts.ts:81-561` (6 trang `kind: 'knowledge'`)
- Modify: `src/lib/lab/packs/packs.test.ts` `knownFor` — ba bài live dùng lại id của `ARTICLES`, nên gate `idTaken` sẽ đỏ. Pack của chúng tên `thay-bai-live-2026-11`; trong `knownFor` thêm một dòng trước `takenIds`: `const REPLACE_PACKS = new Set(['thay-bai-live-2026-11'])` và `takenIds: new Set([...ids(REPLACE_PACKS.has(pack) ? pages(pack).filter((p) => !ARTICLES.some((a) => a.id === p.id)) : pages(pack)), ...RESERVED_IDS])`, với comment: pack này tồn tại để `push:lab --replace`, id trùng `ARTICLES` là chủ ý.

Quy trình bài live:
1. Lấy bài gốc từ `ARTICLES` (`src/lib/lab/articles.ts:59-329`). Kiểm bản live bằng `curl -sL https://sonycolorlab.app/vi/blog/<id>` → `get_page_text` so với gốc; nếu khác (owner đã sửa trong Sửa), ghi báo cáo "bài live đã khác mã, `--replace` sẽ tự từ chối" và vẫn viết lại từ bản live (chữ trên trang).
2. Viết lại theo Task 7 bước 1–10: thêm `p` định nghĩa có `[[…]]`, `figure` dẫn, `table` nếu chưa có, FAQ 2 cặp, `related` 3 note (`back-button-af` → `lay-net`, `do-sau-truong-anh-va-xoa-phong`, `cai-dat-nhanh-truoc-buoi-chup`; `iso-auto-min-ss` → `iso`, `toc-do-man-trap`, `cai-dat-nhanh-truoc-buoi-chup`; `body-ev…` → `bu-sang`, `dong-bo-man-sau`, `do-sang`). Giữ mọi `menu`, nguồn và giá trị đã có; chỉ thêm nguồn mới đọc hôm nay.
3. Commit từng bài.

Nháp pilot (6 trang knowledge, giữ `kind`, `section`, `order`, id): thêm trong `p` đầu một `[[…]]` tới note alphaskill tương ứng (`white-balance-shift` → `[[Cân bằng trắng và nhiệt độ màu]]`; `picture-profile-va-creative-look` → `[[Creative Look]]`; `raw-jpeg-va-cai-dat-mau` → `[[RAW, JPEG và HEIF]]`; `color-depth`, `gamma-va-color-mode` → `[[Creative Look]]` chỉ khi câu có nghĩa, không ép; `chon-cong-thuc-theo-may` → `[[Cài đặt nhanh trước buổi chụp]]`), và `related` thêm `{ kind: 'knowledge', id: '<slug>' }` tương ứng. Không đổi giá trị kỹ thuật nào. `npx vitest run src/lib/lab/pilot-drafts.test.ts src/lib/lab/packs` xanh (pilot drafts không qua `packProblems`, nhưng `pilot-drafts.test.ts` chạy `validateForPublish` — đọc nó trước). Commit: `"Pilot drafts: wikilinks and related into the alphaskill tree"`.

---

## Phase C — Gộp, gate, PR (orchestrator, ~1.5h)

### Task 13: Gộp pack và chạy mọi gate

- [ ] **Step 1:** Tạo `src/lib/lab/packs/nen-tang-2026-11.ts` và `thay-bai-live-2026-11.ts` import mọi `page`; thêm cả hai vào `PACKS` (`packs/index.ts`). Mỗi writer commit trong worktree riêng: orchestrator `git merge` từng nhánh writer vào `claude/blog-knowledge-tree` (không rebase), giải quyết xung đột chỉ ở `index.ts`.
- [ ] **Step 2:** `npx vitest run src/lib/lab/packs` → mọi `is ready to push` xanh; đọc từng mã lỗi và trả bài về đúng writer (SendMessage) nếu đỏ.
- [ ] **Step 3:** `npm test` · `npm run typecheck` · `npm run lint; echo $?` (phải in 0, không `&&`).
- [ ] **Step 4:** 7 lệnh `rg` của CLAUDE.md "Before committing UI" → 0 hit (Task 2 đổi `blocks.tsx`).
- [ ] **Step 5:** `npm run test:screens` một lần (Task 2 đổi đoạn văn; gate axe link-in-text-block và vùng chạm). Đỏ → sửa trong PR này, không nâng budget. Sau đó `rm -rf .next/cache/fetch-cache`.
- [ ] **Step 6:** `git status` sạch, không file lạ ngoài `src/lib/lab/packs/**`, `scripts/**`, `src/lib/alphaskill/markdown*`, `src/lib/lab/wiki*`, `src/components/lab/**`, `src/lib/lab/outline.ts`, `src/lib/search/documents.ts`, `src/lib/lab/pilot-drafts.ts`, `.claude/skills/colorlab-blog-content/SKILL.md`, docs.

### Task 14: PR và báo cáo

- [ ] **Step 1:** Push `claude/blog-knowledge-tree` bằng danh tính `thaikpham` (SSH `git@github.com:thaikpham/…` hoặc `GH_TOKEN=$(gh auth token --user thaikpham) gh …`).
- [ ] **Step 2:** PR theo `.github/pull_request_template.md`, tiếng Việt, tick "Không đổi giao diện" **không** được tick vì `blocks.tsx` đổi (link gạch chân trong đoạn văn): tick các mục còn lại sau khi kiểm; kèm ảnh 390 và 1440 của một đoạn có wikilink từ `test:screens`. Mô tả nêu: PR #31 khi merge cần `stripWiki` ở `.md` twin và JSON-LD. Kết bằng `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- [ ] **Step 3:** Báo cáo (file `docs/plans/2026-11-06-night-build-blog-report.md` và trong mô tả PR) theo §6 của skill:

```
## Đã viết
<id> · article · <tiêu đề>                      (12 dòng + 3 bài live)
## Đã sửa từ tài liệu
<tiêu đề đề xuất đổi vì nguồn Sony nói khác, nháp pilot đã thêm gì>
## Bỏ ra và lý do
<bài không có trang Sony, link không 200, video không embed, ảnh không có giấy phép hợp lệ>
## Ảnh cần thêm
<bài nào chưa có ảnh dẫn (nếu Commons không có), và ảnh đã kèm: id — file — tác giả — giấy phép>
## Bài live
<id> — `--replace` áp được / sẽ bị từ chối vì đã sửa tay
## Lệnh đẩy bài
npm run push:lab -- --target content --pack nen-tang-2026-11 --dry-run
npm run push:lab -- --target content --pack nen-tang-2026-11
npm run push:lab -- --target content --pack thay-bai-live-2026-11 --replace back-button-af --replace iso-auto-min-ss --replace body-ev-vs-flash-ev-sony-flash-ttl --dry-run
npm run push:lab -- --target content --pack thay-bai-live-2026-11 --replace back-button-af --replace iso-auto-min-ss --replace body-ev-vs-flash-ev-sony-flash-ttl
```

Một dòng cuối: bài về dưới "Bản nháp"; chủ sở hữu xuất bản từng bài từ Sửa của nó.

---

## Lịch đêm và lệnh khởi động

| Giờ | Việc | Ai |
|---|---|---|
| 22:00 | Task 1–6 | 1 developer (worktree) |
| 00:00 | Task 8–11 song song, Task 12 song song | 4 writer + 1 bài cũ (worktree mỗi agent) |
| 04:00 | Task 13 | orchestrator |
| 05:30 | Task 14 | orchestrator |

Khởi động (một phiên Claude Code tại repo, nhánh `main` đã `git pull`):

```
Thực hiện docs/superpowers/plans/2026-11-05-night-build-blog-knowledge-tree.md bằng superpowers:subagent-driven-development. Phase A một agent developer. Phase B năm agent song song, mỗi agent isolation worktree, mỗi agent đọc .claude/skills/colorlab-blog-content/SKILL.md và Task 7 trước khi viết. Không chạy push:*, không đụng .env.local. Kết thúc bằng PR và báo cáo tiếng Việt.
```

## Bỏ qua có chủ ý

- `/blog/setup` không sửa: `SetupGuide` là client component có gate màn đầu đếm control; wikilink từ bài mới đã trỏ về note "Cài đặt nhanh trước buổi chụp".
- 3 nháp thử nghiệm (`thu-nghiem-*`, `so-sanh-hai-cau-hinh-cung-canh`) cần ảnh chủ sở hữu tự chụp.
- Không viết note mới vào vault Obsidian; 5 lỗ hổng cho người mới (tiêu cự/ống kính, histogram, chống rung, drive mode, flash cơ bản) ghi ở báo cáo cho đêm sau.
- `.md` twin và JSON-LD (PR #31 chưa merge) — ghi chú trong PR.
