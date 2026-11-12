"use client";

import { useEffect, useId, useRef, useState } from "react";
import { kol, kolSets, kolStudio } from "@/app/content";
import { KOL_LIMITS, photoNote, type KolPhoto, type PhotoMod, type PhotoNote } from "@/lib/kol";
import { cleanPatch, patchOf, useMods, type PpMod, type PpValues } from "@/lib/ppMods";
import presets from "@/lib/zve10/presets";
import { InfoTip } from "./InfoTip";

const field = "h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const area = "mt-2 block w-full rounded-control border border-separator bg-card px-3 py-2.5 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const secondary = "inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";
const segment = (on: boolean) => `flex-1 h-11 rounded-badge text-subhead font-medium transition ${on ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"}`;
const labelText = "text-subhead font-semibold text-label";

// Công thức chọn được: bỏ công thức bị codec chặn, nhóm theo Preset.group như ô Color Bank.
const RECIPES = presets.reduce<Record<string, typeof presets>>((acc, p) => {
  if (p.blocked) return acc;
  if (!acc[p.group]) acc[p.group] = [];
  acc[p.group].push(p);
  return acc;
}, {});
const RECIPE_IDS: ReadonlySet<string> = new Set(presets.filter((p) => !p.blocked).map((p) => p.id));

const samePatch = (a: PpValues, b: PpValues) => {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => b[k] !== undefined && String(a[k]) === String(b[k]));
};
const sameMod = (a: PhotoMod, b: PhotoMod) => a.name === b.name && a.base === b.base && samePatch(a.patch, b.patch);

/** Mod thành bản chụp kèm ảnh, hoặc null nếu công thức gốc không dùng được hoặc không còn giá trị nào khác gốc. */
function snapshotOf(m: PpMod): PhotoMod | null {
  const patch = cleanPatch(m.base, patchOf(m));
  return patch && Object.keys(patch).length > 0 ? { name: m.name, base: m.base, patch } : null;
}

/**
 * Ô soạn ghi chú của một ảnh mẫu, đặt ngay dưới lưới ảnh trong KolPhotos. Nháp nằm trong ô; Lưu thì onSave nhận nháp, cha lọc bằng photoNote.
 * Mở thì đưa focus vào ô khẩu độ. Mod: chọn một mod trong máy, giữ mod đã lưu nếu không khớp mod nào, hoặc không dùng.
 */
export function PhotoNoteEditor({ n, photo, busy, onSave, onCancel }: { n: number; photo: KolPhoto; busy: boolean; onSave: (draft: PhotoNote) => void; onCancel: () => void }) {
  const uid = useId();
  const first = useRef<HTMLInputElement>(null);
  const mods = useMods();
  const usable = mods.filter((m) => snapshotOf(m) !== null);
  const [aperture, setAperture] = useState(photo.aperture ?? "");
  const [shutter, setShutter] = useState(photo.shutter ?? "");
  const [iso, setIso] = useState(photo.iso ?? "");
  const [lens, setLens] = useState(photo.lens ?? "");
  const [slot, setSlot] = useState(photo.slot);
  const [recipe, setRecipe] = useState(photo.recipe && RECIPE_IDS.has(photo.recipe) ? photo.recipe : "");
  const [modId, setModId] = useState(() => {
    const kept = photo.mod;
    if (!kept) return "";
    return usable.find((m) => {
      const s = snapshotOf(m);
      return s !== null && sameMod(s, kept);
    })?.id ?? "saved";
  });
  const [text, setText] = useState(photo.text ?? "");
  useEffect(() => {
    first.current?.focus();
  }, []);

  const fields = [
    { key: "aperture", label: kol.aperture, value: aperture, set: setAperture },
    { key: "shutter", label: kol.shutter, value: shutter, set: setShutter },
    { key: "iso", label: kol.iso, value: iso, set: setIso },
    { key: "lens", label: kol.lens, value: lens, set: setLens },
  ];

  const save = () => {
    const pick = usable.find((m) => m.id === modId);
    const mod = modId === "saved" ? photo.mod : pick ? (snapshotOf(pick) ?? undefined) : undefined;
    onSave({ aperture, shutter, iso, lens, slot, recipe, mod, text });
  };

  return (
    <section
      aria-labelledby={`${uid}-h`}
      onKeyDown={(e) => {
        // Ô nằm trong form hồ sơ: Enter ở ô nhập không được gửi form; lưu bằng nút Lưu ghi chú.
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault();
      }}
      className="mt-6 space-y-5 border-t border-separator pt-6"
    >
      <h3 id={`${uid}-h`} className="text-title3 font-medium">
        {kolStudio.noteOf(n)}
      </h3>

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label htmlFor={`${uid}-${f.key}`} className={labelText}>
              {f.label}
            </label>
            <input
              id={`${uid}-${f.key}`}
              ref={f.key === "aperture" ? first : undefined}
              value={f.value}
              maxLength={KOL_LIMITS.noteField}
              onChange={(e) => f.set(e.target.value)}
              className={`${field} mt-2`}
            />
          </div>
        ))}
      </div>

      <div>
        <span className={`block ${labelText}`}>{kol.slot}</span>
        <div role="group" aria-label={kol.slot} className="mt-2 flex gap-1 rounded-control bg-fill p-1">
          {([undefined, 1, 2, 3, 4] as const).map((v) => (
            <button key={v ?? "none"} type="button" onClick={() => setSlot(v)} aria-pressed={slot === v} className={segment(slot === v)}>
              {v === undefined ? kolStudio.noteNone : kolSets.slotName(v)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-r`} className={labelText}>
          {kol.recipe}
        </label>
        <select id={`${uid}-r`} value={recipe} onChange={(e) => setRecipe(e.target.value)} className={`${field} mt-2`}>
          <option value="">{kolStudio.noteNoRecipe}</option>
          {Object.entries(RECIPES).map(([group, list]) => (
            <optgroup key={group} label={group}>
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center gap-1">
          <label htmlFor={`${uid}-m`} className={labelText}>
            {kol.mod}
          </label>
          <InfoTip entry={kolStudio.noteModTip} />
        </div>
        <select id={`${uid}-m`} value={modId} onChange={(e) => setModId(e.target.value)} className={`${field} mt-2`}>
          <option value="">{kolStudio.noteNoMod}</option>
          {usable.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
          {modId === "saved" && photo.mod && <option value="saved">{kolStudio.noteSavedMod(photo.mod.name)}</option>}
        </select>
      </div>

      <div>
        <label htmlFor={`${uid}-t`} className={labelText}>
          {kol.text}
        </label>
        <textarea id={`${uid}-t`} rows={3} value={text} maxLength={KOL_LIMITS.noteText} onChange={(e) => setText(e.target.value)} className={area} />
        <p className="mt-2 text-footnote text-secondary tabular-nums">{kolStudio.noteCount(text.length, KOL_LIMITS.noteText)}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={save} disabled={busy} className={secondary}>
          {kolStudio.noteSave}
        </button>
        {photoNote(photo) && (
          <button type="button" onClick={() => onSave({})} disabled={busy} className={secondary}>
            {kolStudio.noteClear}
          </button>
        )}
        <button type="button" onClick={onCancel} className={secondary}>
          {kolStudio.cancel}
        </button>
      </div>
    </section>
  );
}
