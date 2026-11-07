import { adminClient } from './lib/db'
import { requireTarget } from './supabase/args'
import { PACKS } from '../src/lib/lab/packs'
import { validateForPublish } from '../src/lib/lab/parse'
import { DRAFT_BUCKET, PUBLIC_BUCKET, assetVariantPaths, referencedAssetIds } from '../src/lib/lab/assets'

/**
 * Publish the draft rows a pack left on the content plane, the way
 * `/api/admin/articles/[id]` does it: the spec gate, then every referenced
 * asset copied from `lab-drafts` into `lab` and marked `published`, then the
 * row flipped to `published`. A row somebody edited in the admin, or that is
 * not a draft, is left alone and reported. `--dry-run` prints the plan.
 *
 * The app's helpers are not imported: `asset-lifecycle.ts` and
 * `admin-store.ts` carry `import 'server-only'` and read credentials through
 * `contentAdmin()`, both of which throw under tsx.
 */
async function main() {
  const { args, target } = requireTarget(process.argv.slice(2), ['--pack', '--dry-run'])
  if (target !== 'content') throw new Error('Pass --target content.')
  if (!args.pack) throw new Error('Pass --pack <name>.')
  const pack = PACKS[args.pack]
  if (!pack) throw new Error(`Unknown pack "${args.pack}". Packs: ${Object.keys(PACKS).join(', ')}`)
  const db = adminClient(target)

  const ids = pack.map((a) => a.id)
  const { data, error } = await db.from('lab_articles').select('id, status, updated_by, blocks').in('id', ids)
  if (error) throw new Error(`lab_articles: ${error.message}`)
  const rows = new Map((data ?? []).map((r) => [r.id as string, r as { id: string; status: string; updated_by: string | null; blocks: unknown[] }]))

  const todo: typeof pack[number][] = []
  for (const article of pack) {
    const row = rows.get(article.id)
    if (!row) { console.log(`- ${article.id}: chưa có trên content plane (chạy push:lab trước)`); continue }
    if (row.status === 'published') { console.log(`= ${article.id}: đã published`); continue }
    if (row.updated_by !== null) { console.log(`✗ ${article.id}: ${row.updated_by} đã sửa trong admin — xuất bản từ /blog/${article.id}/edit`); continue }
    const problems = validateForPublish(article)
    if (problems.length) { console.log(`✗ ${article.id}: ${problems.join(', ')}`); continue }
    todo.push(article)
  }
  if (args.dryRun) {
    for (const a of todo) console.log(`  would publish ${a.kind.padEnd(9)} ${a.id}  (${referencedAssetIds(rows.get(a.id)!.blocks).length} ảnh)`)
    console.log(`(dry run) ${todo.length} bài`)
    return
  }

  let done = 0
  for (const article of todo) {
    const row = rows.get(article.id)!
    const referenced = referencedAssetIds(row.blocks)
    if (referenced.length) {
      const { data: owned, error: ownErr } = await db.from('lab_assets').select('id, state').eq('article_id', article.id)
      if (ownErr) throw new Error(`${article.id} lab_assets: ${ownErr.message}`)
      const states = new Map((owned ?? []).map((r) => [r.id as string, r.state as string]))
      const foreign = referenced.filter((id) => !states.has(id))
      if (foreign.length) { console.log(`✗ ${article.id}: ảnh không thuộc bài (${foreign.join(', ')})`); continue }
      const incomplete = referenced.filter((id) => states.get(id) !== 'draft' && states.get(id) !== 'published')
      if (incomplete.length) { console.log(`✗ ${article.id}: ảnh chưa tải xong (${incomplete.join(', ')})`); continue }
      let copyFailed = false
      for (const id of referenced) {
        for (const path of assetVariantPaths(article.id, id)) {
          const { error: cp } = await db.storage.from(DRAFT_BUCKET).copy(path, path, { destinationBucket: PUBLIC_BUCKET })
          if (cp && !/already exists|duplicate|resource exists/i.test(cp.message)) { console.log(`✗ ${article.id}: copy ${path}: ${cp.message}`); copyFailed = true; break }
        }
        if (copyFailed) break
      }
      if (copyFailed) continue
      const { error: st } = await db.from('lab_assets').update({ state: 'published' }).in('id', referenced)
      if (st) throw new Error(`${article.id} lab_assets -> published: ${st.message}`)
    }
    const { error: up } = await db
      .from('lab_articles')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', article.id)
      .eq('status', 'draft')
      .is('updated_by', null)
    if (up) throw new Error(`${article.id}: ${up.message}`)
    console.log(`✓ ${article.id}`)
    done += 1
  }
  console.log(`✓ ${done}/${todo.length} published`)
}

main().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
