import { describe, expect, it } from 'vitest';

import recipesSeed from '../../../data/recipes.seed.json';
import { PP_GAMMA } from '@/lib/camera/constants';
import type { Recipe } from '@/lib/camera/schema';
import { markBase, markCode, markInitials } from './mark';

const seed = recipesSeed as unknown as Recipe[];

describe('recipeMood', () => {
  it('drops the code from the name, whichever shape it has', async () => {
    const { recipeMood } = await import('./title');
    expect(recipeMood('CL-013-Golden Matte Muted')).toBe('Golden Matte Muted');
    expect(recipeMood('SCL-PP-001: Mojave Sun')).toBe('Mojave Sun');
    expect(recipeMood('Plain Name')).toBe('Plain Name');
  });
});

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
  it('prints the gamma exactly as the camera does', () => {
    for (const r of seed) {
      const base = markBase(r);
      expect(PP_GAMMA as readonly string[]).toContain(base);
    }
  });
});
