import { readFileSync } from 'node:fs';
import { createElement, type ComponentProps, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import en from '../../messages/en.json';
import type { Recipe } from '@/lib/camera/schema';
import type { CommentItem } from '@/app/api/comments/route';

/**
 * Render tests for the recipe page's comments — the part of the community
 * section left after the owner removed proposals, votes and the AI tweak
 * (2026-10-28). The cases are the ones that section's suite carried for its
 * comments tab: a sign-in prompt flashed at a reader still being restored, an
 * outage drawn as an empty discussion, a refused comment that lost its draft.
 *
 * Plain `.ts` with `createElement`, because the vitest include pattern is
 * `src/**\/*.test.ts` and a `.test.tsx` here would silently never run. Copy is
 * real: the provider carries `messages/en.json`, so a missing key renders as a
 * key path and fails the assertion instead of passing it.
 */

type Auth = {
  user: { name: string; email: string; avatarUrl: string } | null;
  isReady: boolean;
};
const auth: Auth = { user: null, isReady: true };

vi.mock('./auth-context', () => ({
  useAuth: () => ({
    ...auth,
    isLoginModalOpen: false,
    openLoginModal: () => {},
    closeLoginModal: () => {},
    loginWithGoogle: async () => {},
    logout: async () => {},
    accessToken: () => null,
  }),
}));

const { RecipeComments, CommentCard, CommentList, CommunityAlert, Avatar } = await import('./recipe-comments');

const seed = JSON.parse(readFileSync('data/recipes.seed.json', 'utf8')) as Recipe[];
const PP = seed.find((r) => r.format === 'pp')!;

/* The provider's props type requires `children`; the real child is passed
   positionally below, which is what createElement renders. */
const INTL: ComponentProps<typeof NextIntlClientProvider> = {
  locale: 'en',
  messages: en,
  timeZone: 'Asia/Ho_Chi_Minh',
  children: null,
};

const render = (node: ReactNode) => renderToStaticMarkup(createElement(NextIntlClientProvider, INTL, node));
const section = () => render(createElement(RecipeComments, { recipeSlug: PP.slug }));
const source = readFileSync('src/components/recipe-comments.tsx', 'utf8');

beforeEach(() => {
  auth.user = null;
  auth.isReady = true;
});

describe('the comments before the session is known', () => {
  it('shows no sign-in prompt while the session is still restoring', () => {
    auth.isReady = false;
    const html = section();
    expect(html).not.toContain('sign in with Google');
    expect(html).not.toContain('<textarea');
  });

  it('asks a reader who is signed out to sign in', () => {
    expect(section()).toContain('sign in with Google');
  });

  it('opens the sign-in dialog from the prompt, where outage errors render', () => {
    /* `loginWithGoogle` reports its failures through the modal; called
       straight from the prompt, a failed sign-in did nothing visible. */
    expect(source).not.toContain('loginWithGoogle');
  });

  it('gives a signed-in reader the form, its field named', () => {
    auth.user = { name: 'Linh', email: 'linh@example.com', avatarUrl: '' };
    const html = section();
    expect(html).toContain('<textarea');
    expect(html).toContain(`aria-label="${en.community.title}"`);
  });
});

describe('the heading', () => {
  it('does not count a list that has not loaded', () => {
    const html = section();
    expect(html).toContain(`>${en.community.title}</h2>`);
    expect(html).not.toContain('(0)');
  });
});

describe('CommunityAlert', () => {
  it('renders the code’s copy from the catalogue as an alert', () => {
    const html = render(createElement(CommunityAlert, { code: 'rateLimited' }));
    expect(html).toContain('role="alert"');
    expect(html).toContain(en.community.errors.rateLimited);
  });

  it('renders the fallback for an unknown code', () => {
    expect(render(createElement(CommunityAlert, { code: 'unknown' }))).toContain(en.community.errors.unknown);
  });

  it('does not tell a reader whose list failed to load that nothing was saved', () => {
    /* `errors.controlUnavailable` is a write's copy. A reader who only opened
       the page has not tried to save anything. */
    const html = render(createElement(CommunityAlert, { code: 'controlUnavailable', read: true }));
    expect(html).toContain('role="alert"');
    expect(html).toContain(en.community.loadUnavailable);
    expect(html).not.toContain(en.community.errors.controlUnavailable);
  });
});

describe('CommentCard', () => {
  const comment: CommentItem = {
    id: 'c1',
    recipeSlug: PP.slug,
    authorName: 'An',
    authorAvatar: null,
    content: 'first line\nsecond line',
    createdAt: '2026-10-08T00:00:00.000Z',
  };

  it('keeps the line breaks a reader typed', () => {
    const html = render(createElement(CommentCard, { comment }));
    expect(html).toMatch(/<p class="[^"]*whitespace-pre-line[^"]*">first line\nsecond line<\/p>/);
  });
});

describe('Avatar', () => {
  it('falls back to an initial on a token colour, never a third-party image', () => {
    const html = render(createElement(Avatar, { src: null, name: 'Linh', size: 'md' }));
    expect(html).not.toContain('<img');
    expect(html).toContain('>L<');
  });

  it('sends no referrer for a Google avatar', () => {
    const html = render(createElement(Avatar, { src: 'https://lh3.example/a.jpg', name: 'Linh', size: 'md' }));
    expect(html).toContain('referrerPolicy="no-referrer"');
  });

  it('is the only avatar fallback, with no generated-avatar service anywhere', () => {
    expect(source).not.toContain('ui-avatars.com');
    expect(readFileSync('src/components/auth-context.tsx', 'utf8')).not.toContain('ui-avatars.com');
  });
});

describe('CommentList', () => {
  const comment: CommentItem = {
    id: 'c1',
    recipeSlug: PP.slug,
    authorName: 'An',
    authorAvatar: null,
    content: 'hello',
    createdAt: '2026-10-08T00:00:00.000Z',
  };
  const list = (over: Partial<Parameters<typeof CommentList>[0]> = {}) =>
    render(createElement(CommentList, { comments: [], loaded: true, loadError: null, ...over }));

  it('says there are no comments only when an empty list actually loaded', () => {
    expect(list()).toContain(en.community.noComments);
    expect(list({ loaded: false })).not.toContain(en.community.noComments);
  });

  it('renders a failed load as an alert, never as "be the first"', () => {
    /* The GET answers 503 with an empty list beside its code, which used to
       read as an empty discussion during an outage. */
    const html = list({ loaded: false, loadError: 'controlUnavailable' });
    expect(html).toContain('role="alert"');
    expect(html).toContain(en.community.loadUnavailable);
    expect(html).not.toContain(en.community.noComments);
  });

  it('does not call a list empty when its latest load failed', () => {
    const html = list({ loaded: true, loadError: 'unknown' });
    expect(html).toContain(en.community.errors.unknown);
    expect(html).not.toContain(en.community.noComments);
  });

  it('keeps the comments it has when a later load fails', () => {
    const html = list({ comments: [comment], loadError: 'unknown' });
    expect(html).toContain(en.community.errors.unknown);
    expect(html).toContain('hello');
  });
});

describe('the handlers', () => {
  /** One handler's text, from its declaration to the next marker. */
  const handler = (start: string, end: string) => {
    const from = source.indexOf(start);
    const to = source.indexOf(end, from + start.length);
    expect(from, `${start} is missing`).toBeGreaterThan(-1);
    expect(to, `${end} is missing after ${start}`).toBeGreaterThan(from);
    return source.slice(from, to);
  };
  /** The first `if (!res.ok) {` branch in a handler, up to its `return;`. */
  const refusal = (text: string) => {
    const from = text.indexOf('if (!res.ok) {');
    expect(from, 'no refusal branch').toBeGreaterThan(-1);
    return text.slice(from, text.indexOf('return;', from) + 'return;'.length);
  };

  const fetchComments = handler('const fetchComments', 'useEffect(');
  const post = handler('const handlePost', 'return (');

  it('keeps a failed load, and shows it', () => {
    expect(refusal(fetchComments)).toContain('setLoadError(await communityErrorOf(res))');
    expect(fetchComments).toMatch(/catch \{\s*setLoadError\('unknown'\)/);
    expect(source).toMatch(/<CommentList[^>]*loadError=\{loadError\}/);
  });

  it('shows why a comment was refused, and keeps the draft', () => {
    const refused = refusal(post);
    expect(refused).toContain('setPostError(await communityErrorOf(res))');
    expect(refused).not.toContain("setDraft('')");
    expect(refused).toContain('if (res.status === 401) openLoginModal();');
    expect(post).toMatch(/catch \{\s*setPostError\('unknown'\)/);
    expect(source).toContain('{postError && <CommunityAlert code={postError} />}');
  });

  /* Identity comes from the session JWT, never from the body. */
  it('sends no identity in the body', () => {
    expect(post).toContain('JSON.stringify({ recipeSlug, content: draft.trim() })');
    expect(post).not.toMatch(/authorName|authorEmail|user\.email/);
  });
});
