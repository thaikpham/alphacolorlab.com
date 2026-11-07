import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Recipe } from '@/lib/camera/schema';
import camerasSeed from '../../../data/sony-cameras.seed.json';
import { capabilitiesForModel } from './capabilities/installable';
import { MORE_FOR_SITUATION_CANDIDATES, MORE_FOR_SITUATION_LIMIT } from '@/lib/recipes/browse';
import {
  OLDER_CAMERA_CHOICE,
  cameraOptions,
  cameraRows,
  cameraShortName,
  cameraWarnings,
  installableFor,
  isStorableChoice,
  resolveMyCamera,
} from './my-camera';
import { readCookie, wellFormedChoice } from './my-camera-cookie';

/**
 * "My camera" (ADR 0006) against the real catalogue and the real recipes:
 * the choices a reader is offered, what a stored value means, and what each
 * choice hides. The camera facts themselves are `installable.test.ts`'s.
 */

const products = camerasSeed as { sku: string; name: string; category: string; imageUrl: string }[];
const options = cameraOptions(products);
const recipes = JSON.parse(readFileSync('data/recipes.seed.json', 'utf8')) as Recipe[];
const pp = recipes.filter((r): r is Extract<Recipe, { format: 'pp' }> => r.format === 'pp');
const sCinetone = pp.find((r) => r.settings.gamma === 'S-Cinetone')!;
/* Still gamma, Still colour mode: on every body's list. */
const plainPp = pp.find((r) => r.settings.gamma === 'Still' && r.settings.colorMode === 'Still')!;
const cine4 = pp.find((r) => r.settings.gamma === 'Cine4')!;

describe('the choices', () => {
  it('are every catalogue camera, once, by the model code its SKU starts with', () => {
    const cameras = products.filter((p) => p.category === 'camera');
    expect(options).toHaveLength(cameras.length);
    expect(new Set(options.map((o) => o.id)).size).toBe(options.length);
    for (const o of options) expect(wellFormedChoice(o.id), o.id).toBe(true);
    expect(options.map((o) => o.id)).toEqual(expect.arrayContaining(['ILCE-7M3', 'ILCE-6400', 'ILCE-7M4', 'ZV-1']));
  });

  it('lists no lens and no accessory', () => {
    const lensCodes = products.filter((p) => p.category !== 'camera').map((p) => p.sku.split('/')[0].trim());
    for (const code of lensCodes) expect(options.some((o) => o.id === code), code).toBe(false);
  });

  it('name an Alpha body the way a reader says it, and leave every other name alone', () => {
    const name = (id: string) => options.find((o) => o.id === id)?.name;
    expect(name('ILCE-7M3')).toBe('a7 III');
    expect(name('ILCE-6400')).toBe('a6400');
    expect(name('ILCE-7RM3A')).toBe('a7R III');
    expect(name('ZV-E10')).toBe('ZV-E10');
    expect(name('DSC-RX100M7')).toBe('RX100 VII');
    expect(name('ILME-FX3A')).toBe('FX3');
    expect(cameraShortName({ sku: 'ILCE-1/BQ AP2', name: '1' })).toBe('a1');
  });

  it('are in name order, the a6400 before the a7 III', () => {
    const names = options.map((o) => o.name);
    expect(names.indexOf('a6400')).toBeLessThan(names.indexOf('a7 III'));
    expect(names.indexOf('a7 III')).toBeLessThan(names.indexOf('a9 III'));
  });
});

describe('a stored value', () => {
  it('names a catalogue camera, or the generic older camera', () => {
    expect(resolveMyCamera('ILCE-7M3', options)).toMatchObject({ choice: 'ILCE-7M3', name: 'a7 III' });
    expect(resolveMyCamera(OLDER_CAMERA_CHOICE, options)).toMatchObject({ choice: OLDER_CAMERA_CHOICE, name: null });
  });

  it('is no camera when it is unknown, malformed or not in the catalogue', () => {
    for (const raw of [
      undefined,
      null,
      '',
      'unknown',
      'ILCE-7M9',
      'ilce-7m3',
      'constructor',
      '__proto__',
      'ILCE-7M3; Path=/',
      '<script>',
      'A'.repeat(40),
      42,
    ]) {
      expect(resolveMyCamera(raw, options), String(raw)).toBeNull();
      expect(isStorableChoice(raw, options), String(raw)).toBe(false);
    }
  });

  it('is read out of a cookie string, and only by its exact name', () => {
    expect(readCookie('a=1; colorlab-camera=ILCE-7M3; b=2', 'colorlab-camera')).toBe('ILCE-7M3');
    expect(readCookie('xcolorlab-camera=ILCE-7M3', 'colorlab-camera')).toBeNull();
    expect(readCookie('colorlab-camera=%E0%A4%A', 'colorlab-camera')).toBeNull();
    expect(readCookie('', 'colorlab-camera')).toBeNull();
  });
});

describe('what a choice hides', () => {
  const shown = (raw: string | null) => installableFor(recipes, resolveMyCamera(raw, options));

  it('a7 III: S-Cinetone, and nothing it can install', () => {
    const left = shown('ILCE-7M3');
    expect(left).not.toContain(sCinetone);
    expect(left).toContain(plainPp);
  });

  it('RX100 VII: a Cine4 Picture Profile, which its confirmed Gamma list lacks', () => {
    expect(shown('DSC-RX100M7')).not.toContain(cine4);
    expect(shown('ILCE-7M3')).toContain(cine4);
  });

  it('no camera, "unknown", a malformed value and a camera with no checked data: nothing', () => {
    for (const raw of [null, 'unknown', 'not a camera', 'ILCE-9M3']) expect(shown(raw), String(raw)).toHaveLength(recipes.length);
  });

  it('S-Cinetone Picture Profile: only for a camera whose confirmed list lacks it', () => {
    for (const o of options) {
      const caps = capabilitiesForModel(o.id);
      const confirmedLack =
        caps.pictureProfile === false ||
        (caps.gammas !== null && !caps.gammas.includes(sCinetone.settings.gamma)) ||
        (caps.colorModes !== null && !caps.colorModes.includes(sCinetone.settings.colorMode));
      expect(shown(o.id).includes(sCinetone), o.id).toBe(!confirmedLack);
    }
    /* Proven on real bodies, not only vacuously. */
    expect(shown('ILCE-6400')).not.toContain(sCinetone);
    expect(shown('ILCE-7M4')).toContain(sCinetone);
  });

  it('the generic older camera: never S-Cinetone, which it only warns about', () => {
    const left = shown(OLDER_CAMERA_CHOICE);
    expect(left).toHaveLength(recipes.length);
    expect(left).toContain(sCinetone);
  });
});

describe('the recipe page’s lines', () => {
  it('an S-Cinetone Picture Profile: confirmed on the a6400, a warning only on the older camera', () => {
    const w = cameraWarnings(sCinetone, options);
    expect(w['ILCE-6400']).toEqual({
      camera: 'a6400',
      reasons: [{ setting: 'gamma', label: 'S-Cinetone', confirmed: true }],
    });
    expect(w[OLDER_CAMERA_CHOICE]?.reasons).toEqual([{ setting: 'gamma', label: 'S-Cinetone', confirmed: false }]);
    expect(w['ILCE-7M4']).toBeUndefined();
  });

  it('a recipe every camera can install: no line for anyone', () => {
    expect(cameraWarnings(plainPp, options)).toEqual({});
  });
});

describe('the recipe page’s row of other recipes', () => {
  /* Real recipes in the page's order: one the a7 III cannot install inside
     the first six, and ones it can after the sixth to fill from. */
  const a7iiiInstalls = new Set(installableFor(recipes, resolveMyCamera('ILCE-7M3', options)).map((r) => r.id));
  const hiddenOn7M3 = recipes.filter((r) => !a7iiiInstalls.has(r.id));
  const installableOn7M3 = recipes.filter((r) => a7iiiInstalls.has(r.id));
  const candidates = [hiddenOn7M3[0], ...installableOn7M3].slice(0, MORE_FOR_SITUATION_CANDIDATES);
  const rows = cameraRows(candidates, options, MORE_FOR_SITUATION_LIMIT);

  it('is tested on a row the a7 III changes', () => {
    expect(hiddenOn7M3.length).toBeGreaterThan(0);
    expect(candidates.length).toBeGreaterThan(MORE_FOR_SITUATION_LIMIT);
    expect(candidates.length).toBeLessThanOrEqual(MORE_FOR_SITUATION_CANDIDATES);
  });

  it('no cookie, or one that is no camera: the first six, today’s row', () => {
    expect(rows.row).toEqual(candidates.slice(0, MORE_FOR_SITUATION_LIMIT).map((r) => r.id));
    for (const raw of ['unknown', 'ILCE-9M3', 'not a camera']) expect(rows.byChoice[raw], raw).toBeUndefined();
  });

  it('a7 III: hides what it cannot install and fills from the candidates after the sixth, in order', () => {
    const a7iii = rows.byChoice['ILCE-7M3'];
    expect(a7iii.length).toBeGreaterThan(0);
    expect(a7iii.every((id) => a7iiiInstalls.has(id))).toBe(true);
    /* The browse's own rule, the S-Cinetone the a7 III lacks included. */
    expect(a7iii).toEqual(
      installableFor(candidates, resolveMyCamera('ILCE-7M3', options))
        .slice(0, MORE_FOR_SITUATION_LIMIT)
        .map((r) => r.id),
    );
    /* Backfilled: a recipe beyond today's six is in the a7 III's row. */
    expect(a7iii.some((id) => !rows.row.includes(id))).toBe(true);
    /* The older camera only warns, so its row is today's. */
    expect(rows.byChoice[OLDER_CAMERA_CHOICE]).toBeUndefined();
  });

  it('a camera that installs every candidate keeps no row of its own', () => {
    expect(rows.byChoice['ILCE-7M4']).toBeUndefined();
  });

  it('renders only the cards some row shows, in candidate order', () => {
    const used = new Set([...rows.row, ...Object.values(rows.byChoice).flat()]);
    expect(rows.shown).toEqual(candidates.map((r) => r.id).filter((id) => used.has(id)));
  });

  it('an empty row for a camera that can install none of them', () => {
    const hidden = candidates.filter((r) => !a7iiiInstalls.has(r.id));
    expect(cameraRows(hidden, options, MORE_FOR_SITUATION_LIMIT).byChoice['ILCE-7M3']).toEqual([]);
  });
});
