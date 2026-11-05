import { describe, expect, it } from 'vitest'
import { ARTICLES } from '@/lib/lab/articles'
import { articleDoc } from './documents'

describe('wikilinks in article body', () => {
  it('body search không mang ngoặc wikilink', () => {
    const doc = articleDoc({ ...ARTICLES[0], blocks: [...ARTICLES[0].blocks, { t: 'p', text: 'Có [[ISO]] ở đây' }] })
    expect(doc.body).toContain('Có ISO ở đây')
    expect(doc.body).not.toContain('[[')
  })
})
