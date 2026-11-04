import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { accentCss } from '@/lib/camera/color';
import { FORMAT_LABELS } from '@/lib/camera/constants';
import type { RecipeView } from '@/lib/recipes/source';
import type { SituationId } from '@/lib/recipes/taxonomy';
import { markBackdrop } from '@/lib/recipes/mark';
import { recipeIdKey } from '@/lib/recipes/recipe-id';
import { recipeMood } from '@/lib/recipes/title';
import { RecipeMark } from './recipe-mark';

/**
 * Grid card: the recipe's mark on a 160px stage, then two lines — the mood
 * as the title, the situations under it. No recipe carries a photograph;
 * pictures come only from readers, on the recipe page.
 *
 * Compact on purpose (owner, 2026-10-29: "too big and ugly"). It was a 210px
 * slot under three lines — a format eyebrow, the full name, the situations —
 * and printed the code twice and the format twice. Now each fact appears
 * once: the silhouette (cartridge or clapperboard) and the code's prefix on
 * the mark say the format, so the eyebrow went (a label over a heading is the
 * eyebrow CLAUDE.md removes everywhere); the code is printed on the mark
 * only; the title is the mood, the part a reader remembers. The code and the
 * format are still spoken to a screen reader, inside the heading.
 *
 * The mark is the `sm` size on the stage, the `s` one when the card is
 * narrower than 12rem (two to a row on a phone) — a container query, so the
 * same card works in the browse grid and the recipe page's related row.
 *
 * `.surface` is the whole elevation: white 5% film, blur 30, elevation 1 and
 * the 1px specular highlight that stands in for the border.
 */
export function RecipeCard({
  recipe,
  situationLabels,
}: {
  recipe: RecipeView;
  /** `browse.situations.*` in the reader's locale, resolved once by the page. */
  situationLabels: Readonly<Record<SituationId, string>>;
}) {
  const accent = accentCss(recipe.accent);

  /* The two formats are mutually exclusive on the camera (rule 2), and the two
     names stay in English because they are Sony menu items, not copy (rule 3,
     same as `structured-data.tsx`). */
  const kind = FORMAT_LABELS[recipe.format];
  const situations = recipe.situations.map((s) => situationLabels[s]).join(' · ');

  return (
    /* No `prefetch={true}`. The recipe route renders on demand, so an eager
       prefetch is not a cheap cache warm — it is a full server render, and each
       one costs its own round trip to Supabase. The list page renders a card
       per recipe, so one visit to /colorlab fanned out into a server render of
       every recipe page in the catalogue, for pages the reader never opened.
       That is what put 5,373 requests a day on /rest/v1/recipes, ~95% of them
       for nobody. Link's default (auto) prefetches only the loading boundary of
       a dynamic route, which is the behaviour this wanted all along. */
    <Link
      href={`/recipe/${recipe.slug}`}
      className="surface block overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-1"
      /* Scopes ::selection inside the card to this recipe's own colour. */
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <div className="h-40 w-full overflow-hidden">
        <MarkSlot recipe={recipe} />
      </div>

      <div className="flex flex-col gap-1 px-4 pt-3 pb-4">
        <h3 className="text-title-3 font-semibold leading-snug tracking-[-0.02em] text-ink line-clamp-2">
          {/* The mark prints the code and is decorative to a screen reader,
              so the heading speaks the code and the format first. */}
          <span className="sr-only">
            {recipeIdKey(recipe.id)}, {kind}:{' '}
          </span>
          {recipeMood(recipe.name)}
        </h3>

        {situations ? <p className="meta line-clamp-1">{situations}</p> : null}
      </div>
    </Link>
  );
}

/**
 * The slot: the recipe's own gradient backdrop, its mark standing in the middle.
 * One labelled image, with the palette's own label — what the colours read as —
 * since the mark repeats the name written under it.
 */
async function MarkSlot({ recipe }: { recipe: RecipeView }) {
  const [t, tBrowse] = await Promise.all([getTranslations('palette'), getTranslations('browse')]);
  const label = t('label', { tone: tBrowse(`tones.${recipe.tone}`), style: tBrowse(`styles.${recipe.style}`) });
  return (
    <div
      role="img"
      aria-label={label}
      className="@container relative h-full w-full shadow-[var(--elevation-inset)]"
      style={{ background: markBackdrop(recipe.palette) }}
    >
      {/* The card's mark is 156px wide; a card narrower than 12rem — two to
          a row on a phone — takes the 120px one instead of cutting it off. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <RecipeMark recipe={recipe} size="sm" className="hidden @min-[12rem]:block" backdrop={false} />
        <RecipeMark recipe={recipe} size="s" className="@min-[12rem]:hidden" backdrop={false} />
      </div>
    </div>
  );
}
