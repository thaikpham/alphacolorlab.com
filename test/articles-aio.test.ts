// Every published article passes the AIO/SEO and house-style checks of scripts/article-check.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import articles from '../data/articles.json' with { type: 'json' }
import { checkArticle } from '../scripts/article-check.ts'
import { blocksOf, type Article } from '../lib/blog.ts'

const base = blocksOf(articles[0] as Article)
const menu: any = articles.find((a) => a.id === 'menu-may-anh-toi-uu-nguoi-moi')

test('every article passes article-check', () => {
  for (const a of articles) assert.deepEqual(checkArticle(a), [], a.id)
})

test('khối set chỉ trỏ tới bộ công khai', () => {
  const withSet = (id: string) => ({ ...articles[0], blocks: [{ t: 'set', id }, ...base] })
  const setProblems = (id: string) => checkArticle(withSet(id)).filter((p) => p.startsWith('khối set'))
  assert.deepEqual(setProblems('zv-e10-hybrid'), [])
  assert.deepEqual(setProblems('shoot-easy'), ['khối set: không có bộ "shoot-easy" trong danh sách công khai'])
  assert.deepEqual(setProblems('khong-co'), ['khối set: không có bộ "khong-co" trong danh sách công khai'])
})

test('nhãn mục lục (toc) của mục h: không rỗng, tối đa 28 ký tự, không kết thúc bằng dấu câu', () => {
  const withToc = (toc: unknown) => ({ ...articles[0], blocks: [...base, { t: 'h', text: 'Mục thử', toc }, { t: 'p', text: 'Đoạn thử.' }] })
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

test('icon của mục h: không có thì bỏ qua, có thì phải nằm trong headingIcons', () => {
  const withIcon = (icon: unknown) => ({ ...articles[0], blocks: [...base, { t: 'h', text: 'Mục thử', icon }, { t: 'p', text: 'Đoạn thử.' }] })
  const iconProblems = (icon: unknown) => checkArticle(withIcon(icon)).filter((p) => p.includes('icon đề mục'))
  assert.deepEqual(iconProblems(undefined), [])
  assert.deepEqual(iconProblems('camera'), [])
  assert.deepEqual(iconProblems('khong-co'), ['icon đề mục không có trong danh sách: "khong-co"'])
  assert.deepEqual(iconProblems(42), ['icon đề mục không có trong danh sách: "42"'])
})

test('khối steps: 2 đến 9 bước, mỗi bước có text, kiểm tùy chọn nhưng không rỗng, chú thích bắt buộc', () => {
  const withSteps = (items: unknown[], caption: unknown = 'Chú thích thử.') => ({ ...articles[0], blocks: [base[0], { t: 'steps', caption, items }, ...base.slice(1)] })
  const stepsProblems = (items: unknown[], caption?: unknown) => checkArticle(withSteps(items, caption)).filter((p) => /steps|kiểm của bước/.test(p))
  const ok = [{ text: 'Bấm MENU.', check: 'Hiện màn hình menu.' }, { text: 'Chọn Chụp.' }]
  assert.deepEqual(stepsProblems(ok), [])
  assert.deepEqual(stepsProblems([{ text: 'Bấm MENU.' }]), ['khối steps cần 2 đến 9 bước, đang có 1'])
  assert.deepEqual(stepsProblems([{ text: '' }, { text: 'Chọn Chụp.' }]), ['bước 1 của khối steps rỗng hoặc thừa khoảng trắng: ""'])
  assert.deepEqual(stepsProblems([{ text: 'Bấm MENU.', check: '' }, { text: 'Chọn Chụp.' }]), ['kiểm của bước 1 rỗng hoặc thừa khoảng trắng: ""'])
  assert.deepEqual(stepsProblems(ok, ''), ['khối steps thiếu chú thích (caption)'])
  assert.ok(checkArticle(withSteps([{ text: 'Bấm MENU.', check: 'Creative Look' }, { text: 'Chọn Chụp.' }])).some((p) => p.startsWith('có Creative')))
})

test('bài có variants: mỗi bản chạy cùng luật khối, lỗi ghi kèm id bản', () => {
  const withBlock = (variantId: string, block: object) => ({ ...menu, variants: menu.variants.map((v: any) => (v.id === variantId ? { ...v, blocks: [v.blocks[0], block, ...v.blocks.slice(1)] } : v)) })
  assert.deepEqual(checkArticle(withBlock('new-gen', { t: 'set', id: 'zv-e10-hybrid' })), [])
  assert.ok(checkArticle(withBlock('new-gen', { t: 'set', id: 'khong-co' })).includes('[new-gen] khối set: không có bộ "khong-co" trong danh sách công khai'))
  assert.ok(checkArticle(withBlock('legacy', { t: 'set', id: 'khong-co' })).includes('[legacy] khối set: không có bộ "khong-co" trong danh sách công khai'))
})

test('variants: cần đúng một trong blocks hoặc variants, id bản không trùng, mỗi máy chỉ một bản', () => {
  assert.ok(checkArticle({ ...menu, blocks: base }).includes('bài phải có đúng một trong hai: blocks (một bản) hoặc variants (nhiều bản)'))
  assert.ok(checkArticle({ ...menu, variants: [menu.variants[0], menu.variants[0]] }).includes('trùng id bản: "legacy"'))
  assert.ok(checkArticle({ ...menu, variants: [menu.variants[0], { ...menu.variants[1], models: ['zve10'] }] }).includes('máy "zve10" thuộc cả hai bản "legacy" và "new-gen"'))
})
