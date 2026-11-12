import { test } from 'node:test'
import assert from 'node:assert/strict'
import { browseAppOf, parseIndexView, readIndexView, setIndexView } from '../lib/indexView.ts'

test('browseAppOf: /blog, /wiki và trang con là app tương ứng, các đường khác là null', () => {
  assert.equal(browseAppOf('/blog'), 'blog')
  assert.equal(browseAppOf('/blog/kien-thuc'), 'blog')
  assert.equal(browseAppOf('/wiki'), 'wiki')
  assert.equal(browseAppOf('/wiki/a7c-ii/some-lens'), 'wiki')
  assert.equal(browseAppOf('/blogs'), null)
  assert.equal(browseAppOf('/wikipedia'), null)
  assert.equal(browseAppOf('/blog-x/y'), null)
  assert.equal(browseAppOf('/'), null)
  assert.equal(browseAppOf('/colors'), null)
  assert.equal(browseAppOf('/console'), null)
  assert.equal(browseAppOf(''), null)
})

test('parseIndexView: chỉ "list" là danh sách, mọi giá trị khác là lưới', () => {
  assert.equal(parseIndexView('list'), 'list')
  assert.equal(parseIndexView('grid'), 'grid')
  assert.equal(parseIndexView(null), 'grid')
  assert.equal(parseIndexView(undefined), 'grid')
  assert.equal(parseIndexView(''), 'grid')
  assert.equal(parseIndexView('LIST'), 'grid')
  assert.equal(parseIndexView('{"view":"list"}'), 'grid')
})

test('readIndexView: khóa riêng của app thắng, thiếu thì lấy khóa chung cũ, mặc định là lưới', () => {
  const read = (data: Record<string, string>, app: 'blog' | 'wiki') => readIndexView(app, (k) => data[k] ?? null)
  assert.equal(read({}, 'blog'), 'grid')
  assert.equal(read({}, 'wiki'), 'grid')
  // Người đã chọn Danh sách trước khi có núm riêng: giữ cho cả hai app
  assert.equal(read({ 'index-view': 'list' }, 'blog'), 'list')
  assert.equal(read({ 'index-view': 'list' }, 'wiki'), 'list')
  // Khóa riêng có mặt thì thắng khóa chung
  assert.equal(read({ 'index-view': 'list', 'index-view-blog': 'grid' }, 'blog'), 'grid')
  assert.equal(read({ 'index-view': 'list', 'index-view-blog': 'grid' }, 'wiki'), 'list')
  assert.equal(read({ 'index-view': 'grid', 'index-view-wiki': 'list' }, 'wiki'), 'list')
  // Khóa riêng có mặt nhưng lạ (rỗng) là lưới, không rơi về khóa chung
  assert.equal(read({ 'index-view': 'list', 'index-view-wiki': '' }, 'wiki'), 'grid')
})

test('setIndexView: chỉ ghi khóa của app đó và báo đổi; không có window thì không làm gì', () => {
  const g = globalThis as Record<string, unknown>
  const hadWindow = 'window' in g
  const hadStorage = 'localStorage' in g

  // Không có window (chạy trên server): không ném lỗi, không ghi gì
  setIndexView('blog', 'grid')

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
    setIndexView('blog', 'grid')
    assert.equal(store.get('index-view-blog'), 'grid')
    assert.equal(store.has('index-view'), false)
    assert.deepEqual(events, ['index-view-change'])
    setIndexView('wiki', 'list')
    assert.equal(store.get('index-view-wiki'), 'list')
    assert.equal(store.get('index-view-blog'), 'grid')
    assert.equal(store.has('index-view'), false)
    assert.deepEqual(events, ['index-view-change', 'index-view-change'])
  } finally {
    if (hadWindow) g.window = undefined
    else delete g.window
    if (hadStorage) g.localStorage = undefined
    else delete g.localStorage
  }
})
