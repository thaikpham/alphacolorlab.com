import { Suspense } from 'react'
import { buildIndex } from '@/lib/searchIndex'
import { search, seo } from '@/app/content'
import { SearchClient } from '@/app/components/SearchClient'

export const metadata = {
  title: seo.searchTitle,
  description: 'Tìm kiếm bài viết, máy ảnh, kiến thức và công thức màu.',
}

export default async function SearchPage() {
  const items = buildIndex()

  return (
    <main className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 pt-16 pb-16 sm:pt-24 sm:pb-24">
        <h1 className="text-display font-light mb-2">{search.title}</h1>
        <p className="text-body text-secondary mb-8">{search.lead}</p>

        <Suspense
          fallback={
            <div className="mb-8">
              <input
                type="search"
                disabled
                aria-label={search.title}
                placeholder={search.placeholder}
                className="w-full h-11 px-4 rounded-control bg-card border border-separator text-callout placeholder:text-tertiary disabled:opacity-50"
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
