"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import presets from "@/lib/zve10/presets";
import { PP_FIELDS } from "@/lib/zve10/dat";
import { colorBank, presetConsole, cameraModels } from "@/app/content";
import { useModel } from "@/lib/model";
import { hubIdFromValue } from "@/lib/hubId";
import { MOD_LIMITS, changesOf, cleanPatch, newModId, patchOf, useMods, writeMods, type PpMod } from "@/lib/ppMods";
import { InfoTip } from "./InfoTip";
import { PpForm } from "./PpForm";

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11" r="0.5" fill="currentColor" />
  </svg>
);

const grey = "inline-flex h-11 items-center justify-center rounded-full bg-fill px-4 text-subhead font-semibold text-label transition hover:bg-fill-strong";
const danger = "inline-flex h-11 items-center justify-center rounded-full bg-danger-fill px-4 text-subhead font-semibold text-danger transition hover:opacity-80";

export function RecipeDetailContent({ preset }: { preset: (typeof presets)[0] }) {
  const model = useModel() || "zve10";
  const isZVE10 = model === "zve10";
  const isBlocked = !!preset.blocked;
  // Mod PP: mọi mod đều nằm trong một danh sách, lọc theo công thức đang mở. Giới hạn tính trên tất cả.
  const allMods = useMods();
  const mods = allMods.filter((m) => m.base === preset.id);
  const full = allMods.length >= MOD_LIMITS.mods;
  // Trình sửa mod mở ngay trong trang (không phải hộp thoại): null là đóng, { mod: null } là tạo mới
  const [editor, setEditor] = useState<{ mod: PpMod | null } | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const jumped = useRef(false);

  // Link từ Color Bank (#mod-<id>): cuộn tới dòng đó khi danh sách mod đã có dữ liệu trên máy
  useEffect(() => {
    const id = location.hash.slice(1);
    if (jumped.current || !id.startsWith("mod-") || !mods.length) return;
    jumped.current = true;
    document.getElementById(id)?.scrollIntoView({ block: "center" });
  }, [mods.length]);

  useEffect(() => {
    if (editor) nameRef.current?.focus();
  }, [editor]);

  const openEditor = (mod: PpMod | null, from: HTMLButtonElement) => {
    opener.current = from;
    setName(mod?.name ?? "");
    setError(null);
    setConfirming(null);
    setEditor({ mod });
  };

  const closeEditor = () => {
    setEditor(null);
    setError(null);
    opener.current?.focus();
  };

  const save = (pp: Record<string, any>) => {
    if (!editor) return;
    const label = name.trim();
    if (!label) {
      setError(colorBank.mod.nameRequired);
      nameRef.current?.focus();
      return;
    }
    const patch = cleanPatch(preset.id, pp);
    if (!patch) {
      setError(colorBank.mod.invalid);
      return;
    }
    if (!Object.keys(patch).length) {
      setError(colorBank.mod.noChange);
      return;
    }
    const id = editor.mod?.id ?? newModId();
    const next: PpMod = { id, name: label.slice(0, MOD_LIMITS.name), base: preset.id, patch };
    writeMods(editor.mod ? allMods.map((m) => (m.id === id ? next : m)) : [...allMods, next]);
    closeEditor();
  };

  const remove = (id: string) => {
    writeMods(allMods.filter((m) => m.id !== id));
    if (editor?.mod?.id === id) setEditor(null);
    setConfirming(null);
  };

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
      <section className="mb-8 xl:col-start-1">
        <div className="flex flex-col gap-2">
          {/* Một nút cam mỗi màn: khi đang sửa mod, nút cam là Lưu trong form */}
          {isZVE10 && !isBlocked && !editor && (
            <Link
              href={`/tao-m1-m4?recipe=${preset.id}`}
              className="h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 transition inline-flex w-full items-center justify-center"
            >
              {colorBank.recipe.useForSlots}
            </Link>
          )}
          {!isBlocked && (
            <div className="flex items-center gap-2">
              <button type="button" disabled={full} onClick={(e) => openEditor(null, e.currentTarget)} className={`${grey} flex-1 disabled:opacity-50`}>
                {colorBank.mod.create}
              </button>
              {full && <InfoTip entry={colorBank.mod.limit} />}
            </div>
          )}
        </div>
        {isZVE10 && isBlocked && preset.blocked && (
          <div className="mt-2 rounded-control px-3 py-2.5 text-footnote text-label flex gap-2 bg-fill">
            <span className="flex-shrink-0 mt-0.5 text-secondary">
              <InfoIcon />
            </span>
            <p className="text-pretty">{colorBank.recipe.blocked(preset.blocked)}</p>
          </div>
        )}
        {!isZVE10 && (
          <div className="mt-2 rounded-control px-3 py-2.5 text-footnote text-label flex gap-2 bg-fill">
            <span className="flex-shrink-0 mt-0.5 text-secondary">
              <InfoIcon />
            </span>
            <p className="text-pretty">{presetConsole.unsupported.title} {presetConsole.unsupported.hint(cameraModels.find((m) => m.id === model)!.name)}</p>
          </div>
        )}
      </section>

      {/* Mod editor: đặt tên rồi sửa PP ngay trong trang */}
      {editor && (
        <section className="mb-8 xl:col-start-1">
          <h2 className="text-title3 font-medium mb-3">{editor.mod ? colorBank.mod.editOld : colorBank.mod.editNew}</h2>
          <label htmlFor="mod-name" className="text-footnote font-medium text-secondary block mb-1.5">
            {colorBank.mod.nameLabel}
          </label>
          <input
            id="mod-name"
            ref={nameRef}
            value={name}
            maxLength={MOD_LIMITS.name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 rounded-control border border-separator bg-card px-3 text-callout text-label"
          />
          {error && <p role="alert" className="mt-2 text-footnote font-medium text-danger">{error}</p>}
          <PpForm
            key={editor.mod?.id ?? "new"}
            initialPreset={{ pp: editor.mod ? { ...preset.pp, ...patchOf(editor.mod) } : preset.pp }}
            onApply={save}
            onClose={closeEditor}
          />
        </section>
      )}

      {/* Bản mod của tôi: chỉ hiện khi công thức này có mod */}
      {mods.length > 0 && (
        <section className="mb-8 xl:col-start-1">
          <h2 className="text-title3 font-medium mb-3">{colorBank.mod.mine}</h2>
          <ul className="rounded-card bg-card shadow-card divide-y divide-separator">
            {mods.map((mod) => (
              <li key={mod.id} id={`mod-${mod.id}`} className="px-4 py-3">
                <h3 className="text-subhead font-semibold text-label">{mod.name}</h3>
                <dl className="mt-2">
                  {changesOf(preset.id, patchOf(mod)).map((c) => (
                    <div key={c.key} className="flex justify-between gap-4 py-0.5">
                      <dt className="text-footnote text-secondary">{c.label}</dt>
                      <dd className="text-footnote font-semibold text-right">
                        {String(c.to)}
                        {c.from !== undefined && <span className="font-normal text-secondary"> ({colorBank.mod.baseValue(c.from)})</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
                {confirming === mod.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="flex-1 text-footnote text-label">{colorBank.mod.removeAsk}</p>
                    <button type="button" onClick={() => setConfirming(null)} className={grey}>
                      {colorBank.mod.keep}
                    </button>
                    <button type="button" onClick={() => remove(mod.id)} className={danger}>
                      {colorBank.mod.removeConfirm}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isZVE10 && !isBlocked && (
                      <Link href={`/tao-m1-m4?mod=${mod.id}`} className={grey}>
                        {colorBank.mod.useForSlots}
                      </Link>
                    )}
                    <button type="button" onClick={(e) => openEditor(mod, e.currentTarget)} className={grey}>
                      {colorBank.mod.edit}
                    </button>
                    <button type="button" onClick={() => setConfirming(mod.id)} className={grey}>
                      {colorBank.mod.remove}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
