import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { redirect } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ArticleView } from '@/components/lab/article-view'
import { NoteView } from '@/components/alphaskill/note-view'
import { SiteHeader } from '@/components/site-header'
import { ArticleStructuredData } from '@/components/structured-data'
import { ARTICLE_LANG } from '@/lib/lab/articles'
import { getPublishedKnowledge, getPublishedKnowledgePage } from '@/lib/lab/data'
import { getNote, listNotes, noteHref } from '@/lib/alphaskill/knowledge'
import { findNoteBySlugAlias } from '@/lib/alphaskill/parse'
import { routing, type Locale } from '@/i18n/routing'

/* The paper room, as on `/blog/[id]`. */
export const viewport: Viewport = { themeColor: '#F9F8F5', colorScheme: 'light' }

/** Warm start; `dynamicParams` admits a page published after the build.
    Includes both authored knowledge pages and notes. */
export async function generateStaticParams() {
  const [pages, notes] = await Promise.all([getPublishedKnowledge(), listNotes()])
  return routing.locales.flatMap((locale) => [
    ...pages.map((page) => ({ locale, id: page.id })),
    ...notes.map((note) => ({ locale, id: note.slug })),
  ])
}

export const dynamicParams = true
export const revalidate = 3600

/** The body is Vietnamese on every locale, so the Vietnamese URL is canonical
    for both and no language alternates are declared (ADR 0004). */
const canonicalPath = (id: string) =>
  ARTICLE_LANG === routing.defaultLocale ? `/learn/${id}` : `/${ARTICLE_LANG}/learn/${id}`

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const page = await getPublishedKnowledgePage(id)
  if (page) {
    return {
      title: page.title,
      description: page.dek || undefined,
      alternates: { canonical: canonicalPath(id) },
      openGraph: { type: 'article', title: page.title, description: page.dek || undefined, locale: 'vi_VN' },
    }
  }
  const note = await getNote(id)
  if (note) {
    return {
      title: note.title,
      description: note.summary || undefined,
      alternates: { canonical: canonicalPath(id) },
      openGraph: { type: 'article', title: note.title, description: note.summary || undefined, locale: 'vi_VN' },
    }
  }
  return {}
}

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const page = await getPublishedKnowledgePage(id)
  if (page) {
    return (
      <div className="theme-paper contents">
        <Suspense>
          <SiteHeader />
        </Suspense>
        <ArticleStructuredData article={page} path={canonicalPath(id)} />
        <main className="mx-auto min-h-screen-dynamic w-full max-w-[86rem] inset-safe pt-8 pb-24">
          <ArticleView article={page} />
        </main>
      </div>
    )
  }

  const note = await getNote(id)
  if (note) {
    const notes = await listNotes()
    return (
      <div className="theme-paper contents">
        <Suspense>
          <SiteHeader />
        </Suspense>
        <main className="mx-auto min-h-screen-dynamic w-full max-w-[86rem] inset-safe pt-8 pb-24">
          <NoteView note={note} notes={notes} />
        </main>
      </div>
    )
  }

  /* A note renamed in the vault keeps its old address through `aliases`;
     the link lands on the current slug. */
  const aliasNote = findNoteBySlugAlias(id, await listNotes())
  if (aliasNote) redirect({ href: noteHref(aliasNote.slug), locale })

  notFound()
}
