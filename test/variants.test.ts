// The menu article's variants: which body is the default, what a variant selects, and what the shared helpers read.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allBlocks, blocksOf, byId, list, thumbOf } from '../lib/blog.ts'

const menu = byId('menu-may-anh-toi-uu-nguoi-moi')!
const [legacy, newGen] = menu.variants!

test('bài menu có hai bản: Legacy (mặc định) rồi New-gen', () => {
  assert.deepEqual(menu.variants!.map((v) => [v.id, v.models]), [['legacy', ['zve10', 'a6400']], ['new-gen', ['a7c2']]])
  assert.equal(menu.blocks, undefined)
})

test('blocksOf: không truyền bản thì lấy bản đầu, bản lạ cũng về bản đầu', () => {
  assert.equal(blocksOf(menu), legacy.blocks)
  assert.equal(blocksOf(menu, 'new-gen'), newGen.blocks)
  assert.equal(blocksOf(menu, 'khong-co'), legacy.blocks)
})

test('allBlocks gộp mọi bản; bài một bản trả đúng blocks của bài', () => {
  assert.equal(allBlocks(menu).length, legacy.blocks.length + newGen.blocks.length)
  const plain = list().find((a) => a.blocks !== undefined)!
  assert.equal(allBlocks(plain), plain.blocks)
})

test('ảnh đại diện lấy từ bản mặc định', () => {
  const figure = legacy.blocks.find((b) => b.t === 'figure')
  assert.ok(figure && figure.t === 'figure')
  assert.equal(thumbOf(menu)?.src, figure.src)
})

test('dữ liệu không còn link tới hai slug cũ', () => {
  const json = JSON.stringify(list())
  assert.ok(!json.includes('menu-may-anh-toi-uu-nguoi-moi-legacy-menu'))
  assert.ok(!json.includes('menu-may-anh-toi-uu-nguoi-moi-new-gen-menu'))
})
