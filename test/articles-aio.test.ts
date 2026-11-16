// Every published article passes the AIO/SEO and house-style checks of scripts/article-check.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import articles from '../data/articles.json' with { type: 'json' }
import { checkArticle } from '../scripts/article-check.ts'

test('every article passes article-check', () => {
  for (const a of articles) assert.deepEqual(checkArticle(a), [], a.id)
})

test('khối set chỉ trỏ tới bộ công khai', () => {
  const withSet = (id: string) => ({ ...articles[0], blocks: [{ t: 'set', id }, ...articles[0].blocks] })
  const setProblems = (id: string) => checkArticle(withSet(id)).filter((p) => p.startsWith('khối set'))
  assert.deepEqual(setProblems('zv-e10-hybrid'), [])
  assert.deepEqual(setProblems('shoot-easy'), ['khối set: không có bộ "shoot-easy" trong danh sách công khai'])
  assert.deepEqual(setProblems('khong-co'), ['khối set: không có bộ "khong-co" trong danh sách công khai'])
})

test('nhãn mục lục (toc) của mục h: không rỗng, tối đa 28 ký tự, không kết thúc bằng dấu câu', () => {
  const withToc = (toc: unknown) => ({ ...articles[0], blocks: [...articles[0].blocks, { t: 'h', text: 'Mục thử', toc }, { t: 'p', text: 'Đoạn thử.' }] })
  const tocProblems = (toc: unknown) => checkArticle(withToc(toc)).filter((p) => p.includes('nhãn mục lục'))
  assert.deepEqual(tocProblems('Chọn khẩu độ'), [])
  assert.deepEqual(tocProblems('a'.repeat(28)), [])
  assert.deepEqual(tocProblems('a'.repeat(29)), [`nhãn mục lục dài quá 28 ký tự: "${'a'.repeat(29)}"`])
  assert.deepEqual(tocProblems('Đèn flash có cần không?'), ['nhãn mục lục không được kết thúc bằng . ? : !: "Đèn flash có cần không?"'])
  assert.deepEqual(tocProblems(' Chọn khẩu độ'), ['nhãn mục lục rỗng hoặc thừa khoảng trắng: " Chọn khẩu độ"'])
  assert.deepEqual(tocProblems(''), ['nhãn mục lục rỗng hoặc thừa khoảng trắng: ""'])
  assert.deepEqual(tocProblems(42), ['nhãn mục lục rỗng hoặc thừa khoảng trắng: "42"'])
  assert.ok(checkArticle(withToc('Creative Look')).some((p) => p.startsWith('có Creative')))
})
