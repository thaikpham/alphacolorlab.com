# ADR 0007 — Alphaskill is the knowledge source for /learn

Status: accepted · 2026-11-04

## Context

The app has two sources of reference content on `/learn`:

1. **Authored knowledge pages** in `lab_articles` with `kind = 'knowledge'` (ADR 0001).
   Edited in `/admin/blog`, published through the admin gate, stored on the content
   plane. These pages follow the editorial contract: at least one source with a
   checked date, a section, a heading, and the house rules (no emoji, no `!`).

2. **Alphaskill notes** from an Obsidian vault served by a read-only API at
   https://api.alphacolorlab.com. The vault is owned by the Sony trainer and
   holds Vietnamese markdown: 29 notes on camera concepts, colour, composition
   and production. The notes are not edited in this app — they are Obsidian
   originals, pulled at build time and cached.

The two sources are merged in `/learn` (alphabetical by section then title),
linked in concept maps (e.g., a parameter card → reference pages that explain it),
and indexed together in search.

## API contract

- `GET /v1/get_knowledge` → JSON tree of folders containing `_notes` arrays:
  ```json
  {
    "count": 29,
    "1 Kiến thức": {
      "Màu sắc": {
        "_notes": [
          { "title": "Creative Look", "path": "1 Kiến thức/Màu sắc/Creative Look.md", "summary": "…" }
        ]
      }
    },
    "2 Giáo án": { "_notes": […] }
  }
  ```
- `GET /v1/get_knowledge?note={path url-encoded}` → Single note with full markdown:
  ```json
  {
    "path": "1 Kiến thức/Màu sắc/Creative Look.md",
    "title": "Creative Look",
    "props": { "aliases": […], "level": "cơ bản", "sources": […], "tags": […] },
    "text": "---\ntitle: …\n---\n# Creative Look\n\n…\n## Liên quan\n[[Related]]"
  }
  ```

Bodies are Vietnamese markdown: `# Title`, `## Heading`, paragraphs, bullets,
`**bold**`, Obsidian wikilinks `[[Title]]`/`[[Title|display]]`/`[[Title#frag]]`,
and a trailing `## Liên quan` section that is just a list of wikilinks.

## Decision

1. **Configuration decides the source.** `ALPHASKILL_API_URL` (default
   `https://api.alphacolorlab.com`) → online read; unset → committed snapshot
   in `data/alphaskill-knowledge.seed.json`. Online failures (non-2xx, timeout,
   invalid shape) throw; never fall back to the snapshot when the env var is
   set. The snapshot is refreshed by `npm run alphaskill:emit`.

2. **Slug = `slugify(title)`**, the same function as blog articles. A collision
   (two notes with the same slug) is refused with a clear error naming both
   titles, so renaming in Obsidian is immediate and detectable.

3. **Wikilinks resolve by title or alias**, case-insensitive, diacritic-insensitive.
   A note's `links` array is populated from `[[…]]` anywhere in the full text,
   de-duplicated. Rendering resolves each link's title back to a note to compute
   backlinks and related content. `[[Title#frag]]` and `[[Title|display]]` strip
   the fragment and display text — what matters is the target note.

4. **Notes are Vietnamese-only**, like knowledge pages (ADR 0004). A message
   route that links to them uses locales to pick which reading surface to show
   in each language.

5. **The structure mirrors `getPublishedEntries`** in `/src/lib/lab/data.ts`:
   - `unstable_cache()` with a 1-hour TTL and a `ALPHASKILL_TAG`
   - `contentOrOfflineSeed()` branching on `ALPHASKILL_API_URL`
   - Validation with zod
   - Sorted by section, then title, with `localeCompare(…, 'vi')`

6. **Concept mapping** in `src/lib/alphaskill/concepts.ts` names which notes
   explain which camera concepts. The map is small and hand-coded; a concept
   without a note is simply not linked. Currently: `wb` and `cl` group heads,
   plus `cl.look` (both map to the Creative Look note).

## Consequences

- The app reads from two APIs at build time (Supabase content plane and
  Alphaskill) and must handle both being offline / misconfigured.
- A note that cannot be fetched stops the build; the snapshot is never silently
  served if the env var is set. The build fails loudly instead.
- Wikilinks in the vault stay as they are (no renaming needed when a note moves);
  the slug is derived at read time, so an Obsidian rename is picked up on the
  next build.
- A concept's label comes from Alphaskill only if a note is mapped to it; there
  is no fallback to the parameter label. This is deliberate — the reference
  pages own that namespace once published.
