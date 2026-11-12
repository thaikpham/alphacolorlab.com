import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sections, cameraModels, sonyBodies, consoleHashRoutes } from '../app/content.ts'

const routes = new Set([...sections.map((s) => `/cai-tay/${s.id}`), '/cai-tay/tom-tat', '/tao-m1-m4', '/console'])

test('old one-page hashes land on a console route', () => {
  for (const h of [...sections.map((s) => s.id), 'tom-tat', 'huong-dan', 'tao-preset', 'choi-game']) {
    assert.ok(routes.has(consoleHashRoutes[h]), `#${h} → ${consoleHashRoutes[h]}`)
  }
  assert.equal(consoleHashRoutes['may-cua-ban'], undefined, '#may-cua-ban stays on /')
})

test('every guided camera has a Product Wiki page to link from (/?model=<id>)', () => {
  const codes = new Set((JSON.parse(readFileSync('data/products.json', 'utf8')) as { code: string }[]).map((p) => p.code))
  for (const m of cameraModels) {
    const body = sonyBodies.find((b) => b.id === m.id)
    assert.ok(body && codes.has(body.code), `${m.id} → ${body?.code}`)
  }
})
