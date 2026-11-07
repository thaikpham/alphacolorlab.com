import { describe, expect, it } from 'vitest';
import {
  NO_FILTERS,
  browseFilters,
  browseHref,
  colorlabPath,
  colorlabSearch,
  facetCounts,
  hasBrowseFilters,
  MORE_FOR_SITUATION_LIMIT,
  matchesBrowse,
  moreForSituation,
  situationCounts,
  visibleSituations,
  type Browsable,
  type Relatable,
} from './browse';

const r = (
  situations: Browsable['situations'],
  style: Browsable['style'],
  tone: Browsable['tone'],
): Browsable => ({
  situations,
  style,
  tone,
});

const CATALOGUE: Browsable[] = [
  r(['portrait', 'daily'], 'natural', 'warm'),
  r(['portrait'], 'film', 'mono'),
  r(['portrait', 'street'], 'film', 'cool'),
  r(['street', 'daily'], 'vivid', 'neutral'),
  r(['travel'], 'vivid', 'warm'),
  r(['night'], 'film', 'cool'),
];

describe('filters from the URL', () => {
  it('reads style, tone and q, and drops a value it does not know', () => {
    expect(browseFilters('portrait', { style: 'film', tone: 'warm', q: ' cafe ' })).toEqual({
      situation: 'portrait',
      style: 'film',
      tone: 'warm',
      q: 'cafe',
    });
    expect(browseFilters(null, { style: 'FILM', tone: 'sepia', q: ['a', 'b'] })).toEqual({
      situation: null,
      style: null,
      tone: null,
      q: 'a',
    });
    expect(browseFilters(null, {})).toEqual(NO_FILTERS);
  });

  it('never reads ?situation= — the situation is the path — nor ?format=', () => {
    expect(browseFilters(null, { situation: 'portrait' }).situation).toBeNull();
    expect(browseFilters(null, { format: 'cl' })).toEqual(NO_FILTERS);
  });

  it('knows when nothing is chosen', () => {
    expect(hasBrowseFilters(NO_FILTERS)).toBe(false);
    expect(hasBrowseFilters({ ...NO_FILTERS, tone: 'cool' })).toBe(true);
    expect(hasBrowseFilters({ ...NO_FILTERS, q: 'x' })).toBe(true);
  });
});

describe('the catalogue search keeps the reader’s filters', () => {
  it('merges a new query into the style and tone already in the URL', () => {
    expect(colorlabSearch(new URLSearchParams('style=film&tone=warm'), { q: 'cafe' })).toBe(
      'q=cafe&style=film&tone=warm',
    );
    expect(colorlabSearch(new URLSearchParams('q=old&style=film'), { q: '85' })).toBe('q=85&style=film');
  });

  it('drops a cleared query, an empty value and an unknown one', () => {
    expect(colorlabSearch(new URLSearchParams('q=a7&tone=cool'), { q: '' })).toBe('tone=cool');
    expect(colorlabSearch(new URLSearchParams('style=film'), { style: '' })).toBe('');
    expect(colorlabSearch(new URLSearchParams('style=sepia&tone=hot'), {})).toBe('');
    expect(colorlabSearch(null, { q: '  ' })).toBe('');
  });

  it('carries no legacy parameter', () => {
    expect(colorlabSearch(new URLSearchParams('format=cl&look=FL&tag=x&q=a'), {})).toBe('q=a');
    expect(colorlabSearch(new URLSearchParams('format=pp&tone=cool&style=film'), { q: 'x' })).toBe(
      'q=x&style=film&tone=cool',
    );
  });
});

describe('addresses', () => {
  it('puts the situation in the path and the rest in the query', () => {
    expect(colorlabPath(null)).toBe('/colorlab');
    expect(colorlabPath('portrait')).toBe('/colorlab/portrait');
    expect(browseHref({ ...NO_FILTERS, situation: 'portrait', style: 'film' })).toBe(
      '/colorlab/portrait?style=film',
    );
    expect(browseHref({ ...NO_FILTERS, tone: 'mono', q: 'hẻm' })).toBe('/colorlab?q=h%E1%BA%BBm&tone=mono');
    expect(browseHref({ ...NO_FILTERS, situation: 'night', tone: 'cool' })).toBe('/colorlab/night?tone=cool');
    expect(browseHref(NO_FILTERS)).toBe('/colorlab');
  });
});

describe('matching and counting', () => {
  it('ANDs the three groups and ignores an empty one', () => {
    expect(matchesBrowse(CATALOGUE[0], NO_FILTERS)).toBe(true);
    expect(matchesBrowse(CATALOGUE[0], { ...NO_FILTERS, situation: 'portrait', style: 'natural', tone: 'warm' })).toBe(true);
    expect(matchesBrowse(CATALOGUE[0], { ...NO_FILTERS, situation: 'portrait', style: 'film' })).toBe(false);
    expect(matchesBrowse(CATALOGUE[0], { ...NO_FILTERS, situation: 'night' })).toBe(false);
  });

  it('counts each group against the other two, so a chip says what pressing it yields', () => {
    const f = facetCounts(CATALOGUE, { ...NO_FILTERS, situation: 'portrait' });
    /* Situations are counted with no situation applied: the row stays whole. */
    expect(f.situations.portrait).toBe(3);
    expect(f.situations.street).toBe(2);
    expect(f.situations.night).toBe(1);
    expect(f.situations.heritage).toBe(0);
    /* Styles and tones are counted inside the chosen situation. */
    expect(f.styles).toEqual({ natural: 1, range: 0, vivid: 0, film: 2 });
    expect(f.tones).toEqual({ warm: 1, neutral: 0, cool: 1, mono: 1 });

    const g = facetCounts(CATALOGUE, { ...NO_FILTERS, situation: 'portrait', style: 'film' });
    expect(g.tones).toEqual({ warm: 0, neutral: 0, cool: 1, mono: 1 });
    /* The style row is counted with the style released, so the natural chip
       still shows what it would yield. */
    expect(g.styles.natural).toBe(1);
    /* And the situation row is counted inside style=film: one street recipe. */
    expect(g.situations.street).toBe(1);
  });

  it('advertises a situation only from three recipes', () => {
    expect(situationCounts(CATALOGUE)).toMatchObject({ portrait: 3, street: 2, daily: 2, travel: 1, night: 1, heritage: 0 });
    expect(visibleSituations(CATALOGUE)).toEqual(['portrait']);
    expect(visibleSituations([...CATALOGUE, r(['street'], 'film', 'warm')])).toEqual(['portrait', 'street']);
  });
});

describe('more for the same situation', () => {
  const rel = (
    id: string,
    situations: Relatable['situations'],
    style: Relatable['style'] = 'natural',
    tone: Relatable['tone'] = 'neutral',
    published = true,
  ): Relatable => ({ id, situations, style, tone, published });
  const ids = (m: ReturnType<typeof moreForSituation>) => m?.recipes.map((x) => x.id);

  const self = rel('PP-001', ['portrait', 'daily'], 'film', 'warm');

  it('reads the first situation, and leaves out the recipe itself and every other situation', () => {
    const more = moreForSituation(self, [
      self,
      rel('PP-002', ['street']),
      rel('PP-003', ['daily', 'portrait']),
      rel('PP-004', ['travel', 'daily']),
    ]);
    expect(more?.situation).toBe('portrait');
    /* PP-004 shares `daily`, a secondary situation, and not the primary. */
    expect(ids(more)).toEqual(['PP-003']);
  });

  it('leaves out an unpublished recipe', () => {
    expect(ids(moreForSituation(self, [rel('PP-002', ['portrait'], 'natural', 'neutral', false), rel('PP-003', ['portrait'])]))).toEqual([
      'PP-003',
    ]);
  });

  it('shows six at most', () => {
    const many = Array.from({ length: 10 }, (_, i) => rel(`PP-1${10 + i}`, ['portrait']));
    expect(MORE_FOR_SITUATION_LIMIT).toBe(6);
    expect(ids(moreForSituation(self, many))).toEqual(many.slice(0, 6).map((x) => x.id));
    expect(ids(moreForSituation(self, many, 2))).toEqual(['PP-110', 'PP-111']);
  });

  it('puts the recipes sharing more of its situations, style and tone first, then keeps catalogue order', () => {
    const catalogue = [
      rel('PP-010', ['portrait']), // 1: the situation only
      rel('PP-011', ['portrait'], 'film'), // 2: and the style
      rel('PP-012', ['portrait'], 'vivid', 'warm'), // 2: and the tone
      rel('PP-013', ['portrait', 'daily'], 'film', 'warm'), // 4: everything
      rel('PP-014', ['portrait', 'daily']), // 2: both situations
      rel('PP-015', ['portrait']), // 1
    ];
    expect(ids(moreForSituation(self, catalogue))).toEqual(['PP-013', 'PP-011', 'PP-012', 'PP-014', 'PP-010', 'PP-015']);
    /* The same answer however often it is asked, and the input is not touched. */
    const before = catalogue.map((x) => x.id);
    expect(ids(moreForSituation(self, catalogue))).toEqual(ids(moreForSituation(self, catalogue)));
    expect(catalogue.map((x) => x.id)).toEqual(before);
  });

  it('is null — no empty row — when nothing else shares the situation, or the recipe has none', () => {
    expect(moreForSituation(self, [self, rel('PP-002', ['street', 'daily'])])).toBeNull();
    expect(moreForSituation(self, [])).toBeNull();
    expect(moreForSituation(self, [self])).toBeNull();
    expect(moreForSituation(rel('PP-020', []), [rel('PP-021', ['portrait'])])).toBeNull();
    expect(moreForSituation(self, [rel('PP-002', ['portrait'])], 0)).toBeNull();
  });
});
