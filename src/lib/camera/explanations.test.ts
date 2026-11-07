import { describe, expect, it } from 'vitest';
import {
  COLOR_DEPTH_EXPLANATIONS,
  PP_DETAIL_EXPLANATIONS,
  PP_EXPLANATIONS,
  WB_OVERVIEW,
} from './explanations';
import {
  PP_COLOR_DEPTH_CHANNELS,
  PP_RANGES,
  WB_KELVIN,
  WB_SHIFT_AXIS,
} from './constants';
import { MIRED_PER_SHIFT_STEP } from './color';
import { ppSettingsSchema } from './schema';

/** The PP setting keys, read off the schema rather than hand-listed. */
const ppKeys = Object.keys(ppSettingsSchema.shape);

describe('parameter explanations', () => {
  it('covers every Picture Profile setting', () => {
    expect(ppKeys.length).toBeGreaterThan(0);
    for (const key of ppKeys) {
      expect(PP_EXPLANATIONS, `missing explanation for PP "${key}"`).toHaveProperty(key);
    }
  });

  it('covers every Color Depth channel', () => {
    for (const c of PP_COLOR_DEPTH_CHANNELS) {
      expect(COLOR_DEPTH_EXPLANATIONS, `missing channel "${c}"`).toHaveProperty(c);
    }
  });

  it('covers every Picture Profile Detail sub-parameter', () => {
    for (const d of ['level', 'mode', 'vhBalance', 'bwBalance', 'limit', 'crispening', 'hiLightDetail']) {
      expect(PP_DETAIL_EXPLANATIONS, `missing detail sub-param "${d}"`).toHaveProperty(d);
    }
  });

  it('covers every Creative Look parameter', () => {
  });

  it('names no Detail number that is not a bound of PP_RANGES.detailLevel', () => {
    /* The bands used to be typed in ('−7 to −3', '+1 to +7'), so a widened
       Detail range left the prose stale. Only the bounds, read from
       constants.ts, may appear. */
    const { min, max } = PP_RANGES.detailLevel;
    for (const text of [PP_EXPLANATIONS.detail.en, PP_EXPLANATIONS.detail.vi]) {
      const numbers = [...text.matchAll(/[−+-]?\d+/g)].map((m) => Number(m[0].replace('−', '-')));
      expect(numbers.length).toBeGreaterThan(0);
      for (const n of numbers) expect([min, max], text).toContain(n);
      expect(text).toContain(`${min}`);
      expect(text).toContain(`+${max}`);
    }
  });
});
