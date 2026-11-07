import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import recipesSeed from '../../../../data/recipes.seed.json'
import camerasSeed from '../../../../data/sony-cameras.seed.json'
import notesSeed from '../../../../data/alphaskill-knowledge.seed.json'
import { ARTICLES } from '../articles'
import { PILOT_DRAFTS } from '../pilot-drafts'
import { RESERVED_IDS } from '../parse'
import type { Article, Block } from '../types'
import type { AlphaNote } from '@/lib/alphaskill/parse'
import { PACK_LICENCES, PACK_NAME_RE, packProblems, type Known, type PackImage } from './check'
import { PACKS } from './index'

/**
 * A pack is pages the blog-content skill wrote from an owner's document,
 * waiting to be pushed as drafts (`push:lab --pack <name>`). The gate is
 * stricter than a draft needs on purpose: a pack page must already pass the
 * publish rules, link only to things that exist, and cite a dated source, so
 * the owner's review is about the writing, not about broken plumbing.
 */
const ids = (rows: readonly { id: string }[]) => new Set(rows.map((r) => r.id))
const pages = (except?: string) => [
  ...ARTICLES,
  ...PILOT_DRAFTS,
  ...Object.entries(PACKS).flatMap(([n, p]) => (n === except ? [] : p)),
]

/* Packs that exist to replace existing articles via `push:lab --replace`.
   Their ids overlap ARTICLES on purpose; takenIds must exclude ids from these
   packs' own pages. */
const REPLACE_PACKS = new Set(['thay-bai-live-2026-11'])

const NOTES = notesSeed as AlphaNote[]
const IMAGES_DIR = (pack: string) => join(__dirname, `${pack}.images`)

/** Mọi figure có file trong `<pack>.images/<pageId>/manifest.json`. */
function packImages(pack: string, packPages: readonly Article[]): Set<string> {
  const out = new Set<string>()
  for (const page of packPages) {
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
    takenIds: new Set([...ids(REPLACE_PACKS.has(pack) ? pages(pack).filter((p) => !ARTICLES.some((a) => a.id === p.id)) : pages(pack)), ...RESERVED_IDS]),
    refIds: {
      recipe: ids(recipesSeed as { id: string }[]),
      product: new Set([...ids(camerasSeed as { id: string }[])]),
      article: ids(all.filter((a) => a.kind === 'article')),
      knowledge: new Set([...ids(all.filter((a) => a.kind === 'knowledge')), ...NOTES.map((n) => n.slug)]),
    },
    notes: NOTES,
    images: packImages(pack, PACKS[pack] ?? extra),
  }
}

describe('every pack', () => {
  /* Always one case, so the block is not empty while PACKS is (vitest fails an
     empty suite), and a pack listed under a name push:lab --pack cannot take
     fails here rather than at the command line. */
  it('is listed under a slug', () => {
    for (const name of Object.keys(PACKS)) expect(name).toMatch(PACK_NAME_RE)
  })

  for (const [name, pack] of Object.entries(PACKS)) {
    it(`${name} is ready to push`, () => {
      expect(packProblems(name, pack, knownFor(name))).toEqual([])
    })
  }
})

describe('pack images', () => {
  it('manifest.json entries have valid licence, source URL, files and block references', () => {
    for (const [pack, packPages] of Object.entries(PACKS)) {
      for (const page of packPages) {
        const file = join(IMAGES_DIR(pack), page.id, 'manifest.json')
        if (!existsSync(file)) continue
        const manifest = JSON.parse(readFileSync(file, 'utf8')) as PackImage[]
        for (const m of manifest) {
          expect(PACK_LICENCES).toContain(m.licence)
          expect(m.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//)
          expect(existsSync(join(IMAGES_DIR(pack), page.id, m.file))).toBe(true)
          const block = page.blocks[m.blockIndex]
          expect(block?.t).toBe('figure')
        }
      }
    }
  })
})

/* The probes: one good page, and one way to break each rule. The base is a
   live article (it passes the publish rules today) under a fresh id, with a
   dated source added. */
const source = { url: 'https://helpguide.sony.net/', title: 'Help Guide', publisher: 'Sony', checkedAt: '2026-10-28' }
const good: Article = { ...ARTICLES[0], id: 'probe-page', meta: { ...ARTICLES[0].meta, sources: [source] } }
const check = (p: readonly Article[]) => packProblems('probe', p, knownFor('probe', p))

describe('packProblems', () => {
  it('cho related trỏ tới note alphaskill', () => {
    const p = { ...good, meta: { ...good.meta, related: [{ kind: 'knowledge' as const, id: 'toc-do-man-trap' }] } }
    expect(check([p])).toEqual([])
  })
  it('đòi mỗi wikilink resolve và có trong related', () => {
    const blocks = [...good.blocks]
    blocks[1] = { t: 'p' as const, text: 'Xem [[Tốc độ màn trập]] và [[Không có]].' }
    const p = { ...good, blocks }
    expect(check([p])).toContain('probe-page: unknownWikilink Không có')
    expect(check([p])).toContain('probe-page: wikilinkNotRelated toc-do-man-trap')
  })
  it('không cho wikilink ngoài p/callout', () => {
    const blocks = [...good.blocks]
    blocks[2] = { t: 'h' as const, text: 'Về [[ISO]]' }
    expect(check([{ ...good, blocks }])).toContain('probe-page: wikilinkOutsideProse')
  })
  it('figure có ảnh sidecar thì qua, không có thì figureNeedsUpload', () => {
    const blocks = [...good.blocks, { t: 'figure' as const, caption: 'Ảnh: A · CC BY 4.0 · Wikimedia Commons' } as unknown as Block]
    const withFig = { ...good, blocks }
    expect(check([withFig])).toContain('probe-page: figureNeedsUpload')
    const known = { ...knownFor('probe', [withFig]), images: new Set([`probe-page#${blocks.length - 1}`]) }
    expect(packProblems('probe', [withFig], known)).toEqual([])
  })

  it('passes a page that meets every rule', () => {
    expect(check([good])).toEqual([])
  })

  it('refuses a pack name that is not a slug', () => {
    expect(packProblems('Bad Name', [good], knownFor('Bad Name', [good]))).toContain('packName')
  })

  it('carries the publish rules, prefixed with the page id', () => {
    expect(check([{ ...good, dek: '' }])).toContain('probe-page: emptyDek')
  })

  it('refuses a duplicate id within the pack and an id already taken', () => {
    expect(check([good, good])).toContain('probe-page: duplicateId')
    expect(check([{ ...good, id: ARTICLES[1].id }])).toContain(`${ARTICLES[1].id}: idTaken`)
  })

  it('refuses a reference to something that does not exist', () => {
    const bad = { ...good, meta: { ...good.meta, related: [{ kind: 'recipe' as const, id: 'PP-999' }] } }
    expect(check([bad])).toContain('probe-page: unknownRef recipe:PP-999')
    const pre = { ...good, meta: { ...good.meta, prerequisites: ['khong-co-trang-nay'] } }
    expect(check([pre])).toContain('probe-page: unknownPrerequisite khong-co-trang-nay')
  })

  it('lets a page name another page of the same pack', () => {
    const pillar: Article = { ...good, id: 'probe-pillar' }
    const cluster: Article = { ...good, meta: { ...good.meta, prerequisites: ['probe-pillar'] } }
    expect(check([pillar, cluster])).toEqual([])
  })

  it('wants at least one source, each dated', () => {
    expect(check([{ ...good, meta: { ...good.meta, sources: [] } }])).toContain('probe-page: noSource')
    const undated = { ...good, meta: { ...good.meta, sources: [{ ...source, checkedAt: undefined }] } }
    expect(check([undated])).toContain('probe-page: sourceNeedsDate')
  })
})
