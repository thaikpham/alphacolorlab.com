// Copies the site's final content to the CONTENT Supabase project. The repo JSON stays the source of truth.
// Tables: products, knowledge_notes, learning_paths (create them with supabase/content.sql) and lab_articles (upsert by id).
// Recipes are not pushed: the 45 published rows on Supabase already match lib/zve10/presets.json.
//
// Dry run (no key needed):  node --experimental-strip-types scripts/push-supabase.ts
// Write:  node --env-file="../../ColorLab 2.0/.env.local" --experimental-strip-types scripts/push-supabase.ts --apply
// Only the new tables:  … scripts/push-supabase.ts --apply --tables=products,knowledge_notes,learning_paths
// The secret key is read from the environment only; never print it or copy it into this repo.
import products from '../data/products.json' with { type: 'json' }
import knowledge from '../data/knowledge.json' with { type: 'json' }
import paths from '../data/learning-paths.json' with { type: 'json' }
import articles from '../data/articles.json' with { type: 'json' }

const apply = process.argv.includes('--apply')
const url = process.env.NEXT_PUBLIC_CONTENT_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.CONTENT_SUPABASE_SECRET_KEY

const tables: { table: string; key: string; rows: Record<string, unknown>[] }[] = [
  {
    table: 'products',
    key: 'slug',
    rows: products.map((p) => ({ slug: p.slug, code: p.code, name: p.name, kind: p.kind, group: p.group, image: p.image, source: p.source, specs: p.specs })),
  },
  {
    table: 'knowledge_notes',
    key: 'slug',
    rows: (knowledge as any[]).map((k) => ({
      slug: k.slug, title: k.title, home: k.home ?? null, group: k.group ?? null, section: k.section ?? null, level: k.level ?? null,
      aliases: k.aliases ?? [], summary: k.summary ?? '', body: k.body ?? '', merged_into: k.mergedInto ?? null,
    })),
  },
  {
    table: 'learning_paths',
    key: 'slug',
    rows: paths.map((p) => ({ slug: p.slug, title: p.title, lead: p.lead, draft: Boolean(p.draft), steps: p.steps })),
  },
  {
    table: 'lab_articles',
    key: 'id',
    rows: (articles as any[]).map((a) => ({
      id: a.id, status: 'published', kind: a.kind, topic: a.topic, level: a.level, archetype: a.archetype, read: a.read,
      title: a.title, dek: a.dek, blocks: a.blocks, meta: a.meta, category: a.category ?? null, ...(a.updatedAt && { updated_at: a.updatedAt }),
    })),
  },
]

// Self-check: one row per primary key, as the tables require.
for (const { table, key: pk, rows } of tables) {
  const ids = rows.map((r) => r[pk])
  if (ids.some((id) => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) throw new Error(`${table}: empty or duplicate ${pk}`)
}
// --tables=products,knowledge_notes pushes only those (lab_articles is what ColorLab 2.0 shows live).
const only = process.argv.find((a) => a.startsWith('--tables='))?.slice(9).split(',')
if (only) tables.splice(0, tables.length, ...tables.filter((t) => only.includes(t.table)))

for (const { table, rows } of tables) console.log(`${table}: ${rows.length} rows, ${(JSON.stringify(rows).length / 1024).toFixed(0)} KB`)
if (!apply) {
  console.log('Dry run. Add --apply to write.')
  process.exit(0)
}
if (!url || !key) throw new Error('Set NEXT_PUBLIC_CONTENT_SUPABASE_URL and CONTENT_SUPABASE_SECRET_KEY (e.g. --env-file).')

// New sb_secret_ keys go in `apikey` only; a legacy service_role JWT also goes in Authorization.
const auth: Record<string, string> = key.startsWith('sb_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }

for (const { table, key: pk, rows } of tables) {
  const r = await fetch(`${url}/rest/v1/${table}?on_conflict=${pk}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
  if (!r.ok) throw new Error(`${table}: ${r.status} ${(await r.text()).slice(0, 300)}`)
  console.log(`${table}: upserted ${rows.length}`)
}
