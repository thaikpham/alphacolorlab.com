import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CL_EXPLANATIONS, PP_EXPLANATIONS, WB_EXPLANATIONS } from '@/lib/camera/explanations';
import { clEffects, ppEffects } from '@/lib/camera/effects';
import { CL_PARAM_ORDER, PP_COLOR_DEPTH_CHANNELS } from '@/lib/camera/constants';
import type { ClSettings, PpSettings, Recipe, WhiteBalance } from '@/lib/camera/schema';
import { ClCards, PpCards, WbDials } from './param-cards';

/**
 * The parameter cards (owner, 2026-10-28), as markup. Plain `.ts` with
 * `createElement`: the vitest include pattern is `src/**\/*.test.ts`.
 */

const seed = JSON.parse(readFileSync('data/recipes.seed.json', 'utf8')) as Recipe[];
const pp = seed.find((r) => r.format === 'pp')!.settings as PpSettings;
const clRecipes = seed.filter((r) => r.format === 'cl');
const cl = clRecipes.find((r) => (r.settings as ClSettings).fade! > 0)!.settings as ClSettings;

const cards = (html: string) => html.match(/class="param-row\b/g)?.length ?? 0;
/** A card's label: the `.label` span inside its face. */
const labels = (html: string) => [...html.matchAll(/<span class="label leading-tight">([^<]+)<\/span>/g)].map((m) => m[1]);

describe('Picture Profile cards', () => {
  const html = renderToStaticMarkup(createElement(PpCards, { s: pp, locale: 'en' }));

  it('give every dial a card: seven, six channels, seven detail', () => {
    expect(cards(html)).toBe(7 + PP_COLOR_DEPTH_CHANNELS.length + 7);
  });

  it('carry what the value does and what the dial is, behind the tap', () => {
    const fx = ppEffects(pp);
    expect(html).toContain(fx.blackLevel.en);
    expect(html).toContain(PP_EXPLANATIONS.blackLevel.en);
    expect(html.match(/<details /g)?.length).toBe(cards(html));
  });

  it('draws Color Depth in its channel colours', () => {
    for (const c of PP_COLOR_DEPTH_CHANNELS) expect(labels(html)).toContain(c);
    expect(html).toMatch(/style="color:#[0-9a-f]{6}"/i);
  });
});

describe('Creative Look cards', () => {
  const html = renderToStaticMarkup(createElement(ClCards, { s: cl, locale: 'en' }));

  it('give the Look and every dial the camera shows a card', () => {
    const shown = CL_PARAM_ORDER.filter((p) => cl[p] !== undefined).length;
    expect(cards(html)).toBe(1 + shown);
  });

  /* Rule 1: Fade, Sharpness, Clarity and Sharpness Range are unsigned. */
  it('prints unsigned values without a sign', () => {
    const fade = html.match(/>Fade<\/span><span class="[^"]*">([^<]+)<\/span>/)?.[1];
    expect(fade).toBe(String(cl.fade));
    expect(html).toContain(CL_EXPLANATIONS.fade.en);
    expect(html).toContain(clEffects(cl).fade.en);
  });

  it('names the Look beside its code', () => {
    expect(html).toContain(`>${cl.look}</span>`);
  });
});

describe('the White Balance dials, per mode (rule 1b)', () => {
  const render = (wb: WhiteBalance) => renderToStaticMarkup(createElement(WbDials, { wb, locale: 'en' }));

  it('keeps Temperature and its explanation for a Kelvin recipe', () => {
    const html = render({ mode: 'kelvin', kelvin: 7000 });
    expect(labels(html)[0]).toBe('Temperature');
    expect(html).toContain(WB_EXPLANATIONS.temperature.en);
  });

  it.each([
    ['a preset', { mode: 'preset', preset: 'Cloudy', shift: { ab: { axis: 'A', amount: 1.5 } } }],
    ['an auto mode', { mode: 'auto', auto: 'AWB' }],
  ] as [string, WhiteBalance][])('names the White Balance, not a Temperature, for %s', (_, wb) => {
    const html = render(wb);
    expect(labels(html)[0]).toBe('White Balance');
    expect(html).not.toContain(WB_EXPLANATIONS.temperature.en);
  });

  it('draws a card per shift axis the recipe sets, and none for one it does not', () => {
    expect(cards(render({ mode: 'kelvin', kelvin: 5600 }))).toBe(1);
    expect(cards(render({ mode: 'kelvin', kelvin: 5600, shift: { ab: { axis: 'A', amount: 2 }, gm: { axis: 'G', amount: 1 } } }))).toBe(3);
  });
});
