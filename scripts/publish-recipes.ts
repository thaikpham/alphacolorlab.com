import { adminClient } from './lib/db'
import { requireTarget } from './supabase/args'
import { readFileSync } from 'node:fs'

/**
 * Flip the recipes the seed still ships unpublished — ColorLab's own originals —
 * to published on the content plane — what the
 * owner otherwise does one by one in /admin/colorlab after shooting each.
 * Only rows the project holds unpublished change; settings are never touched.
 * `--dry-run` prints the plan.
 */
async function main() {
  const { args, target } = requireTarget(process.argv.slice(2), ['--dry-run'])
  if (target !== 'content') throw new Error('Pass --target content.')
  const db = adminClient(target)
  const seed = JSON.parse(readFileSync('data/recipes.seed.json', 'utf8')) as { id: string; published: boolean }[]
  const ids = seed.filter((r) => r.published === false).map((r) => r.id)
  const { data, error } = await db.from('recipes').select('id, published').in('id', ids)
  if (error) throw new Error(`recipes: ${error.message}`)
  const held = new Map((data ?? []).map((r) => [r.id as string, r.published as boolean]))
  const missing = ids.filter((id) => !held.has(id))
  const todo = ids.filter((id) => held.get(id) === false)
  if (missing.length) console.log(`- chưa có trên content plane: ${missing.join(', ')} (library:sync trước)`)
  console.log(`${todo.length} chưa xuất bản: ${todo.join(', ') || '(không)'}`)
  if (args.dryRun || todo.length === 0) return
  const { error: up } = await db.from('recipes').update({ published: true }).in('id', todo).eq('published', false)
  if (up) throw new Error(`recipes -> published: ${up.message}`)
  console.log(`✓ ${todo.length} published`)
}

main().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
