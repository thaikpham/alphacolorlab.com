import type { CSSProperties, ReactNode } from 'react';
import {
  haloSpectrum,
  markBase,
  markCode,
  markInitials,
  MARK_HUES,
  swatchCss,
  type MarkInput,
  type MarkSize,
} from '@/lib/recipes/mark';

/**
 * The recipe mark (owner, 2026-10-28; canvas "Recipe chip marks"): a white
 * 35mm cartridge standing up for a Creative Look, a white cinema reel for a
 * Picture Profile (a clapperboard until 2026-10-29). It replaced the nine-swatch strip on the card, which
 * readers found hard to choose from: a silhouette says stills or cinema
 * before a word is read, and the initials give a recipe a handle.
 *
 * The colour is on the film, never under the type. Each object's leader
 * shows three frames — the recipe's highlight, mid and shadow; the cartridge
 * wears a sticker of its six hues and the reel shows them through its six
 * windows; and behind both a halo of those hues (`haloSpectrum`), lit the way
 * the launcher's tiles are, from this recipe's own swatches. All of it is
 * `paletteFor`'s reading of the settings, never a preview.
 *
 * It is a drawn object, not a surface. That is why its body is white and its
 * type dark — the paper room's ink, printed on the object — and why its
 * corners follow the object rather than the radius scale. Decorative to a
 * screen reader: the name is always written next to it, and the card's slot
 * carries the palette's label.
 *
 * Five sizes, every type size a step of the scale and none under 13px: what
 * does not fit drops out (the code at `s`, the id and sticker at `xs`)
 * instead of shrinking. `sm` is the browse card's.
 */

type Dims = {
  readonly size: MarkSize;
  readonly w: number;
  readonly h: number;
  /** Scale against the 216px design size. */
  readonly k: number;
  readonly initials: string;
  readonly showId: boolean;
  readonly showCode: boolean;
};

const SIZES: Readonly<Record<MarkSize, Omit<Dims, 'size' | 'h' | 'k'>>> = {
  xs: { w: 66, initials: 'text-body', showId: false, showCode: false },
  s: { w: 120, initials: 'text-title-3 tracking-[-0.02em]', showId: true, showCode: false },
  /* The browse card's size (owner, 2026-10-29: the cards were too big). */
  sm: { w: 156, initials: 'text-title-2 tracking-[-0.02em]', showId: true, showCode: true },
  m: { w: 216, initials: 'text-title-1 tracking-[-0.02em]', showId: true, showCode: true },
  l: { w: 288, initials: 'text-display tracking-[-0.02em]', showId: true, showCode: true },
};

function dims(size: MarkSize): Dims {
  const s = SIZES[size];
  return { ...s, size, h: Math.round((s.w * 176) / 216), k: s.w / 216 };
}

/* The object's materials. Not interface colour: a white label, metal, film
   base and paper ink, printed on a thing standing in the slot. */
const LABEL_WHITE =
  'linear-gradient(90deg, oklch(99.5% 0.002 275) 0%, oklch(97.5% 0.003 275) 45%, oklch(89% 0.006 275) 100%)';
const METAL = 'linear-gradient(180deg, oklch(82% 0.006 275), oklch(54% 0.006 275))';
const FILM = 'oklch(11% 0.006 275)';
const SPROCKET = 'oklch(100% 0 0 / 0.16)';
const STICKER = 'oklch(96.5% 0.014 85)';
const PAPER_INK = 'oklch(21% 0.014 265)';
const PAPER_MUTED = 'oklch(38% 0.014 265)';
const LIFT = 'var(--elevation-1)';

type Ink = { readonly initials: string; readonly code: string; readonly base: string };

const scale = (d: Dims) => (v: number) => Math.round(v * d.k);

function Initials({ d, children }: { d: Dims; children: ReactNode }) {
  return (
    <span className={`${d.initials} font-extrabold leading-none whitespace-nowrap`} style={{ color: PAPER_INK }}>
      {children}
    </span>
  );
}

/** Id and Sony code at label size. The gamma keeps Sony's casing (`S-Cinetone`). */
function Small({ children, keepCase = false }: { children: ReactNode; keepCase?: boolean }) {
  return (
    <span className={`label leading-none whitespace-nowrap ${keepCase ? 'normal-case' : ''}`} style={{ color: PAPER_MUTED }}>
      {children}
    </span>
  );
}

/** The six hues on an ivory paper sticker. */
function Sticker({ d, c }: { d: Dims; c: Record<string, string> }) {
  const px = scale(d);
  return (
    <span
      className="inline-flex self-start"
      style={{
        gap: Math.max(1, px(2)),
        padding: Math.max(2, px(3)),
        borderRadius: Math.max(3, px(5)),
        background: STICKER,
        boxShadow: '0 1px 2px oklch(0% 0 0 / 0.22)',
      }}
    >
      {MARK_HUES.map((hue) => (
        <span
          key={hue}
          style={{
            width: Math.max(5, px(10)),
            height: Math.max(7, px(14)),
            borderRadius: Math.max(1, px(2)),
            background: c[hue],
          }}
        />
      ))}
    </span>
  );
}

function Sprockets({ d, width, edge }: { d: Dims; width: number; edge: 'top' | 'bottom' }) {
  const px = scale(d);
  const count = Math.max(2, Math.floor(width / px(14)));
  return (
    <span className="absolute flex justify-between" style={{ left: px(6), right: px(6), [edge]: Math.max(1, px(3)) }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ width: Math.max(3, px(6)), height: Math.max(2, px(4)), borderRadius: 1, background: SPROCKET }} />
      ))}
    </span>
  );
}

function Cartridge({ d, c, ink }: { d: Dims; c: Record<string, string>; ink: Ink }) {
  const px = scale(d);
  const bodyW = d.size === 'xs' ? 44 : d.size === 's' ? 72 : d.size === 'sm' ? 84 : px(100);
  const lip = Math.max(2, px(4));
  const knobW = px(22);
  const knobH = Math.max(4, px(10));
  const capH = Math.max(4, px(8));
  const tongueW = d.size === 'xs' ? 16 : d.size === 's' ? 32 : d.size === 'sm' ? 34 : px(44);
  const tongueH = d.size === 'xs' ? 20 : d.size === 's' ? 36 : d.size === 'sm' ? 44 : px(56);
  const x0 = Math.round((d.w - (bodyW + 2 * lip + tongueW)) / 2);
  const bodyL = x0 + lip;
  const labelT = knobH + capH;
  const labelH = d.h - knobH - 2 * capH - 4;
  const holeH = Math.max(2, px(4));
  const frameT = holeH + px(7);
  const tuck = px(6);
  const cap = (top: number): CSSProperties => ({
    left: x0,
    top,
    width: bodyW + 2 * lip,
    height: capH,
    borderRadius: px(3),
    background: METAL,
    boxShadow: LIFT,
  });

  return (
    <>
      {/* The spool's knob. */}
      <span
        className="absolute"
        style={{
          left: bodyL + Math.round((bodyW - knobW) / 2),
          top: 0,
          width: knobW,
          height: knobH + 2,
          borderRadius: `${px(3)}px ${px(3)}px 0 0`,
          background: METAL,
        }}
      />
      {/* The leader: three frames, the recipe's highlight, mid and shadow. */}
      <span
        className="absolute overflow-hidden"
        style={{
          left: bodyL + bodyW - tuck,
          top: labelT + px(16),
          width: tongueW + tuck,
          height: tongueH,
          borderRadius: `0 ${px(3)}px ${px(3)}px 0`,
          background: FILM,
          boxShadow: LIFT,
        }}
      >
        <Sprockets d={d} width={tongueW} edge="top" />
        <Sprockets d={d} width={tongueW} edge="bottom" />
        <span
          className="absolute flex"
          style={{ left: tuck + px(4), right: px(4), top: frameT, height: tongueH - 2 * frameT, gap: Math.max(2, px(3)) }}
        >
          <span className="flex-1" style={{ background: c.highlight }} />
          <span className="flex-1" style={{ background: c.mid }} />
          <span className="flex-1" style={{ background: c.shadow }} />
        </span>
      </span>
      <span className="absolute" style={cap(knobH)} />
      <span className="absolute" style={cap(labelT + labelH)} />
      {/* The label, lit from the left like a cylinder. */}
      <span
        className={`absolute flex flex-col items-start overflow-hidden ${d.size === 'xs' ? 'justify-center' : 'justify-between'}`}
        style={{
          left: bodyL,
          top: labelT,
          width: bodyW,
          height: labelH,
          padding: `${px(10)}px ${px(8)}px`,
          background: LABEL_WHITE,
          boxShadow: LIFT,
        }}
      >
        {d.showCode ? <Small keepCase>{ink.base}</Small> : null}
        <Initials d={d}>{ink.initials}</Initials>
        {d.size === 'xs' ? null : <Sticker d={d} c={c} />}
        {d.showId ? <Small>{ink.code}</Small> : null}
      </span>
    </>
  );
}

/* Per size: the reel's diameter, its hub's, and a window's radius. */
const REEL: Readonly<Record<MarkSize, { d: number; hub: number; win: number }>> = {
  xs: { d: 52, hub: 34, win: 4 },
  s: { d: 90, hub: 62, win: 7 },
  sm: { d: 122, hub: 80, win: 9 },
  m: { d: 150, hub: 96, win: 11 },
  l: { d: 200, hub: 128, win: 15 },
};

/**
 * Picture Profile: a cinema reel (owner, 2026-10-29; it was a clapperboard),
 * white like the cartridge, its leader coming off the rim to the right. Six
 * windows between the spokes show the recipe's six hues; the leader's three
 * frames are its highlight, mid and shadow; the hub is the ivory label with
 * the name.
 */
function Reel({ d, c, ink }: { d: Dims; c: Record<string, string>; ink: Ink }) {
  const px = scale(d);
  const { d: D, hub, win } = REEL[d.size];
  const cx = D / 2;
  const cy = d.h / 2;
  const ring = (D / 2 + hub / 2) / 2;
  const tongueW = d.w - D + px(6);
  const tongueH = d.size === 'xs' ? 20 : d.size === 's' ? 36 : d.size === 'sm' ? 44 : px(56);
  const tongueT = Math.round(cy - D / 2 + px(18));
  const holeH = Math.max(2, px(4));
  const frameT = holeH + px(7);
  const tuck = px(6);

  return (
    <>
      {/* The leader, off the rim. */}
      <span
        className="absolute overflow-hidden"
        style={{
          left: D - tuck,
          top: tongueT,
          width: tongueW,
          height: tongueH,
          borderRadius: `0 ${px(3)}px ${px(3)}px 0`,
          background: FILM,
          boxShadow: LIFT,
        }}
      >
        <Sprockets d={d} width={tongueW - tuck} edge="top" />
        <Sprockets d={d} width={tongueW - tuck} edge="bottom" />
        <span
          className="absolute flex"
          style={{ left: tuck + px(4), right: px(4), top: frameT, height: tongueH - 2 * frameT, gap: Math.max(2, px(3)) }}
        >
          <span className="flex-1" style={{ background: c.highlight }} />
          <span className="flex-1" style={{ background: c.mid }} />
          <span className="flex-1" style={{ background: c.shadow }} />
        </span>
      </span>
      {/* The reel. */}
      <span
        className="absolute"
        style={{
          left: 0,
          top: cy - D / 2,
          width: D,
          height: D,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 30%, oklch(99.5% 0.002 275), oklch(95% 0.004 275) 62%, oklch(88% 0.006 275) 100%)',
          boxShadow: `${LIFT}, inset 0 1px 0 oklch(100% 0 0 / 0.9)`,
        }}
      >
        {MARK_HUES.map((hue, i) => {
          const a = ((i * 60 - 90) * Math.PI) / 180;
          return (
            <span
              key={hue}
              className="absolute"
              style={{
                left: cx + ring * Math.cos(a) - win,
                top: cx + ring * Math.sin(a) - win,
                width: win * 2,
                height: win * 2,
                borderRadius: '50%',
                background: c[hue],
                boxShadow: 'inset 0 1px 3px oklch(0% 0 0 / 0.4)',
              }}
            />
          );
        })}
        {/* The hub label. */}
        <span
          className="absolute flex flex-col items-center justify-center text-center"
          style={{
            left: cx - hub / 2,
            top: cx - hub / 2,
            width: hub,
            height: hub,
            borderRadius: '50%',
            gap: Math.max(2, px(4)),
            background: STICKER,
            boxShadow: 'inset 0 1px 3px oklch(0% 0 0 / 0.18), 0 1px 0 oklch(100% 0 0 / 0.8)',
          }}
        >
          {d.showCode ? <Small keepCase>{ink.base}</Small> : null}
          <Initials d={d}>{ink.initials}</Initials>
          {d.showId ? <Small>{ink.code}</Small> : null}
        </span>
      </span>
    </>
  );
}

export function RecipeMark({
  recipe,
  size = 'm',
  className = '',
  halo = true,
}: {
  recipe: MarkInput;
  size?: MarkSize;
  /** Placement and visibility only (`hidden sm:block`); the mark sizes itself. */
  className?: string;
  /** The recipe's halo behind the object. Off only where the ground is light. */
  halo?: boolean;
}) {
  const d = dims(size);
  const c = swatchCss(recipe.palette);
  const ink: Ink = { initials: markInitials(recipe.name), code: markCode(recipe.id), base: markBase(recipe) };
  const box = haloBox(recipe.format, d);
  return (
    <div aria-hidden="true" className={`relative shrink-0 ${className}`} style={{ width: d.w, height: d.h }}>
      {halo ? (
        <span
          className="mark-glow-stage"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            '--mark-spectrum': haloSpectrum(recipe.palette),
            '--glow-blur': `${Math.round(d.w * 0.19)}px`,
            '--rim-blur': `${Math.round(d.w * 0.06)}px`,
          } as CSSProperties}
        >
          <span className="mark-glow" />
          <span className="mark-glow-rim" />
        </span>
      ) : null}
      {recipe.format === 'cl' ? <Cartridge d={d} c={c} ink={ink} /> : <Reel d={d} c={c} ink={ink} />}
    </div>
  );
}

/** Where the halo sits: behind the cartridge's body, behind the reel's disc. */
function haloBox(format: 'cl' | 'pp', d: Dims): { left: number; top: number; width: number; height: number } {
  const px = scale(d);
  if (format === 'pp') {
    const D = REEL[d.size].d;
    return { left: 0, top: d.h / 2 - D / 2, width: D, height: D };
  }
  const bodyW = d.size === 'xs' ? 44 : d.size === 's' ? 72 : d.size === 'sm' ? 84 : px(100);
  const lip = Math.max(2, px(4));
  const tongueW = d.size === 'xs' ? 16 : d.size === 's' ? 32 : d.size === 'sm' ? 34 : px(44);
  const knobH = Math.max(4, px(10));
  const x0 = Math.round((d.w - (bodyW + 2 * lip + tongueW)) / 2);
  return { left: x0, top: knobH, width: bodyW + 2 * lip, height: d.h - knobH - 4 };
}
