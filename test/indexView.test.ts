import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseIndexView, setIndexView } from '../lib/indexView.ts'

test('parseIndexView: chỉ "grid" là lưới, mọi giá trị khác là danh sách', () => {
  assert.equal(parseIndexView('grid'), 'grid')
  assert.equal(parseIndexView('list'), 'list')
  assert.equal(parseIndexView(null), 'list')
  assert.equal(parseIndexView(undefined), 'list')
  assert.equal(parseIndexView(''), 'list')
  assert.equal(parseIndexView('GRID'), 'list')
  assert.equal(parseIndexView('{"view":"grid"}'), 'list')
})

test('setIndexView: ghi localStorage và báo đổi; không có window thì không làm gì', () => {
  const g = globalThis as Record<string, unknown>
  const hadWindow = 'window' in g
  const hadStorage = 'localStorage' in g

  // Không có window (chạy trên server): không ném lỗi, không ghi gì
  setIndexView('grid')

  const store = new Map<string, string>()
  const events: string[] = []
  g.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  }
  g.window = {
    dispatchEvent: (e: Event) => void events.push(e.type),
    addEventListener() {},
    removeEventListener() {},
  }
  try {
    setIndexView('grid')
    assert.equal(store.get('index-view'), 'grid')
    assert.deepEqual(events, ['index-view-change'])
    setIndexView('list')
    assert.equal(store.get('index-view'), 'list')
  } finally {
    if (hadWindow) g.window = undefined
    else delete g.window
    if (hadStorage) g.localStorage = undefined
    else delete g.localStorage
  }
})
