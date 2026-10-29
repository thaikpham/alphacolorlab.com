import type { Palette, SwatchId } from '@/lib/camera/palette';
import type { Recipe } from '@/lib/camera/schema';
import { recipeIdKey } from './recipe-id';
import { recipeMood } from './title';

/**
 * The recipe mark (owner, 2026-10-28): the card thumbnail that replaced the
 * nine-swatch strip, which readers found hard to choose from. A Creative Look
 * is a 35mm cartridge standing up, a Picture Profile a clapperboard — the
 * format reads from the silhouette before a word is read. Both are white
 * objects whose film, stripes and sticker carry the recipe's own swatches, on
 * a sunken slot lit by its own bokeh. Drawn by `recipe-mark.tsx`; everything
 * here is the part that can be wrong without a screen: what is written on the
 * object and where the lights fall.
 */

export const MARK_SIZES = ['xs', 's', 'sm', 'm', 'l'] as const;
export type MarkSize = (typeof MARK_SIZES)[number];

type DistributivePick<T, K extends keyof T> = T extends unknown ? Pick<T, K> : never;

/** What a mark reads: the identity, the format with its settings, and the swatches. */
export type MarkInput = DistributivePick<Recipe, 'format' | 'settings'> & {
  readonly id: string;
  readonly name: string;
  readonly palette: Palette;
};

/**
 * The handle on the label: the first letter of each word of the name's mood,
 * at most three. `CL-013-Airy Warm Pastel` → `AWP`. A row still on the legacy
 * `SCL-PP-001: Mojave Sun` shape gives `MS` from its title. Two recipes may
 * share initials (VDC, VCN); the code under them never repeats.
 */
export function markInitials(name: string): string {
  return recipeMood(name)
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 3)
    .map((w) => [...w][0])
    .join('')
    .toLocaleUpperCase('en');
}

/** The code printed on the object: `CL-013`, whichever id shape the row holds. */
export const markCode = (id: string): string => recipeIdKey(id);

/**
 * Sony's own name for what the recipe starts from, exactly as the camera
 * prints it: the Look code (`SH`, `VV2`) or the gamma (`S-Cinetone`, `Cine1`).
 * Read from the validated settings, never retyped (Rule 1).
 */
export const markBase = (recipe: DistributivePick<Recipe, 'format' | 'settings'>): string =>
  recipe.format === 'cl' ? recipe.settings.look : recipe.settings.gamma;

export const swatchCss = (palette: Palette): Record<SwatchId, string> =>
  Object.fromEntries(palette.map((s) => [s.id, s.css])) as Record<SwatchId, string>;

/** The six hues, in the palette's own order: what the sticker and the bokeh draw. */
export const MARK_HUES: readonly SwatchId[] = ['red', 'skin', 'yellow', 'foliage', 'sky', 'blossom'];

/**
 * The halo behind a mark (owner, 2026-10-29): the recipe's six hues as one
 * conic sweep, closed on the first, the way the launcher's tiles are lit —
 * but from THIS recipe's swatches, so a warm recipe glows warm and a
 * monochrome one grey. It is the palette read as light, not the launcher's
 * spectrum reused: that stays the one multi-hue gradient the interface itself
 * draws, and the one that rotates. This one holds still.
 */
export const haloSpectrum = (palette: Palette): string => {
  const css = swatchCss(palette);
  const hues = MARK_HUES.map((h) => css[h]);
  return [...hues, hues[0]].join(', ');
};
