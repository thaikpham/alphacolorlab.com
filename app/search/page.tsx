import { Suspense } from 'react'
import { buildIndex } from '@/lib/searchIndex'
import { search, seo } from '@/app/content'
import { SearchClient } from '@/app/components/SearchClient'

export const metadata = {
  title: seo.searchTitle,
  description: search.lead,
}

export default async function SearchPage() {
  const items = buildIndex()

  return (
    <main className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pt-8 sm:pb-24">
        <h1 className="text-display font-light mb-8">{search.title}</h1>

        <Suspense
          fallback={
            <div className="mb-8">
              <input
                type="search"
                disabled
                aria-label={search.title}
                placeholder={search.placeholder}
                className="w-full h-11 px-4 rounded-control bg-card border border-separator text-callout placeholder:text-secondary disabled:opacity-50"
              />
            </div>
          }
        >
          <SearchClient items={items} />
        </Suspense>
      </div>
    </main>
  )
}
