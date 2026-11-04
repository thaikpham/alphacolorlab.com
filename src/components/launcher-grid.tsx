'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { LAUNCHER_GLOW } from '../../packages/colorlab-tokens/src/tokens';
import { ECOSYSTEM_APPS, type EcosystemAppDef } from '@/lib/ecosystem';

/**
 * The ecosystem launcher — the one sanctioned exception in the design system.
 *
 * Squircle tiles carrying a rotating seven-colour spectral glow: the only
 * multi-hue gradient, the only rotating animation and the only radius outside
 * the scale anywhere in the ecosystem. The recipe itself lives in globals.css
 * (`.launcher-*`) so there is exactly one place to delete it from if it ever
 * gets reused somewhere else and stops being a signature.
 *
 * The seven hues come from LAUNCHER_GLOW in the token package rather than being
 * retyped here, and are handed to the stylesheet as one custom property. A
 * conic gradient needs its stops as a single comma-separated string, and the
 * first hue repeats at the end so the wheel closes without a seam.
 */
const SPECTRUM = [...LAUNCHER_GLOW, LAUNCHER_GLOW[0]].join(', ');

type Props = {
  onNavigate?: () => void;
};

/**
 * One layout, everywhere (owner, 2026-10-30): the first app four times the
 * size of the other two.
 *
 * A grid of four units by two. ColorLab is the first entry and takes the two
 * left units on both rows — a tile two units wide and two tall, its name
 * under it. The other two apps stack down the right, one unit each with the
 * name beside it. On a phone the right column drops under the big tile and
 * the two rows keep their shape. The unit, the gaps and the breakpoints are
 * `.launcher-grid`'s in globals.css, with the glow blurs that go with each
 * size; there is no size prop to diverge with, so the landing page and the
 * header's ecosystem overlay render the same object.
 *
 * Written out as classes rather than derived from another string: Tailwind v4
 * scans source text for class names, and a class assembled at runtime is one
 * the scanner never sees.
 */

/**
 * One tile: two glow layers behind an opaque icon face.
 *
 * The face must stay opaque. The spectrum reads as light escaping from behind
 * the tile; the moment it tints the artwork it stops being a signature and
 * becomes a filter over the apps' icons.
 */
function Face({ app, big }: { app: EcosystemAppDef; big: boolean }) {
  return (
    <div
      className={`launcher-tile ${big ? 'launcher-tile-big' : 'launcher-tile-unit'}`}
      style={{ '--launcher-spectrum': SPECTRUM } as React.CSSProperties}
    >
      <span aria-hidden className="launcher-glow" />
      <span aria-hidden className="launcher-glow-rim" />
      <div className={`launcher-face ${app.iconInset}`}>
        {/* Both marks are rendered and CSS picks one (`.mark-on-dark` /
            `.mark-on-paper` in globals.css): the theme is a class on the
            page, not a media query, so there is nothing to branch on here. */}
        <Image
          src={app.icon}
          alt=""
          width={200}
          height={200}
          unoptimized
          className="mark-on-dark w-full h-full object-contain"
        />
        <Image
          src={app.iconLight}
          alt=""
          width={200}
          height={200}
          unoptimized
          className="mark-on-paper w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

/**
 * Every tile opens its app. No tile opens a second screen of tiles.
 *
 * Sony Wiki used to be the exception: tapping it swapped the grid for a DI/PE
 * sub-view, so reaching a camera page cost two taps and a back button that had
 * to be positioned around `.animate-fade-in`'s transform. The two divisions are
 * one app with two catalogues, not two apps, so the switch between them now
 * lives where the rest of that app's controls live — beside the search field in
 * `site-header.tsx`. The tile lands on `/cameras` like any other tile lands on
 * its app.
 */
export function LauncherGrid({ onNavigate }: Props) {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="launcher-grid animate-fade-in">
        {ECOSYSTEM_APPS.map((app, i) => {
          const big = i === 0;
          /* The big tile: the face, the name under it. A small one: the face,
             the name beside it. The name is the link's accessible name, so it
             stays inside the link in both. 13px is the floor and the small
             tiles' names sit at the body size; the big tile's at the card
             title's. */
          const className = big
            ? 'launcher-link launcher-link-big group flex flex-col items-center gap-3 sm:gap-4 text-center cursor-pointer'
            : 'launcher-link launcher-link-unit group flex items-center gap-4 sm:gap-5 text-left cursor-pointer';
          const content = (
            <>
              <Face app={app} big={big} />
              <span
                className={
                  big
                    ? 'text-body sm:text-title-3 font-semibold text-ink leading-tight'
                    : 'text-body font-semibold text-ink leading-tight min-w-0'
                }
              >
                {app.name}
              </span>
            </>
          );

          return (
            <Link key={app.key} href={app.href} onClick={onNavigate} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
