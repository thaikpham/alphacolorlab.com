import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/site-header';
import { RecipeGallery } from '@/components/recipe-gallery';
import { RecipeComments } from '@/components/recipe-comments';
import { ClCards, PpCards, WbPanel } from '@/components/param-cards';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeMark } from '@/components/recipe-mark';
import { RecipeStructuredData } from '@/components/structured-data';
import { RecipeLearnMore } from '@/components/content/reverse-links';
import { MyCameraWarning } from '@/components/my-camera-warning';
import { Link, permanentRedirect, redirect } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { accentCss } from '@/lib/camera/color';
import { CREATIVE_LOOKS } from '@/lib/camera/constants';
import { getSonyCameras } from '@/lib/cameras/data';
import { cameraOptions, cameraWarnings } from '@/lib/cameras/my-camera';
import { colorlabPath, moreForSituation } from '@/lib/recipes/browse';
import { listRecipes, listSlugs } from '@/lib/recipes/source';
import { isPermanentMove } from '@/lib/recipes/slug-aliases';
import { resolveRecipeSlug } from '@/lib/recipes/slug-resolve';
import { SITUATIONS, type SituationId } from '@/lib/recipes/taxonomy';
import { recipeTitle } from '@/lib/recipes/title';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const OG_LOCALES: Record<Locale, string> = { en: 'en_US', vi: 'vi_VN' };

/* What the database holds, in whichever spelling it holds it. Any other
   spelling still renders on demand — and redirects, below. */
export async function generateStaticParams() {
  return (await listSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}): Promise<Metadata> {
  const { slug: requested, locale } = await params;
  const resolved = await resolveRecipeSlug(requested, locale);
  if (!resolved) return {};
  /* The page redirects a former or not-yet-migrated spelling; the canonical
     is the one it redirects to. */
  const { recipe, slug } = resolved;

  const path = locale === routing.defaultLocale ? `/recipe/${slug}` : `/${locale}/recipe/${slug}`;

  return {
    title: recipe.name,
    description: recipe.description,
    alternates: {
      canonical: path,
      // Tells search engines the two locales are the same recipe, not
      // duplicate content.
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          l === routing.defaultLocale ? `/recipe/${slug}` : `/${l}/recipe/${slug}`,
        ]),
      ),
    },
    openGraph: {
      type: 'article',
      title: recipe.name,
      description: recipe.description,
      url: path,
      siteName: 'Alpha ColorLab',
      // og:locale is language_TERRITORY; scrapers may ignore a bare 'vi'.
      locale: OG_LOCALES[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug: requested, locale } = await params;
  setRequestLocale(locale);

  const [resolved, catalogue, t, tBrowse, products] = await Promise.all([
    resolveRecipeSlug(requested, locale),
    /* The same unfiltered read the browse makes — one cache entry per locale,
       nothing new in its key — for the row of other recipes at the foot. */
    listRecipes(locale),
    getTranslations('recipe'),
    getTranslations('browse'),
    getSonyCameras(),
  ]);
  if (!resolved) notFound();
  const { recipe, slug } = resolved;
  /* A slug the recipe had, or will have once a content migration runs,
     lands on the one the catalogue holds now. Permanent only from an older
     spelling to a newer one: the reverse is an unmigrated database, and a
     cached 308 that way would loop once the migration turns it round. */
  if (slug !== requested) {
    const to = { href: `/recipe/${slug}`, locale };
    if (isPermanentMove(requested, slug)) permanentRedirect(to);
    redirect(to);
  }

  /* What each camera choice has to say about this recipe, worked out here so
     the page stays prerendered: the cookie is read in the browser, by the
     island, never by this render (ADR 0006). */
  const warnings = cameraWarnings(recipe, cameraOptions(products));

  const accent = accentCss(recipe.accent);
  const title = recipeTitle(recipe.name);
  /* Other recipes for this one's primary situation, or nothing at all — the
     row is left out rather than shown empty. */
  const more = moreForSituation(recipe, catalogue);
  const situationLabels = Object.fromEntries(
    SITUATIONS.map((id) => [id, tBrowse(`situations.${id}`)]),
  ) as Record<SituationId, string>;
  const look =
    recipe.format === 'cl' ? CREATIVE_LOOKS.find((l) => l.code === recipe.settings.look) : null;
  const shareUrl = `${SITE_URL}${
    locale === routing.defaultLocale ? '' : `/${locale}`
  }/recipe/${slug}`;

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <SiteHeader />
      <RecipeStructuredData recipe={recipe} locale={locale} url={shareUrl} />

      <main className="mx-auto w-full max-w-[86rem] flex-1 inset-safe pb-24">
        {/* Top Back Navigation */}
        <nav className="py-6">
          {/* Back to the catalogue this recipe belongs to, not the launcher. */}
          <Link
            href="/colorlab"
            className="btn-glass group gap-2.5 px-4 text-label cursor-pointer"
          >
            {/* 4-Square 2x2 Grid Icon */}
            <svg
              className="w-3.5 h-3.5 fill-current shrink-0 opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
              <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
              <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
              <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
            </svg>
            {/* Not uppercase: vi is four words, and uppercase is capped at
                three because Vietnamese diacritics need the ascender room. */}
            <span>{t('back')}</span>
          </Link>
        </nav>

        {/* One reading column (owner, 2026-10-28): the hero, the settings as
            cards, the readers' photographs with the way to add one, the
            comments. Source order is reading order at every width, so the
            settings — the reason to open a recipe — come straight after the
            hero. The two-column layout with a sticky settings column went
            with the cards, which need the page's width to sit six to a row;
            "propose a version" and "tweak with AI" went with it. */}
        <div className="flex flex-col gap-12">
          {/* The mark, then the code chip and the name beside it; the
              description and the camera warning under the name from sm,
              under both on a phone. The situation, style and tone chips that
              led back into the catalogue went on 2026-10-28 (owner): the
              "More for …" row at the foot and the browse page carry that. */}
          <div
            data-part="hero"
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-5 sm:gap-x-8 xl:gap-x-10"
          >
            <div className="sm:row-span-2">
              <RecipeMark recipe={recipe} size="s" className="sm:hidden" />
              <RecipeMark recipe={recipe} size="m" className="hidden sm:block xl:hidden" />
              <RecipeMark recipe={recipe} size="l" className="hidden xl:block" />
            </div>

            <div className="min-w-0 flex flex-col items-start gap-3">
              {/* The name carries the code now (`PP-048-Soft Clean Portrait`).
                  A row still on the old `SCL-PP-048: Huế Silk` shape — until
                  the library sync reaches production — keeps its code here,
                  since its title drops it. */}
              <div className="flex flex-wrap items-center gap-3">
                {recipe.name.includes(': ') && <span className="chip label text-ink">{recipe.id}</span>}
                {/* The code is uppercase on the camera; the Look's name is not,
                    and in `.label` "BW (Black & White)" ran to four words. */}
                {look && (
                  <span className="chip label bg-accent-900 text-accent-200">
                    CL: {look.code} <span className="normal-case">({look.label})</span>
                  </span>
                )}
                {recipe.format === 'pp' && (
                  <span className="chip label bg-accent-900 text-accent-200">PICTURE PROFILE</span>
                )}
              </div>

              <h1 className="text-title-2 sm:text-title-1 xl:text-display font-extrabold leading-[1.12] tracking-[-0.02em] text-ink break-words">
                {title}
              </h1>
            </div>

            <div className="col-span-2 sm:col-span-1 sm:col-start-2 flex flex-col gap-4">
              <p className="max-w-3xl whitespace-pre-line leading-relaxed text-ink-muted text-body sm:text-body-lg">
                {recipe.description}
              </p>

              {/* The reader's camera, when it cannot install this recipe or
                  may not: an accuracy line, one per reason. Empty until the
                  browser has read the cookie, and then usually still empty. */}
              <div className="empty:hidden">
                <MyCameraWarning warnings={warnings} />
              </div>
            </div>
          </div>

          {/* The settings, one parameter per card: White Balance first, then
              the format's own groups. */}
          <section data-part="settings" aria-labelledby="camera-settings" className="flex flex-col gap-4">
            {/* Not `.label`: vi "Cài đặt máy ảnh" is four words. */}
            <h2 id="camera-settings" className="text-title-3 font-semibold tracking-[-0.02em] text-ink">
              {t('paramsLabel')}
            </h2>
            <WbPanel recipe={recipe} locale={locale} />
            {recipe.format === 'pp' ? (
              <PpCards s={recipe.settings} locale={locale} />
            ) : (
              <ClCards s={recipe.settings} locale={locale} />
            )}
            {/* What the cards mean, and what has been written about this
                recipe — computed from the published pages, never authored
                here (ADR 0002). */}
            <RecipeLearnMore recipeId={recipe.id} format={recipe.format} locale={locale} />
          </section>

          {/* The readers' part: their photographs, with the tile that adds
              one, and the comments. */}
          <div data-part="participation" className="flex flex-col gap-12">
            <RecipeGallery slug={slug} title={title} />
            <RecipeComments recipeSlug={slug} />
          </div>
        </div>

        {/* Other recipes for the primary situation, as the browse draws them.
            The heading is the way into that situation's page, so the row
            needs no "see all" line. An h2 over the cards' h3s. */}
        {more ? (
          <section aria-labelledby="more-for-situation" className="mt-16 flex flex-col gap-4">
            <h2 id="more-for-situation" className="text-title-3 font-semibold text-ink">
              <Link
                href={colorlabPath(more.situation)}
                className="inline-flex min-h-[var(--layout-touch-target)] items-center gap-2 transition-colors hover:text-accent-400"
              >
                {tBrowse('moreFor', { situation: situationLabels[more.situation] })}
                <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M5.47 2.97a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06L9.44 8 5.47 4.03a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </Link>
            </h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {more.recipes.map((r) => (
                /* `grid` stretches the card to the row's height: a name
                   that wraps to three lines no longer leaves its neighbour
                   short. */
                <li key={r.id} className="grid">
                  <RecipeCard recipe={r} situationLabels={situationLabels} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
