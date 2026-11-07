/**
 * The settings a new recipe starts from in the /admin editor.
 * Every signed dial starts at zero, every unsigned one at its minimum.
 * The recipe name (`names.ts`) measures against the same dials.
 *
 * Every bound is read from `constants.ts` (Rule 1); the enum members are the
 * schema's own strings, which `satisfies` checks.
 */

import { PP_RANGES } from './constants';
import type { PpSettings } from './schema';

export const DEFAULT_PP_SETTINGS = {
  blackLevel: 0,
  gamma: 'Cine1',
  blackGamma: { range: 'Middle', level: 0 },
  knee: { mode: 'Auto' },
  colorMode: 'Pro',
  saturation: 0,
  colorPhase: 0,
  colorDepth: { R: 0, G: 0, B: 0, C: 0, M: 0, Y: 0 },
  detail: {
    level: 0,
    mode: 'Auto',
    vhBalance: 0,
    bwBalance: 'Type3',
    limit: PP_RANGES.detailLimit.min,
    crispening: PP_RANGES.detailCrispening.min,
    hiLightDetail: PP_RANGES.detailHiLightDetail.min,
  },
} as const satisfies PpSettings;
