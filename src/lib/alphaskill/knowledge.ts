import 'server-only'
import { readFileSync } from 'fs'
import { join } from 'path'
import { unstable_cache } from 'next/cache'
import {
  AlphaNote,
  RawNote,
  AlphaNoteSchema,
  parseNote,
  flattenTree,
  checkSlugCollisions,
  sortNotes,
  fold,
  findNoteByTitle,
  notesLinkingTo,
} from './parse'

export type { AlphaNote }
export { fold, findNoteByTitle, notesLinkingTo, sortNotes }
export { flattenTree } from './parse'

export const ALPHASKILL_TAG = 'alphaskill-knowledge'

const ALPHASKILL_TTL_SECONDS = 3600

/**
 * Read from API and parse all notes.
 */
async function fetchNotesFromAPI(baseUrl: string): Promise<readonly AlphaNote[]> {
  const treeUrl = `${baseUrl.replace(/\/$/, '')}/v1/get_knowledge`
  const treeRes = await fetch(treeUrl, {
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })

  if (!treeRes.ok) {
    throw new Error(`Alphaskill API /v1/get_knowledge returned ${treeRes.status}`)
  }

  const tree = await treeRes.json()
  const notesList = flattenTree(tree as Record<string, unknown>)

  // Fetch each note in parallel
  const notePromises = notesList.map(async (item) => {
    const detailUrl = `${baseUrl.replace(/\/$/, '')}/v1/get_knowledge?note=${encodeURIComponent(item.path)}`
    const detailRes = await fetch(detailUrl, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })

    if (!detailRes.ok) {
      throw new Error(`Alphaskill API /v1/get_knowledge?note=... returned ${detailRes.status} for ${item.path}`)
    }

    const raw = (await detailRes.json()) as RawNote
    return parseNote(raw, item.folders, item.summary)
  })

  const notes = await Promise.all(notePromises)

  // Validate each note
  const validated: AlphaNote[] = []
  for (const note of notes) {
    const result = AlphaNoteSchema.safeParse(note)
    if (!result.success) {
      throw new Error(`Invalid note ${note.title}: ${result.error.message}`)
    }
    validated.push(result.data)
  }

  checkSlugCollisions(validated)
  return sortNotes(validated)
}

/**
 * Parse notes from seed snapshot.
 */
function parseNotesFromSnapshot(snapshot: unknown): readonly AlphaNote[] {
  if (!Array.isArray(snapshot)) {
    throw new Error('Snapshot must be an array of notes')
  }

  const validated: AlphaNote[] = []
  for (const note of snapshot) {
    const result = AlphaNoteSchema.safeParse(note)
    if (!result.success) {
      throw new Error(`Invalid note in snapshot: ${result.error.message}`)
    }
    validated.push(result.data)
  }

  checkSlugCollisions(validated)
  return validated
}

/**
 * Read all notes, with caching.
 * Source is determined by ALPHASKILL_API_URL env var:
 * - Set → online read (throws on failure)
 * - Unset → offline snapshot read
 */
async function readNotes(): Promise<readonly AlphaNote[]> {
  const apiUrl = process.env.ALPHASKILL_API_URL

  if (apiUrl) {
    // Online mode: fetch from API, failures throw
    return fetchNotesFromAPI(apiUrl)
  } else {
    // Offline mode: load snapshot
    const content = readFileSync(join(process.cwd(), 'data', 'alphaskill-knowledge.seed.json'), 'utf8')
    const snapshot = JSON.parse(content)
    return parseNotesFromSnapshot(snapshot)
  }
}

/**
 * Public API: fetch all notes with caching.
 */
export const listNotes = unstable_cache(readNotes, ['alphaskill-notes'], {
  revalidate: ALPHASKILL_TTL_SECONDS,
  tags: [ALPHASKILL_TAG],
})

/**
 * Get a single note by slug.
 */
export async function getNote(slug: string): Promise<AlphaNote | undefined> {
  const notes = await listNotes()
  return notes.find((n) => n.slug === slug)
}

/**
 * Generate href for a note.
 */
export const noteHref = (slug: string) => `/learn/${slug}`
