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
