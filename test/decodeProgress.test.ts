import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeProgress } from '../lib/decodeProgress.ts'
import { A6400_FIELDS } from '../lib/a6400/dat.ts'
import { cameraModels, sonyBodies } from '../app/content.ts'

test('decodeProgress: ZV-E10 decoded, A7C II decoding below 100%, others none', () => {
  const z = decodeProgress('zve10')
  assert.equal(z.state, 'decoded')
  assert.ok(z.done > 0 && z.percent === Math.round((100 * z.done) / z.total))
  const a = decodeProgress('a7c2')
  assert.equal(a.state, 'decoding')
  assert.ok(a.percent > 0 && a.percent < 100 && a.done <= a.total)
  assert.deepEqual(decodeProgress('unknown-body'), { state: 'none', percent: 0, done: 0, total: 0 })
})

test('decodeProgress: A6400 is read-only experimental, never decoded', () => {
  const x = decodeProgress('a6400')
  assert.equal(x.state, 'decoding')
  assert.equal(x.total, decodeProgress('zve10').total)
  assert.equal(x.done, A6400_FIELDS.filter((f) => f.observed.length > 0).length)
  assert.ok(x.percent < 100 && x.done <= x.total)
})

test('decodeProgress: "decoded" agrees with the decoded flag in sonyBodies', () => {
  for (const b of sonyBodies) assert.equal(decodeProgress(b.id).state === 'decoded', Boolean(b.decoded), b.name)
  for (const m of cameraModels) assert.ok(decodeProgress(m.id).percent >= 0, m.id)
})
