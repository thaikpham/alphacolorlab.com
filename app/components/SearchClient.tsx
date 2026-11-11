'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchIndex, suggestQuery, type SearchItem } from '@/lib/search'
import { search as searchCopy } from '@/app/content'
import { LinkRow } from './LinkRow'

type Item = SearchItem

export function SearchClient({ items }: { items: Item[] }) {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')

  useEffect(() => {
    if (query) {
      history.replaceState(null, '', `/search?q=${encodeURIComponent(query)}`)
    } else {
      history.replaceState(null, '', '/search')
    }
  }, [query])

  const { results, suggestion } = useMemo(() => {
    const found = searchIndex(items, query)
    // Groups follow the rank of their best hit, so the top answer is always in the first group.
    const groups = new Map<Item['kind'], Item[]>()
    for (const item of found) groups.set(item.kind, [...(groups.get(item.kind) ?? []), item])
    return {
      results: [...groups].map(([kind, items]) => ({ kind, items })),
      suggestion: found.length <= 2 ? suggestQuery(items, query) : null,
    }
  }, [query, items])

  const count = results.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <>
      <div className="mb-8">
        <label htmlFor="search-input" className="sr-only">
          {searchCopy.placeholder}
        </label>
        <input
          id="search-input"
          type="search"
          placeholder={searchCopy.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full h-11 px-4 rounded-control bg-card border border-separator text-callout placeholder:text-tertiary"
        />
      </div>

      {query ? (
        <>
          <div className="mb-4" aria-live="polite" aria-atomic="true">
            <p className="text-footnote text-secondary">{searchCopy.resultCount(count)}</p>
            {suggestion && (
              <p className="text-subhead text-secondary">
                {searchCopy.didYouMean}{" "}
                <button type="button" onClick={() => setQuery(suggestion)} className="min-h-11 font-medium text-accent-text">
                  {suggestion}
                </button>
              </p>
            )}
          </div>

          {count === 0 ? (
            <div className="text-center py-12">
              <p className="text-body text-secondary mb-4">{searchCopy.empty}</p>
            </div>
          ) : (
            results.map(({ kind, items: kindItems }) => (
              <div key={kind} className="mb-8">
                <h2 className="text-title3 font-medium mb-3">{searchCopy.kindLabels[kind]}</h2>
                <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
                  {kindItems.map((item) => (
                    <LinkRow
                      key={item.href}
                      href={item.href}
                      title={item.title}
                      detail={item.summary}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-body text-secondary">{searchCopy.hint}</p>
        </div>
      )}
    </>
  )
}
