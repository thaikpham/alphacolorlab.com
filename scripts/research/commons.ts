/**
 * Ảnh minh họa từ Wikimedia Commons, giấy phép đọc từ extmetadata. Usage:
 *   npx tsx scripts/research/commons.ts "<query>" [--n 8]
 *   npx tsx scripts/research/commons.ts "<query>" --save <path.jpg> <index>
 * Một JSON mỗi hit; --save tải bản 1024px của hit thứ <index> (0-based) và in nơi lưu.
 * Chỉ hit `allowed: true` được lưu; exit 1 nếu không.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { PACK_LICENCES } from '../../src/lib/lab/packs/check'
import { pickCommons } from './lib'

const UA = 'alphacolorlab-blog/1.0 (https://alphacolorlab.com)'

async function main() {
  const [query, ...rest] = process.argv.slice(2)
  if (!query) throw new Error('query required')
  const n = rest.includes('--n') ? Number(rest[rest.indexOf('--n') + 1]) : 8
  const save = rest.includes('--save') ? { path: rest[rest.indexOf('--save') + 1], index: Number(rest[rest.indexOf('--save') + 2]) } : null
  const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: `${query} filetype:bitmap`, gsrnamespace: '6', gsrlimit: String(n), prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1024', format: 'json' })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`commons ${res.status}`)
  const hits = pickCommons(await res.json(), PACK_LICENCES)
  if (!save) { for (const h of hits) console.log(JSON.stringify(h)); return }
  const hit = hits[save.index]
  if (!hit?.allowed) throw new Error(`hit ${save.index} is not allowed: ${hit?.licence ?? 'none'}`)
  const img = await fetch(hit.thumb, { headers: { 'User-Agent': UA } })
  if (!img.ok) throw new Error(`thumb ${img.status}`)
  mkdirSync(dirname(save.path), { recursive: true })
  writeFileSync(save.path, Buffer.from(await img.arrayBuffer()))
  console.log(JSON.stringify({ ...hit, savedTo: save.path }))
}
main().catch((e: unknown) => { console.error(`✗ ${e instanceof Error ? e.message : String(e)}`); process.exit(1) })
