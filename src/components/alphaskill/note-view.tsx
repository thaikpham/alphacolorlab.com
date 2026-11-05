import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { RelatedLinks } from '@/components/content/related-links'
import { parseMarkdown } from '@/lib/alphaskill/markdown'
import {
  AlphaNote,
  findNoteByTitle,
  notesLinkingTo,
  noteHref,
} from '@/lib/alphaskill/knowledge'
import { ARTICLE_LANG } from '@/lib/lab/articles'
import type { Inline } from '@/lib/alphaskill/markdown'

/**
 * Render a single AlphaNote in the paper room.
 * Uses the same typography and related-links pattern as ArticleView.
 */
export async function NoteView({
  note,
  notes,
}: {
  note: AlphaNote
  notes: readonly AlphaNote[]
}) {
  const [locale, t, tl] = await Promise.all([
    getLocale(),
    getTranslations('lab'),
    getTranslations('learn'),
  ])

  /* The vault opens every note with its summary in bold, and the page already
     prints the summary as the dek: drop the opening paragraph when it is that
     sentence, so the reader does not meet it twice in a row. */
  const parsed = parseMarkdown(note.body)
  const opening = parsed[0]
  const openingText =
    opening?.t === 'p' ? opening.inline.map((n) => ('text' in n ? n.text : n.display)).join('') : ''
  const blocks = openingText.trim() === note.summary.trim() ? parsed.slice(1) : parsed

  // Build related links: (1) forward links, (2) backlinks, deduped by slug
  const relatedSlugs = new Set<string>()
  const relatedLinks: Array<{
    kind: 'knowledge'
    id: string
    title: string
    href: string
    subtitle: string
  }> = []

  // Forward links: resolve wikilinks
  for (const linkTitle of note.links) {
    const linked = findNoteByTitle(linkTitle, notes)
    if (linked && !relatedSlugs.has(linked.slug)) {
      relatedSlugs.add(linked.slug)
      relatedLinks.push({
        kind: 'knowledge',
        id: linked.slug,
        title: linked.title,
        href: noteHref(linked.slug),
        subtitle: linked.section,
      })
    }
  }

  // Backlinks: notes linking to this one
  for (const backlink of notesLinkingTo(note.slug, notes)) {
    if (!relatedSlugs.has(backlink.slug)) {
      relatedSlugs.add(backlink.slug)
      relatedLinks.push({
        kind: 'knowledge',
        id: backlink.slug,
        title: backlink.title,
        href: noteHref(backlink.slug),
        subtitle: backlink.section,
      })
    }
  }

  return (
    <article className="lab-article min-w-0 max-w-[46rem] lg:flex-1 lg:basis-[32.5rem]">
      {/* Breadcrumb: Learn › section */}
      <nav aria-label={tl('breadcrumb')} className="mb-6">
        <ol className="flex flex-wrap items-center gap-x-2 text-body-sm font-semibold text-ink-muted">
          <li>
            <Link
              href="/learn"
              className="inline-flex min-h-[var(--layout-touch-target)] items-center transition-colors hover:text-accent-400"
            >
              {tl('title')}
            </Link>
          </li>
          {note.section ? (
            <li className="flex items-center gap-2">
              <span aria-hidden className="text-ink-faint">
                ›
              </span>
              <Link
                href={`/learn#note-${slugify(note.section)}`}
                className="inline-flex min-h-[var(--layout-touch-target)] items-center transition-colors hover:text-accent-400"
              >
                {note.section}
              </Link>
            </li>
          ) : null}
        </ol>
      </nav>

      {/* Section and level info */}
      <p className="mb-3 text-label font-semibold text-ink-faint">
        <span className="text-accent-400">{note.section}</span>
        <span className="text-ink-faint">
          {note.level ? (
            <>
              {' '}
              · <span lang={ARTICLE_LANG}>{note.level}</span>
            </>
          ) : null}
        </span>
      </p>

      {/* Language note if on non-VI locale */}
      {locale !== ARTICLE_LANG ? (
        <p className="meta mb-3">{t('articleInVietnamese')}</p>
      ) : null}

      <div lang={ARTICLE_LANG}>
        <h1 className="text-display font-semibold tracking-[-0.02em] leading-[1.15] text-ink [text-wrap:pretty]">
          {note.title}
        </h1>

        {note.summary ? (
          <p className="mt-4 text-title-3 font-normal leading-[1.5] text-ink-muted [text-wrap:pretty]">
            {note.summary}
          </p>
        ) : null}

        <hr className="seam mt-8 mb-8" />

        {/* Render parsed markdown blocks */}
        {blocks.map((block, i) => {
          if (block.t === 'h2') {
            return (
              <h2
                key={i}
                className="mt-6 mb-3 text-title-2 font-semibold tracking-[-0.02em] leading-[1.3] text-ink [text-wrap:pretty]"
              >
                {block.text}
              </h2>
            )
          }
          if (block.t === 'h3') {
            return (
              <h3
                key={i}
                className="mt-5 mb-3 text-title-3 font-semibold tracking-[-0.02em] leading-[1.3] text-ink [text-wrap:pretty]"
              >
                {block.text}
              </h3>
            )
          }
          if (block.t === 'p') {
            return (
              <p
                key={i}
                className="mb-4 text-body leading-[1.6] text-ink [text-wrap:pretty]"
              >
                {block.inline.map((inline, j) => renderInline(inline, j, notes))}
              </p>
            )
          }
          if (block.t === 'ul') {
            return (
              <ul key={i} className="mb-4 list-inside list-disc space-y-1 text-body text-ink">
                {block.items.map((item, j) => (
                  <li key={j}>
                    {item.map((inline, k) => renderInline(inline, k, notes))}
                  </li>
                ))}
              </ul>
            )
          }
          return null
        })}
      </div>

      {/* Footer: related links */}
      <footer className="mt-3 flex flex-col gap-6 pt-5">
        <hr className="seam" />
        {relatedLinks.length > 0 || note.aliases.length > 0 ? (
          <RelatedLinks links={relatedLinks} heading={tl('related')} lang={ARTICLE_LANG} />
        ) : null}
      </footer>
    </article>
  )
}

/**
 * Render a single inline element.
 * Wikilinks resolve to <Link>; unresolvable or external links render as text or <a>.
 */
function renderInline(inline: Inline, key: React.Key, notes: readonly AlphaNote[]) {
  if (inline.t === 'text') {
    return <span key={key}>{inline.text}</span>
  }
  if (inline.t === 'strong') {
    return <strong key={key}>{inline.text}</strong>
  }
  if (inline.t === 'em') {
    return <em key={key}>{inline.text}</em>
  }
  if (inline.t === 'link') {
    return (
      <a
        key={key}
        href={inline.href}
        rel="noopener"
        className="text-accent-400 transition-colors hover:text-accent-500"
      >
        {inline.text}
      </a>
    )
  }
  if (inline.t === 'wiki') {
    const linked = findNoteByTitle(inline.title, notes)
    if (linked) {
      return (
        <Link
          key={key}
          href={noteHref(linked.slug)}
          className="text-accent-400 transition-colors hover:text-accent-500"
        >
          {inline.display}
        </Link>
      )
    }
    // Unresolved wikilink: render as plain text
    return <span key={key}>{inline.display}</span>
  }
  return null
}

/**
 * Simple slugify for section IDs.
 * (Replicates the behavior of src/lib/lab/parse.ts:slugify)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
