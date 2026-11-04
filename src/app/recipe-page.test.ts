import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The recipe page's layout, outline and labels — source assertions, because
 * this suite has no DOM and no browser to measure a column in. Each case is a
 * defect found by reading the CSS against the screen widths it lands on.
 */

const page = readFileSync('src/app/[locale]/recipe/[slug]/page.tsx', 'utf8');
const cards = readFileSync('src/components/param-cards.tsx', 'utf8');
const gallery = readFileSync('src/components/recipe-gallery.tsx', 'utf8');
const comments = readFileSync('src/components/recipe-comments.tsx', 'utf8');
const messages = ['en', 'vi'].map(
  (l) => JSON.parse(readFileSync(`messages/${l}.json`, 'utf8')) as { recipe: Record<string, string> },
);

describe('one reading column', () => {
  /* Owner, 2026-10-28: the settings as cards, six to a row on a desktop, so
     the page is one column at every width and source order is reading order.
     The two-column grid with a sticky settings column went with the rows. */
  it('keeps the reading width and drops the two columns', () => {
    expect(page).toContain('max-w-[86rem]');
    expect(page).not.toMatch(/lg:col-span-|lg:sticky|lg:grid-cols-12/);
  });

  /* It was hero → gallery → AI → community → white balance → settings: the
     settings, the reason to open a recipe, started on screen 3 of 6. */
  it('reads hero, settings, then the readers’ part', () => {
    const at = (part: string) => page.indexOf(`data-part="${part}"`);
    expect(at('hero')).toBeGreaterThan(-1);
    expect(at('settings')).toBeGreaterThan(at('hero'));
    expect(at('participation')).toBeGreaterThan(at('settings'));
    expect(page.indexOf('<WbPanel')).toBeGreaterThan(at('settings'));
    expect(page.indexOf('<WbPanel')).toBeLessThan(page.indexOf('<PpCards'));
    expect(page.indexOf('<RecipeGallery')).toBeGreaterThan(at('participation'));
    expect(page.indexOf('<RecipeComments')).toBeGreaterThan(page.indexOf('<RecipeGallery'));
  });

  /* Owner, 2026-10-28: "propose & vote on a new version" and "tweak with AI"
     are gone, and so is the nine-swatch strip — the mark carries the colour. */
  it('has no proposals, no AI tweak and no palette strip', () => {
    expect(page).not.toMatch(/TweakPanel|RecipeCommunitySection|RecipePalette|ProposalList/);
    expect(gallery).not.toMatch(/OPEN_PROPOSAL_EVENT|OPEN_TWEAK_EVENT|proposeVersion|tweakAi/);
    const code = comments.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/proposal|vote|heart/i);
    for (const m of messages) {
      expect(m).not.toHaveProperty('tweak');
      expect(m.recipe).not.toHaveProperty('proposeVersion');
      expect(m.recipe).not.toHaveProperty('tweakAi');
    }
  });
});

describe('the hero', () => {
  /* The mark at every width: small beside the code and the name on a phone,
     M from sm, L from xl. The description and the ways back sit under the
     name from sm and under both on a phone. */
  it('puts the mark beside the code and the name, one size per width', () => {
    expect(page).toContain('<RecipeMark recipe={recipe} size="s" className="sm:hidden" />');
    expect(page).toContain('<RecipeMark recipe={recipe} size="m" className="hidden sm:block xl:hidden" />');
    expect(page).toContain('<RecipeMark recipe={recipe} size="l" className="hidden xl:block" />');
    expect(page).toContain('grid grid-cols-[auto_minmax(0,1fr)]');
    expect(page.indexOf('<RecipeMark')).toBeLessThan(page.indexOf('<h1'));
    expect(page).toMatch(/col-span-2 sm:col-span-1 sm:col-start-2/);
  });

  /* Owner, 2026-10-28: the situation, style and tone chips went from the
     hero; the "More for …" row and the browse page lead back instead. */
  it('carries no chips back into the catalogue', () => {
    const hero = page.slice(page.indexOf('data-part="hero"'), page.indexOf('data-part="settings"'));
    expect(hero).not.toMatch(/chip-action|<Link\b/);
    expect(page).not.toContain('browseChips');
  });
});

describe('the parameter cards', () => {
  /* One parameter per card: the label, the value under it, and an info
     button that opens the card's quote box — a native popover the browser
     toggles, closes on a second press, a click outside or Escape (owner,
     2026-10-29). Both kinds of help live in the box (Rule 4). */
  it('open a native popover from an info button, with both kinds of help', () => {
    expect(cards).toMatch(/<button\s+type="button"\s+popoverTarget=\{popId\}/);
    expect(cards).toMatch(/<div id=\{popId\} popover="auto" className="param-pop"/);
    expect(cards).toContain('{effect[locale]}');
    expect(cards).toContain('AXIS_LABELS[effect.axis][locale]');
    expect(cards).toContain('{explanation}');
    expect(cards).not.toMatch(/<details className="param-row/);
    expect(cards).not.toMatch(/'use client'/);
    expect(cards).not.toMatch(/>\s*\?\s*</);
  });

  /* The button names what it opens, in the reader's language, and meets the
     44px floor on a touch screen without widening under a mouse. */
  it('name the button and size it for touch', () => {
    expect(cards).toContain("aria-label={t('explain', { param: label })}");
    expect(cards).toMatch(/className="param-info[^"]*pointer-coarse:h-11 pointer-coarse:w-11/);
    for (const m of messages) expect(typeof (m.recipe as Record<string, string>).explain).toBe('string');
  });

  /* The combined cast belongs to no single dial, so it sits on the wide
     White Balance card, never on Temperature (Rule 4). */
  it('keep the white balance summary off the dials', () => {
    expect(cards).toMatch(/const \{ net, interplay \} = wbSummary\(wb\)/);
    const dial = cards.slice(cards.indexOf('export function ParamCard'), cards.indexOf('export function ParamPanel'));
    expect(dial).not.toContain('wbSummary');
  });

  it('take their labels from constants.ts, never a literal per call', () => {
    expect(cards).toMatch(/label=\{PP_PARAM_LABELS\.blackLevel\}/);
    expect(cards).toMatch(/label=\{CL_PARAM_LABELS\[p\]\}/);
    expect(cards).toMatch(/value=\{formatClValue\(p, value\)\}/);
  });
});

describe('the outline', () => {
  /* h1 → h2 (camera settings, sample photos, comments) → h3 (each panel, the
     contribute form). axe's heading-order fails a skip. */
  it('steps h1 → h2 → h3 and never skips', () => {
    expect(page).toMatch(/<h2 id="camera-settings" className="[^"]*">\s*\{t\('paramsLabel'\)\}/);
    expect(cards).toMatch(/<h3 className="label mb-3">\{title\}<\/h3>/);
    expect(cards).not.toMatch(/<h2\b/);
    expect(gallery).toMatch(/<h2 id="sample-photos"/);
    expect(gallery).toMatch(/<h3 className="text-body-lg font-semibold text-ink">\{t\('formTitle'\)\}<\/h3>/);
    expect(gallery).not.toMatch(/<h[4-6]\b/);
    expect(comments).toMatch(/<h2 id="comments-title"/);
  });
});

describe('the photo grid', () => {
  /* The way to add a photograph is the grid's last cell (owner, 2026-10-28);
     with no photographs it is the whole grid — a title and a button. */
  it('ends with the contribute tile, and has no empty-state sentence', () => {
    const grid = gallery.slice(gallery.indexOf('<ul className="grid'), gallery.indexOf('</ul>', gallery.indexOf('<ul className="grid')));
    expect(grid.lastIndexOf('<ContributeTile')).toBeGreaterThan(grid.lastIndexOf('allPhotos.map'));
    expect(gallery).not.toContain('galleryEmpty');
    for (const m of messages) expect(m.recipe).not.toHaveProperty('galleryEmpty');
  });
});

describe('labels', () => {
  /* A label restating the heading under it is the eyebrow CLAUDE.md removed. */
  it('puts no eyebrow over the White Balance heading', () => {
    expect(page).not.toContain('wbEngineLabel');
    for (const m of messages) expect(m.recipe).not.toHaveProperty('wbEngineLabel');
  });

  /* Uppercase is `.label` only, and never over three words: Vietnamese
     diacritics need the ascender room. vi rendered "TẤT CẢ CÔNG THỨC",
     "CÀI ĐẶT MÁY ẢNH" and "CL: BW (BLACK & WHITE)". */
  it('sets no uppercase over more than three words', () => {
    expect(page).not.toMatch(/className="[^"]*\buppercase\b/);
    expect(page).not.toMatch(/className="label[^"]*">\{t\('(back|paramsLabel)'\)\}/);
    expect(page).toMatch(/CL: \{look\.code\}\s*<span className="normal-case">\(\{look\.label\}\)<\/span>/);
  });
});

describe('the row of other recipes for the same situation', () => {
  const card = readFileSync('src/components/recipe-card.tsx', 'utf8');
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const browse = ['en', 'vi'].map(
    (l) => (JSON.parse(readFileSync(`messages/${l}.json`, 'utf8')) as { browse: Record<string, unknown> }).browse,
  );

  /* The browse's own unfiltered read — no new cache key, no new query — and
     nothing request-bound beside it, so the page stays prerendered. */
  it('reads the catalogue the browse reads, once, and stays static', () => {
    expect(code(page).match(/listRecipes\([^)]*\)/g)).toEqual(['listRecipes(locale)']);
    expect(page).toContain('const more = moreForSituation(recipe, catalogue, MORE_FOR_SITUATION_CANDIDATES);');
    expect(page).toMatch(/export async function generateStaticParams\(\)/);
    expect(code(page)).not.toMatch(/\bcookies\(|\bheaders\(|searchParams|force-dynamic|connection\(/);
  });

  it('draws the browse’s card, under an h2 that links to the situation', () => {
    /* The section is the camera island's (more-for-situation.tsx), so a
       camera that can install none of the row draws none; the heading and
       the cards are rendered here, on the server. */
    const island = readFileSync('src/components/more-for-situation.tsx', 'utf8');
    expect(page).toMatch(/\{more && rows \? \(\s*<MoreForSituation/);
    expect(island).toContain('<section aria-labelledby="more-for-situation" className="mt-16 flex flex-col gap-4">');
    expect(page).toMatch(/<h2 id="more-for-situation" className="text-title-3 font-semibold text-ink">\s*<Link\s+href=\{colorlabPath\(more\.situation\)\}/);
    expect(page).toContain("{tBrowse('moreFor', { situation: situationLabels[more.situation] })}");
    expect(page).toContain('<RecipeCard key={r.id} recipe={r} situationLabels={situationLabels} />');
    expect(island).toMatch(/<li key=\{id\} className="grid">\s*\{cards\[id\]\}/);
    expect(island).toContain('grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6');
    /* No `see all` line and no helper copy: the heading is the link. */
    const row = page.slice(page.indexOf('<MoreForSituation'), page.indexOf('/>', page.indexOf('<RecipeCard key')));
    expect(row).not.toMatch(/<p\b/);
    expect(row.match(/<Link\b/g)).toHaveLength(1);
    expect(code(island)).not.toMatch(/<p\b|<Link\b/);
  });

  /* An eager prefetch of every card is what once put thousands of requests a
     day on the recipes table. The card keeps Link's default. */
  it('keeps the card’s prefetch at Link’s default', () => {
    expect(code(card)).not.toMatch(/prefetch/);
    expect(code(page)).not.toMatch(/prefetch/);
  });

  it('has its heading in both languages, the situation interpolated', () => {
    for (const m of browse) {
      expect(typeof m.moreFor).toBe('string');
      expect(m.moreFor).toContain('{situation}');
    }
    expect(browse[0].moreFor).not.toEqual(browse[1].moreFor);
  });
});
