'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { search } from '@/app/content'
import { searchIndex, suggestQuery, type SearchItem } from '@/lib/search'
import { activePageSearch, usePageSearchVersion, type PageHit, type PageSearch } from '@/lib/pageSearch'

const LIST_ID = 'search-suggestions'
type Option = { kind: 'item'; item: SearchItem } | { kind: 'fix'; query: string } | { kind: 'node'; hit: PageHit }

/** The site's only search box (ARIA combobox), in the nav. The index (/search-index.json) loads on first focus, not with the page.
 * Pages can add their own results through lib/pageSearch: graph nodes come first and focus the node instead of navigating. */
export function SearchField() {
  const router = useRouter()
  const pathname = usePathname()
  const version = usePageSearchVersion()
  const [source, setSource] = useState<PageSearch | null>(null)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchItem[] | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const box = useRef<HTMLDivElement>(null)

  // Nguồn tìm của trang đổi theo route, theo đăng ký, và theo phần đang hiện (landing ↔ đồ thị ở "/")
  const refresh = () => {
    const next = activePageSearch()
    if (next === source) return
    setSource(next)
    setQuery('')
  }
  useEffect(refresh, [version, pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo<Option[]>(() => {
    if (!query.trim()) return []
    const nodes: Option[] = source?.kind === 'pick' ? source.find(query).slice(0, 5).map((hit) => ({ kind: 'node', hit })) : []
    if (!index) return nodes
    const hits = searchIndex(index, query).slice(0, nodes.length ? 5 : 8)
    const fix = hits.length || nodes.length ? null : suggestQuery(index, query)
    return fix ? [{ kind: 'fix', query: fix }] : [...nodes, ...hits.map((item) => ({ kind: 'item' as const, item }))]
  }, [index, query, source])
  const shown = open && options.length > 0

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const load = () => {
    if (index) return
    setIndex([])
    fetch('/search-index.json')
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex(null)) // offline without a cached index: the next focus tries again
  }

  const go = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const choose = (o: Option) => {
    if (o.kind === 'node' && source?.kind === 'pick') {
      source.pick(o.hit.id)
      setOpen(false)
      setQuery('')
    } else if (o.kind === 'item') go(o.item.href)
    else if (o.kind === 'fix') {
      setQuery(o.query)
      setActive(-1)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') return setOpen(false)
    if (e.key === 'Enter') {
      e.preventDefault()
      if (shown && active >= 0) choose(options[active])
      else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`)
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    setOpen(true)
    const n = options.length
    if (n) setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n))
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1 md:max-w-xs lg:max-w-none" role="search">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
      >
        <circle cx="7" cy="7" r="4.75" />
        <path d="M10.5 10.5l3 3" />
      </svg>
      <input
        type="search"
        placeholder={source?.placeholder ?? search.title}
        aria-label={search.title}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(-1)
          setOpen(true)
        }}
        onFocus={() => {
          refresh()
          load()
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={LIST_ID}
        aria-activedescendant={shown && active >= 0 ? `${LIST_ID}-${active}` : undefined}
        className="h-11 w-full rounded-control border border-separator bg-card pl-9 pr-3 text-callout placeholder:text-secondary"
      />
      {/* Always in the DOM so aria-controls points at a real element; hidden while empty. */}
      <div
        id={LIST_ID}
        role="listbox"
        aria-label={search.title}
        hidden={!shown}
        className="absolute top-full left-0 right-0 z-50 mt-2 rounded-card bg-card border border-separator shadow-card divide-y divide-separator overflow-hidden"
      >
        {options.map((o, i) => (
          <div
            key={o.kind === 'item' ? o.item.href : o.kind === 'node' ? `node-${o.hit.id}` : 'fix'}
            id={`${LIST_ID}-${i}`}
            role="option"
            aria-selected={i === active}
            onClick={() => choose(o)}
            onMouseEnter={() => setActive(i)}
            className={`px-4 py-3 min-h-11 flex flex-col justify-center gap-0.5 cursor-pointer ${i === active ? 'bg-fill' : ''}`}
          >
            {o.kind === 'node' ? (
              <>
                <span className="text-callout text-label font-medium">{o.hit.label}</span>
                <span className="text-footnote text-secondary">{search.graphGroup}</span>
              </>
            ) : o.kind === 'item' ? (
              <>
                <span className="text-callout text-label font-medium">{o.item.title}</span>
                <span className="text-footnote text-secondary">
                  {search.kindLabels[o.item.kind]}
                  {o.item.kind === 'product' && ` · ${o.item.extra}`}
                </span>
              </>
            ) : (
              <span className="text-callout text-label">
                {search.didYouMean} <span className="font-medium text-accent-text">{o.query}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
