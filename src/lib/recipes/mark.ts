import type { Palette, SwatchId } from '@/lib/camera/palette';
import type { Recipe } from '@/lib/camera/schema';
import { recipeIdKey } from './recipe-id';
import { recipeMood } from './title';

/**
 * The recipe mark (owner, 2026-10-28): the card thumbnail that replaced the
 * nine-swatch strip, which readers found hard to choose from. A Picture
 * Profile is a white cinema reel whose film and windows carry the recipe's
 * own swatches. Drawn by `recipe-mark.tsx`; everything
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
 * at most three. `PP-001-Neutral Soft Rich` → `NSR`. A row still on the legacy
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

/** The code printed on the object: `PP-013`, whichever id shape the row holds. */
export const markCode = (id: string): string => recipeIdKey(id);

/**
 * Sony's own name for what the recipe starts from, exactly as the camera
 * prints it: the gamma (`S-Cinetone`, `Cine1`).
 * Read from the validated settings, never retyped (Rule 1).
 */
export const markBase = (recipe: DistributivePick<Recipe, 'format' | 'settings'>): string =>
  recipe.settings.gamma;

export const swatchCss = (palette: Palette): Record<SwatchId, string> =>
  Object.fromEntries(palette.map((s) => [s.id, s.css])) as Record<SwatchId, string>;

/** The six hues, in the palette's own order: what the sticker and the bokeh draw. */
export const MARK_HUES: readonly SwatchId[] = ['red', 'skin', 'yellow', 'foliage', 'sky', 'blossom'];
