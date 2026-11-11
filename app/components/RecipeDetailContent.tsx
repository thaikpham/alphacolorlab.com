"use client";

import Link from "next/link";
import presets from "@/lib/zve10/presets";
import { PP_FIELDS } from "@/lib/zve10/dat";
import { colorBank, presetConsole, cameraModels } from "@/app/content";
import { useModel } from "@/lib/model";
import { hubIdFromValue } from "@/lib/graph";

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11" r="0.5" fill="currentColor" />
  </svg>
);

export function RecipeDetailContent({ preset }: { preset: (typeof presets)[0] }) {
  const model = useModel() || "zve10";
  const isZVE10 = model === "zve10";
  const isBlocked = !!preset.blocked;

  const formatShift = (value: number, type: "ab" | "gm"): string => {
    if (value === 0) return "0";
    if (type === "ab") {
      return colorBank.recipe.shift(value < 0 ? "B" : "A", Math.abs(value));
    } else {
      return colorBank.recipe.shift(value > 0 ? "M" : "G", Math.abs(value * 10) / 10);
    }
  };

  // xl+: description, WB, action on the left; the long Picture Profile list on the right. DOM order unchanged for phones.
  return (
    <div className="xl:grid xl:grid-cols-2 xl:grid-rows-[auto_auto_auto_1fr] xl:gap-x-10">
      {/* Description */}
      <section className="mb-8 xl:col-start-1">
        <p className="text-body text-secondary text-pretty">{preset.description_vi}</p>
      </section>

      {/* White Balance */}
      <section className="mb-8 xl:col-start-1">
        <h2 className="text-title3 font-medium mb-3">
          <Link href="/do-thi/colors?n=can-bang-trang-va-nhiet-do-mau" className="text-label hover:text-accent-text transition">
            {colorBank.recipe.whiteBalance}
          </Link>
        </h2>
        <div className="rounded-card bg-card shadow-card divide-y divide-separator">
          <div className="px-4 py-3 flex justify-between">
            <span className="text-footnote text-secondary">{preset.wb.mode === "awb" ? colorBank.recipe.awb : colorBank.recipe.colorTemp}</span>
            <span className="text-footnote font-semibold">
              {preset.wb.mode === "awb" ? colorBank.recipe.awb : colorBank.recipe.kelvin(preset.wb.kelvin)}
            </span>
          </div>
          {preset.wb.ab !== 0 && (
            <div className="px-4 py-3 flex justify-between">
              <span className="text-footnote text-secondary">A–B</span>
              <span className="text-footnote font-semibold">{formatShift(preset.wb.ab, "ab")}</span>
            </div>
          )}
          {preset.wb.gm !== 0 && (
            <div className="px-4 py-3 flex justify-between">
              <span className="text-footnote text-secondary">G–M</span>
              <span className="text-footnote font-semibold">{formatShift(preset.wb.gm, "gm")}</span>
            </div>
          )}
        </div>
      </section>

      {/* Picture Profile */}
      <section className="mb-8 xl:col-start-2 xl:row-span-4 xl:row-start-1">
        <h2 className="text-title3 font-medium mb-3">{colorBank.recipe.pictureProfile}</h2>
        <div className="text-footnote text-secondary mb-3">{colorBank.recipe.menuPath}</div>
        <div className="rounded-card bg-card shadow-card divide-y divide-separator">
          {PP_FIELDS.map((field) => {
            const value = preset.pp[field.key];
            if (value === undefined) return null;
            const valueStr = String(value);
            const hubId = field.key === "gamma" || field.key === "color_mode" ? hubIdFromValue(field.key, valueStr) : null;
            const displayValue = hubId ? (
              <Link href={`/do-thi/colors?n=${hubId}`} className="text-footnote font-semibold text-accent-text hover:underline">
                {valueStr}
              </Link>
            ) : (
              <span className="text-footnote font-semibold">{valueStr}</span>
            );
            return (
              <div key={field.key} className="px-4 py-3 flex justify-between">
                <span className="text-footnote text-secondary">{field.label}</span>
                {displayValue}
              </div>
            );
          })}
        </div>
      </section>

      {/* Action */}
      <section className="xl:col-start-1">
        {isZVE10 && !isBlocked && (
          <Link
            href={`/tao-m1-m4?recipe=${preset.id}`}
            className="h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 transition inline-flex w-full items-center justify-center"
          >
            {colorBank.recipe.useForSlots}
          </Link>
        )}
        {isZVE10 && isBlocked && preset.blocked && (
          <div className="rounded-control px-3 py-2.5 text-footnote text-label flex gap-2 bg-fill">
            <span className="flex-shrink-0 mt-0.5 text-secondary">
              <InfoIcon />
            </span>
            <p className="text-pretty">{colorBank.recipe.blocked(preset.blocked)}</p>
          </div>
        )}
        {!isZVE10 && (
          <div className="rounded-control px-3 py-2.5 text-footnote text-label flex gap-2 bg-fill">
            <span className="flex-shrink-0 mt-0.5 text-secondary">
              <InfoIcon />
            </span>
            <p className="text-pretty">{presetConsole.unsupported.title} {presetConsole.unsupported.hint(cameraModels.find((m) => m.id === model)!.name)}</p>
          </div>
        )}
      </section>
    </div>
  );
}
