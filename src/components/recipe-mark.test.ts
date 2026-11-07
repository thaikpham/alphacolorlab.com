import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import recipesSeed from '../../data/recipes.seed.json';
import { paletteFor } from '@/lib/camera/palette';
import type { Recipe } from '@/lib/camera/schema';
import { markBase, markCode, markInitials, MARK_SIZES, type MarkInput, type MarkSize } from '@/lib/recipes/mark';
import { RecipeMark } from './recipe-mark';

/**
 * The mark as markup. Plain `.ts` with `createElement`: the vitest include
 * pattern is `src/**\/*.test.ts`.
 */

const seed = (recipesSeed as unknown as Recipe[]).map(
  (r) => ({ ...r, palette: paletteFor(r) }) as MarkInput & Recipe,
);
const pp = seed.find((r) => r.id === 'PP-048')!;
const render = (recipe: MarkInput, size: MarkSize = 'm') => renderToStaticMarkup(createElement(RecipeMark, { recipe, size }));

/** The scale's classes, and nothing else, size the type. */
const TYPE_CLASSES = /\b(text-(?:display|title-1|title-3|body))\b|\blabel\b/g;

describe('RecipeMark', () => {
  it('is decorative: the name is always written beside it', () => {
    expect(render(pp)).toMatch(/^<div aria-hidden="true"/);
  });

  it('prints the initials, the code and Sony’s base on the object', () => {
    for (const r of seed) {
      const html = render(r);
      expect(html, r.id).toContain(`>${markInitials(r.name)}<`);
      expect(html, r.id).toContain(`>${markCode(r.id)}<`);
      expect(html, r.id).toContain(`>${markBase(r)}<`);
    }
  });

  /* The leader shows the ramp as three frames; the reel shows the six hues
     through its windows. */
  it('draws a reel with the ramp on its leader and the hues in its windows', () => {
    const swatch = (id: string) => pp.palette.find((s) => s.id === id)!.css;
    const html = render(pp);
    for (const id of ['highlight', 'mid', 'shadow', 'red', 'skin', 'yellow', 'foliage', 'sky', 'blossom']) {
      expect(html, id).toContain(`background:${swatch(id)}`);
    }
    expect(html).toContain('border-radius:50%');
    expect(html).not.toMatch(/repeating-linear-gradient|rotate\(/);
  });

  /* Nothing behind the object: no halo, no gradient tile (owner, 2026-11-04). */
  it('draws no backdrop behind the object', () => {
    expect(render(pp)).not.toMatch(/conic-gradient|mark-glow|absolute inset-0 rounded-lg/);
  });

  /* Rule 2 of the design system: nothing under 13px, and no size off the scale.
     What does not fit drops out instead of shrinking. */
  it('sets type only in the scale’s steps, dropping the code at s and the id at xs', () => {
    for (const size of MARK_SIZES) {
      const html = render(pp, size);
      expect(html).not.toMatch(/font-size/);
      expect(html.match(TYPE_CLASSES)?.length).toBeGreaterThan(0);
    }
    expect(render(pp, 's')).not.toContain(`>${markBase(pp)}<`);
    expect(render(pp, 's')).toContain('>PP-048<');
    expect(render(pp, 'xs')).not.toContain('>PP-048<');
    expect(render(pp, 'xs')).toContain(`>${markInitials(pp.name)}<`);
  });

  it('writes no hex and draws no stroke', () => {
    for (const size of MARK_SIZES) {
      for (const r of [pp]) {
        const html = render(r, size);
        expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
        expect(html).not.toMatch(/\bborder(?:-(?:top|right|bottom|left))?(?:-width|-style)?:|outline:|\bring-/);
      }
    }
  });
});
