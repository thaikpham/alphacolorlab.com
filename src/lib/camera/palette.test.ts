import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CHANNEL_HUE,
  WB_HUE,
  accentFor,
  accentHex,
  gamutMap,
  inSrgb,
  oklchToHex,
  wbBalance,
  type AccentInput} from './color';
import {
  PP_BLACK_GAMMA_RANGE,
  PP_COLOR_DEPTH_CHANNELS,
  PP_DETAIL_BW_BALANCE,
  PP_RANGES,
  WB_KELVIN,
  WB_SHIFT_AXIS,
  type Range} from './constants';
import { DAYLIGHT_K, PALETTE_WEIGHTS, REFERENCE, SWATCH_IDS, paletteFor, type Palette, type SwatchId } from './palette';
import type { PpSettings, Recipe, WhiteBalance } from './schema';

/**
 * The palette is a reading of the settings in Sony's documented directions,
 * with magnitudes that are neutral defaults (`PALETTE_WEIGHTS`). These tests
 * pin direction, order and legibility bands — never a number — so refitting
 * the weights from the a7 IV ColorChecker shoot does not fight them.
 */

const recipes = JSON.parse(readFileSync('data/recipes.seed.json', 'utf8')) as Recipe[];

const NEUTRAL_WB: WhiteBalance = { mode: 'kelvin', kelvin: 5500 };

const NEUTRAL_PP_SETTINGS: PpSettings = {
  blackLevel: 0,
  gamma: 'Movie',
  blackGamma: { range: 'Middle', level: 0 },
  knee: { mode: 'Manual', point: 100, slope: PP_RANGES.kneeManualSlope.max },
  colorMode: 'Movie',
  saturation: 0,
  colorPhase: 0,
  colorDepth: { R: 0, G: 0, B: 0, C: 0, M: 0, Y: 0 },
  detail: { level: 0, mode: 'Manual', vhBalance: 0, bwBalance: 'Type3', limit: 0, crispening: 0, hiLightDetail: 0 }};

const NEUTRAL_CL_SETTINGS: ClSettings = {
  look: 'ST',
  contrast: 0,
  highlights: 0,
  shadows: 0,
  fade: 0,
  saturation: 0,
  sharpness: 0,
  sharpnessRange: 3,
  clarity: 0};

const NEUTRAL_PP: AccentInput = { format: 'pp', whiteBalance: NEUTRAL_WB, settings: NEUTRAL_PP_SETTINGS };
const NEUTRAL_CL: AccentInput = { format: 'pp', whiteBalance: NEUTRAL_WB, settings: NEUTRAL_CL_SETTINGS };

const pp = (settings: Partial<PpSettings>, whiteBalance: WhiteBalance = NEUTRAL_WB): AccentInput => ({
  format: 'pp',
  whiteBalance,
  settings: { ...NEUTRAL_PP_SETTINGS, ...settings }});

const cl = (settings: Partial<ClSettings>, whiteBalance: WhiteBalance = NEUTRAL_WB): AccentInput => ({
  format: 'pp',
  whiteBalance,
  settings: { ...NEUTRAL_CL_SETTINGS, ...settings }});

/** Every legal value of a range, in steps, from the bound in `constants.ts`. */
function sweep(range: Range): number[] {
  const n = Math.round((range.max - range.min) / range.step);
  return Array.from({ length: n + 1 }, (_, i) => Number((range.min + i * range.step).toFixed(6)));
}

const swatch = (p: Palette, id: SwatchId) => {
  const s = p.find((x) => x.id === id);
  if (!s) throw new Error(`no ${id}`);
  return s;
};

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/** Signed shortest turn from `a` to `b`, degrees. */
const hueTurn = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;

const EPS = 1e-9;

function expectNonDecreasing(values: number[], label: string) {
  for (let i = 1; i < values.length; i++) {
    expect(values[i], `${label} step ${i}`).toBeGreaterThanOrEqual(values[i - 1] - EPS);
  }
  expect(values.at(-1)!, `${label} max vs min`).toBeGreaterThan(values[0]);
}

function expectNonIncreasing(values: number[], label: string) {
  expectNonDecreasing(values.map((v) => -v), label);
}

const CHROMATIC: SwatchId[] = SWATCH_IDS.filter((id) => REFERENCE[id].c > 0);
const NEUTRALS: SwatchId[] = SWATCH_IDS.filter((id) => REFERENCE[id].c === 0);

const meanChroma = (p: Palette) => CHROMATIC.reduce((sum, id) => sum + swatch(p, id).c, 0) / CHROMATIC.length;

// ---------------------------------------------------------------------------

describe('hex emitter', () => {
  /* Fixed points of the OKLab ↔ sRGB transform (Ottosson's published values
     for the sRGB primaries), so a broken matrix or transfer function fails
     here rather than shifting every swatch and accent together. */
  

  it('paints every Sepia recipe in one warm hue — the accent\'s sepia, not the White Balance', () => {
    const sepia = recipes.filter((r) => r.format === 'cl' && r.settings.look === 'SE');
    expect(sepia.length).toBeGreaterThan(0);
    for (const r of sepia) {
      // The accent is the one other reading of a sepia recipe; the two agree.
      const accent = accentFor(r);
      expect(hueGap(accent.h, WB_HUE.amber), `${r.id} accent`).toBeLessThanOrEqual(20);
      for (const input of [r, withShift(r)]) {
        for (const s of paletteFor(input)) {
          expect(hueGap(s.h, accent.h), `${r.id} ${s.id}`).toBeLessThanOrEqual(3);
          expect(s.c, `${r.id} ${s.id}`).toBeGreaterThan(0);
          expect(s.c, `${r.id} ${s.id}`).toBeLessThanOrEqual(accent.c + 0.001);
        }
      }
    }
  });
});

describe('not painted', () => {
  it('ignores every Detail field — a flat patch has no edge', () => {
    const base = paletteFor(NEUTRAL_PP);
    const d = NEUTRAL_PP_SETTINGS.detail;
    const variants: PpSettings['detail'][] = [
      ...sweep(PP_RANGES.detailLevel).map((level) => ({ ...d, level })),
      ...sweep(PP_RANGES.detailVhBalance).map((vhBalance) => ({ ...d, vhBalance })),
      ...sweep(PP_RANGES.detailLimit).map((limit) => ({ ...d, limit })),
      ...sweep(PP_RANGES.detailCrispening).map((crispening) => ({ ...d, crispening })),
      ...sweep(PP_RANGES.detailHiLightDetail).map((hiLightDetail) => ({ ...d, hiLightDetail })),
      ...PP_DETAIL_BW_BALANCE.map((bwBalance) => ({ ...d, bwBalance })),
      { ...d, mode: 'Auto' as const },
    ];
    for (const detail of variants) expect(paletteFor(pp({ detail })), JSON.stringify(detail)).toEqual(base);
  });

  
});



describe('bounds and light', () => {
  /* No seed recipe is dark enough to reach the floor, so this one is built to:
     every darkening dial at its bound. Without the clamp its shadow would sit
     below the page's own ground and read as a hole in the card. */
  it('holds the shadow at the floor when every darkening dial is at its bound', () => {
    const darkest = paletteFor(
      pp({
        gamma: 'Cine4',
        colorMode: 'Still',
        blackLevel: PP_RANGES.blackLevel.min,
        blackGamma: { range: 'Wide', level: PP_RANGES.blackGammaLevel.min }}),
    );
    expect(swatch(darkest, 'shadow').l).toBe(PALETTE_WEIGHTS.bounds.lMin);
  });

  /* A Kelvin setting reads warmer under a lower light: the same 4000K that
     cools a daylight scene warms one lit by 3000K bulbs. AWB and the presets
     publish no Kelvin, so the light the recipe is built for cannot move them. */
  it('reads a Kelvin recipe under the light it is built for, and leaves AWB alone', () => {
    const lean = (p: Palette) => {
      const mid = swatch(p, 'mid');
      return mid.c * Math.cos(((mid.h - WB_HUE.amber) * Math.PI) / 180);
    };
    const kelvin = pp({}, { mode: 'kelvin', kelvin: 4000 });
    expect(lean(paletteFor(kelvin))).toBeLessThan(0);
    expect(lean(paletteFor(kelvin, { light: 3000 }))).toBeGreaterThan(0);
    expect(paletteFor(kelvin, { light: DAYLIGHT_K })).toEqual(paletteFor(kelvin));

    const awb = pp({}, { mode: 'auto', auto: 'AWB', shift: { ab: { axis: 'A', amount: 2 } } });
    expect(paletteFor(awb, { light: 3000 })).toEqual(paletteFor(awb));
  });
});

// ---------------------------------------------------------------------------

describe('every seed recipe', () => {
  const palettes = recipes.map((r) => [r, paletteFor(r)] as const);

  it('stays in the legibility band, in sRGB', () => {
    for (const [r, p] of palettes) {
      expect(swatch(p, 'highlight').l, `${r.id} highlight`).toBeGreaterThanOrEqual(0.7);
      expect(swatch(p, 'shadow').l, `${r.id} shadow vs mid`).toBeLessThanOrEqual(swatch(p, 'mid').l - 0.06);
      expect(p.filter((s) => s.l >= 0.5).length, `${r.id} light swatches`).toBeGreaterThanOrEqual(3);
      for (const s of p) {
        expect(s.l, `${r.id} ${s.id}`).toBeGreaterThanOrEqual(PALETTE_WEIGHTS.bounds.lMin);
        expect(s.l, `${r.id} ${s.id}`).toBeLessThanOrEqual(PALETTE_WEIGHTS.bounds.lMax);
        expect(inSrgb(s), `${r.id} ${s.id}`).toBe(true);
      }
    }
  });

  it('emits css and hex from the same mapped value', () => {
    const CSS_RE = /^oklch\((\d+(\.\d+)?)% ([\d.]+) ([\d.]+)\)$/;
    for (const [r, p] of palettes) {
      for (const s of p) {
        const m = CSS_RE.exec(s.css);
        expect(m, `${r.id} ${s.id} ${s.css}`).not.toBeNull();
        expect(Number(m![1]) / 100).toBeCloseTo(s.l, 9);
        expect(Number(m![3])).toBeCloseTo(s.c, 9);
        expect(Number(m![4])).toBeCloseTo(s.h, 9);
        expect(s.hex).toBe(oklchToHex(s));
        expect(deltaEOk(hexToOklab(s.hex), oklchToOklab(s)), `${r.id} ${s.id}`).toBeLessThanOrEqual(0.01);
      }
    }
  });

  it('never gives two recipes with different painted settings the same palette', () => {
    const differs = (a: Palette, b: Palette) =>
      a.some((s, i) => Math.abs(s.l - b[i].l) > 1e-4 || Math.abs(s.c - b[i].c) > 1e-4 || Math.abs(s.h - b[i].h) > 1e-4);
    for (let i = 0; i < palettes.length; i++) {
      for (let j = i + 1; j < palettes.length; j++) {
        const [a, pa] = palettes[i];
        const [b, pb] = palettes[j];
        if (paintedKey(a) === paintedKey(b)) continue;
        expect(differs(pa, pb), `${a.id} vs ${b.id}`).toBe(true);
      }
    }
  });
});

describe('source hygiene', () => {
  it('has no hex literal in palette.ts — hex comes only from the emitter', () => {
    expect(readFileSync('src/lib/camera/palette.ts', 'utf8')).not.toMatch(/#[0-9a-fA-F]/);
  });
});

// ---------------------------------------------------------------------------

/**
 * What the palette reads from a recipe. Detail, sharpness, sharpness range
 * and clarity are not painted; White Balance is read only as its warmth and
 * tint, so two Auto modes with the same shift are the same input.
 */
function paintedKey(r: Recipe): string {
  const { warmth, tint } = wbBalance(r.whiteBalance);
  const wb = { warmth: Number(warmth.toFixed(6)), tint: Number(tint.toFixed(6)) };
  if (r.format === 'pp') {
    const { detail: _detail, knee, ...rest } = r.settings;
    const kneeKey = knee.mode === 'Auto' ? { mode: 'Auto' } : knee;
    return JSON.stringify({ format: 'pp', wb, ...rest, knee: kneeKey });
  }
  const { sharpness: _s, sharpnessRange: _r, clarity: _c, ...rest } = r.settings;
  return JSON.stringify({ format: 'pp', wb, ...rest });
}

function oklchToOklab(s: { l: number; c: number; h: number }): [number, number, number] {
  const r = (s.h * Math.PI) / 180;
  return [s.l, s.c * Math.cos(r), s.c * Math.sin(r)];
}

function hexToOklab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function deltaEOk(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
