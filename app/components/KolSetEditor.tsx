"use client";

import { useId, useState } from "react";
import { kolSets, kolStudio } from "@/app/content";
import { KolError, saveSet, SET_LIMIT_ERROR, type RemoteSet } from "@/lib/kol";
import { cloneSlots, defaultSet, PresetError, validatePresetSets, type PresetSet, type PresetSlot } from "@/lib/presetSets";
import presetSetsJson from "@/data/preset-sets.json";
import { InfoTip } from "./InfoTip";
import { SlotCard } from "./SlotCard";

const SET_ID = /^[a-z0-9-]{1,40}$/;
const SET_ID_MAX = 40;
// Trùng ràng buộc char_length trong supabase/kol.sql (kol_sets.name, kol_sets.description).
const SET_NAME_MAX = 60;
const SET_DESCRIPTION_MAX = 240;
const fieldBase = "h-11 w-full rounded-control border border-separator px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const field = `${fieldBase} bg-card`;
// Đường dẫn bộ đã tạo: chỉ đọc, nền xám để thấy là đang khóa.
const fieldLocked = `${fieldBase} bg-fill`;
const primary = "inline-flex h-11 items-center rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-40";
const secondary = "inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong";
const segment = (on: boolean) => `flex-1 h-11 rounded-badge text-subhead font-medium transition ${on ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"}`;

const BASE = defaultSet(validatePresetSets(presetSetsJson));

/** Chuyển chữ thành đường dẫn: bỏ dấu, chữ thường, ký tự ngoài a–z, 0–9, "-" thành "-". Không cắt đầu cuối để gõ tiếp được. */
export function toSlug(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[Đđ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .slice(0, max);
}

/** Bản sao 4 ô (nhãn, ghi chú, cài đặt) để chỉnh mà không đụng dữ liệu gốc. */
function copySlots(set: PresetSet): PresetSlot[] {
  return cloneSlots(set).map((settings, i) => ({ label: set.slots[i].label, note: set.slots[i].note, settings }));
}

/** Soạn một bộ: tên, mô tả, đường dẫn, trạng thái và 4 ô. Bộ mới lấy 4 ô từ bộ khuyến nghị làm điểm bắt đầu. */
export function KolSetEditor({
  userId,
  initial,
  taken,
  onDone,
  onCancel,
}: {
  userId: string;
  initial?: RemoteSet;
  taken: ReadonlySet<string>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [id, setId] = useState(initial?.id ?? "");
  const [idTouched, setIdTouched] = useState(Boolean(initial));
  const [publish, setPublish] = useState<"draft" | "public">(initial?.published ? "public" : "draft");
  const [slots, setSlots] = useState<PresetSlot[]>(() => copySlots(initial ?? BASE));
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đường dẫn không đổi sau khi tạo: bộ khác đã sưu tầm và link /bo-m1-m4/<id> đang trỏ vào nó.
  const locked = Boolean(initial);
  const cleanId = id.replace(/^-+|-+$/g, "");
  const idTaken = taken.has(cleanId);
  const valid = name.trim() !== "" && SET_ID.test(cleanId) && !idTaken && !busy;

  // Đường dẫn tự lấy từ tên cho đến khi người dùng sửa tay ô đường dẫn.
  const rename = (v: string) => {
    setName(v);
    if (!idTouched) setId(toSlug(v, SET_ID_MAX).replace(/^-+|-+$/g, ""));
  };
  const patch = (i: number, p: Partial<PresetSlot>) => setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, ...p } : s)));

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await saveSet(userId, { id: cleanId, name: name.trim(), description: description.trim(), slots: slots as PresetSet["slots"] }, publish === "public", initial?.id);
      onDone();
    } catch (e) {
      setBusy(false);
      if (e instanceof PresetError) setError(e.message);
      else if (e instanceof KolError && e.message === SET_LIMIT_ERROR) setError(kolStudio.setLimit);
      else setError(e instanceof KolError && e.status === 409 ? kolStudio.setIdTaken : kolStudio.setSaveFailed);
    }
  };

  return (
    <section aria-labelledby={`${uid}-t`} className="mt-6">
      <h2 id={`${uid}-t`} className="text-title3 font-medium">
        {initial ? kolStudio.editorEdit : kolStudio.editorNew}
      </h2>
      <div className="mt-4 space-y-5 rounded-card bg-card p-6 shadow-card sm:p-8">
        <div>
          <label htmlFor={`${uid}-n`} className="text-subhead font-semibold text-label">
            {kolStudio.setName}
          </label>
          <input id={`${uid}-n`} value={name} maxLength={SET_NAME_MAX} onChange={(e) => rename(e.target.value)} className={`${field} mt-2`} />
        </div>

        <div>
          <label htmlFor={`${uid}-d`} className="text-subhead font-semibold text-label">
            {kolStudio.setDescription}
          </label>
          <textarea
            id={`${uid}-d`}
            rows={2}
            value={description}
            maxLength={SET_DESCRIPTION_MAX}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 block w-full rounded-control border border-separator bg-card px-3 py-2.5 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <div>
          <div className="flex items-center gap-1">
            <label htmlFor={`${uid}-i`} className="text-subhead font-semibold text-label">
              {kolStudio.setId}
            </label>
            <InfoTip entry={kolStudio.setIdTip} />
          </div>
          <input
            id={`${uid}-i`}
            value={id}
            maxLength={SET_ID_MAX}
            readOnly={locked}
            aria-readonly={locked}
            aria-invalid={idTaken}
            onChange={(e) => {
              setIdTouched(true);
              setId(toSlug(e.target.value, SET_ID_MAX));
            }}
            className={`${locked ? fieldLocked : field} mt-2`}
          />
          {idTaken && <p className="mt-2 text-footnote font-medium text-danger">{kolStudio.setIdTaken}</p>}
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span id={`${uid}-p`} className="text-subhead font-semibold text-label">
              {kolStudio.setPublish}
            </span>
            <InfoTip entry={kolStudio.setPublishTip} />
          </div>
          <div role="group" aria-labelledby={`${uid}-p`} className="mt-2 flex max-w-xs gap-1 rounded-control bg-fill p-1">
            {(["draft", "public"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setPublish(v)} aria-pressed={publish === v} className={segment(publish === v)}>
                {v === "draft" ? kolStudio.draft : kolStudio.public}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span id={`${uid}-s`} className="block text-subhead font-semibold text-label">
            {kolStudio.slotsTitle}
          </span>
          <div role="group" aria-labelledby={`${uid}-s`} className="mt-2 flex gap-1 rounded-control bg-fill p-1">
            {slots.map((_, i) => (
              <button key={i} type="button" onClick={() => setSelected(i)} aria-pressed={selected === i} className={segment(selected === i)}>
                {kolSets.slotName(i + 1)}
              </button>
            ))}
          </div>
          {slots.map((slot, i) => (
            <div key={i} hidden={selected !== i} className="mt-4 space-y-4">
              <div>
                <label htmlFor={`${uid}-l${i}`} className="text-subhead font-semibold text-label">
                  {kolStudio.slotLabel}
                </label>
                <input id={`${uid}-l${i}`} value={slot.label} onChange={(e) => patch(i, { label: e.target.value })} className={`${field} mt-2`} />
              </div>
              <div>
                <label htmlFor={`${uid}-o${i}`} className="text-subhead font-semibold text-label">
                  {kolStudio.slotNote}
                </label>
                <input id={`${uid}-o${i}`} value={slot.note ?? ""} onChange={(e) => patch(i, { note: e.target.value || undefined })} className={`${field} mt-2`} />
              </div>
              <SlotCard settings={slot.settings} onChange={(settings) => patch(i, { settings })} />
            </div>
          ))}
        </div>

        {error && <p role="alert" className="text-footnote font-medium text-danger">{error}</p>}
        <div className="flex flex-wrap gap-3 border-t border-separator pt-5">
          <button type="button" onClick={save} disabled={!valid} className={primary}>
            {kolStudio.setSave}
          </button>
          <button type="button" onClick={onCancel} className={secondary}>
            {kolStudio.cancel}
          </button>
        </div>
      </div>
    </section>
  );
}
