import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseIndexView, setIndexView } from '../lib/indexView.ts'

test('parseIndexView: chỉ "list" là danh sách, mọi giá trị khác là lưới', () => {
  assert.equal(parseIndexView('list'), 'list')
  assert.equal(parseIndexView('grid'), 'grid')
  assert.equal(parseIndexView(null), 'grid')
  assert.equal(parseIndexView(undefined), 'grid')
  assert.equal(parseIndexView(''), 'grid')
  assert.equal(parseIndexView('LIST'), 'grid')
  assert.equal(parseIndexView('{"view":"list"}'), 'grid')
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
