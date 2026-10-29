import type { Palette, SwatchId } from '@/lib/camera/palette';
import type { Recipe } from '@/lib/camera/schema';
import { parseRecipeName } from './names';
import { recipeIdKey } from './recipe-id';
import { recipeTitle } from './title';

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

export const MARK_SIZES = ['xs', 's', 'm', 'l'] as const;
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
  const parsed = parseRecipeName(name);
  /* A name the vocabulary does not parse still reads its words: the code in
     front of them (`PP-080-`) is not one. */
  const words = parsed
    ? parsed.words
    : recipeTitle(name).replace(/^(?:SCL-)?(?:PP|CL)-\d{3}-/, '').split(/\s+/);
  return words
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

/* ---------------------------------------------------------------------------
   Bokeh
--------------------------------------------------------------------------- */

/** FNV-1a: a stable seed from the code, so a card is laid out the same on every render. */
function seedOf(key: string): number {
  let h = 2166136261;
  for (const ch of key) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** mulberry32. Deterministic, so the server and every re-render agree. */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type BokehLight = {
  /** Centre, in percent of the slot. */
  readonly x: number;
  readonly y: number;
  /** Diameter in px. */
  readonly size: number;
  readonly hue: SwatchId;
  readonly opacity: number;
};

export type Bokeh = {
  readonly discs: readonly BokehLight[];
  readonly sparks: readonly BokehLight[];
  /** Where the wash of the mid swatch is centred, in percent. */
  readonly wash: { readonly x: number; readonly y: number };
};

export const BOKEH_DISCS = 10;
export const BOKEH_SPARKS = 3;

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Out-of-focus lights in the recipe's six hues, spread over the whole slot
 * with the object standing in front of them. Seeded on the code, so the same
 * recipe is lit the same way everywhere and two cards side by side never are.
 * The colours are the recipe's swatches: a warm recipe glows warm, a
 * monochrome one grey. It is a reading of the settings like the palette,
 * never a preview.
 */
export function bokehFor(id: string): Bokeh {
  const next = rng(seedOf(markCode(id)));
  const discs = Array.from({ length: BOKEH_DISCS }, (_, i) => ({
    hue: MARK_HUES[i % MARK_HUES.length],
    x: round1(3 + next() * 94),
    y: round1(5 + next() * 86),
    size: Math.round(16 + next() * 30),
    opacity: Math.round((0.45 + next() * 0.3) * 100) / 100,
  }));
  const sparks = Array.from({ length: BOKEH_SPARKS }, () => ({
    hue: MARK_HUES[Math.floor(next() * MARK_HUES.length)],
    x: round1(4 + next() * 92),
    y: round1(8 + next() * 80),
    size: Math.round(5 + next() * 6),
    opacity: 0.7,
  }));
  const wash = { x: Math.round(20 + next() * 60), y: Math.round(20 + next() * 60) };
  return { discs, sparks, wash };
}
