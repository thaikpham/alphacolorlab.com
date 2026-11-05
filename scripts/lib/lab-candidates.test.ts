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
