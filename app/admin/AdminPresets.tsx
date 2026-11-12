"use client";

import { useEffect, useId, useState } from "react";
import { PRESET_LIMITS, PresetSet, PresetError, PresetSlot, validatePresetSets, type SlotDraft } from "@/lib/presetSets";
import { toSlug } from "@/lib/slug";
import { SlotDashboard } from "@/app/components/SlotDashboard";
import { InfoTip } from "@/app/components/InfoTip";
import { adminCopy } from "./copy";

const DEFAULT_SLOT_SETTINGS: SlotDraft = {
  mode: "A",
  iso: "auto",
  focus: "AF-C",
  wb: { mode: "awb", priority: "standard", ab: 0, gm: 0 },
};

// Bước di chuyển khi bấm phím mũi tên trong nhóm chọn bộ
const ARROW_STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

const inputBox = "h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const textBox = "block w-full rounded-control border border-separator bg-card px-3 py-2.5 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const labelCls = "text-subhead font-semibold text-label";
const card = "rounded-card bg-card p-6 shadow-card sm:p-8";
const bar = "rounded-card bg-card p-4 shadow-card sm:p-6";
const secondary = "inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";
const primary = "inline-flex h-11 shrink-0 items-center rounded-full bg-accent px-6 text-subhead font-semibold text-on-accent transition-colors hover:bg-accent/90 disabled:opacity-40";
const chip = (on: boolean) => `inline-flex min-h-11 items-center gap-2 rounded-badge px-4 py-2 text-subhead transition ${on ? "bg-card shadow-thumb font-semibold text-label" : "font-medium text-label hover:bg-fill-strong"}`;
const badge = "shrink-0 rounded-badge bg-fill px-2 py-0.5 text-footnote font-medium text-label";

/**
 * Quản lý bộ M1–M4 của data/preset-sets.json (chỉ chạy khi npm run dev). Chọn bộ theo vị trí trong danh sách, không theo tên hay id.
 * Id tự lấy từ tên chỉ cho bộ thêm hoặc nhân bản trong phiên này, đến khi sửa id bằng tay hoặc lưu xong.
 * Bốn ô M1–M4 soạn bằng SlotDashboard (dùng chung với editor bộ KOL).
 */
export function AdminPresets({ initialSets }: { initialSets: PresetSet[] }) {
  const uid = useId();
  const [sets, setSets] = useState<PresetSet[]>(initialSets);
  const [selected, setSelected] = useState(0);
  const [editedSets, setEditedSets] = useState<PresetSet[] | null>(null);
  const [autoIds, setAutoIds] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [error, setError] = useState("");
  const [lastSaveTime, setLastSaveTime] = useState("");

  const isDirty = editedSets !== null;
  const currentSets = editedSets ?? sets;
  const set = currentSets[selected];

  const patchSet = (p: Partial<PresetSet>) => setEditedSets(currentSets.map((s, i) => (i === selected ? { ...s, ...p } : s)) as PresetSet[]);
  const withAuto = (edit: (ids: Set<string>) => void) =>
    setAutoIds((prev) => {
      const next = new Set(prev);
      edit(next);
      return next;
    });

  const addSet = () => {
    const id = `bo-moi-${Date.now()}`;
    const added: PresetSet = {
      id,
      name: adminCopy.newSetName,
      description: adminCopy.newSetDesc,
      slots: [
        { label: adminCopy.slotName(1), settings: structuredClone(DEFAULT_SLOT_SETTINGS) },
        { label: adminCopy.slotName(2), settings: structuredClone(DEFAULT_SLOT_SETTINGS) },
        { label: adminCopy.slotName(3), settings: structuredClone(DEFAULT_SLOT_SETTINGS) },
        { label: adminCopy.slotName(4), settings: structuredClone(DEFAULT_SLOT_SETTINGS) },
      ],
    };
    setEditedSets([...currentSets, added]);
    withAuto((ids) => ids.add(id));
    setSelected(currentSets.length);
  };

  const duplicateSet = () => {
    const id = `${set.id.slice(0, 20).replace(/-+$/, "")}-copy-${Date.now().toString(36)}`;
    setEditedSets([...currentSets, { ...structuredClone(set), id, recommended: false }]);
    withAuto((ids) => ids.add(id));
    setSelected(currentSets.length);
  };

  const deleteSet = () => {
    if (currentSets.length <= 1 || !window.confirm(adminCopy.deleteConfirm)) return;
    const next = currentSets.filter((_, i) => i !== selected);
    setEditedSets(next);
    setSelected(Math.min(selected, next.length - 1));
  };

  // Tên đổi thì id đổi theo chỉ khi bộ còn trong danh sách tự lấy id
  const changeName = (name: string) => {
    const auto = autoIds.has(set.id);
    const id = auto ? toSlug(name, PRESET_LIMITS.id).replace(/^-+|-+$/g, "") || set.id : set.id;
    patchSet({ name, id });
    if (auto) withAuto((ids) => {
      ids.delete(set.id);
      ids.add(id);
    });
  };

  // Sửa id bằng tay thì bộ thoát khỏi danh sách tự lấy id
  const changeId = (raw: string) => {
    patchSet({ id: toSlug(raw, PRESET_LIMITS.id) });
    withAuto((ids) => ids.delete(set.id));
  };

  // Ô trống không ghi vào bộ; cả 4 ô trống thì bỏ hẳn author
  const setAuthor = (field: "name" | "handle" | "avatar" | "link", value: string) => {
    const a = { name: "", handle: "", avatar: "", link: "", ...set.author, [field]: value };
    const author = a.name || a.handle || a.avatar || a.link
      ? { name: a.name, handle: a.handle, ...(a.avatar ? { avatar: a.avatar } : {}), ...(a.link ? { link: a.link } : {}) }
      : undefined;
    patchSet({ author });
  };

  const setRecommended = (on: boolean) => setEditedSets(currentSets.map((s, i) => ({ ...s, recommended: i === selected ? on : false })) as PresetSet[]);

  const setSlots = (slots: PresetSlot[]) => patchSet({ slots: slots as PresetSet["slots"] });

  const undo = () => {
    setEditedSets(null);
    setAutoIds(new Set<string>());
    setSelected((i) => Math.min(i, sets.length - 1));
    setError("");
  };

  const downloadJson = () => {
    const jsonStr = JSON.stringify(currentSets, null, 2);
    const blob = new Blob([jsonStr + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preset-sets.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const save = async () => {
    try {
      setError("");
      validatePresetSets(currentSets);
      const res = await fetch("/admin/api", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentSets),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new PresetError(data.error || "Save failed");
      }
      setSets(currentSets);
      setEditedSets(null);
      setAutoIds(new Set<string>());
      const now = new Date();
      setLastSaveTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    } catch (err) {
      setError(err instanceof PresetError ? err.message : String(err));
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = adminCopy.beforeUnload;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  if (!set) return null;

  // Một ô tác giả: nhãn ngắn, lời dặn nằm trong nút "i"
  const authorField = (key: "name" | "handle" | "avatar" | "link", text: string, tip: string, max: number) => (
    <div key={key}>
      <div className="flex items-center gap-1.5">
        <label htmlFor={`${uid}-${key}`} className={labelCls}>
          {text}
        </label>
        <InfoTip entry={{ term: text, lines: [{ t: tip }] }} />
      </div>
      <input id={`${uid}-${key}`} value={set.author?.[key] ?? ""} maxLength={max} onChange={(e) => setAuthor(key, e.target.value)} className={`${inputBox} mt-2`} />
    </div>
  );

  return (
    <div className="space-y-6 pb-48 lg:pb-32">
      {/* Thanh chọn bộ */}
      <div className={bar}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label={adminCopy.setList} className="flex max-w-full flex-wrap gap-1 rounded-control bg-fill p-1">
            {currentSets.map((s, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={i === selected}
                tabIndex={i === selected ? 0 : -1}
                onClick={() => setSelected(i)}
                onKeyDown={(e) => {
                  const step = ARROW_STEP[e.key];
                  if (!step) return;
                  e.preventDefault();
                  const next = (i + step + currentSets.length) % currentSets.length;
                  setSelected(next);
                  (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
                }}
                className={chip(i === selected)}
              >
                <span className="min-w-0 break-words">{s.name || s.id}</span>
                {s.recommended && <span className={badge}>{adminCopy.defaultChip}</span>}
                {s.unlisted && <span className={badge}>{adminCopy.unlistedChip}</span>}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addSet} className={secondary}>
              {adminCopy.addSet}
            </button>
            <button type="button" onClick={duplicateSet} className={secondary}>
              {adminCopy.duplicateSet}
            </button>
            <button
              type="button"
              onClick={deleteSet}
              disabled={currentSets.length <= 1}
              className="inline-flex h-11 shrink-0 items-center rounded-full px-5 text-subhead font-semibold text-danger transition-colors hover:bg-danger-fill disabled:opacity-40"
            >
              {adminCopy.deleteSet}
            </button>
          </div>
        </div>
      </div>

      {/* Thông tin bộ */}
      <section aria-labelledby={`${uid}-info`} className={card}>
        <h3 id={`${uid}-info`} className="text-title3 font-medium">
          {adminCopy.setInfo}
        </h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor={`${uid}-n`} className={labelCls}>
              {adminCopy.setName}
            </label>
            <input id={`${uid}-n`} value={set.name} maxLength={PRESET_LIMITS.name} onChange={(e) => changeName(e.target.value)} className={`${inputBox} mt-2`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor={`${uid}-i`} className={labelCls}>
                {adminCopy.setId}
              </label>
              <InfoTip entry={{ term: adminCopy.setId, lines: [{ t: adminCopy.setIdTip }] }} />
            </div>
            <input id={`${uid}-i`} value={set.id} maxLength={PRESET_LIMITS.id} onChange={(e) => changeId(e.target.value)} className={`${inputBox} mt-2 font-mono`} />
          </div>
          {authorField("name", adminCopy.authorName, adminCopy.authorNameTip, PRESET_LIMITS.authorName)}
          {authorField("handle", adminCopy.authorHandle, adminCopy.authorHandleTip, PRESET_LIMITS.authorHandle)}
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-d`} className={labelCls}>
              {adminCopy.setDescription}
            </label>
            <textarea id={`${uid}-d`} rows={2} value={set.description} maxLength={PRESET_LIMITS.description} onChange={(e) => patchSet({ description: e.target.value })} className={`${textBox} mt-2`} />
          </div>
          {authorField("avatar", adminCopy.authorAvatar, adminCopy.authorAvatarTip, PRESET_LIMITS.url)}
          {authorField("link", adminCopy.authorLink, adminCopy.authorLinkTip, PRESET_LIMITS.url)}
          <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2 xl:col-span-4">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-callout text-label">
              <input type="checkbox" checked={set.recommended ?? false} onChange={(e) => setRecommended(e.target.checked)} className="h-5 w-5" />
              <span>{adminCopy.makeDefault}</span>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-callout text-label">
              <input type="checkbox" checked={set.unlisted ?? false} onChange={(e) => patchSet({ unlisted: e.target.checked })} className="h-5 w-5" />
              <span>{adminCopy.unlisted}</span>
            </label>
          </div>
        </div>
      </section>

      {/* Bốn ô nhớ */}
      <section aria-labelledby={`${uid}-slots`} className={card}>
        <h3 id={`${uid}-slots`} className="text-title3 font-medium">
          {adminCopy.slots}
        </h3>
        <div className="mt-5">
          <SlotDashboard key={selected} setName={set.name} slots={set.slots} onChange={setSlots} />
        </div>
      </section>

      {/* Thanh lưu: nằm trên thanh tab dưới (dưới lg), đáy màn hình từ lg */}
      <div className="fixed bottom-tabbar left-0 right-0 z-30 border-t border-separator bg-card lg:bottom-0">
        {/* Dồn về bên phải: góc dưới trái là chỗ nút công cụ dev của Next */}
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-end gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <div className="text-footnote font-medium">
            {error ? (
              <p role="alert" className="text-danger">
                {adminCopy.errorPrefix} {error}
              </p>
            ) : isDirty ? (
              <p className="text-warning">{adminCopy.unsavedChanges}</p>
            ) : lastSaveTime ? (
              <p className="text-success">
                {adminCopy.savedAt} {lastSaveTime}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={undo} disabled={!isDirty} className={secondary}>
              {adminCopy.undo}
            </button>
            <button type="button" onClick={downloadJson} className={secondary}>
              {adminCopy.downloadJson}
            </button>
            <button type="button" onClick={save} disabled={!isDirty} className={primary}>
              {adminCopy.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
