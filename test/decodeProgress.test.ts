import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { decodeProgress } from '../lib/decodeProgress.ts'
import { modelSummary } from '../lib/decode/matrix.ts'
import { cameraModels, sonyBodies } from '../app/content.ts'

test('decodeProgress: ZV-E10 decoded, A7C II decoding below 100%, others none', () => {
  const z = decodeProgress('zve10')
  assert.equal(z.state, 'decoded')
  assert.ok(z.done > 0 && z.percent === Math.round((100 * z.done) / z.total))
  assert.equal(z.done, modelSummary('zve10').confirmed)
  assert.equal(z.total, modelSummary('zve10').values)
  const a = decodeProgress('a7c2')
  assert.equal(a.state, 'decoding')
  assert.ok(a.percent > 0 && a.percent < 100 && a.done <= a.total)
  assert.deepEqual(decodeProgress('unknown-body'), { state: 'none', percent: 0, done: 0, total: 0 })
})

test('decodeProgress: A7C II counts confirmed values of modelSummary, capped at 99', () => {
  const s = modelSummary('a7c2')
  const a = decodeProgress('a7c2')
  assert.equal(a.done, s.confirmed)
  assert.equal(a.total, s.values)
  assert.equal(a.percent, Math.min(99, Math.round((100 * s.confirmed) / s.values)))
})

test('data/decode-summary.json khớp modelSummary cho a7c2 và a6400 (chạy npm run decode:scan nếu lệch)', () => {
  const committed = JSON.parse(readFileSync(new URL('../data/decode-summary.json', import.meta.url), 'utf8')) as {
    models: Record<string, { values: number; confirmed: number }>
  }
  for (const id of ['a7c2', 'a6400'] as const) {
    const s = modelSummary(id)
    assert.equal(committed.models[id].values, s.values, id)
    assert.equal(committed.models[id].confirmed, s.confirmed, id)
  }
})

test('decodeProgress: A6400 is read-only experimental, never decoded', () => {
  const x = decodeProgress('a6400')
  assert.equal(x.state, 'decoding')
  assert.equal(x.done, modelSummary('a6400').confirmed)
  assert.equal(x.total, modelSummary('a6400').values)
  assert.ok(x.percent < 100 && x.done <= x.total)
})

test('decodeProgress: "decoded" agrees with the decoded flag in sonyBodies', () => {
  for (const b of sonyBodies) assert.equal(decodeProgress(b.id).state === 'decoded', Boolean(b.decoded), b.name)
  for (const m of cameraModels) assert.ok(decodeProgress(m.id).percent >= 0, m.id)
})

test('showDecodeStatus: tắt khi NODE_ENV=production, bật khi npm run dev', () => {
  const href = new URL('../lib/decodeProgress.ts', import.meta.url).href
  const run = (nodeEnv: 'production' | 'development') =>
    spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--no-warnings', '--input-type=module', '-e', `console.log(String((await import(${JSON.stringify(href)})).showDecodeStatus))`],
      { env: { ...process.env, NODE_ENV: nodeEnv }, encoding: 'utf8' },
    ).stdout.trim()
  assert.equal(run('production'), 'false')
  assert.equal(run('development'), 'true')
})
