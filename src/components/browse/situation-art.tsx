import { useId, type ReactNode } from 'react';
import type { SituationId } from '@/lib/recipes/taxonomy';

/**
 * One drawing per situation, for the landing's tiles (owner, 2026-10-28: the
 * band of recipe colours did not say what a situation is for). Never a
 * photograph — a photograph says what one person shot, not what the recipes
 * are for (D3).
 *
 * Drawn in the interface's own material so it sits on the tile rather than
 * on top of it: rounded shapes in ink at 6–36% on the tile's own film, no
 * outlines, and one light per scene in the accent ramp (300 for the lamp, a
 * 500 bloom around it). A second hue would turn a tile into decoration; the
 * accent is the one colour the system already spends on "this is lit".
 *
 * A 270×120 scene, cropped to the tile by `slice`, so it holds from a phone's
 * two columns to a desktop's five. Every situation has one — the record is
 * exhaustive, so a new situation does not type-check without its drawing.
 */

type Paint = { readonly id: string };

/** Ink at an opacity: the shapes. */
const ink = (opacity: number) => ({ fill: 'currentColor', fillOpacity: opacity });

/** The one light, and the bloom around it. */
function Lamp({ id, x, y, r, bloom }: Paint & { x: number; y: number; r: number; bloom: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={bloom} fill={`url(#${id}-bloom)`} />
      {r > 0 ? <circle cx={x} cy={y} r={r} className="fill-accent-300" /> : null}
    </>
  );
}

/** A pane or a sign lit from inside. */
const lit = (opacity: number) => ({ className: 'fill-accent-400', fillOpacity: opacity });

const SCENES: Readonly<Record<SituationId, (p: Paint) => ReactNode>> = {
  /* A bust under a key light, a reflector on the far side. */
  portrait: ({ id }) => (
    <>
      <rect x={44} y={10} width={186} height={120} rx={12} {...ink(0.06)} />
      <Lamp id={id} x={62} y={30} r={13} bloom={40} />
      <circle cx={232} cy={72} r={20} {...ink(0.12)} />
      <rect x={110} y={82} width={80} height={60} rx={26} {...ink(0.22)} />
      <rect x={143} y={70} width={14} height={18} rx={4} {...ink(0.22)} />
      <circle cx={150} cy={56} r={19} {...ink(0.3)} />
    </>
  ),

  /* Window light across a table: a mug, a plant. */
  daily: ({ id }) => (
    <>
      <rect x={150} y={10} width={92} height={74} rx={8} {...ink(0.07)} />
      <rect x={155} y={15} width={40} height={31} rx={3} {...lit(0.14)} />
      <rect x={199} y={15} width={38} height={31} rx={3} {...lit(0.18)} />
      <rect x={155} y={50} width={40} height={29} rx={3} {...lit(0.1)} />
      <rect x={199} y={50} width={38} height={29} rx={3} {...lit(0.13)} />
      <Lamp id={id} x={218} y={32} r={0} bloom={46} />
      <polygon points="150,92 238,92 252,120 128,120" {...lit(0.1)} />
      <rect x={18} y={84} width={152} height={8} rx={4} {...ink(0.18)} />
      <rect x={28} y={92} width={6} height={28} {...ink(0.12)} />
      <rect x={154} y={92} width={6} height={28} {...ink(0.12)} />
      <rect x={64} y={60} width={26} height={24} rx={5} {...ink(0.28)} />
      <rect x={90} y={66} width={9} height={11} rx={4.5} {...ink(0.28)} />
      <rect x={116} y={66} width={24} height={18} rx={4} {...ink(0.22)} />
      <circle cx={128} cy={56} r={11} {...ink(0.16)} />
      <circle cx={118} cy={48} r={7} {...ink(0.14)} />
      <circle cx={138} cy={50} r={7} {...ink(0.14)} />
    </>
  ),

  /* A street lamp over a crossing, a walker, windows lit. */
  street: ({ id }) => (
    <>
      <rect x={0} y={26} width={62} height={100} {...ink(0.07)} />
      <rect x={62} y={46} width={48} height={80} {...ink(0.05)} />
      <rect x={208} y={36} width={70} height={90} {...ink(0.07)} />
      <rect x={12} y={40} width={10} height={12} rx={2} {...lit(0.22)} />
      <rect x={34} y={40} width={10} height={12} rx={2} {...lit(0.14)} />
      <rect x={12} y={64} width={10} height={12} rx={2} {...lit(0.1)} />
      <rect x={222} y={52} width={10} height={12} rx={2} {...lit(0.18)} />
      <rect x={246} y={52} width={10} height={12} rx={2} {...lit(0.1)} />
      <rect x={246} y={76} width={10} height={12} rx={2} {...lit(0.16)} />
      <polygon points="112,120 150,120 136,42 126,42" {...lit(0.1)} />
      <rect x={150} y={30} width={4} height={90} rx={2} {...ink(0.26)} />
      <rect x={132} y={28} width={24} height={4} rx={2} {...ink(0.26)} />
      <Lamp id={id} x={130} y={34} r={6} bloom={34} />
      {[14, 44, 74, 104].map((x) => (
        <rect key={x} x={x} y={106} width={18} height={14} rx={2} {...ink(0.12)} />
      ))}
      <circle cx={190} cy={72} r={6} {...ink(0.32)} />
      <rect x={184} y={80} width={12} height={24} rx={6} {...ink(0.3)} />
      <rect x={183} y={100} width={5} height={20} rx={2.5} {...ink(0.26)} transform="rotate(-18 185 100)" />
      <rect x={192} y={100} width={5} height={20} rx={2.5} {...ink(0.26)} transform="rotate(14 194 100)" />
    </>
  ),

  /* A plane on its way, the sun ahead, a suitcase waiting. */
  travel: ({ id }) => (
    <>
      <Lamp id={id} x={224} y={30} r={15} bloom={40} />
      <rect x={0} y={44} width={62} height={3} rx={1.5} fill={`url(#${id}-trail)`} />
      <polygon points="60,46 122,39 152,44 118,52" {...ink(0.32)} />
      <polygon points="92,44 108,22 120,26 106,46" {...ink(0.26)} />
      <polygon points="100,48 110,60 118,58 112,47" {...ink(0.2)} />
      <polygon points="62,46 70,34 78,36 72,47" {...ink(0.26)} />
      <rect x={0} y={98} width={270} height={30} {...ink(0.06)} />
      <rect x={190} y={62} width={20} height={12} rx={5} {...ink(0.18)} />
      <rect x={174} y={70} width={52} height={38} rx={7} {...ink(0.24)} />
      <rect x={216} y={64} width={10} height={16} rx={2} {...lit(0.85)} />
      <circle cx={184} cy={110} r={3.5} {...ink(0.32)} />
      <circle cx={216} cy={110} r={3.5} {...ink(0.32)} />
    </>
  ),

  /* Three ridges and a lake under a low sun. */
  landscape: ({ id }) => (
    <>
      <Lamp id={id} x={70} y={32} r={16} bloom={44} />
      <polygon points="-10,120 70,48 150,120" {...ink(0.12)} />
      <polygon points="84,120 170,34 256,120" {...ink(0.2)} />
      <polygon points="180,120 240,64 300,120" {...ink(0.09)} />
      <ellipse cx={135} cy={118} rx={130} ry={12} {...lit(0.12)} />
      <polygon points="18,120 32,86 46,120" {...ink(0.26)} />
      <polygon points="40,120 51,94 62,120" {...ink(0.18)} />
    </>
  ),

  /* A pendant over a café table: a cup, a pastry. */
  lifestyle: ({ id }) => (
    <>
      <rect x={133} y={0} width={2} height={26} {...ink(0.2)} />
      <polygon points="116,26 152,26 160,44 108,44" {...ink(0.26)} />
      <polygon points="98,100 170,100 150,46 118,46" {...lit(0.08)} />
      <Lamp id={id} x={134} y={48} r={6} bloom={40} />
      <ellipse cx={134} cy={100} rx={74} ry={8} {...ink(0.16)} />
      <rect x={130} y={104} width={8} height={20} {...ink(0.1)} />
      <rect x={118} y={56} width={4} height={12} rx={2} {...ink(0.12)} />
      <rect x={126} y={52} width={4} height={14} rx={2} {...ink(0.14)} />
      <rect x={134} y={58} width={4} height={10} rx={2} {...ink(0.12)} />
      <rect x={110} y={72} width={30} height={22} rx={5} {...ink(0.3)} />
      <rect x={140} y={78} width={9} height={11} rx={4.5} {...ink(0.3)} />
      <rect x={102} y={92} width={46} height={5} rx={2.5} {...ink(0.22)} />
      <ellipse cx={180} cy={92} rx={20} ry={6} {...ink(0.16)} />
      <ellipse cx={180} cy={87} rx={12} ry={5} {...ink(0.24)} />
    </>
  ),

  /* A dress on a hanger under a spotlight. */
  fashion: ({ id }) => (
    <>
      <polygon points="112,0 158,0 218,120 52,120" {...lit(0.09)} />
      <Lamp id={id} x={135} y={2} r={9} bloom={40} />
      <rect x={133} y={16} width={4} height={12} rx={2} {...ink(0.32)} />
      <polygon points="100,46 135,30 170,46 166,50 135,36 104,50" {...ink(0.32)} />
      <polygon points="112,48 158,48 150,72 178,120 92,120 120,72" {...ink(0.22)} />
      <rect x={118} y={68} width={34} height={5} rx={2.5} {...ink(0.32)} />
      <rect x={0} y={114} width={270} height={10} {...ink(0.06)} />
    </>
  ),

  /* An áo dài under a conical hat, an apricot branch, a lantern lit for Tết. */
  heritage: ({ id }) => (
    <>
      <polygon points="0,30 70,12 74,16 6,36" {...ink(0.16)} />
      <polygon points="38,22 60,44 56,46 34,24" {...ink(0.14)} />
      {[
        [14, 30, 0.3],
        [30, 22, 0.26],
        [48, 18, 0.32],
        [64, 14, 0.24],
        [58, 42, 0.28],
        [44, 32, 0.2],
      ].map(([x, y, a]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={4} {...ink(a)} />
      ))}
      <rect x={200} y={0} width={2} height={18} {...ink(0.22)} />
      <Lamp id={id} x={201} y={34} r={0} bloom={38} />
      <ellipse cx={201} cy={34} rx={13} ry={15} className="fill-accent-300" />
      <rect x={195} y={18} width={12} height={3} rx={1.5} {...ink(0.3)} />
      <rect x={195} y={47} width={12} height={3} rx={1.5} {...ink(0.3)} />
      <rect x={200} y={50} width={2} height={10} {...ink(0.22)} />
      <rect x={236} y={0} width={2} height={10} {...ink(0.18)} />
      <ellipse cx={237} cy={22} rx={9} ry={11} {...ink(0.16)} />
      <polygon points="108,40 152,40 130,20" {...ink(0.32)} />
      <circle cx={130} cy={46} r={7} {...ink(0.3)} />
      <rect x={126} y={51} width={8} height={6} {...ink(0.26)} />
      <polygon points="118,57 142,57 146,84 114,84" {...ink(0.28)} />
      <polygon points="114,84 129,84 124,120 104,120" {...ink(0.24)} />
      <polygon points="131,84 146,84 156,120 136,120" {...ink(0.18)} />
      <rect x={124} y={98} width={5} height={22} rx={2} {...ink(0.12)} />
      <rect x={131} y={98} width={5} height={22} rx={2} {...ink(0.12)} />
      <rect x={0} y={116} width={270} height={8} {...ink(0.06)} />
    </>
  ),

  /* A skyline after dark: windows lit, a crescent, light trails on the road. */
  night: ({ id }) => (
    <>
      <Lamp id={id} x={226} y={26} r={0} bloom={30} />
      <path d="M232 12 a15 15 0 1 0 6 27 a12 12 0 1 1 -6 -27 Z" className="fill-accent-300" />
      {[
        [30, 18],
        [70, 10],
        [118, 22],
        [160, 12],
        [190, 30],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} {...ink(0.5)} />
      ))}
      <rect x={0} y={52} width={34} height={60} {...ink(0.1)} />
      <rect x={36} y={34} width={30} height={78} {...ink(0.14)} />
      <rect x={68} y={60} width={26} height={52} {...ink(0.08)} />
      <rect x={96} y={42} width={36} height={70} {...ink(0.12)} />
      <rect x={134} y={66} width={24} height={46} {...ink(0.08)} />
      <rect x={160} y={48} width={34} height={64} {...ink(0.13)} />
      <rect x={196} y={70} width={30} height={42} {...ink(0.09)} />
      <rect x={228} y={58} width={42} height={54} {...ink(0.11)} />
      {[
        [42, 42, 0.5],
        [54, 42, 0.2],
        [42, 56, 0.25],
        [54, 70, 0.45],
        [104, 50, 0.3],
        [118, 64, 0.5],
        [104, 78, 0.2],
        [168, 56, 0.45],
        [180, 70, 0.22],
        [168, 84, 0.35],
        [238, 66, 0.3],
        [252, 80, 0.45],
      ].map(([x, y, a]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={7} height={8} rx={1.5} {...lit(a)} />
      ))}
      <rect x={0} y={112} width={270} height={12} {...ink(0.07)} />
      <rect x={20} y={114} width={150} height={2.5} rx={1.25} fill={`url(#${id}-trail)`} />
      <rect x={90} y={118} width={170} height={2} rx={1} fill={`url(#${id}-trail)`} />
    </>
  ),

  /* A ring light around a phone on a tripod, chat rising beside it. */
  livestream: ({ id }) => (
    <>
      <Lamp id={id} x={135} y={54} r={0} bloom={52} />
      <path
        d="M135,54 m-30,0 a30,30 0 1,0 60,0 a30,30 0 1,0 -60,0 Z M135,54 m-22,0 a22,22 0 1,1 44,0 a22,22 0 1,1 -44,0 Z"
        className="fill-accent-300"
        fillRule="evenodd"
      />
      <rect x={127} y={38} width={16} height={32} rx={3} {...ink(0.36)} />
      <rect x={129} y={41} width={12} height={24} rx={1.5} {...ink(0.18)} />
      <rect x={133} y={84} width={4} height={26} {...ink(0.24)} />
      <rect x={133} y={98} width={4} height={30} {...ink(0.2)} transform="rotate(-28 135 98)" />
      <rect x={133} y={98} width={4} height={30} {...ink(0.2)} transform="rotate(28 135 98)" />
      <rect x={40} y={112} width={190} height={8} rx={4} {...ink(0.08)} />
      <rect x={196} y={30} width={44} height={12} rx={6} {...ink(0.12)} />
      <rect x={206} y={48} width={34} height={12} rx={6} {...ink(0.1)} />
      <rect x={200} y={66} width={40} height={12} rx={6} {...ink(0.08)} />
      <rect x={36} y={18} width={36} height={12} rx={6} {...ink(0.12)} />
      <circle cx={46} cy={24} r={3.5} className="fill-accent-400" />
    </>
  ),
};

export function SituationArt({ situation, className = '' }: { situation: SituationId; className?: string }) {
  /* Gradient ids must be unique in the document; the tiles draw each scene
     once, but nothing here should depend on that. */
  const id = `art${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 270 120"
      preserveAspectRatio="xMidYMid slice"
      className={`block w-full text-ink ${className}`}
    >
      <defs>
        <radialGradient id={`${id}-bloom`}>
          <stop offset="0" style={{ stopColor: 'var(--color-accent-500)', stopOpacity: 0.55 }} />
          <stop offset="0.55" style={{ stopColor: 'var(--color-accent-500)', stopOpacity: 0.16 }} />
          <stop offset="1" style={{ stopColor: 'var(--color-accent-500)', stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={`${id}-trail`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--color-accent-400)', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: 'var(--color-accent-400)', stopOpacity: 0.5 }} />
        </linearGradient>
      </defs>
      {SCENES[situation]({ id })}
    </svg>
  );
}
