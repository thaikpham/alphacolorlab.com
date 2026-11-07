import { describe, expect, it } from 'vitest'
import { PP_MENU_ITEMS } from '@/lib/camera/constants'
import { PP_EXPLANATIONS, WB_EXPLANATIONS } from '@/lib/camera/explanations'
import { CONCEPTS, conceptTitle, conceptsForRecipe } from './concepts'

describe('the concept vocabulary', () => {
  it('names every explained parameter, and nothing else', () => {
    const expected = [
      'wb',
      ...Object.keys(WB_EXPLANATIONS).map((k) => `wb.${k}`),
      'pp',
      ...Object.keys(PP_EXPLANATIONS).map((k) => `pp.${k}`),
    ]
    expect(CONCEPTS.map((c) => c.key)).toEqual(expected)
  })

  it('labels Picture Profile concepts with the menu items Sony prints', () => {
    for (const c of CONCEPTS.filter((c) => c.group === 'pp' && c.key !== 'pp')) {
      expect(PP_MENU_ITEMS).toContain(c.label)
    }
  })

  it('composes a readable title', () => {
    expect(conceptTitle('pp.colorDepth')).toBe('Picture Profile · Color Depth')
    expect(conceptTitle('wb')).toBe('White Balance')
  })

  it('Picture Profile concepts include White Balance parameters', () => {
    const pp = conceptsForRecipe('pp')
    expect(pp).toContain('wb.shiftAb')
    expect(pp).toContain('pp.colorDepth')
  })
})
