---
name: add-recipe
description: Add a new colour recipe to Alpha ColorLab — WB + Picture Profile. Use when the user wants to add, publish, or draft a recipe, supplies camera settings to turn into a recipe, or says "new recipe" / "thêm công thức". Handles ID assignment, validation and bilingual descriptions.
---

# Add a recipe

## Before anything else

Read `src/lib/camera/constants.ts`. Do not proceed from memory — the legal ranges
are easy to get plausibly wrong.

## 1. Establish the format

Every recipe is a Picture Profile (`format: 'pp'`). Creative Look recipes were
removed on 2026-11-07 (owner). If the user supplies a Look code, Fade or
Clarity, say ColorLab no longer takes Creative Look recipes and stop.

## 2. Collect the settings

Ask only for what is missing. Values the user gives in the camera's own notation
(`"+25"`, `"Wide +5"`, `"Manual 92.5% +3"`, `"7000K, B3-M1.5"`) are fine — convert
them to the structured form yourself.

**Do not invent a value the user did not give.** If Detail settings were never
mentioned, ask; do not fill in defaults that will end up on someone's camera.

Watch for these, which are wrong more often than not when supplied by hand:

- `Sharpness Range` is unsigned. If the user writes `"+3"`, store `3`.
- Picture Profile `Saturation` is −32…+32.

## 3. Assign the ID

Sequential, zero-padded to three digits:

```bash
node -e "const r=require('./data/recipes.seed.json');const f='PP';\
const n=r.filter(x=>x.id.replace(/^SCL-/,'').startsWith(f+'-')).map(x=>+x.id.slice(-3));\
console.log('next: '+f+'-'+String(Math.max(0,...n)+1).padStart(3,'0'))"
```

- `id` is `PP-NNN` (no `SCL-` prefix since 2026-10-24).
- `name` is never written by hand: `npm run seed:emit` computes it from the
  recipe's palette (`nameFor` in `src/lib/recipes/names.ts`), e.g.
  `PP-001-Warm Soft Rich`, and `/admin` the same way on every save. An
  originals entry has no `name` field.
- `slug` is the code, lowercased: `slugFor(id)`, e.g. `pp-048`. Never typed
  by hand and never derived from the name, so a later rename moves no URL;
  `names.test.ts` fails a slug that is not.

## 4. Validate before writing anything

Never insert first and check later.

```ts
import { recipeSchema } from '@/lib/camera/schema';
const parsed = recipeSchema.safeParse(candidate);
if (!parsed.success) console.error(parsed.error.issues);
```

If it fails, fix the **data** — never widen the schema to accommodate a value.
The schema reflects what the camera physically accepts; a failure means the recipe
cannot be shot as written. Report the specific field back to the user.

## 5. Descriptions

Write the English description first: 2–3 sentences on the mood and what it suits.
Concrete and evocative, no marketing filler.

Then Vietnamese — **the description only.** Recipe name, parameter labels, Look
codes, gamma names and WB values all stay in English. Descriptions live in
`recipe_translations`, keyed by `(recipe_id, locale)`.

## 6. Images

None. A recipe carries no photograph of its own: the card shows the colour
derived from its settings, and pictures come only from readers, who
contribute a URL on the recipe page (`community_photos`). Do not upload,
vendor or hotlink one.

## 7. Finish

```bash
npm test        # must pass
npm run dev     # check the card and the detail page render
```

Confirm the new recipe appears in the grid, its filters match, and the detail page
shows every parameter with the correct sign.
