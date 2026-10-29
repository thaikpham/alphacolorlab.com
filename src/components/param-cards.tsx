import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  CL_PARAM_LABELS,
  CL_PARAM_ORDER,
  CREATIVE_LOOKS,
  PP_COLOR_DEPTH_CHANNELS,
  PP_DETAIL_LABELS,
  PP_PARAM_LABELS,
  WB_PARAM_LABELS,
} from '@/lib/camera/constants';
import {
  CL_EXPLANATIONS,
  COLOR_DEPTH_EXPLANATIONS,
  PP_DETAIL_EXPLANATIONS,
  PP_EXPLANATIONS,
  WB_EXPLANATIONS,
  WB_OVERVIEW,
  type Locale,
} from '@/lib/camera/explanations';
import { AXIS_LABELS, clEffects, ppEffects, wbEffects, wbSummary, type Effect } from '@/lib/camera/effects';
import { formatClValue, signed, wbHeadLabel } from '@/lib/camera/format';
import { getColorDepthChannelHexColor, getKelvinHexColor, getWbShiftAxisHexColor } from '@/lib/camera/color';
import type { ClSettings, PpSettings, WhiteBalance } from '@/lib/camera/schema';
import type { RecipeView } from '@/lib/recipes/source';
import { WbShiftPlane } from './wb-shift-plane';

/**
 * A recipe's settings as cards, one parameter per card (owner, 2026-10-28,
 * after the Fujistyle app's recipe sheet): the value large, the camera's name
 * for the dial under it. It replaced the three-column rows, which read as a
 * spreadsheet.
 *
 * The two kinds of help the rows carried are still here, one tap away: open a
 * card and it says which axis the value works on, what THIS value is doing
 * (`effects.ts`, graded against the dial's own range) and what the dial is
 * (`explanations.ts`). Native `<details>`, so it works before hydration and
 * ships no JavaScript.
 *
 * Labels and value formatting come from `constants.ts` / `format.ts`, never
 * retyped here — that is what keeps a Creative Look's unsigned `Fade` from
 * being rendered "+5" while Picture Profile's signed `Saturation` is "+25".
 *
 * Every card carries `param-row`: the first-screen gate counts them as the
 * page's content rows, apart from its controls (e2e/first-screen.spec.ts).
 */

/**
 * A value set as a number reads at 25/800; a name (`S-Cinetone`, `Type3`,
 * `Narrow -7`) at 21/600, so a long Sony string still fits two columns on a
 * phone at a size on the scale.
 */
const NUMERIC = /^(?:[+\-−]?\d[\d.]*(?:%|K)?|[ABGM]\d[\d.]*)$/;

/**
 * The card grid. Two a row on a phone, six on a desktop. `items-start`: an
 * open card grows on its own, instead of stretching every card in its row
 * into an empty box.
 */
export const CARD_GRID = 'grid grid-cols-2 items-start gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6';

export function ParamCard({
  label,
  value,
  sub,
  effect,
  explanation,
  locale,
  tint,
}: {
  label: string;
  value: string;
  /** A second line under the value: a Look's name beside its code. */
  sub?: string;
  effect?: Effect;
  explanation?: string;
  locale: Locale;
  /** The value's own colour where it means one: a Color Depth channel, a WB axis. */
  tint?: string;
}) {
  const valueClass = NUMERIC.test(value)
    ? 'text-title-2 font-extrabold'
    : 'text-title-3 font-semibold';
  const valueStyle: CSSProperties | undefined = tint ? { color: tint } : undefined;

  /* Label first in the source, so a screen reader hears "Black Level, -7";
     the column is reversed to put the value on top. */
  const face = (
    <span className="flex flex-col-reverse items-center gap-1.5 text-center">
      <span className="label leading-tight">{label}</span>
      {sub ? <span className="meta text-ink-muted leading-tight">{sub}</span> : null}
      <span
        /* One line height for both sizes, so a closed `-9` and a closed
           `S-Cinetone` stand the same height side by side. */
        className={`${valueClass} tracking-[-0.02em] leading-8 tabular-nums break-words max-w-full ${tint ? '' : 'text-ink'}`}
        style={valueStyle}
      >
        {value}
      </span>
    </span>
  );

  if (!effect && !explanation) {
    return <div className="param-row row-tint px-3 pt-4 pb-3.5">{face}</div>;
  }

  return (
    <details className="param-row group row-tint relative px-3 pt-4 pb-3.5 open:bg-white/[0.08]">
      <summary className="cursor-pointer list-none marker:content-none">
        {face}
        <InfoGlyph className="absolute top-2 right-2" />
      </summary>
      <div className="mt-3 flex flex-col gap-1.5 text-left">
        <hr className="seam mb-1.5" />
        {effect ? (
          <>
            <span className="label text-accent-400">{AXIS_LABELS[effect.axis][locale]}</span>
            <p className="text-body-sm leading-relaxed text-ink-muted">{effect[locale]}</p>
          </>
        ) : null}
        {explanation ? <p className="meta leading-relaxed">{explanation}</p> : null}
      </div>
    </details>
  );
}

/**
 * The cue that a card opens (owner, 2026-10-28: an info button, not a bare
 * "?"). It sits inside the `<summary>`, which is the real button, so it is
 * drawn rather than nested — a `<button>` inside a summary would swallow the
 * tap. Lit in the accent while its card is open; the nearest `.group` is the
 * `<details>`.
 */
function InfoGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-5 w-5 shrink-0 text-ink-faint transition-colors group-hover:text-ink group-open:text-accent-300 ${className}`}
    >
      <circle cx="10" cy="10" r="10" className="fill-white/[0.08] group-open:fill-accent-900" />
      <circle cx="10" cy="5.9" r="1.15" fill="currentColor" />
      <rect x="9.1" y="8.4" width="1.8" height="6.2" rx="0.9" fill="currentColor" />
    </svg>
  );
}

/** One group of cards on its own panel: "Picture Profile", "Color Depth", "Detail". */
export function ParamPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface p-4 sm:p-5">
      {/* h3: these sit under the page's "Camera settings" h2. */}
      <h3 className="label mb-3">{title}</h3>
      <div className={CARD_GRID}>{children}</div>
    </section>
  );
}

export function PpCards({ s, locale = 'en' }: { s: PpSettings; locale?: Locale }) {
  const fx = ppEffects(s);
  const knee =
    s.knee.mode === 'Auto'
      ? `Auto${s.knee.maxPoint ? ` ${s.knee.maxPoint}%` : ''}${s.knee.sensitivity ? ` ${s.knee.sensitivity}` : ''}`
      : `Manual ${s.knee.point}% ${signed(s.knee.slope)}`;
  const e = (k: keyof typeof PP_EXPLANATIONS) => PP_EXPLANATIONS[k][locale];
  const d = (k: keyof typeof PP_DETAIL_EXPLANATIONS) => PP_DETAIL_EXPLANATIONS[k][locale];

  return (
    <>
      <ParamPanel title="Picture Profile">
        <ParamCard locale={locale} label={PP_PARAM_LABELS.blackLevel} value={signed(s.blackLevel)} effect={fx.blackLevel} explanation={e('blackLevel')} />
        <ParamCard locale={locale} label={PP_PARAM_LABELS.gamma} value={s.gamma} effect={fx.gamma} explanation={e('gamma')} />
        <ParamCard
          locale={locale}
          label={PP_PARAM_LABELS.blackGamma}
          value={`${s.blackGamma.range} ${signed(s.blackGamma.level)}`}
          effect={fx.blackGamma}
          explanation={e('blackGamma')}
        />
        <ParamCard locale={locale} label={PP_PARAM_LABELS.knee} value={knee} effect={fx.knee} explanation={e('knee')} />
        <ParamCard locale={locale} label={PP_PARAM_LABELS.colorMode} value={s.colorMode} effect={fx.colorMode} explanation={e('colorMode')} />
        <ParamCard locale={locale} label={PP_PARAM_LABELS.saturation} value={signed(s.saturation)} effect={fx.saturation} explanation={e('saturation')} />
        <ParamCard locale={locale} label={PP_PARAM_LABELS.colorPhase} value={signed(s.colorPhase)} effect={fx.colorPhase} explanation={e('colorPhase')} />
      </ParamPanel>

      <ParamPanel title={PP_PARAM_LABELS.colorDepth}>
        {PP_COLOR_DEPTH_CHANNELS.map((c) => (
          <ParamCard
            key={c}
            locale={locale}
            label={c}
            value={signed(s.colorDepth[c])}
            tint={getColorDepthChannelHexColor(c)}
            effect={fx[`colorDepth.${c}`]}
            explanation={COLOR_DEPTH_EXPLANATIONS[c][locale]}
          />
        ))}
      </ParamPanel>

      <ParamPanel title={PP_PARAM_LABELS.detail}>
        <ParamCard locale={locale} label={PP_DETAIL_LABELS.level} value={signed(s.detail.level)} effect={fx.detailLevel} explanation={d('level')} />
        <ParamCard locale={locale} label={PP_DETAIL_LABELS.mode} value={s.detail.mode} effect={fx.detailMode} explanation={d('mode')} />
        <ParamCard locale={locale} label={PP_DETAIL_LABELS.vhBalance} value={signed(s.detail.vhBalance)} effect={fx.vhBalance} explanation={d('vhBalance')} />
        <ParamCard locale={locale} label={PP_DETAIL_LABELS.bwBalance} value={s.detail.bwBalance} effect={fx.bwBalance} explanation={d('bwBalance')} />
        {/* Limit, Crispening and Hi-Light Detail are unsigned; no sign, by design. */}
        <ParamCard locale={locale} label={PP_DETAIL_LABELS.limit} value={String(s.detail.limit)} effect={fx.detailLimit} explanation={d('limit')} />
        <ParamCard locale={locale} label={PP_DETAIL_LABELS.crispening} value={String(s.detail.crispening)} effect={fx.crispening} explanation={d('crispening')} />
        <ParamCard locale={locale} label={PP_DETAIL_LABELS.hiLightDetail} value={String(s.detail.hiLightDetail)} effect={fx.hiLightDetail} explanation={d('hiLightDetail')} />
      </ParamPanel>
    </>
  );
}

export function ClCards({ s, locale = 'en' }: { s: ClSettings; locale?: Locale }) {
  const fx = clEffects(s);
  const look = CREATIVE_LOOKS.find((l) => l.code === s.look);

  return (
    <ParamPanel title="Creative Look">
      <ParamCard locale={locale} label="Look" value={s.look} sub={look?.label} effect={fx.look} />
      {CL_PARAM_ORDER.map((p) => {
        const value = s[p];
        // Saturation is absent on BW and SE — the camera greys it out.
        if (value === undefined) return null;
        return (
          <ParamCard
            key={p}
            locale={locale}
            label={CL_PARAM_LABELS[p]}
            value={formatClValue(p, value)}
            effect={fx[p]}
            explanation={CL_EXPLANATIONS[p][locale]}
          />
        );
      })}
    </ParamPanel>
  );
}

/**
 * White Balance: one wide card holding the shift plane, the readout and what
 * the three dials do together (`wbSummary`), then a card per dial.
 *
 * The combined cast stays on the wide card and off the dials: it is not any
 * one dial's property, and stating it on Temperature would be wrong the
 * moment the A/B shift pulls the other way (Rule 4).
 *
 * The values keep the colours of what they do — a Kelvin's blue or orange, an
 * A shift's amber, a G shift's green. That is the recipe's own measured cast
 * drawn as itself, not a colour the interface chose (`color.ts`).
 */
export function WbPanel({ recipe, locale }: { recipe: RecipeView; locale: Locale }) {
  const t = useTranslations('recipe');
  const wb: WhiteBalance = recipe.whiteBalance;
  const { net, interplay } = wbSummary(wb);

  return (
    <section className="surface p-4 sm:p-5">
      <h3 className="label mb-3">White Balance Shift</h3>
      <div className={CARD_GRID}>
        <div className="row-tint col-span-2 sm:col-span-3 lg:col-span-2 xl:col-span-3 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="w-40 shrink-0 self-center sm:w-44">
            <WbShiftPlane recipes={[recipe]} />
          </div>
          <div className="min-w-0 flex flex-col gap-1.5">
            <WbReadout wb={wb} />
            <span className="label mt-2">{t('wbNet')}</span>
            <p className="text-body-sm leading-relaxed text-ink-muted">{net[locale]}</p>
            {interplay ? <p className="meta leading-relaxed">{interplay[locale]}</p> : null}
            <details className="group mt-1">
              <summary className="flex cursor-pointer items-center gap-1.5 list-none marker:content-none text-meta text-ink-muted transition-colors hover:text-ink">
                {t('wbOverview')}
                <InfoGlyph />
              </summary>
              <div className="mt-2 flex max-w-prose flex-col gap-2">
                {WB_OVERVIEW[locale].map((paragraph) => (
                  <p key={paragraph} className="meta leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </details>
          </div>
        </div>

        <WbDials wb={wb} locale={locale} />
      </div>
    </section>
  );
}

/**
 * The three White Balance dials as cards. Apart from the panel so a test can
 * render them: the panel holds the shift plane, which reads its label on the
 * server.
 */
export function WbDials({ wb, locale }: { wb: WhiteBalance; locale: Locale }) {
  const fx = wbEffects(wb);
  const ab = wb.shift?.ab;
  const gm = wb.shift?.gm;
  const kelvin = wb.mode === 'kelvin';
  return (
    <>
      {/* Only a Kelvin recipe sets a Temperature. An Auto or preset card is
          the White Balance menu itself, and the Kelvin explanation would
          describe a dial that recipe never touches (rule 1b). */}
      <ParamCard
        locale={locale}
        label={kelvin ? WB_PARAM_LABELS.temperature : WB_PARAM_LABELS.whiteBalance}
        value={wbHeadLabel(wb)}
        tint={kelvin ? getKelvinHexColor(wb.kelvin) : undefined}
        effect={fx.temperature}
        explanation={kelvin ? WB_EXPLANATIONS.temperature[locale] : undefined}
      />
      {ab ? (
        <ParamCard
          locale={locale}
          label={WB_PARAM_LABELS.shiftAb}
          value={`${ab.axis}${ab.amount}`}
          tint={getWbShiftAxisHexColor(ab.axis)}
          effect={fx.shiftAb}
          explanation={WB_EXPLANATIONS.shiftAb[locale]}
        />
      ) : null}
      {gm ? (
        <ParamCard
          locale={locale}
          label={WB_PARAM_LABELS.shiftGm}
          value={`${gm.axis}${gm.amount}`}
          tint={getWbShiftAxisHexColor(gm.axis)}
          effect={fx.shiftGm}
          explanation={WB_EXPLANATIONS.shiftGm[locale]}
        />
      ) : null}
    </>
  );
}

/** "5600K, A3.5-G3", each part in the colour of what it does. */
export function WbReadout({ wb }: { wb: WhiteBalance }) {
  const ab = wb.shift?.ab;
  const gm = wb.shift?.gm;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 text-title-2 font-extrabold tracking-[-0.02em] tabular-nums">
      <span style={{ color: wb.mode === 'kelvin' ? getKelvinHexColor(wb.kelvin) : 'var(--color-ink)' }}>
        {wbHeadLabel(wb)}
      </span>
      {ab ? <span style={{ color: getWbShiftAxisHexColor(ab.axis) }}>{`${ab.axis}${ab.amount}`}</span> : null}
      {gm ? <span style={{ color: getWbShiftAxisHexColor(gm.axis) }}>{`${gm.axis}${gm.amount}`}</span> : null}
    </span>
  );
}
