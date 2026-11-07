import { readFileSync } from 'node:fs';
import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

import en from '../../messages/en.json';

import { PP_EXPLANATIONS, WB_EXPLANATIONS } from '@/lib/camera/explanations';
import { ppEffects } from '@/lib/camera/effects';
import { PP_COLOR_DEPTH_CHANNELS } from '@/lib/camera/constants';
import type { PpSettings, Recipe, WhiteBalance } from '@/lib/camera/schema';
import { PpCards, WbDials } from './param-cards';

/**
 * The parameter cards (owner, 2026-10-28), as markup. Plain `.ts` with
 * `createElement`: the vitest include pattern is `src/**\/*.test.ts`.
 */

const seed = JSON.parse(readFileSync('data/recipes.seed.json', 'utf8')) as Recipe[];
const pp = seed.find((r) => r.format === 'pp')!.settings as PpSettings;

/* The provider's props type requires `children`; the real child is passed
   positionally, which is what createElement renders. */
const INTL: ComponentProps<typeof NextIntlClientProvider> = {
  locale: 'en',
  messages: en,
  timeZone: 'Asia/Ho_Chi_Minh',
  children: null,
};
const render = (node: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(createElement(NextIntlClientProvider, INTL, node));

const cards = (html: string) => html.match(/class="param-row\b/g)?.length ?? 0;
/** A card's label: the `.label` span inside its face. */
const labels = (html: string) => [...html.matchAll(/<span class="label leading-tight">([^<]+)<\/span>/g)].map((m) => m[1]);

describe('Picture Profile cards', () => {
  const html = render(createElement(PpCards, { s: pp, locale: 'en' }));

  it('give every dial a card: seven, six channels, seven detail', () => {
    expect(cards(html)).toBe(7 + PP_COLOR_DEPTH_CHANNELS.length + 7);
  });

  it('carry what the value does and what the dial is, in a popover per card', () => {
    const fx = ppEffects(pp);
    expect(html).toContain(fx.blackLevel.en);
    expect(html).toContain(PP_EXPLANATIONS.blackLevel.en);
    expect(html.match(/popover="auto"/g)?.length).toBe(cards(html));
    /* React serialises the attribute as written; HTML attribute names are
       case-insensitive, so the browser reads `popoverTarget` as the API's. */
    expect(html.match(/<button type="button" popover[Tt]arget="/g)?.length).toBe(cards(html));
    expect(html).toContain('aria-label="Explain Black Level"');
  });

  it('pair every button with its own popover and anchor', () => {
    const targets = [...html.matchAll(/popover[Tt]arget="([^"]+)"/g)].map((m) => m[1]);
    const ids = [...html.matchAll(/<div id="([^"]+)" popover="auto"/g)].map((m) => m[1]);
    expect(targets).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('draws Color Depth in its channel colours', () => {
    for (const c of PP_COLOR_DEPTH_CHANNELS) expect(labels(html)).toContain(c);
    expect(html).toMatch(/style="color:#[0-9a-f]{6}"/i);
  });
});

describe('the White Balance dials, per mode (rule 1b)', () => {
  const dials = (wb: WhiteBalance) => render(createElement(WbDials, { wb, locale: 'en' }));

  it('keeps Temperature and its explanation for a Kelvin recipe', () => {
    const html = dials({ mode: 'kelvin', kelvin: 7000 });
    expect(labels(html)[0]).toBe('Temperature');
    expect(html).toContain(WB_EXPLANATIONS.temperature.en);
  });

  it.each([
    ['a preset', { mode: 'preset', preset: 'Cloudy', shift: { ab: { axis: 'A', amount: 1.5 } } }],
    ['an auto mode', { mode: 'auto', auto: 'AWB' }],
  ] as [string, WhiteBalance][])('names the White Balance, not a Temperature, for %s', (_, wb) => {
    const html = dials(wb);
    expect(labels(html)[0]).toBe('White Balance');
    expect(html).not.toContain(WB_EXPLANATIONS.temperature.en);
  });

  it('draws a card per shift axis the recipe sets, and none for one it does not', () => {
    expect(cards(dials({ mode: 'kelvin', kelvin: 5600 }))).toBe(1);
    expect(cards(dials({ mode: 'kelvin', kelvin: 5600, shift: { ab: { axis: 'A', amount: 2 }, gm: { axis: 'G', amount: 1 } } }))).toBe(3);
  });
});
