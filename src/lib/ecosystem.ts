/**
 * The three apps, in launcher order.
 *
 * Two surfaces render this list — the overlay in `site-header.tsx` and the
 * landing page at `/` — so it lives in one place. They were one component with
 * the list inlined; the moment a second surface needed it, a copy would have
 * been a launcher that disagrees with itself about what exists.
 *
 * **App names are not translated.** They are product names, the same category
 * as recipe names and Creative Look codes in Rule 3: "ColorLab 2.0" is
 * "ColorLab 2.0" in both locales. That is why they are here and not in
 * `messages/*.json` — a name in a message catalogue is a name somebody will
 * eventually translate.
 */

export type EcosystemAppDef = {
  /** Stable key for React and for tests; never shown. */
  key: string;
  /** Product name. Never translated — see above. */
  name: string;
  /**
   * Square artwork under `/public`, authored on a 256x256 canvas.
   *
   * SVG for the two marks drawn for this system, PNG for ColorLab's, which
   * predates it. The launcher passes `unoptimized`, so the file is served as
   * authored and a vector stays crisp on the 198px desktop tile at 3x — which
   * a 256px raster does not.
   */
  icon: string;
  /** The paper version, shown instead of `icon` under `.theme-paper`. */
  iconLight: string;
  href: string;
  /**
   * Padding inside the tile, per app. Unused by a `mark` tile, whose glyph is
   * centred by the face rather than inset.
   *
   * The PNGs are bare artwork on transparency with quite different bleed, so
   * one shared padding renders them at different optical sizes. These values
   * land them both on roughly 70% of the tile. Percentages, not `p-4`, so they
   * hold at every tile size without a breakpoint.
   */
  iconInset: string;
  /**
   * Short form, for a slot narrower than the name at the 13px floor. The
   * launcher's names sit beside or under faces wide enough for the full name
   * since 2026-10-30, so nothing reads it today; kept for the next narrow
   * slot. Not a translation — the same product-name rule applies, this is
   * just the name the product itself uses when it has no room.
   */
  shortName: string;
};

export const ECOSYSTEM_APPS: readonly EcosystemAppDef[] = [
  {
    key: 'colorlab',
    name: 'ColorLab 2.0',
    shortName: 'ColorLab',
    icon: '/colorlab-icon.svg',
    iconLight: '/colorlab-icon-light.svg',
    href: '/colorlab',
    iconInset: 'p-[13.5%]',
  },
  {
    key: 'wiki',
    name: 'Sony Wiki',
    shortName: 'Sony Wiki',
    icon: '/sony-wiki-icon.svg',
    iconLight: '/sony-wiki-icon-light.svg',
    href: '/cameras',
    iconInset: 'p-[13.5%]',
  },
  {
    key: 'blog',
    name: 'Alpha Tech Blogs',
    shortName: 'Tech Blogs',
    icon: '/alpha-tech-blogs-icon.svg',
    iconLight: '/alpha-tech-blogs-icon-light.svg',
    href: '/blog',
    iconInset: 'p-[13.5%]',
  },
] as const;

