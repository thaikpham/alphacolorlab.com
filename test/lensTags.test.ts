import { test } from 'node:test'
import assert from 'node:assert/strict'
import products from '../data/products.json' with { type: 'json' }
import { lensTags } from '../lib/lensTags.ts'
import { wiki } from '../app/content.ts'

const tags = (code: string) => lensTags(products.find((p) => p.code === code)!)
const has = (code: string, ...t: string[]) => for_(code, t, true)
const not = (code: string, ...t: string[]) => for_(code, t, false)
function for_(code: string, t: string[], want: boolean) {
  const got = tags(code)
  for (const x of t) assert.equal(got.includes(x), want, `${code} ${want ? 'should' : 'should not'} have ${x}: ${got.join(' ')}`)
}

test('lensTags: format, type and series', () => {
  has('SEL2470GM2', 'ff', 'zoom', 'GM')
  has('SEL35F18', 'apsc', 'prime', 'standard')
})

test('lensTags: the owner\'s focal ranges, APS-C by full-frame equivalent', () => {
  has('SEL2470GM2', 'street', 'daily', 'portrait-half') // 24–70
  not('SEL2470GM2', 'wide', 'portrait-close', 'tele')
  has('SEL35F18', 'portrait-half') // APS-C 35mm ≈ 52.5mm
  not('SEL35F18', 'street', 'daily')
  has('SEL85F14GM2', 'portrait-half', 'portrait-close') // 85 sits on the boundary
  has('SEL14F18GM', 'wide', 'astro')
  has('SEL600F40GM', 'tele')
  has('SELP1650', 'street', 'daily', 'portrait-half', 'vlog') // kit 16–50 on APS-C ≈ 24–75
})

test('lensTags: other uses', () => {
  has('SEL90M28G', 'macro', 'oss')
  has('SELP18105G', 'video', 'travel', 'oss')
  has('SEL50F18F', 'low-light', 'light')
  not('SEL600F40GM', 'light', 'vlog', 'low-light')
})

test('lensTags: every chip in the filter matches at least one lens, and every lens tag has a chip', () => {
  const chips = new Set(wiki.product.lensFilter.groups.flatMap((g) => g.chips.map(([id]) => id)))
  const used = new Set(products.filter((p) => p.kind === 'lens').flatMap((p) => lensTags(p)))
  for (const c of chips) assert.ok(used.has(c), `chip ${c} matches no lens`)
  for (const t of used) assert.ok(chips.has(t), `tag ${t} has no chip`)
})

test('matchLenses: OR inside an "any" group, AND across groups and inside an "all" group', async () => {
  const { matchLenses } = await import('../lib/lensTags.ts')
  const groups = wiki.product.lensFilter.groups
  const lenses = products.filter((p) => p.kind === 'lens').map((p) => ({ code: p.code, tags: lensTags(p) }))
  const codes = (...on: string[]) => matchLenses(lenses, new Set(on), groups).map((l) => l.code)
  assert.equal(codes().length, lenses.length)
  assert.ok(codes('apsc', 'portrait-half').includes('SEL35F18'))
  assert.ok(!codes('ff', 'portrait-half').includes('SEL35F18'))
  assert.ok(codes('wide', 'tele').length > codes('wide').length) // OR inside the focal group
  for (const c of codes('low-light', 'light')) assert.ok(codes('low-light').includes(c) && codes('light').includes(c)) // AND inside "use"
})
