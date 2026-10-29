import { describe, expect, it } from 'vitest';

import recipesSeed from '../../../data/recipes.seed.json';
import { CREATIVE_LOOK_CODES, PP_GAMMA } from '@/lib/camera/constants';
import type { Recipe } from '@/lib/camera/schema';
import { BOKEH_DISCS, BOKEH_SPARKS, bokehFor, markBase, markCode, markInitials, MARK_HUES } from './mark';

const seed = recipesSeed as unknown as Recipe[];

describe('markInitials', () => {
  it('takes the first letter of each word of the mood', () => {
    expect(markInitials('CL-013-Golden Matte Muted')).toBe('GMM');
    expect(markInitials('PP-048-Neutral Soft Muted')).toBe('NSM');
  });

  /* The vocabulary changes (2026-10-28 dropped HLG): a stored name it no
     longer parses still gives its words, never the code's letter. */
  it('reads a name the vocabulary no longer parses without the code', () => {
    expect(markInitials('PP-080-Range HLG Daylight')).toBe('RHD');
  });

  /* A row still on the legacy shape until the library sync reaches it. */
  it('reads a legacy name from its title, diacritics kept', () => {
    expect(markInitials('SCL-PP-001: Mojave Sun')).toBe('MS');
    expect(markInitials('SCL-CL-002: Đà Lạt Mist')).toBe('ĐLM');
    expect(markInitials('SCL-PP-009: Sài Gòn Café Sữa Đá')).toBe('SGC');
  });

  it('gives every seed recipe two or three letters', () => {
    for (const r of seed) expect(markInitials(r.name), r.name).toMatch(/^[A-Z]{2,3}$/);
  });
});

describe('the code and the base', () => {
  /* Initials may repeat (VDC, VCN); the code under them is what never does. */
  it('prints a code that is unique across the catalogue, in either id shape', () => {
    const codes = seed.map((r) => markCode(r.id));
    expect(new Set(codes).size).toBe(codes.length);
    expect(markCode('SCL-PP-001')).toBe('PP-001');
  });

  /* Rule 1: Sony's own string, read from the validated settings. */
  it('prints the Look code or the gamma exactly as the camera does', () => {
    for (const r of seed) {
      const base = markBase(r);
      if (r.format === 'cl') expect(CREATIVE_LOOK_CODES).toContain(base);
      else expect(PP_GAMMA as readonly string[]).toContain(base);
    }
  });
});

describe('bokehFor', () => {
  it('lights the same recipe the same way every time, whichever id shape it holds', () => {
    expect(bokehFor('CL-013')).toEqual(bokehFor('CL-013'));
    expect(bokehFor('SCL-PP-001')).toEqual(bokehFor('PP-001'));
  });

  it('lights two recipes differently', () => {
    const layouts = new Set(seed.map((r) => JSON.stringify(bokehFor(r.id))));
    expect(layouts.size).toBe(seed.length);
  });

  it('keeps every light inside the slot, in the recipe’s six hues', () => {
    for (const r of seed) {
      const { discs, sparks, wash } = bokehFor(r.id);
      expect(discs).toHaveLength(BOKEH_DISCS);
      expect(sparks).toHaveLength(BOKEH_SPARKS);
      for (const l of [...discs, ...sparks]) {
        expect(l.x).toBeGreaterThanOrEqual(0);
        expect(l.x).toBeLessThanOrEqual(100);
        expect(l.y).toBeGreaterThanOrEqual(0);
        expect(l.y).toBeLessThanOrEqual(100);
        expect(MARK_HUES).toContain(l.hue);
        expect(l.opacity).toBeLessThanOrEqual(0.75);
      }
      expect(wash.x).toBeGreaterThanOrEqual(20);
      expect(wash.x).toBeLessThanOrEqual(80);
    }
  });

  /* Ten discs over six hues: every hue is lit at least once. */
  it('uses all six hues', () => {
    expect(new Set(bokehFor('CL-001').discs.map((d) => d.hue)).size).toBe(MARK_HUES.length);
  });
});
