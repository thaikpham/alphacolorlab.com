/**
 * Spec rows for a product page, in the order of the user's templates (camera, lens, accessory).
 * Labels and words come from app/content.ts; `note` is the Knowledge note the label links to.
 */
import { wiki } from '../app/content.ts'

type SpecRow = { label: string; note?: string; value: string }
type Product = { code: string; kind: string; group: string; specs: Record<string, any> }

const R = wiki.specRows
const W = wiki.specWords
// Vietnamese decimal comma, no thousands dot (2115 g, not 2.115 g)
const nf = (n: number | null | undefined) => (n == null ? null : n.toLocaleString('vi-VN', { useGrouping: false }))
const aperture = (a: string | null) => (a ? `F${a.replace('-', '–')}` : null)
const rates = (r: number[]) => (r.length ? r.map((x) => `${x}p`).join(' · ') : W.none)
// Cinema Line cameras carry only mount, sensor, megapixels, weight and size in their spec data
const isCinema = (p: Product) => p.kind === 'camera' && p.group === 'cinema'

export function specRows(p: Product): SpecRow[] {
  const s = p.specs
  const rows: SpecRow[] = []
  const row = (key: string, value: string | null | undefined | false, note = R[key].note) => {
    if (value) rows.push({ label: R[key].label, note, value })
  }
  row('code', p.code)
  if (isCinema(p)) {
    row('mount', W.mounts[s.mount] ?? s.mount)
    row('sensor', [W.formats[s.sensorFormat] ?? s.sensorFormat, s.sensorType].filter(Boolean).join(' · '))
    row('megapixels', s.megapixels && `${nf(s.megapixels)} MP`)
    row('weight', W.weight(nf(s.weightG), null))
    row('dimensions', s.dimensionsMm && `${s.dimensionsMm.map(nf).join(' × ')} mm`)
  } else if (p.kind === 'camera') {
    const [stab, stabNote] = W.stabilization[s.stabilization] ?? []
    row('processor', s.processor)
    row('sensor', [W.formats[s.sensorFormat] ?? s.sensorFormat, s.sensorType].filter(Boolean).join(' · '))
    row('megapixels', s.megapixels && `${nf(s.megapixels)} MP`)
    row('video4k', rates(s.video4k))
    row('video1080', rates(s.video1080))
    row('battery', s.battery)
    row('batteryLife', W.batteryLife(nf(s.shots), nf(s.videoMin)))
    row('stabilization', stab, stabNote)
    row('weight', W.weight(nf(s.weightG), nf(s.weightWithBatteryG)))
    row('dimensions', s.dimensionsMm && `${s.dimensionsMm.map(nf).join(' × ')} mm`)
  } else if (p.kind === 'lens') {
    row('format', W.lensFormats[p.group])
    row('focal', s.focalMin === s.focalMax ? `${nf(s.focalMin)} mm` : `${nf(s.focalMin)}–${nf(s.focalMax)} mm`)
    row('type', s.zoom ? W.zoom : W.prime)
    row('apertureMax', aperture(s.apertureMax))
    row('apertureMin', aperture(s.apertureMin))
    row('oss', s.oss ? (s.ossModes ? W.ossModes(s.ossModes) : W.yes) : W.no)
    row('powerZoom', s.powerZoom ? W.yes : W.no)
    row('series', W.series[s.series])
    row('weight', s.weightG && `${nf(s.weightG)} g`)
    row('dimensions', s.diameterMm && `Ø${nf(s.diameterMm)} × ${nf(s.lengthMm)} mm`)
    row('filter', s.filterMm ? `${nf(s.filterMm)} mm` : W.noFilterThread)
    row('rearFilter', s.rearFilterMm && W.dropIn(nf(s.rearFilterMm)!))
  } else {
    if (p.group === 'mic') {
      row('micType', W.micTypes[s.type] ?? s.type)
      row('micPattern', W.micPatterns[s.pattern] ?? s.pattern)
    } else if (p.group === 'headphone') {
      row('hpType', W.hpTypes[s.type] ?? s.type)
      row('driverMm', s.driverMm && `${nf(s.driverMm)} mm`)
      row('impedance', s.impedanceOhm && `${nf(s.impedanceOhm)} Ω`)
      row('sensitivity', s.sensitivityDb && `${nf(s.sensitivityDb)} dB`)
    } else if (p.group === 'flash') {
      row('guideNumber', s.guideNumber && nf(s.guideNumber))
    } else if (p.group === 'monitor') {
      row('screenInch', s.screenInch && `${nf(s.screenInch)} inch`)
    } else if (p.group === 'battery') {
      row('capacity', s.capacityMah && `${nf(s.capacityMah)} mAh`)
      row('voltage', s.voltageV && `${nf(s.voltageV)} V`)
    } else if (p.group === 'charger') {
      row('chargeTime', s.chargeMin && `${nf(s.chargeMin)} phút`)
      row('inputVoltage', s.inputV && s.inputV.replace(/(\d+)-(\d+)V/, '$1–$2 V'))
    } else if (p.group === 'dc-coupler') {
      row('battery', s.battery)
    } else if (p.group === 'card-reader') {
      row('slots', s.slots && `${nf(s.slots)} khe`)
      row('interface', s.interface)
    } else if (p.group === 'grip') {
      row('compatibleBodies', s.compatibleBodies)
    } else if (p.group === 'memory-card' || p.group === 'storage') {
      row('capacities', s.capacitiesGb?.map((g: number) => `${nf(g)} GB`).join(' · '))
      row('cardType', s.cardType)
      row('uhsBus', s.uhsBus)
      row('uhsSpeedClass', s.uhsSpeedClass && `Class ${nf(s.uhsSpeedClass)}`)
      row('speedClass', s.speedClass && `Class ${nf(s.speedClass)}`)
      row('readSpeed', s.readMBs && `${nf(s.readMBs)} MB/s`)
      row('writeSpeed', s.writeMBs && `${nf(s.writeMBs)} MB/s`)
    }
    row('weight', s.weightG && `${nf(s.weightG)} g`)
    // Lens format: Ø diameter × length when the page gives two figures (microphones, XLR adapters)
    row('dimensions', s.dimensionsMm ? `${s.dimensionsMm.map(nf).join(' × ')} mm` : s.diameterMm && `Ø${nf(s.diameterMm)} × ${nf(s.lengthMm)} mm`)
  }
  return rows
}

/** Short line under the product name in the /wiki/san-pham list. */
export function productDetail(p: Product): string {
  const s = p.specs
  if (isCinema(p)) return [W.formats[s.sensorFormat], s.megapixels && `${nf(s.megapixels)} MP`].filter(Boolean).join(' · ')
  if (p.kind === 'camera') {
    const video = s.video4k.length ? `4K ${s.video4k[0]}p` : s.video1080.length ? `Full HD ${s.video1080[0]}p` : null
    return [s.megapixels && `${nf(s.megapixels)} MP`, video].filter(Boolean).join(' · ')
  }
  if (p.kind === 'lens') return [aperture(s.apertureMax), W.series[s.series]].join(' · ')
  return p.code
}

/** One or two sentences that answer "what is this product", built only from its spec rows (top of the product page, for readers and AI answers). */
export function productSummary(p: Product & { name: string }): string {
  const rows = specRows(p)
  const v = (k: keyof typeof R) => rows.find((r) => r.label === R[k].label)?.value?.replace(/ · /g, ', ')
  const facts = {
    name: p.name, code: p.code === p.name ? '' : p.code, mount: v('mount'), processor: v('processor'), sensor: v('sensor')?.replace(', ', ' '), megapixels: v('megapixels'),
    video4k: v('video4k'), stabilization: v('stabilization'), weight: v('weight')?.match(/^[\d,]+ g/)?.[0],
    format: v('format'), focal: v('focal'), apertureMax: v('apertureMax'), series: v('series'), oss: p.specs.oss === true,
  }
  if (isCinema(p)) return wiki.product.summary.cinema(facts)
  if (p.kind === 'accessory') return wiki.product.summary.accessory({ ...facts, role: wiki.product.accessoryGroups[p.group]?.role })
  return wiki.product.summary[p.kind as 'camera' | 'lens'](facts)
}

/** 2–3 short facts for a product card (camera: MP, top video mode, IBIS; lens: focal, max aperture, series). */
export function productChips(p: Product): string[] {
  const s = p.specs
  if (p.kind === 'camera') return [...productDetail(p).split(' · '), s.stabilization === 'ibis' && W.stabilization.ibis[1]].filter(Boolean) as string[]
  if (p.kind === 'lens') return [specRows(p).find((r) => r.label === R.focal.label)?.value, aperture(s.apertureMax), W.series[s.series]].filter(Boolean) as string[]
  return []
}

type CompareRow = { label: string; note?: string; values: (string | null)[] }

/** Spec rows of same-kind products side by side, one row per label (code sits in the column header); null where a product has no value. */
export function compareRows(ps: Product[]): CompareRow[] {
  const all = ps.map(specRows)
  const out: CompareRow[] = []
  for (const r of all.flat())
    if (r.label !== R.code.label && !out.some((o) => o.label === r.label))
      out.push({ label: r.label, note: r.note, values: all.map((rows) => rows.find((x) => x.label === r.label)?.value ?? null) })
  return out
}
