import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toSlug } from '../lib/slug.ts'

test('toSlug: bỏ dấu, chữ thường, khoảng trắng và ký tự lạ thành "-"', () => {
  assert.equal(toSlug('Bộ Cưới Đẹp', 40), 'bo-cuoi-dep')
  assert.equal(toSlug('Chân dung 2026!', 40), 'chan-dung-2026-')
  assert.equal(toSlug('Ánh sáng  mềm', 40), 'anh-sang-mem')
  assert.equal(toSlug('Đà Nẵng', 40), 'da-nang')
})

test('toSlug: giữ được số, không bỏ chữ số như \\D+ cũ', () => {
  assert.equal(toSlug('bo 4 o', 40), 'bo-4-o')
  assert.equal(toSlug('m1-m4', 40), 'm1-m4')
})

test('toSlug: cắt theo max và không cắt dấu gạch đầu cuối', () => {
  assert.equal(toSlug('abcdef', 3), 'abc')
  assert.equal(toSlug('ab cd', 40), 'ab-cd')
  assert.equal(toSlug(' ', 40), '-')
})

test('toSlug: chữ cái Latin khác trong bảng mã không lọt vào kết quả', () => {
  // Chữ "о" Cyrillic (U+043E) trông như "o" nhưng không phải a–z: phải thành "-"
  assert.equal(toSlug('bо moi', 40), 'b-moi')
})
