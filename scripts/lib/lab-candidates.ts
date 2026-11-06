import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ARTICLES } from '../../src/lib/lab/articles'
import { PACKS } from '../../src/lib/lab/packs'
import { PILOT_DRAFTS } from '../../src/lib/lab/pilot-drafts'
import type { Article } from '../../src/lib/lab/types'
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

/**
 * What `push:lab` may insert. The three live articles go in published (a draft
 * would take them off the site); pilot drafts and a pack's pages go in as
 * drafts, always — the owner publishes each from its own editor.
 */
export function labCandidates(
  opts: { withPilotDrafts: boolean; pack?: string },
  packs: Readonly<Record<string, readonly Article[]>> = PACKS,
  manifests: PackManifests = opts.pack ? { [opts.pack]: readManifests(opts.pack) } : {},
): LabCandidate[] {
  const out: LabCandidate[] = ARTICLES.map((article) => ({ article, status: 'published', images: [] }))
  if (opts.withPilotDrafts) out.push(...PILOT_DRAFTS.map((article) => ({ article, status: 'draft' as const, images: [] })))
  if (opts.pack !== undefined) {
    const pack = packs[opts.pack]
    if (!pack) {
      throw new Error(`Unknown pack "${opts.pack}". Packs: ${Object.keys(packs).join(', ') || '(none yet)'}`)
    }
    const byPage = manifests[opts.pack] ?? {}
    /* Một id vừa là bài mẫu vừa có trong pack: pack là bản mới, bài mẫu bỏ —
       nếu không, script ghi bài mẫu rồi ghi đè ngay bằng pack và in mỗi bài hai dòng. */
    const packIds = new Set(pack.map((a) => a.id))
    for (let i = out.length - 1; i >= 0; i -= 1) if (packIds.has(out[i]!.article.id)) out.splice(i, 1)
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
