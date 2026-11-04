import { useId, type CSSProperties, type ReactNode } from 'react';
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
 * after the Fujistyle app's recipe sheet; made compact on 2026-10-29): the
 * camera's name for the dial, the value under it. It replaced the
 * three-column rows, which read as a spreadsheet.
 *
 * The two kinds of help the rows carried are still here, behind each card's
 * info button: which axis the value works on, what THIS value is doing
 * (`effects.ts`, graded against the dial's own range) and what the dial is
 * (`explanations.ts`). A native popover, so it works before hydration and
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
 * The card grid. Two a row on a phone, seven on a wide desktop, where each
 * Picture Profile group is one row. `items-start`: the dial cards beside the
 * wide White Balance card keep their own height instead of stretching to it.
 */
export const CARD_GRID = 'grid grid-cols-2 items-start gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8';

/**
 * One parameter, one card (owner, 2026-10-29: smaller, and the help behind an
 * info button). The label flush left, the value under it at one size, and in
 * the corner a button that opens the card's quote box: the axis, what this
 * value is doing, what the dial is. The box is a native popover — the browser
 * toggles it on the button, closes it on a second press, a click outside or
 * Escape, and ships no script for it. Where the browser can anchor, it hangs
 * under its card; elsewhere it takes the popover default, centred.
 *
 * Every card carries `param-row`, and its button sits directly inside it:
 * the first-screen gate counts those as the page's content, apart from its
 * controls (e2e/checks.ts).
 */
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
  const t = useTranslations('recipe');
  /* The popover's id and the anchor's name, unique per card and stable across
     server and client. `useId` yields `:r1:`-style ids; both attributes need
     plain characters. */
  const popId = `pop${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const anchor = { '--pa': `--${popId}` } as CSSProperties;
  const valueStyle: CSSProperties | undefined = tint ? { color: tint } : undefined;

  const face = (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="label leading-tight">{label}</span>
      <span
        className={`text-body-lg font-semibold leading-tight tabular-nums break-words ${tint ? '' : 'text-ink'}`}
        style={valueStyle}
      >
        {value}
      </span>
      {sub ? <span className="meta leading-tight">{sub}</span> : null}
    </span>
  );

  if (!effect && !explanation) {
    return <div className="param-row row-tint px-3 py-2">{face}</div>;
  }

  return (
    <div className="param-row param-card row-tint relative px-3 py-2 pr-9" style={anchor}>
      {face}
      {/* `pointer-coarse:` lifts the button to the 44px floor on a touch screen
          without widening it under a mouse. */}
      <button
        type="button"
        popoverTarget={popId}
        aria-label={t('explain', { param: label })}
        className="param-info absolute top-1 right-1 flex h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 cursor-pointer items-center justify-center rounded-sm text-ink-faint transition-colors hover:text-ink"
      >
        <InfoGlyph />
      </button>
      <div id={popId} popover="auto" className="param-pop" style={anchor}>
        <div className="surface-raised animate-fade-in flex flex-col gap-2 p-4">
          <span className="flex items-baseline justify-between gap-3">
            <span className="label">{label}</span>
            <span className="text-body font-semibold tabular-nums text-ink">{value}</span>
          </span>
          {effect ? (
            <>
              <span className="label text-accent-400">{AXIS_LABELS[effect.axis][locale]}</span>
              <p className="text-body-sm leading-relaxed text-ink">{effect[locale]}</p>
            </>
          ) : null}
          {explanation ? (
            <>
              <hr className="seam" />
              <p className="meta leading-relaxed">{explanation}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The info button's glyph. Lit in the accent while its box is open (globals.css, `.param-info`). */
function InfoGlyph({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-5 w-5 shrink-0 ${className}`}>
      <circle cx="10" cy="10" r="10" className="fill-white/[0.08]" />
      <circle cx="10" cy="5.9" r="1.15" fill="currentColor" />
      <rect x="9.1" y="8.4" width="1.8" height="6.2" rx="0.9" fill="currentColor" />
    </svg>
  );
}

/** One group of cards on its own panel: "Picture Profile", "Color Depth", "Detail". */
export function ParamPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface p-3 sm:p-4">
      {/* h3: these sit under the page's "Camera settings" h2. */}
      <h3 className="label mb-2">{title}</h3>
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
  /* The overview opens from the card's corner like every card's help, so the
     first-screen gate counts it as content (`.param-row > button[popovertarget]`). */
  const popId = `pop${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const anchor = { '--pa': `--${popId}` } as CSSProperties;

  return (
    <section className="surface p-3 sm:p-4">
      <h3 className="label mb-2">White Balance Shift</h3>
      <div className={CARD_GRID}>
        <div
          className="param-row param-card row-tint relative col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-3 xl:col-span-4 2xl:col-span-5 flex flex-col gap-3 p-3 pr-11 sm:flex-row sm:items-center sm:gap-5"
          style={anchor}
        >
          <div className="w-32 shrink-0 self-center sm:w-36">
            <WbShiftPlane recipes={[recipe]} />
          </div>
          <div className="min-w-0 flex flex-col gap-1.5">
            <WbReadout wb={wb} />
            <span className="label mt-2">{t('wbNet')}</span>
            <p className="text-body-sm leading-relaxed text-ink-muted">{net[locale]}</p>
            {interplay ? <p className="meta leading-relaxed">{interplay[locale]}</p> : null}
          </div>
          <button
            type="button"
            popoverTarget={popId}
            aria-label={t('wbOverview')}
            className="param-info absolute top-1 right-1 flex h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 cursor-pointer items-center justify-center rounded-sm text-ink-faint transition-colors hover:text-ink"
          >
            <InfoGlyph />
          </button>
          <div id={popId} popover="auto" className="param-pop" style={anchor}>
            <div className="surface-raised animate-fade-in flex flex-col gap-2 p-4">
              <span className="label">{t('wbOverview')}</span>
              {WB_OVERVIEW[locale].map((paragraph) => (
                <p key={paragraph} className="meta leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
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
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 text-title-3 font-extrabold tracking-[-0.02em] tabular-nums">
      <span style={{ color: wb.mode === 'kelvin' ? getKelvinHexColor(wb.kelvin) : 'var(--color-ink)' }}>
        {wbHeadLabel(wb)}
      </span>
      {ab ? <span style={{ color: getWbShiftAxisHexColor(ab.axis) }}>{`${ab.axis}${ab.amount}`}</span> : null}
      {gm ? <span style={{ color: getWbShiftAxisHexColor(gm.axis) }}>{`${gm.axis}${gm.amount}`}</span> : null}
    </span>
  );
}
