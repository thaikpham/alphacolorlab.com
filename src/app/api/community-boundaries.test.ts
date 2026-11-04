import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Which project each community route is allowed to touch.
 *
 * Community rows — comments and photographs — stay on the
 * control plane, because they are about people: they carry author and voter
 * email addresses, and they are meaningless without the Auth users they belong
 * to. Recipes moved to the content plane. So a single POST now spans both
 * projects, and it does so in a fixed order: ask content whether the recipe
 * exists, then write to control.
 *
 * Getting the order wrong is not a style question. Writing first and checking
 * afterwards leaves an orphan row that no page renders and no foreign key will
 * ever catch, because after the split there *is* no foreign key — the two
 * tables are in different databases. Postgres cannot help here, so this test
 * does.
 *
 * Source assertions rather than request tests, for the same reason the sibling
 * files use them: these handlers need two live projects to execute, and what
 * has to hold is a property of the code.
 */

const ROUTES = {
  comments: 'src/app/api/comments/route.ts',
  photos: 'src/app/api/community-photos/route.ts',
} as const;

const sources = Object.fromEntries(
  Object.entries(ROUTES).map(([name, path]) => [name, readFileSync(path, 'utf8')]),
) as Record<keyof typeof ROUTES, string>;

/** The routes whose row references a recipe by slug: both of them. */
const SLUG_ROUTES = ['comments', 'photos'] as const;

describe.each(Object.entries(ROUTES))('%s', (name, path) => {
  const source = sources[name as keyof typeof ROUTES];

  it('never writes community data with a content credential', () => {
    /* `contentAdmin()` bypasses RLS on the *other* project. A community write
       reaching it would either fail on a table that does not exist there or,
       worse, succeed against a stray one. */
    expect(source).not.toContain('contentAdmin');
  });

  it('never reads operational rows through the content anon client', () => {
    expect(source).not.toMatch(/contentRead\(\)/);
  });

  it('keeps its writes on the control plane', () => {
    if (name === 'photos' || source.includes('.insert(')) {
      expect(source).toContain('controlAdmin()');
    }
  });

  it(`answers 503 rather than 500 when a plane is unreachable (${path})`, () => {
    expect(source).toContain('outageErrorCode');
    expect(source).toMatch(/COMMUNITY_ERRORS\[outage\]/);
  });
});

describe.each(SLUG_ROUTES)('%s', (name) => {
  const source = sources[name];

  const probe = /publishedRecipeExists\(/;

  it('confirms the recipe against the content plane', () => {
    expect(source).toMatch(probe);
  });

  it('confirms it before the control write, not after', () => {
    const check = source.search(probe);
    const insert = source.search(/\.insert\(/);
    expect(check).toBeGreaterThan(-1);
    expect(insert).toBeGreaterThan(-1);
    expect(check).toBeLessThan(insert);
  });

  it('distinguishes an unknown slug from an unreachable content project', () => {
    /* 404 says the recipe is gone; 503 says we could not ask. Collapsing them
       would tell every reader that every recipe had been deleted for as long as
       the content project was restricted. */
    expect(source).toMatch(/communityErrorBody\('recipeNotFound'\)/);
    expect(source).toMatch(/communityErrorBody\(outage\)/);
  });
});

describe('the existence helper', () => {
  const source = readFileSync('src/lib/recipes/existence.ts', 'utf8');

  it('asks the content plane with the anon client, not a service credential', () => {
    expect(source).toContain('contentRead()');
    expect(source).not.toContain('contentAdmin');
  });
});

/* The photo cap filters on `approved`, which anon holds no grant on (0019):
   only the service role may ask, past RLS and every column grant. */
describe('the photo cap', () => {
  it('counts visible rows with the client the photo route writes with, the service role', () => {
    expect(sources.photos).toContain('const db = controlAdmin()');
    expect(sources.photos).toMatch(/visiblePhotoCount\(db, /);
    expect(readFileSync('src/lib/community/gallery.ts', 'utf8')).toContain(".eq('approved', true)");
  });

  it('is never narrowed for the service role by a control migration', () => {
    const dir = 'supabase/migrations';
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => readFileSync(`${dir}/${f}`, 'utf8'))
      .join('\n');
    expect(sql).not.toMatch(/service_role/i);
  });
});
