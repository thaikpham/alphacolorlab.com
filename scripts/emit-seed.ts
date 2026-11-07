/**
 * Regenerates data/recipes.seed.json from three sources:
 *   - the legacy sonycolorlab dataset  -> the Picture Profile recipes kept
 *   - ColorLab's own originals         -> the Picture Profile library and
                                         Picture Profile library
 * and names every recipe from its own settings, `nameFor` in
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
// `images` and `credit` are provenance, not recipe fields — they are written to
// their own file so a seed row still parses as a plain Recipe.
