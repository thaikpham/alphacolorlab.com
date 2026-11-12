// Filter tags for lenses in the Product Wiki: format, type, series, needs by focal length (the owner's ranges) and other uses.
// Labels live in app/content.ts (wiki.product.lensFilter); test/lensTags.test.ts pins the rules.

type Lens = { name: string; group: string; specs: Record<string, any> }

/** APS-C lenses are judged by their full-frame equivalent focal length. */
const APSC_CROP = 1.5

/** The owner's focal ranges (mm, full-frame equivalent), inclusive at both ends: a 35mm lens is both street and daily. */
const FOCAL_NEEDS = [
  { id: 'wide', min: 0, max: 23.9 }, // dưới 24mm: phong cảnh, hành động
  { id: 'street', min: 24, max: 35 },
  { id: 'daily', min: 35, max: 50 },
  { id: 'portrait-half', min: 50, max: 85 },
  { id: 'portrait-close', min: 85, max: 135 },
  { id: 'tele', min: 135, max: Infinity },
] as const

export function lensTags(p: Lens): string[] {
  const s = p.specs
  const crop = p.group === 'aps-c' ? APSC_CROP : 1
  const lo = s.focalMin * crop
  const hi = s.focalMax * crop
  const f = parseFloat(s.apertureMax) // "2.8", or "3.5-5.6" → 3.5 (widest end)
  const w: number | null = s.weightG ?? null
  const tags: string[] = [p.group === 'aps-c' ? 'apsc' : 'ff', s.zoom ? 'zoom' : 'prime', s.series]
  for (const n of FOCAL_NEEDS) if (lo <= n.max && hi >= n.min) tags.push(n.id)
  if (f <= 2) tags.push('low-light')
  if (lo < 24 && f <= 2.8) tags.push('astro') // wide and bright enough for stars
  if (/Macro/i.test(p.name)) tags.push('macro')
  if (lo <= 24 && w != null && w <= 400 && !/Fisheye/i.test(p.name)) tags.push('vlog') // 24mm or wider at arm's length (the ZV-E10 kit lens), light enough to hold out
  if (s.zoom && s.focalMax / s.focalMin >= 4) tags.push('travel') // one lens for the whole trip
  if (w != null && w <= 300) tags.push('light')
  if (s.powerZoom) tags.push('video')
  if (s.oss) tags.push('oss')
  return tags
}

type FilterGroup = { chips: [string, string][]; match: 'any' | 'all' }

/** Lenses that pass every group: "any" = one selected chip of the group matches, "all" = every selected chip matches. */
export function matchLenses<T extends { tags: string[] }>(lenses: T[], on: Set<string>, groups: FilterGroup[]): T[] {
  return lenses.filter((l) =>
    groups.every((g) => {
      const sel = g.chips.map(([id]) => id).filter((id) => on.has(id))
      if (!sel.length) return true
      return g.match === 'all' ? sel.every((t) => l.tags.includes(t)) : sel.some((t) => l.tags.includes(t))
    }),
  )
}
