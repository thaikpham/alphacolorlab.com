import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addBank, bankEntries, editBank, freeBankNumbers, removeBank } from '../lib/ppBanks.ts'

const PP = { sharpness: 3 } as Record<string, any>
const PP2 = { sharpness: 5 } as Record<string, any>

test('freeBankNumbers: đủ PP2–PP10 khi chưa có bank, bỏ số đã dùng', () => {
  assert.deepEqual(freeBankNumbers({}), [2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepEqual(freeBankNumbers({ ppBanks: { 2: PP, 5: PP2 } }), [3, 4, 6, 7, 8, 9, 10])
  const full = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 2, PP]))
  assert.deepEqual(freeBankNumbers({ ppBanks: full }), [])
})

test('bankEntries: theo số tăng dần, recipeId là undefined khi bank tự chỉnh', () => {
  const s = { ppBanks: { 7: PP2, 2: PP }, bankIds: { 2: 'warm' } }
  assert.deepEqual(bankEntries(s), [
    { k: 2, pp: PP, recipeId: 'warm' },
    { k: 7, pp: PP2, recipeId: undefined },
  ])
  assert.deepEqual(bankEntries({}), [])
})

test('addBank: thêm bank với id công thức, giữ bank cũ, không sửa đầu vào', () => {
  const start = {}
  const once = addBank(start, 2, PP, 'warm')
  assert.deepEqual(once, { ppBanks: { 2: PP }, bankIds: { 2: 'warm' } })
  assert.deepEqual(start, {})
  const twice = addBank(once, 4, PP2, 'cool')
  assert.deepEqual(twice, { ppBanks: { 2: PP, 4: PP2 }, bankIds: { 2: 'warm', 4: 'cool' } })
  assert.deepEqual(once, { ppBanks: { 2: PP }, bankIds: { 2: 'warm' } })
})

test('addBank: số ngoài 2–10 hoặc đã có bank thì giữ nguyên ô', () => {
  const s = { ppBanks: { 2: PP }, bankIds: { 2: 'warm' } }
  assert.equal(addBank(s, 1, PP2, 'cool'), s)
  assert.equal(addBank(s, 11, PP2, 'cool'), s)
  assert.equal(addBank(s, 2.5, PP2, 'cool'), s)
  assert.equal(addBank(s, 2, PP2, 'cool'), s)
})

test('removeBank: bỏ cả bộ thông số và id; hết bank thì không còn khóa ppBanks, bankIds', () => {
  const s = { ppBanks: { 2: PP, 3: PP2 }, bankIds: { 2: 'warm', 3: 'cool' } }
  assert.deepEqual(removeBank(s, 2), { ppBanks: { 3: PP2 }, bankIds: { 3: 'cool' } })
  const last = removeBank(removeBank(s, 2), 3)
  assert.equal('ppBanks' in last, false)
  assert.equal('bankIds' in last, false)
  assert.equal(removeBank(s, 9), s)
})

test('editBank: sửa tay thì bỏ id công thức của bank đó, bank khác giữ nguyên', () => {
  const s = { ppBanks: { 2: PP, 3: PP2 }, bankIds: { 2: 'warm', 3: 'cool' } }
  assert.deepEqual(editBank(s, 2, PP2), { ppBanks: { 2: PP2, 3: PP2 }, bankIds: { 3: 'cool' } })
  assert.deepEqual(s.bankIds, { 2: 'warm', 3: 'cool' })
  assert.equal(editBank({}, 2, PP2).ppBanks, undefined)
})

test('editBank: bank chỉ có bộ thông số (không có id) thì sửa xong vẫn không có bankIds', () => {
  const s = { ppBanks: { 4: PP } }
  const out = editBank(s, 4, PP2)
  assert.deepEqual(out, { ppBanks: { 4: PP2 } })
  assert.equal('bankIds' in out, false)
})
