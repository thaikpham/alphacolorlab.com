import 'server-only'
import { cache } from 'react'
import { getSonyCameras } from '@/lib/cameras/data'
import { getPublishedEntries } from '@/lib/lab/data'
import type { Article } from '@/lib/lab/types'
import { listRecipes, type Locale } from '@/lib/recipes/source'
import { listNotes, type AlphaNote } from '@/lib/alphaskill/knowledge'
import {
  buildUniverse,
  type ProductSummary,
  type RecipeSummary,
  type Universe,
} from './relations'

/**
 * Everything a related-content section can link to, for one render.
 *
 * Four cached reads — published pages, alphaskill notes, published recipes,
 * the camera catalogue — each the same function its own pages use, so a
 * link appears exactly when its target's page would answer 200.
 *
 * The reads are settled independently. A related section is supplementary to
 * the page it sits on: an outage of the product catalogue must not take an
 * article down with it. But it must not pass for "nothing related" either, so
 * a failed source is named in `unavailable` and the section says so, the same
 * fail-closed rule `contentOrOfflineSeed` applies — nothing from that source
 * is rendered, and nothing is substituted for it.
 */

export type LoadedUniverse = {
  readonly universe: Universe
  readonly entries: readonly Article[]
  readonly notes: readonly AlphaNote[]
  readonly unavailable: readonly ('pages' | 'recipes' | 'products' | 'notes')[]
}

async function load(locale: Locale): Promise<LoadedUniverse> {
  const [entries, recipes, cameras, notes] = await Promise.allSettled([
    getPublishedEntries(),
    listRecipes(locale),
    getSonyCameras(),
    listNotes(),
  ])

  const unavailable: LoadedUniverse['unavailable'][number][] = []
  if (entries.status === 'rejected') unavailable.push('pages')
  if (recipes.status === 'rejected') unavailable.push('recipes')
  if (cameras.status === 'rejected') unavailable.push('products')
  if (notes.status === 'rejected') unavailable.push('notes')

  const pageList = entries.status === 'fulfilled' ? entries.value : []
  const recipeList: RecipeSummary[] =
    recipes.status === 'fulfilled'
      ? recipes.value.map((r) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          format: r.format,
          wbLabel: r.wbLabel,
          ...(r.format === 'cl' ? { look: r.settings.look } : {}),
        }))
      : []
  const productList: ProductSummary[] = [
    ...(cameras.status === 'fulfilled' ? cameras.value : []),
  ].map((p) => ({ id: p.id, name: p.name, fullName: p.fullName, sku: p.sku, category: p.category }))
  const notesList = notes.status === 'fulfilled' ? notes.value : []

  return {
    universe: buildUniverse({ entries: pageList, recipes: recipeList, products: productList, notes: notesList }),
    entries: pageList,
    notes: notesList,
    unavailable,
  }
}

/** Per request: the article body and its rail ask for the same universe. */
export const loadUniverse = cache(load)
