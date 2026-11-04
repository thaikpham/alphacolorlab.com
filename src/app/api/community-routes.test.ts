import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireUser, UNAUTHENTICATED, type AuthedUser } from '@/lib/auth/require-user';
import { publishedRecipeExists } from '@/lib/recipes/existence';
import { ControlUnavailableError } from '@/lib/supabase/errors';
import type { Recipe } from '@/lib/camera/schema';
import { MAX_PHOTOS_PER_RECIPE } from '@/lib/community/gallery';
import { PHOTO_COLUMNS } from '@/lib/community/columns';
import { slugAliases, slugHistory } from '@/lib/recipes/slug-aliases';

import * as comments from './comments/route';
import * as photos from './community-photos/route';

/**
 * The community handlers — comments and photographs — executed against a
 * recording fake. (Proposals and votes had handlers here too until the
 * owner removed the feature on 2026-10-28; their tables stay as history.)
 *
 * The sibling files (`community-boundaries`, `identity-not-from-body`,
 * `community-error-codes`) are source assertions, and they said why: the
 * handlers needed live Supabase to run. They do not — the existence probe and
 * the admin routes already run against fakes — and the defects pinned here
 * were all ones a grep could not see: a gallery credit longer than its own
 * CHECK, a read failure answered with invented comments.
 *
 * The fake answers each call the way PostgREST would and records it, so a test
 * can assert both what went to the database and what did not.
 */

type Op = 'select' | 'insert' | 'update' | 'delete';
type Call = {
  client: 'controlRead' | 'controlAdmin';
  table: string;
  op: Op;
  columns?: string;
  options?: { count?: string; head?: boolean };
  payload?: Record<string, unknown>;
  filters: [string, unknown][];
  limit?: number;
};
type Result = { data?: unknown; error?: unknown; count?: number | null };

const db = {
  calls: [] as Call[],
  /** Per-test answers; returning undefined falls through to the default. */
  answer: (() => undefined) as (call: Call, terminal: 'many' | 'single' | 'maybe') => Result | undefined,
};

const env = { control: true, content: true };

function defaultAnswer(call: Call, terminal: 'many' | 'single' | 'maybe'): Result {
  if (call.op === 'insert') {
    return {
      data: { id: `${call.table}-1`, created_at: '2026-10-08T00:00:00.000Z', vote_count: 0, ...call.payload },
      error: null,
    };
  }
  if (call.op === 'select' && call.options?.head) return { data: null, error: null, count: 0 };
  if (call.op === 'select') return { data: terminal === 'many' ? [] : null, error: null };
  return { data: null, error: null };
}

function client(name: Call['client']) {
  return {
    from(table: string) {
      let call: Call | null = null;
      const start = (op: Op, extra: Partial<Call> = {}) => {
        call = { client: name, table, op, filters: [], ...extra };
        db.calls.push(call);
      };
      const settle = (terminal: 'many' | 'single' | 'maybe') =>
        Promise.resolve(db.answer(call!, terminal) ?? defaultAnswer(call!, terminal));
      const builder = {
        select(columns: string, options?: Call['options']) {
          if (call) call.columns = columns;
          else start('select', { columns, options });
          return builder;
        },
        insert(payload: Record<string, unknown>) {
          start('insert', { payload });
          return builder;
        },
        update(payload: Record<string, unknown>) {
          start('update', { payload });
          return builder;
        },
        delete() {
          start('delete');
          return builder;
        },
        eq(column: string, value: unknown) {
          call!.filters.push([column, value]);
          return builder;
        },
        in(column: string, value: unknown) {
          call!.filters.push([column, value]);
          return builder;
        },
        order() {
          return builder;
        },
        limit(n: number) {
          call!.limit = n;
          return builder;
        },
        single: () => settle('single'),
        maybeSingle: () => settle('maybe'),
        then<T>(resolve: (r: Result) => T, reject?: (e: unknown) => T) {
          return settle('many').then(resolve, reject);
        },
      };
      return builder;
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  hasControlConfig: () => env.control,
  hasContentConfig: () => env.content,
  controlRead: () => client('controlRead'),
  controlAdmin: () => client('controlAdmin'),
  contentRead: () => {
    throw new Error('community routes reach the content plane only through existence.ts');
  },
  contentAdmin: () => {
    throw new Error('a community route must never hold a content service credential');
  },
}));

vi.mock('@/lib/auth/require-user', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/require-user')>()),
  requireUser: vi.fn(),
}));

vi.mock('@/lib/recipes/existence', () => ({
  publishedRecipeExists: vi.fn(),
}));

// The limiter is per-process and keyed on the address; every test here is the
// same reader, so the real one would start answering 429 halfway down the file.
vi.mock('@/lib/ai/rate-limit', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 1, retryAfterSeconds: 0 }),
}));

const USER: AuthedUser = {
  id: 'user-1',
  email: 'reader@gmail.com',
  name: 'Nguyễn Văn An',
  avatarUrl: null,
  assuranceLevel: null,
};

/* Real recipes from the seed, never settings typed from memory (Rule 1). */
const seed = JSON.parse(readFileSync('data/recipes.seed.json', 'utf8')) as Recipe[];
const PP = seed.find((r) => r.format === 'pp')!;

const SAMPLE = 'https://cdn.example.com/sample.jpg';

const post = (path: string, body: unknown) =>
  new Request(`https://example.test${path}`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer jwt',
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.7',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const get = (path: string) => new Request(`https://example.test${path}`);

const callsTo = (table: string, op?: Op) =>
  db.calls.filter((c) => c.table === table && (!op || c.op === op));

beforeEach(() => {
  db.calls = [];
  db.answer = () => undefined;
  env.control = true;
  env.content = true;
  vi.mocked(requireUser).mockReset().mockResolvedValue(USER);
  vi.mocked(publishedRecipeExists).mockReset().mockResolvedValue(true);
});

describe('/api/comments', () => {
  it('answers a control read failure with 503 and no invented comments', async () => {
    db.answer = () => ({ data: null, error: { message: 'boom' } });
    const res = await comments.GET(get('/api/comments?slug=daylight-cinema'));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: 'controlUnavailable', comments: [] });
  });

  it('keeps the offline examples for a deployment with no control project', async () => {
    env.control = false;
    const body = await (await comments.GET(get('/api/comments?slug=daylight-cinema'))).json();
    expect(body.source).toBe('memory');
    expect(body.comments.length).toBeGreaterThan(0);
  });

  it('bounds the public read', async () => {
    await comments.GET(get(`/api/comments?slug=${PP.slug}`));
    expect(callsTo('recipe_comments', 'select')[0].limit).toBeGreaterThan(0);
  });
});

describe.each([
  ['comments', () => comments.POST],
  ['photos', () => photos.POST],
] as const)('%s POST with a malformed body', (_name, handler) => {
  it.each(['not json', 'null', '[]'])('answers %s with 400 missingFields', async (raw) => {
    const res = await handler()(post('/api/x', raw));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'missingFields' });
    expect(db.calls.filter((c) => c.op !== 'select')).toHaveLength(0);
  });
});

describe.each([
  ['comments', () => comments.POST],
  ['photos', () => photos.POST],
] as const)('%s POST without a session', (_name, handler) => {
  it('answers 401 and touches no table', async () => {
    /* Every beforeEach signs the reader in, so the 401 was only ever
       grep-checked: `status: 401` anywhere in the file. */
    vi.mocked(requireUser).mockResolvedValue(null);
    const res = await handler()(post('/api/x', { recipeSlug: PP.slug, slug: PP.slug, content: 'x' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual(UNAUTHENTICATED);
    expect(db.calls).toHaveLength(0);
  });
});

describe('POST /api/comments', () => {
  it('signs the comment with the session, whatever the body claims', async () => {
    const res = await comments.POST(
      post('/api/comments', {
        recipeSlug: PP.slug,
        content: 'Lovely in shade.',
        authorEmail: 'someone@else.example',
        authorName: 'Someone Else',
      }),
    );
    expect(res.status).toBe(200);
    const [insert] = callsTo('recipe_comments', 'insert');
    expect(insert.payload).toMatchObject({ author_email: USER.email, author_name: USER.name });
  });
});

describe('GET /api/community-photos', () => {
  it('answers a control read failure with 503, not "ok, no photos"', async () => {
    /* Comments already said so; this one answered 200 with
       empty lists, so an outage read as a recipe nobody had photographed. */
    db.answer = () => ({ data: null, error: { message: 'boom' } });
    const res = await photos.GET(get(`/api/community-photos?slug=${PP.slug}`));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: 'controlUnavailable', photos: [], credits: [] });
  });

  it('answers a thrown read the same way', async () => {
    db.answer = () => {
      throw new Error('socket hang up');
    };
    const res = await photos.GET(get(`/api/community-photos?slug=${PP.slug}`));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('controlUnavailable');
  });

  /* A photo hidden in /admin/colorlab must not come back here. The anon
     client is what guarantees it: 0002's policy shows anon approved rows only,
     and `migration.test.ts` runs that policy as anon. The service client
     bypasses RLS, so reading with it would serve every hidden row. */
  it('reads through the anon control client, so a hidden photo is never served', async () => {
    const res = await photos.GET(get(`/api/community-photos?slug=${PP.slug}`));
    expect(res.status).toBe(200);
    expect(db.calls).toHaveLength(1);
    const [read] = db.calls;
    expect(read).toMatchObject({ client: 'controlRead', table: 'community_photos', op: 'select' });
    expect(read.columns).toBe(PHOTO_COLUMNS);
    /* No `approved` filter: anon holds no grant on that column, so one would
       fail every gallery read instead of narrowing it. */
    expect(read.filters).toEqual([['recipe_slug', slugAliases(PP.slug)]]);
  });
});

/**
 * A seed recipe's slug has had three spellings (the first one, the code and
 * name of 2026-10-24, the code alone since 2026-10-28), and the two planes
 * change at different times: the control migration on merge, the content one
 * by hand. A row written while they disagree keeps the slug its page was read
 * with, so every read asks for every spelling and every write keeps the one
 * the request named.
 */
describe('community rows across the slug renames', () => {
  const [FORMER, MIDDLE] = slugHistory(PP.slug);
  const EVERY = [FORMER, PP.slug, MIDDLE];
  type Row = { recipe_slug: string; image_url: string; approved: boolean };
  let gallery: Row[];

  const among = (row: Row, filters: Call['filters']) =>
    filters.every(([column, value]) => {
      const cell = (row as unknown as Record<string, unknown>)[column];
      return Array.isArray(value) ? value.includes(cell) : cell === value;
    });

  beforeEach(() => {
    gallery = [
      { recipe_slug: FORMER, image_url: 'https://cdn.example.com/before.jpg', approved: true },
      { recipe_slug: MIDDLE, image_url: 'https://cdn.example.com/between.jpg', approved: true },
      { recipe_slug: PP.slug, image_url: 'https://cdn.example.com/after.jpg', approved: true },
    ];
    db.answer = (call) => {
      if (call.table !== 'community_photos') return undefined;
      if (call.op === 'insert') {
        const { recipe_slug, image_url } = call.payload as Row;
        /* Exactly Postgres's unique (recipe_slug, image_url): one spelling,
           never its alias. Comparing across aliases here would make the fake
           stricter than the database and hide the bypass these tests pin. */
        if (gallery.some((r) => r.recipe_slug === recipe_slug && r.image_url === image_url)) {
          return { data: null, error: { code: '23505', message: 'duplicate key' } };
        }
        gallery.push({ recipe_slug, image_url, approved: true });
        return { data: { id: 'photo-new' }, error: null };
      }
      if (call.op !== 'select') return undefined;
      const rows = gallery.filter((r) => among(r, call.filters));
      if (call.options?.head) return { data: null, error: null, count: rows.length };
      return { data: rows, error: null };
    };
  });

  it('has three spellings to test with, the code slug newest', () => {
    expect(new Set(EVERY).size).toBe(3);
    expect(PP.slug).toBe(PP.id.toLowerCase());
    expect(slugHistory(PP.slug)).toEqual([FORMER, MIDDLE, PP.slug]);
  });

  it.each([
    ['the code slug', () => PP.slug],
    ['the 2026-10-24 slug', () => MIDDLE],
    ['the first slug', () => FORMER],
  ])('shows the photos sent under every spelling when asked by %s', async (_label, slug) => {
    const res = await photos.GET(get(`/api/community-photos?slug=${slug()}`));
    expect((await res.json()).photos.sort()).toEqual([
      'https://cdn.example.com/after.jpg',
      'https://cdn.example.com/before.jpg',
      'https://cdn.example.com/between.jpg',
    ]);
  });

  it('asks comments for every spelling too', async () => {
    await comments.GET(get(`/api/comments?slug=${FORMER}`));
    expect(callsTo('recipe_comments', 'select')[0].filters).toContainEqual(['recipe_slug', EVERY]);
  });

  it('counts the cap across every spelling, and writes under the slug the request named', async () => {
    const res = await photos.POST(
      post('/api/community-photos', { slug: FORMER, imageUrl: 'https://cdn.example.com/third.jpg' }),
    );
    expect(res.status).toBe(200);
    const [count] = callsTo('community_photos', 'select').filter((c) => c.options?.head);
    expect(count.client).toBe('controlAdmin');
    expect(count.filters).toEqual([
      ['recipe_slug', EVERY],
      ['approved', true],
    ]);
    const [insert] = callsTo('community_photos', 'insert');
    expect(insert.payload).toMatchObject({ recipe_slug: FORMER });
  });

  /* Moderation is `approved = false`, and only the duplicate keeps a hidden
     link hidden. Sent again under the recipe's other spelling, the unique
     key does not fire, and the alias read would show the fresh row. */
  const HIDDEN = 'https://cdn.example.com/hidden.jpg';

  it.each([
    ['code', 'first', () => PP.slug, () => FORMER],
    ['first', 'code', () => FORMER, () => PP.slug],
    ['2026-10-24', 'code', () => MIDDLE, () => PP.slug],
    ['code', '2026-10-24', () => PP.slug, () => MIDDLE],
  ])('keeps a photo hidden under the %s slug hidden when it is sent again under the %s one', async (_a, _b, hiddenUnder, sentUnder) => {
    gallery.push({ recipe_slug: hiddenUnder(), image_url: HIDDEN, approved: false });
    const res = await photos.POST(post('/api/community-photos', { slug: sentUnder(), imageUrl: HIDDEN }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, saved: true, duplicate: true });
    expect(callsTo('community_photos', 'insert')).toHaveLength(0);
    expect(gallery.filter((r) => r.image_url === HIDDEN)).toEqual([
      { recipe_slug: hiddenUnder(), image_url: HIDDEN, approved: false },
    ]);
    const [lookup] = callsTo('community_photos', 'select');
    expect(lookup.filters).toEqual([
      ['recipe_slug', slugAliases(sentUnder())],
      ['image_url', HIDDEN],
    ]);
  });

  it('answers saveFailed, and inserts nothing, when the duplicate lookup fails', async () => {
    const answer = db.answer;
    db.answer = (call, terminal) =>
      call.table === 'community_photos' && call.op === 'select' && !call.options?.head
        ? { data: null, error: { message: 'boom' } }
        : answer(call, terminal);
    const res = await photos.POST(post('/api/community-photos', { slug: FORMER, imageUrl: HIDDEN }));
    expect(res.status).toBe(500);
    expect(callsTo('community_photos', 'insert')).toHaveLength(0);
  });

  it('refuses a photo once the spellings together hold the cap', async () => {
    gallery = Array.from({ length: MAX_PHOTOS_PER_RECIPE }, (_, i) => ({
      recipe_slug: EVERY[i % 3],
      image_url: `https://cdn.example.com/${i}.jpg`,
      approved: true,
    }));
    const res = await photos.POST(
      post('/api/community-photos', { slug: PP.slug, imageUrl: 'https://cdn.example.com/one-more.jpg' }),
    );
    expect(res.status).toBe(409);
    expect(callsTo('community_photos', 'insert')).toHaveLength(0);
  });

  /* Moderation hides a photo and never deletes it, so a hidden row counted
     toward the cap kept a place on a page that no longer shows it. */
  const atCap = (approved: boolean, extra = 0) =>
    Array.from({ length: MAX_PHOTOS_PER_RECIPE + extra }, (_, i) => ({
      recipe_slug: EVERY[i % 3],
      image_url: `https://cdn.example.com/${approved ? 'shown' : 'hidden'}-${i}.jpg`,
      approved,
    }));

  it('counts only visible photos toward the cap', async () => {
    gallery = [...atCap(false, 5), ...atCap(true).slice(1)];
    const photo = await photos.POST(
      post('/api/community-photos', { slug: FORMER, imageUrl: 'https://cdn.example.com/fortieth.jpg' }),
    );
    expect(photo.status).toBe(200);
    expect(await photo.json()).toEqual({ ok: true, saved: true, source: 'supabase' });
    expect(callsTo('community_photos', 'insert').map((c) => c.payload?.image_url)).toEqual([
      'https://cdn.example.com/fortieth.jpg',
    ]);
  });

  it('still refuses at forty visible photos, whatever is hidden beside them', async () => {
    gallery = [...atCap(true), ...atCap(false, 3)];
    const photo = await photos.POST(
      post('/api/community-photos', { slug: PP.slug, imageUrl: 'https://cdn.example.com/one-more.jpg' }),
    );
    expect(photo.status).toBe(409);
    expect(await photo.json()).toEqual({ ok: false, error: 'photoLimitReached' });
    expect(callsTo('community_photos', 'insert')).toHaveLength(0);
  });

  it('still answers duplicate to a hidden link sent again, now that hidden rows hold no place', async () => {
    gallery = [{ recipe_slug: MIDDLE, image_url: HIDDEN, approved: false }];
    const res = await photos.POST(post('/api/community-photos', { slug: PP.slug, imageUrl: HIDDEN }));
    expect(await res.json()).toEqual({ ok: true, saved: true, duplicate: true });
    expect(callsTo('community_photos', 'insert')).toHaveLength(0);
    expect(gallery).toEqual([{ recipe_slug: MIDDLE, image_url: HIDDEN, approved: false }]);
  });
});

describe('POST /api/community-photos', () => {
  it('refuses at the schema what the community_photos CHECKs refuse', async () => {
    /* zod's url() accepts any scheme and the image URL had no lower bound,
       so both reached Postgres as 23514 and came back 500 saveFailed. */
    const social = await photos.POST(
      post('/api/community-photos', { slug: PP.slug, imageUrl: SAMPLE, authorSocial: 'mailto:a@b.co' }),
    );
    expect(social.status).toBe(400);
    expect((await social.json()).error).toBe('missingFields');

    const short = await photos.POST(post('/api/community-photos', { slug: PP.slug, imageUrl: 'https://a.b' }));
    expect(short.status).toBe(400);
    expect((await short.json()).error).toBe('invalidImageUrl');

    const http = await photos.POST(
      post('/api/community-photos', { slug: PP.slug, imageUrl: SAMPLE, authorSocial: 'HTTP://example.com/me' }),
    );
    expect(http.status).toBe(200);
    expect(callsTo('community_photos', 'insert')).toHaveLength(1);
  });

  it('answers 503 when the session cannot be checked', async () => {
    vi.mocked(requireUser).mockRejectedValue(new ControlUnavailableError());
    const res = await photos.POST(
      post('/api/community-photos', { slug: PP.slug, imageUrl: SAMPLE }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: 'controlUnavailable' });
  });

  it('blames the field that is actually wrong', async () => {
    const badSocial = await photos.POST(
      post('/api/community-photos', { slug: PP.slug, imageUrl: SAMPLE, authorSocial: 'https://' }),
    );
    expect(badSocial.status).toBe(400);
    expect((await badSocial.json()).error).toBe('missingFields');

    const badImage = await photos.POST(
      post('/api/community-photos', { slug: PP.slug, imageUrl: 'http://cdn.example.com/a.jpg' }),
    );
    expect((await badImage.json()).error).toBe('invalidImageUrl');
  });

  /* A signed Facebook or Instagram link renders for a while and then leaves a
     dead tile. Refused with its own code, so the reader is told why. */
  it('answers 400 expiringImageHost to a Facebook CDN link, and inserts nothing', async () => {
    const res = await photos.POST(
      post('/api/community-photos', { slug: PP.slug, imageUrl: 'https://scontent.xx.fbcdn.net/a.jpg' }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'expiringImageHost' });
    expect(callsTo('community_photos', 'insert')).toHaveLength(0);
  });

  it('stores a valid photo with an origin marker, not an address', async () => {
    const res = await photos.POST(post('/api/community-photos', { slug: PP.slug, imageUrl: SAMPLE }));
    expect(res.status).toBe(200);
    const [insert] = callsTo('community_photos', 'insert');
    expect(insert.payload).toMatchObject({ image_url: SAMPLE, submitted_by: '203.0.113.7' });
  });
});

describe('the write handlers', () => {
  it.each([
    'src/app/api/comments/route.ts',
    'src/app/api/community-photos/route.ts',
  ])('%s has no offline branch after requireUser, which returns null offline', (path) => {
    /* `requireUser` answers null without control config, so every POST 401s
       before an offline branch could run. Those branches were dead code that
       read as a supported mode. */
    const source = readFileSync(path, 'utf8');
    const post = source.slice(source.indexOf('export async function POST'));
    expect(post).not.toContain('hasControlConfig');
  });
});
