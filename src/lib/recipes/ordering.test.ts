import { describe, expect, it } from 'vitest';
import recipesSeed from '../../../data/recipes.seed.json';
import { listRecipes } from './source';

/**
 * The catalogue's order, offline.
 *
 * It used to be partitioned photographs-first (`photosFirst`), because a run
 * of colour fields at the top of the grid read as broken images. No recipe
 * carries a photograph any more, so there is nothing to partition on: the
 * offline reader serves the seed in its own order, as the online one serves
 * the table ordered by id. Deterministic either way — an unstable order would
 * reshuffle the grid on every request with nothing about the data changed.
 */

describe('listRecipes serves the whole catalogue', () => {
  it('returns all recipes with unique ids', async () => {
    const all = await listRecipes('en');
    expect(new Set(all.map((v) => v.id)).size).toBe(all.length);
    expect(all.some((v) => v.id.startsWith('PP-'))).toBe(true);
    expect(all.every((v) => v.format === 'pp')).toBe(true);
  });

  it('keeps the seed\'s own order, with nothing moved to the front', async () => {
    const published = (recipesSeed as { id: string; published: boolean }[])
      .filter((r) => r.published)
      .map((r) => r.id);
    expect((await listRecipes('en')).map((v) => v.id)).toEqual(published);
  });
});
