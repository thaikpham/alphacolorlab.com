import type { CSSProperties, ReactNode } from 'react';
import {
  bokehFor,
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
 * 35mm cartridge standing up for a Creative Look, a white clapperboard for a
 * Picture Profile. It replaced the nine-swatch strip on the card, which
 * readers found hard to choose from: a silhouette says stills or cinema
 * before a word is read, and the initials give a recipe a handle.
 *
 * The colour is on the film, never under the type. The cartridge's leader
 * shows three frames — the recipe's highlight, mid and shadow — and the
 * clapper's stripes alternate its highlight and shadow, so a black-and-white
 * profile gets the classic clapper. A sticker on the body carries its six
 * hues. All of it is `paletteFor`'s reading of the settings, never a preview.
 *
 * It is a drawn object, not a surface. That is why its body is white and its
 * type dark — the paper room's ink, printed on the object — and why its
 * corners follow the object rather than the radius scale. Decorative to a
 * screen reader: the name is always written next to it, and the card's slot
 * carries the palette's label.
 *
 * Four sizes, every type size a step of the scale and none under 13px: what
 * does not fit drops out (the code at `s`, the id and sticker at `xs`)
 * instead of shrinking.
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
const ACRYLIC = 'linear-gradient(180deg, oklch(99% 0.002 275), oklch(95.5% 0.004 275))';
const METAL = 'linear-gradient(180deg, oklch(82% 0.006 275), oklch(54% 0.006 275))';
const PIN = 'radial-gradient(circle closest-side, oklch(62% 0.006 275), oklch(34% 0.006 275) 88%, transparent)';
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
  const bodyW = d.size === 'xs' ? 44 : d.size === 's' ? 72 : px(100);
  const lip = Math.max(2, px(4));
  const knobW = px(22);
  const knobH = Math.max(4, px(10));
  const capH = Math.max(4, px(8));
  const tongueW = d.size === 'xs' ? 16 : d.size === 's' ? 32 : px(44);
  const tongueH = d.size === 'xs' ? 20 : d.size === 's' ? 36 : px(56);
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

function Clapper({ d, c, ink }: { d: Dims; c: Record<string, string>; ink: Ink }) {
  const px = scale(d);
  const stripe = Math.max(4, px(12));
  const stripes = `repeating-linear-gradient(135deg, ${c.highlight} 0 ${stripe}px, ${c.shadow} ${stripe}px ${stripe * 2}px)`;
  const slateT = px(40);
  const bandH = px(18);
  const stickH = px(18);
  const pin = Math.max(5, px(9));
  const compact = d.size === 's' || d.size === 'xs';

  return (
    <>
      {/* The clapper stick, open. */}
      <span
        className="absolute"
        style={{
          left: 0,
          top: slateT - stickH,
          width: d.w,
          height: stickH,
          borderRadius: px(4),
          background: stripes,
          boxShadow: LIFT,
          transform: 'rotate(-6deg)',
          transformOrigin: `${px(6)}px ${stickH}px`,
        }}
      />
      {/* The slate. */}
      <span
        className={`absolute flex flex-col items-start overflow-hidden ${d.size === 'xs' ? 'justify-center' : 'justify-between'}`}
        style={{
          left: 0,
          top: slateT,
          width: d.w,
          height: d.h - slateT,
          padding: `${bandH + (compact ? px(6) : px(12))}px ${px(16)}px ${compact ? px(6) : px(14)}px`,
          borderRadius: `${px(6)}px ${px(6)}px ${px(14)}px ${px(14)}px`,
          background: ACRYLIC,
          boxShadow: LIFT,
        }}
      >
        <span className="absolute inset-x-0 top-0" style={{ height: bandH, background: stripes }} />
        {d.size === 'xs' ? null : <Sticker d={d} c={c} />}
        <Initials d={d}>{ink.initials}</Initials>
        {d.showId ? (
          <span className="flex" style={{ gap: px(8) }}>
            <Small>{ink.code}</Small>
            {d.showCode ? <Small keepCase>{ink.base}</Small> : null}
          </span>
        ) : null}
      </span>
      {/* The hinge pin. */}
      <span
        className="absolute"
        style={{
          left: px(5),
          top: slateT - pin / 2 - px(2),
          width: pin,
          height: pin,
          background: PIN,
          filter: 'drop-shadow(0 1px 1px oklch(0% 0 0 / 0.6))',
        }}
      />
    </>
  );
}

export function RecipeMark({
  recipe,
  size = 'm',
  className = '',
}: {
  recipe: MarkInput;
  size?: MarkSize;
  /** Placement and visibility only (`hidden sm:block`); the mark sizes itself. */
  className?: string;
}) {
  const d = dims(size);
  const c = swatchCss(recipe.palette);
  const ink: Ink = { initials: markInitials(recipe.name), code: markCode(recipe.id), base: markBase(recipe) };
  return (
    <div aria-hidden="true" className={`relative shrink-0 ${className}`} style={{ width: d.w, height: d.h }}>
      {recipe.format === 'cl' ? <Cartridge d={d} c={c} ink={ink} /> : <Clapper d={d} c={c} ink={ink} />}
    </div>
  );
}

/**
 * The lights behind a mark (owner, 2026-10-28: the slot was too empty). Ten
 * soft discs and three sparks in the recipe's six hues and a wash of its mid
 * swatch, laid out by `bokehFor` from a seed on the code, so each card is its
 * own and the same recipe looks the same everywhere. Fills its parent.
 */
export function RecipeBokeh({ recipe }: { recipe: Pick<MarkInput, 'id' | 'palette'> }) {
  const c = swatchCss(recipe.palette);
  const { discs, sparks, wash } = bokehFor(recipe.id);
  const light = (l: (typeof discs)[number], solid: number) => (
    <span
      key={`${l.x}-${l.y}`}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${l.x}%`,
        top: `${l.y}%`,
        width: l.size,
        height: l.size,
        background: `radial-gradient(circle closest-side, ${c[l.hue]} ${solid}%, transparent)`,
        opacity: l.opacity,
      }}
    />
  );
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(70% 80% at ${wash.x}% ${wash.y}%, color-mix(in oklch, ${c.mid} 22%, transparent), transparent 72%)`,
      }}
    >
      {discs.map((l) => light(l, 78))}
      {sparks.map((l) => light(l, 60))}
    </div>
  );
}
