/**
 * Pushes the three authored articles into `lab_articles`, with support for
 * replacing published articles that haven't been edited.
 *
 * Run once, after migration 0013 has been applied:
 *
 *   npm run push:lab
 *
 * The catalogue used to live in `src/lib/lab/articles.ts` and be compiled into
 * the build. `lib/lab/data.ts` now reads Supabase and falls back to that array
 * only when the table is missing or Supabase is unreachable — so the moment the
 * migration lands on a project with an empty table, `/blog` goes empty. This
 * script is what closes that gap: the seed becomes real rows, and the editor
 * can open all three in the admin.
 *
 * Idempotent. An article edited through the admin will not be silently
 * reverted unless explicitly requested with `--replace <id>`.
 */

import { readFileSync } from 'node:fs'
import { adminClient } from './lib/db'
import { processLabImage } from '../src/lib/lab/image-process.core'
import { uploadDraftAsset } from '../src/lib/lab/asset-store'
import { requireTarget } from './supabase/args'
import { labCandidates, replaceable, withAssetIds } from './lib/lab-candidates'

/**
 * `--with-pilot-drafts` also inserts the nine pilot pages from
 * `pilot-drafts.ts` — always as drafts, which an administrator finds under
 * "Bản nháp" on `/blog` and `/learn` and reviews in each page's own editor
 * (`/learn/<id>/edit`). Without the flag the script does exactly what it
 * always did. `--dry-run` prints the plan and writes nothing.
 *
 * `--pack <name>` also inserts a content pack (`src/lib/lab/packs/<name>.ts`,
 * written by the blog-content skill), as drafts, by the same insert-only path:
 * a page already in the table is skipped, never overwritten unless explicitly
 * requested with `--replace <id>`. Run it with `--dry-run` first.
 *
 * `--replace <id>` rewrites an article that has not been edited in the admin
 * (updated_by IS NULL). Can be given multiple times.
 */
async function main() {
  const { args, target } = requireTarget(process.argv.slice(2), [
    '--with-pilot-drafts',
    '--pack',
    '--dry-run',
    '--replace',
  ])
  if (target !== 'content') {
    throw new Error('This script seeds content tables. Pass --target content.')
  }
  const candidates = labCandidates({ withPilotDrafts: args.withPilotDrafts, pack: args.pack })
  const db = adminClient(target)
  const { data: existing, error: readError } = await db.from('lab_articles').select('id, updated_by, updated_at')
  if (readError) throw new Error(`read lab_articles: ${readError.message}`)
  const rows = new Map((existing ?? []).map((r) => [r.id as string, r as { id: string; updated_by: string | null; updated_at: string }]))

  const toInsert = candidates.filter((c) => !rows.has(c.article.id))
  const toReplace = candidates.filter((c) => rows.has(c.article.id) && args.replace.includes(c.article.id))
  for (const c of toReplace) {
    const row = rows.get(c.article.id)!
    if (!replaceable(row)) console.log(`✗ ${c.article.id} đã được ${row.updated_by} sửa lúc ${row.updated_at} — sửa tay trong /blog/${c.article.id}/edit`)
  }
  const replacing = toReplace.filter((c) => replaceable(rows.get(c.article.id)!))

  if (args.dryRun) {
    for (const c of toInsert) console.log(`  would insert  ${c.status.padEnd(9)} ${c.article.kind.padEnd(9)} ${c.article.id}  (${c.images.length} ảnh)`)
    for (const c of replacing) console.log(`  would replace ${c.status.padEnd(9)} ${c.article.kind.padEnd(9)} ${c.article.id}  (${c.images.length} ảnh)`)
    return
  }
  const now = new Date().toISOString()
  const rowOf = ({ article: a, status }: typeof toInsert[0]) => ({ id: a.id, status, kind: a.kind, topic: a.topic, level: a.level, archetype: a.archetype, read: a.read, title: a.title, dek: a.dek, blocks: a.blocks, meta: a.meta, updated_at: now, updated_by: null })
  if (toInsert.length) {
    const { error } = await db.from('lab_articles').insert(toInsert.map((c) => ({ ...rowOf(c), created_at: now })))
    if (error) throw new Error(`insert lab_articles: ${error.message}`)
  }
  for (const c of replacing) {
    const { error } = await db.from('lab_articles').update(rowOf(c)).eq('id', c.article.id).is('updated_by', null)
    if (error) throw new Error(`replace ${c.article.id}: ${error.message}`)
  }
  /* Ảnh sau khi dòng đã có: uploadDraftAsset đòi articleExists. */
  for (const c of [...toInsert, ...replacing]) {
    if (c.images.length === 0) continue
    const ids = new Map<number, string>()
    for (const img of c.images) {
      const processed = await processLabImage(new Uint8Array(readFileSync(img.path)))
      if (!processed.ok) throw new Error(`${c.article.id} ảnh ${img.path}: ${processed.error}`)
      const up = await uploadDraftAsset(c.article.id, processed.image, 'push:lab')
      if (!up.ok) throw new Error(`${c.article.id} ảnh ${img.path}: ${up.error}`)
      ids.set(img.blockIndex, up.asset.assetId)
    }
    const { error } = await db.from('lab_articles').update({ blocks: withAssetIds(c.article, ids).blocks }).eq('id', c.article.id)
    if (error) throw new Error(`assets ${c.article.id}: ${error.message}`)
  }
  console.log(`✓ ${toInsert.length} inserted, ${replacing.length} replaced`)
}

main().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
