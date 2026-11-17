import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activeIndex, nearOf } from '../lib/tocSpy.ts'

test('activeIndex: chưa có đề mục nào qua vạch thì -1', () => {
  assert.equal(activeIndex([120, 300, 500], 100), -1)
  assert.equal(activeIndex([], 100), -1)
})

test('activeIndex: đúng bằng vạch thì tính là đã qua', () => {
  assert.equal(activeIndex([100, 300], 100), 0)
})

test('activeIndex: nhiều đề mục đã qua thì lấy cái cuối cùng', () => {
  assert.equal(activeIndex([10, 40, 90, 400], 100), 2)
  assert.equal(activeIndex([10, 40, 90, 400], 1000), 3)
})

test('activeIndex: đề mục thiếu (Infinity) không bao giờ là đang đọc', () => {
  assert.equal(activeIndex([Infinity, 50, Infinity], 100), 1)
  assert.equal(activeIndex([Infinity, Infinity], 100), -1)
})

test('nearOf: không có dòng đang đọc thì mọi dòng ở mức 3', () => {
  assert.equal(nearOf(0, -1), 3)
  assert.equal(nearOf(5, -1), 3)
})

test('nearOf: dòng đang đọc là 0, hai dòng cạnh là 1 và 2, còn lại dừng ở 3', () => {
  assert.equal(nearOf(4, 4), 0)
  assert.equal(nearOf(3, 4), 1)
  assert.equal(nearOf(5, 4), 1)
  assert.equal(nearOf(2, 4), 2)
  assert.equal(nearOf(6, 4), 2)
  assert.equal(nearOf(0, 4), 3)
  assert.equal(nearOf(13, 4), 3)
})
