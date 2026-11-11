// What a reader actually types: no diacritics, typos, abbreviations, model codes in every spelling, half-typed words.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { searchIndex, suggestQuery } from '../lib/search.ts'
import { buildIndex } from '../lib/searchIndex.ts'

const index = buildIndex()
const top = (q: string, n: number) => searchIndex(index, q).slice(0, n).map((i) => i.href)

const cases: [query: string, href: string, within: number][] = [
  ['xoa phong', '/blog/kien-thuc/do-sau-truong-anh-va-xoa-phong', 3],
  ['xoa phong', '/blog/xoa-phong-voi-ong-kit', 3],
  ['xoá phông', '/blog/kien-thuc/do-sau-truong-anh-va-xoa-phong', 3],
  ['xao phong', '/blog/kien-thuc/do-sau-truong-anh-va-xoa-phong', 3],
  ['bokeh', '/blog/kien-thuc/do-sau-truong-anh-va-xoa-phong', 1],
  ['wb', '/blog/kien-thuc/can-bang-trang-va-nhiet-do-mau', 1],
  ['awb', '/blog/khi-nao-roi-awb', 2],
  ['can bang trang', '/blog/kien-thuc/can-bang-trang-va-nhiet-do-mau', 1],
  ['a7m4', '/wiki/san-pham/a7-iv', 1],
  ['a7iv', '/wiki/san-pham/a7-iv', 1],
  ['a7 iv', '/wiki/san-pham/a7-iv', 1],
  ['ilce7m4', '/wiki/san-pham/a7-iv', 1],
  ['zve10', '/wiki/san-pham/zv-e10', 1],
  ['zv e10', '/wiki/san-pham/zv-e10', 1],
  ['ZV-E10', '/wiki/san-pham/zv-e10', 1],
  ['zv-e10 ii', '/wiki/san-pham/zv-e10-ii', 1],
  ['zve10m2', '/wiki/san-pham/zv-e10-ii', 1],
  ['6400', '/wiki/san-pham/a6400', 1],
  ['toc do man trap', '/blog/kien-thuc/toc-do-man-trap', 1],
  ['ss', '/blog/kien-thuc/toc-do-man-trap', 3],
  ['chong rung', '/blog/kien-thuc/chong-rung-ibis', 5],
  ['chong rung', '/blog/kien-thuc/chong-rung-dien-tu', 5],
  ['chong rung', '/blog/kien-thuc/oss', 5],
  ['stedyshot', '/blog/kien-thuc/chong-rung-ibis', 5],
  ['eye af', '/blog/af-c-tracking-eye-af', 3],
  ['pp', '/blog/kien-thuc/picture-profile', 1],
  ['mr', '/blog/kien-thuc/bo-nho-cai-dat-va-memory-recall', 1],
  ['phoi sang d', '/blog/phoi-sang-dai-tren-sony', 3],
  ['tieu c', '/blog/kien-thuc/tieu-cu', 1],
  ['iso auto', '/blog/iso-auto-min-ss', 2],
  ['picure profle', '/blog/kien-thuc/picture-profile', 1],
  ['khau do', '/blog/kien-thuc/khau-do', 1],
  ['phoi sang', '/cai-tay/phoi-sang', 1],
  ['lay net', '/cai-tay/lay-net', 2],
  ['mau da', '/cai-tay/mau-da', 2],
  ['man hinh', '/cai-tay/man-hinh', 2],
  ['a74', '/wiki/san-pham/a7-iv', 1],
  ['a7c2', '/wiki/san-pham/a7c-ii', 1],
  ['a7cii', '/wiki/san-pham/a7c-ii', 1],
  ['afc', '/blog/af-s-af-c-dmf-chon-mot', 2], // the AF-C article now leads with "AF-C" in its title
  ['afs', '/blog/af-s-af-c-dmf-chon-mot', 1],
]

for (const [q, href, within] of cases)
  test(`"${q}" finds ${href} in the top ${within}`, () => assert.ok(top(q, within).includes(href), `got ${JSON.stringify(top(q, 5))}`))

test('nonsense finds nothing and suggests nothing', () => {
  assert.deepEqual(searchIndex(index, 'xyzxyz'), [])
  assert.equal(suggestQuery(index, 'xyzxyz'), null)
})

test('a typo gets a corrected query with diacritics', () => {
  assert.equal(suggestQuery(index, 'khua do'), 'khẩu độ')
  assert.equal(suggestQuery(index, 'picure profle')?.toLowerCase(), 'picture profile')
})

test('a correct query gets no suggestion', () => {
  assert.equal(suggestQuery(index, 'khau do'), null)
  assert.equal(suggestQuery(index, 'iso'), null)
})

test('one letter does not match everything', () => assert.ok(searchIndex(index, 'a').length < index.length / 2))
