/**
 * Blog data accessor with typed Article interface.
 */

import articlesData from '../data/articles.json' with { type: 'json' }
import learningPathsData from '../data/learning-paths.json' with { type: 'json' }
import knowledgeData from '../data/knowledge.json' with { type: 'json' }

export type Block =
  | { t: 'tldr'; items: readonly string[] }
  | { t: 'h'; text: string; toc?: string; icon?: string }
  | { t: 'p'; text: string }
  | { t: 'menu'; old: string; new: string; oldVi?: string }
  | { t: 'table'; head: readonly string[]; rows: readonly (readonly string[])[]; caption: string }
  | { t: 'callout'; label: string; text: string }
  | { t: 'compare'; beforeLabel: string; afterLabel: string; caption: string }
  | { t: 'checklist'; label: string; items: readonly string[] }
  | { t: 'steps'; caption: string; items: readonly { text: string; check?: string }[] }
  | { t: 'faq'; items: readonly { q: string; a: string }[] }
  | {
      t: 'figure'
      caption: string
      src: string
      alt?: string
      width?: number
      height?: number
    }
  | { t: 'embed'; provider: 'youtube' | 'vimeo'; id: string; caption: string }
  | { t: 'set'; id: string }

export type Source = {
  url: string
  title: string
  publisher?: string
  checkedAt?: string
  scope?: string
}

export type ArticleMeta = {
  related: Array<{ kind: 'knowledge' | 'article'; id: string }>
  prerequisites: string[]
  concepts: string[]
  sources: readonly Source[]
  authorName: string | null
  reviewedAt: string | null
  section: string | null
  order: string | null
}

/** Một bản của bài (ví dụ Legacy Menu, New-gen Menu): nội dung riêng, chọn bằng công tắc trên trang. */
export type Variant = {
  readonly id: string
  readonly label: string
  /** Ids máy (app/content.ts: zve10, a6400, a7c2) mà bản này là mặc định. */
  readonly models: readonly string[]
  readonly blocks: readonly Block[]
}

export type Article = {
  readonly id: string
  readonly kind: 'article'
  readonly topic: 'af' | 'exposure' | 'composition' | 'gear' | 'color' | 'video'
  readonly level: 'newbie' | 'mid' | 'pro'
  readonly archetype: string
  readonly read: string
  readonly title: string
  readonly dek: string
  /** Bài một bản. Bài nhiều bản dùng `variants` thay cho `blocks` (đúng một trong hai). */
  readonly blocks?: readonly Block[]
  readonly variants?: readonly Variant[]
  readonly meta: ArticleMeta
  readonly updatedAt?: string
  readonly category?: string
  /** Thứ tự ghim vào nhóm Nổi bật đầu /blog (1, 2, …). Không có thì bài nằm theo cấp độ. */
  readonly pinned?: number
}

export type LearningPathStep = {
  kind: 'blog' | 'knowledge'
  id?: string
  slug?: string
  reason: string
}

export type LearningPath = {
  slug: string
  title: string
  draft: boolean
  lead: string
  steps: LearningPathStep[]
}

export type Knowledge = {
  readonly slug: string
  readonly title: string
  readonly summary: string
  readonly level: 'cơ bản' | 'nâng cao'
  readonly body: string
  readonly group: 'merged' | 'post' | 'menu-terms' | 'concepts' | 'camera' | 'specs'
  readonly home?: 'blog' | 'knowledge' | 'product'
  readonly mergedInto?: string
  readonly category?: string
}

export function list(): Article[] {
  return articlesData as Article[]
}

export function byId(id: string): Article | undefined {
  const articles = list()
  return articles.find((a) => a.id === id)
}

export function knowledge(): Knowledge[] {
  return knowledgeData as Knowledge[]
}

export function posts(): Knowledge[] {
  return knowledge().filter((k) => k.group === 'post')
}

export function learningPaths(): LearningPath[] {
  return learningPathsData as LearningPath[]
}

export function learningPathBySlug(slug: string): LearningPath | undefined {
  return learningPaths().find((p) => p.slug === slug)
}

export function publishedLearningPaths(): LearningPath[] {
  return learningPaths().filter((p) => !p.draft)
}

export function isPublished(item: { draft?: boolean }): boolean {
  return !item.draft || process.env.NODE_ENV !== 'production'
}

/** Ảnh đầu bài: khối figure đầu tiên. svg hiện nguyên (object-contain), còn lại là ảnh raster (object-cover). */
export type Thumb = { src: string; svg: boolean }

export type IndexItem = { href: string; title: string; read?: string; steps?: number; image?: Thumb }

/** Khối của một bản; không truyền id thì lấy bản đầu (bản mặc định: ảnh đại diện, JSON-LD). */
export function blocksOf(a: Article, variantId?: string): readonly Block[] {
  if (!a.variants) return a.blocks ?? []
  return a.variants.find((v) => v.id === variantId)?.blocks ?? a.variants[0].blocks
}

/** Mọi khối của mọi bản: để quét wikilink trong đồ thị. */
export function allBlocks(a: Article): readonly Block[] {
  return a.variants ? a.variants.flatMap((v) => v.blocks) : (a.blocks ?? [])
}

export function thumbOf(a: Article): Thumb | undefined {
  const figure = blocksOf(a).find((b): b is Extract<Block, { t: 'figure' }> => b.t === 'figure')
  return figure ? { src: figure.src, svg: figure.src.endsWith('.svg') } : undefined
}

const levelRank: Record<string, number> = { newbie: 0, 'cơ bản': 0, mid: 1, 'nâng cao': 1, pro: 2 }

const articleItem = (a: Article): IndexItem => ({ href: `/blog/${a.id}`, title: a.title, read: a.read, image: thumbOf(a) })

/** Left column of /blog: pinned articles (`highlight`, by `pinned`), then articles and posts grouped by level (Căn bản, Nâng cao, Chuyên nghiệp), then learning paths (drafts only outside production). A pinned article is not repeated in its level group. */
export function blogIndex(): { group: string; items: IndexItem[] }[] {
  const pinned = list().filter((a) => a.pinned !== undefined).sort((a, b) => (a.pinned ?? 0) - (b.pinned ?? 0))
  const pinnedIds = new Set(pinned.map((a) => a.id))
  const ranked = [
    ...list().filter((a) => !pinnedIds.has(a.id)).map((a) => ({ level: a.level as string, item: articleItem(a) })),
    ...posts().map((p) => ({ level: p.level as string, item: { href: `/blog/${p.slug}`, title: p.title } })),
  ].sort((a, b) => a.item.title.localeCompare(b.item.title, 'vi'))
  const levelOf = (l: string) => (['newbie', 'mid', 'pro'] as const)[levelRank[l] ?? 0]
  return [
    { group: 'highlight', items: pinned.map(articleItem) },
    ...(['newbie', 'mid', 'pro'] as const).map((group) => ({ group, items: ranked.filter((r) => levelOf(r.level) === group).map((r) => r.item) })),
    { group: 'lo-trinh', items: learningPaths().filter(isPublished).map((p) => ({ href: `/blog/lo-trinh/${p.slug}`, title: p.title, steps: p.steps.length })) },
  ].filter((g) => g.items.length > 0)
}
