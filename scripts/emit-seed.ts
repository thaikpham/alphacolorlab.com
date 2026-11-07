/**
 * Regenerates data/recipes.seed.json from two sources:
 *   - the legacy sonycolorlab dataset  -> the Picture Profile recipes kept
 *   - ColorLab's own originals         -> the Picture Profile library
 *
 * Names every recipe from its own settings, `nameFor` in
 * src/lib/recipes/names.ts (`PP-001-Neutral Soft Rich`): nobody types a name.
 * Every slug is the recipe's code, `slugFor(id)` (`pp-001`), so a name changes
 * no URL. data/former-slugs.json (every earlier spelling → the code slug) is
 * written from the frozen record of every slug move
 * (`src/lib/recipes/slug-moves.ts`), never recomputed from the sources; the
 * alias lookups (`src/lib/recipes/slug-aliases.ts`) read the same batches.
 * Run with: npm run seed:emit
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { recipeSchema } from '../src/lib/camera/schema';
import legacyRecipes from '../src/lib/legacy/recipes.legacy.js';
import { migrateAll } from '../src/lib/legacy/migrate';
import { ORIGINAL_PP, type OriginalRecipe } from '../src/lib/originals/pp';
import { NAME_VOCABULARY, namesFor, parseRecipeName, readNames, readsAlike, slugFor } from '../src/lib/recipes/names';
import { formerSlugsFor } from '../src/lib/recipes/slug-moves';

const { ok, failed } = migrateAll(legacyRecipes as Record<string, unknown>[]);
if (failed.length) {
  console.error(`✗ ${failed.length} recipe(s) failed validation:`);
  for (const f of failed) console.error(`  ${f.legacyId}: ${f.error}`);
  process.exit(1);
}

/* The originals are typed, but typed is not validated: the ranges and the
   gamma/colour-mode pairing live in the schema, and a number outside them
   must stop the emit here rather than fail on a real camera. They carry no
   name; a placeholder satisfies the schema until every recipe is named
   below, from the whole catalogue at once. */
const validated = (list: readonly OriginalRecipe[]) =>
  list.map((o) => {
    const parsed = recipeSchema.safeParse({ ...o.recipe, name: o.recipe.id });
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      console.error(`✗ ${o.recipe.id} failed validation: ${detail}`);
      process.exit(1);
    }
    return { ...parsed.data, legacyId: null as string | null, description: o.description };
  });
const originals = validated(ORIGINAL_PP);

mkdirSync('data', { recursive: true });
const ppRows = [
  ...ok.map((r) => ({ ...r.recipe, legacyId: r.legacyId as string | null })),
  ...originals.map(({ description: _description, ...recipe }) => recipe),
];
/* Every name is computed from the settings (N1 of the 2026-10-28 names
   design), over the whole catalogue at once so the tie-break sees every
   earlier recipe; whatever the sources called a recipe is discarded. The slug
   does not follow the name: it is the code, `slugFor(id)` (S1 of the same
   design). Former slugs are not read off the sources: they are the
   frozen record of each move, which migrations carry pair for pair. */
const names = namesFor(ppRows);
/* A tie is reported, and allowed only where the two recipes render the same
   palette with the same detail: then no honest word can tell them apart. */
{
  const byId = new Map(ppRows.map((r) => [r.id, r]));
  for (const n of readNames(ppRows)) {
    if (!n.tiedWith) continue;
    const alike = readsAlike(byId.get(n.id)!, byId.get(n.tiedWith)!);
    console[alike ? 'log' : 'error'](
      `${alike ? '·' : '✗'} ${n.id} reads as ${n.tiedWith}: "${n.words.join(' ')}"` +
        (alike ? ' — the same palette and detail' : ' — their palettes differ; the reading needs a word'),
    );
    if (!alike) process.exit(1);
  }
}
const rows = ppRows.map((r) => {
  const name = names.get(r.id)!;
  return { ...r, name, slug: slugFor(r.id) };
});
const { formerSlugs, problems: slugMoveProblems } = formerSlugsFor(rows);
if (slugMoveProblems.length) {
  for (const p of slugMoveProblems) console.error(`✗ ${p}`);
  process.exit(1);
}

/* One id, one slug and one name each, across every source. A collision
   would otherwise surface as a silently skipped row in push:supabase. */
for (const key of ['id', 'slug', 'name'] as const) {
  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r[key])) {
      console.error(`✗ duplicate recipe ${key}: ${r[key]}`);
      process.exit(1);
    }
    seen.add(r[key]);
  }
}

/* A former slug is a second address for its own recipe and nothing else:
   another recipe's current slug under that spelling would make an old link
   land on the wrong colour. */
const currentSlugs = new Set(rows.map((r) => r.slug));
for (const [former, current] of Object.entries(formerSlugs)) {
  if (currentSlugs.has(former)) {
    console.error(`✗ former slug ${former} (now ${current}) is another recipe's current slug`);
    process.exit(1);
  }
}

/* Every name in the one syntax: the recipe's own format and number, then
   exactly three words from the closed vocabulary. */
for (const r of rows) {
  const parsed = parseRecipeName(r.name);
  const stray = parsed?.words.filter((w) => !NAME_VOCABULARY.has(w)) ?? [];
  if (!parsed || parsed.format !== r.format || parsed.number !== r.id.slice(-3) || stray.length) {
    console.error(
      `✗ ${r.id}: name "${r.name}" is not ${r.format.toUpperCase()}-${r.id.slice(-3)}-Mood Words` +
        (stray.length ? ` (not in the vocabulary: ${stray.join(', ')})` : ''),
    );
    process.exit(1);
  }
}

/**
 * Photographer credit and the original photo URLs, as provenance.
 *
 * The URLs are Sony's CDN and nothing on the site follows them: hotlinking
 * someone else's CDN is what broke the images on the old site, and the
 * catalogue carries no photograph of its own any more. They are recorded so
 * every recipe can name the photographer it came from.
 */
// Descriptions are the only translated field, so they live apart from the
// recipe row — mirroring the recipe_translations table.
const byLegacyId = new Map(
  (legacyRecipes as { id: string; description?: string }[]).map((r) => [r.id, r.description ?? '']),
);
const byOriginalId = new Map(originals.map((o) => [o.id as string, o.description]));
const translations = rows.map((r) => {
  // Legacy Picture Profile prose comes from the legacy dataset or the originals.
  const description = 'legacyId' in r
    ? (r.legacyId ? byLegacyId.get(r.legacyId as string) : byOriginalId.get(r.id as string))?.trim()
    : undefined;
  if (!description) throw new Error(`${r.id}: description missing`);
  return { recipeId: r.id, locale: 'en' as const, description };
});

// Vietnamese lives in a hand-maintained source file and is merged in here, so
// regenerating the seed never silently discards translated prose.
const viSource = JSON.parse(readFileSync('data/translations.vi.json', 'utf8')) as Record<
  string,
  string
>;
const vi = rows
  .map((r) => ({ recipeId: r.id, locale: 'vi' as const, description: viSource[r.id]?.trim() ?? '' }))
  .filter((t) => t.description.length > 0);

const missingVi = rows.length - vi.length;

/* Written together, after every check above has passed. A throw used to land
   between files — recipes.seed.json already holding a recipe whose
   translation never got written — and doctor and push:supabase then read a
   recipe with no English text. */
writeFileSync('data/recipes.seed.json', JSON.stringify(rows, null, 2) + '\n');
writeFileSync('data/former-slugs.json', JSON.stringify(formerSlugs, null, 2) + '\n');
writeFileSync(
  'data/translations.seed.json',
  JSON.stringify([...translations, ...vi], null, 2) + '\n',
);

const corrected = ok.filter((r) => r.corrections > 0);
console.log(`✓ ${rows.length} recipes → data/recipes.seed.json`);
console.log(
  `  ${ok.length} Picture Profile (legacy) + ${originals.length} Picture Profile (originals)`,
);
console.log(`✓ ${Object.keys(formerSlugs).length} former slugs → data/former-slugs.json`);
console.log(`✓ ${translations.length} EN + ${vi.length} VI descriptions → data/translations.seed.json`);
if (missingVi > 0) console.log(`  ${missingVi} recipe(s) have no VI description yet — they fall back to English`);
if (corrected.length) {
  console.log(`  ${corrected.length} with documented corrections: ${corrected.map((c) => c.legacyId).join(', ')}`);
}
