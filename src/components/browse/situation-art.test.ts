import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SITUATIONS } from '@/lib/recipes/taxonomy';
import { SituationArt } from './situation-art';

/**
 * The situation drawings (owner, 2026-10-28). Plain `.ts` with
 * `createElement`: the vitest include pattern is `src/**\/*.test.ts`.
 */

const render = (situation: (typeof SITUATIONS)[number]) =>
  renderToStaticMarkup(createElement(SituationArt, { situation }));

describe('SituationArt', () => {
  it('draws every situation, each one differently', () => {
    const drawings = SITUATIONS.map(render);
    expect(new Set(drawings).size).toBe(SITUATIONS.length);
  });

  /* Never a photograph (D3); decorative, since the tile names the situation. */
  it('is a decorative drawing, not a picture', () => {
    for (const s of SITUATIONS) {
      const svg = render(s);
      expect(svg, s).toMatch(/^<svg aria-hidden="true" viewBox="0 0 270 120" preserveAspectRatio="xMidYMid slice"/);
      expect(svg, s).not.toMatch(/<image|<img|<foreignObject/);
    }
  });

  /* The interface's own material: ink at an opacity, one light in the accent
     ramp, no outlines and no colour of its own. */
  it('paints in ink and one accent, with no strokes and no hex', () => {
    for (const s of SITUATIONS) {
      const svg = render(s);
      expect(svg, s).toMatch(/fill-accent-(300|400)/);
      expect(svg, s).toContain('fill="currentColor"');
      expect(svg, s).not.toMatch(/\bstroke=|#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
    }
  });

  it('gives each drawing’s gradients ids of their own', () => {
    const html = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        createElement(SituationArt, { situation: 'night' }),
        createElement(SituationArt, { situation: 'night' }),
      ),
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBe(4);
    expect(new Set(ids).size).toBe(4);
  });
});
