/**
 * Read the live Alphaskill API and emit a snapshot for offline use.
 *
 * Usage:
 *   ALPHASKILL_API_URL=https://api.alphacolorlab.com tsx scripts/alphaskill-emit.ts [--allow-shrink]
 */

import fs from 'fs'
import path from 'path'
import {
  RawNote,
  parseNote,
  flattenTree,
  checkSlugCollisions,
  sortNotes,
  AlphaNoteSchema,
  shouldRefuseShrink,
} from '../src/lib/alphaskill/parse'

async function main() {
  const baseUrl = process.env.ALPHASKILL_API_URL || 'https://api.alphacolorlab.com'
  const treeUrl = `${baseUrl.replace(/\/$/, '')}/v1/get_knowledge`
  const allowShrink = process.argv.includes('--allow-shrink')

  console.log(`Fetching from ${treeUrl}...`)

  const treeRes = await fetch(treeUrl, {
    signal: AbortSignal.timeout(8000),
  })

  if (!treeRes.ok) {
    throw new Error(`API returned ${treeRes.status}`)
  }

  const tree = (await treeRes.json()) as Record<string, unknown>
  const notesList = flattenTree(tree)

  console.log(`Found ${notesList.length} notes`)

  // Fetch each note in parallel
  const notePromises = notesList.map(async (item) => {
    const detailUrl = `${baseUrl.replace(/\/$/, '')}/v1/get_knowledge?note=${encodeURIComponent(item.path)}`
    const detailRes = await fetch(detailUrl, {
      signal: AbortSignal.timeout(8000),
    })

    if (!detailRes.ok) {
      console.error(`⚠ Skipped ${item.path}: returned ${detailRes.status}`)
      return null
    }

    try {
      const raw = (await detailRes.json()) as RawNote
      return parseNote(raw, item.folders, item.summary)
    } catch (err) {
      console.error(`⚠ Skipped ${item.path}:`, err instanceof Error ? err.message : String(err))
      return null
    }
  })

  const results = await Promise.all(notePromises)
  const notes = results.filter((n) => n !== null)

  // Validate each note
  for (const note of notes) {
    const result = AlphaNoteSchema.safeParse(note)
    if (!result.success) {
      console.error(`Error: Invalid note ${note.title}: ${result.error.message}`)
      process.exit(1)
    }
  }

  checkSlugCollisions(notes)
  const sorted = sortNotes(notes)

  // Check for shrinkage
  const snapshotPath = path.join(process.cwd(), 'data', 'alphaskill-knowledge.seed.json')
  let prevCount = 0
  if (fs.existsSync(snapshotPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
      prevCount = Array.isArray(existing) ? existing.length : 0
    } catch {
      prevCount = 0
    }
  }

  if (shouldRefuseShrink(sorted.length, prevCount, allowShrink)) {
    console.error(
      `✗ Refusing to shrink snapshot: ${sorted.length} notes < ${prevCount} existing. Pass --allow-shrink to override.`,
    )
    process.exit(1)
  }

  // Write snapshot
  const json = JSON.stringify(sorted, null, 2) + '\n'
  fs.writeFileSync(snapshotPath, json)

  console.log(`✓ Wrote ${sorted.length} notes to ${snapshotPath}`)
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
