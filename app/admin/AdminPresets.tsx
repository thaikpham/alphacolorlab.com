"use client";

import { useEffect, useState } from "react";
import { PresetSet, PresetError, validatePresetSets } from "@/lib/presetSets";
import { adminCopy } from "./copy";
import { SlotCard } from "@/app/components/SlotCard";
import { SlotDraft } from "@/lib/presetSets";

const DEFAULT_SLOT_SETTINGS: SlotDraft = {
  mode: "A",
  iso: "auto",
  focus: "AF-C",
  wb: { mode: "awb", priority: "standard", ab: 0, gm: 0 },
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Remove diacritics
    .replace(/đ/g, "d") // Special case for Vietnamese đ
    .replace(/\D+/g, "-") // Replace non-word chars with hyphens
    .replace(/^-+|-+$/g, "") // Trim hyphens
    .slice(0, 40);
}

export function AdminPresets({ initialSets }: { initialSets: PresetSet[] }) {
  const [sets, setSets] = useState<PresetSet[]>(initialSets);
  const [selectedSetId, setSelectedSetId] = useState(sets[0].id);
  const [editedSets, setEditedSets] = useState<PresetSet[] | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [error, setError] = useState<string>("");
  const [lastSaveTime, setLastSaveTime] = useState<string>("");

  const isDirty = editedSets !== null;
  const currentSets = editedSets ?? sets;
  const selectedSet = currentSets.find((s) => s.id === selectedSetId);

  const handleAddSet = () => {
    const newSet: PresetSet = {
      id: `bо-moi-${Date.now()}`,
      name: adminCopy.newSetName,
      description: adminCopy.newSetDesc,
      slots: [
        { label: adminCopy.slotName(1), settings: structuredClone(DEFAULT_SLOT_SETTINGS) },
        { label: adminCopy.slotName(2), settings: structuredClone(DEFAULT_SLOT_SETTINGS) },
        { label: adminCopy.slotName(3), settings: structuredClone(DEFAULT_SLOT_SETTINGS) },
        { label: adminCopy.slotName(4), settings: structuredClone(DEFAULT_SLOT_SETTINGS) },
      ],
    };
    const updated = [...currentSets, newSet];
    setEditedSets(updated);
    setSelectedSetId(newSet.id);
    setSelectedSlotIndex(0);
  };

  const handleSetNameChange = (name: string) => {
    if (!selectedSet) return;
    const updated = currentSets.map((s) =>
      s.id === selectedSetId ? { ...s, name, id: slugify(name) || s.id } : s
    ) as PresetSet[];
    setEditedSets(updated);
    setSelectedSetId(updated.find((s) => s.name === name)?.id || selectedSetId);
  };

  const handleSetDescriptionChange = (description: string) => {
    if (!selectedSet) return;
    const updated = currentSets.map((s) =>
      s.id === selectedSetId ? { ...s, description } : s
    ) as PresetSet[];
    setEditedSets(updated);
  };

  const handleSetIdChange = (id: string) => {
    if (!selectedSet) return;
    const updated = currentSets.map((s) =>
      s.id === selectedSetId ? { ...s, id } : s
    ) as PresetSet[];
    setEditedSets(updated);
    setSelectedSetId(id);
  };

  // Ô trống không ghi vào bộ; cả 4 ô trống thì bỏ hẳn author
  const handleSetAuthorChange = (field: "name" | "handle" | "avatar" | "link", value: string) => {
    if (!selectedSet) return;
    const a = { name: "", handle: "", avatar: "", link: "", ...selectedSet.author, [field]: value };
    const author = a.name || a.handle || a.avatar || a.link
      ? { name: a.name, handle: a.handle, ...(a.avatar ? { avatar: a.avatar } : {}), ...(a.link ? { link: a.link } : {}) }
      : undefined;
    const updated = currentSets.map((s) => (s.id === selectedSetId ? { ...s, author } : s)) as PresetSet[];
    setEditedSets(updated);
  };

  const handleSetDefault = (isDefault: boolean) => {
    if (!selectedSet) return;
    const updated = currentSets.map((s) => ({
      ...s,
      recommended: s.id === selectedSetId ? isDefault : false,
    })) as PresetSet[];
    setEditedSets(updated);
  };

  const handleSetUnlisted = (isUnlisted: boolean) => {
    if (!selectedSet) return;
    const updated = currentSets.map((s) => (s.id === selectedSetId ? { ...s, unlisted: isUnlisted } : s)) as PresetSet[];
    setEditedSets(updated);
  };

  const handleSlotLabelChange = (label: string) => {
    if (!selectedSet) return;
    const updated = currentSets.map((s) =>
      s.id === selectedSetId
        ? {
            ...s,
            slots: s.slots.map((sl, i) =>
              i === selectedSlotIndex ? { ...sl, label } : sl
            ) as typeof s.slots,
          }
        : s
    ) as PresetSet[];
    setEditedSets(updated);
  };

  const handleSlotNoteChange = (note: string) => {
    if (!selectedSet) return;
    const updated = currentSets.map((s) =>
      s.id === selectedSetId
        ? {
            ...s,
            slots: s.slots.map((sl, i) =>
              i === selectedSlotIndex ? { ...sl, note: note || undefined } : sl
            ) as typeof s.slots,
          }
        : s
    ) as PresetSet[];
    setEditedSets(updated);
  };

  const handleSlotSettingsChange = (settings: SlotDraft) => {
    if (!selectedSet) return;
    const updated = currentSets.map((s) =>
      s.id === selectedSetId
        ? {
            ...s,
            slots: s.slots.map((sl, i) =>
              i === selectedSlotIndex ? { ...sl, settings } : sl
            ) as typeof s.slots,
          }
        : s
    ) as PresetSet[];
    setEditedSets(updated);
  };

  const handleCopySlotFrom = (sourceIndex: number) => {
    if (!selectedSet) return;
    const sourcSettings = selectedSet.slots[sourceIndex].settings;
    const updated = currentSets.map((s) =>
      s.id === selectedSetId
        ? {
            ...s,
            slots: s.slots.map((sl, i) =>
              i === selectedSlotIndex
                ? { ...sl, settings: structuredClone(sourcSettings) }
                : sl
            ) as typeof s.slots,
          }
        : s
    ) as PresetSet[];
    setEditedSets(updated);
  };

  const handleDuplicateSet = () => {
    if (!selectedSet) return;
    const newSet: PresetSet = {
      ...structuredClone(selectedSet),
      id: `${selectedSet.id}-copy-${Date.now()}`,
      recommended: false,
    };
    const updated = [...currentSets, newSet];
    setEditedSets(updated);
    setSelectedSetId(newSet.id);
  };

  const handleDeleteSet = () => {
    if (!selectedSet || currentSets.length <= 1) {
      if (currentSets.length <= 1) alert(adminCopy.cantDeleteLast);
      return;
    }
    if (!window.confirm(adminCopy.deleteConfirm)) return;
    const updated = currentSets.filter((s) => s.id !== selectedSetId) as PresetSet[];
    setEditedSets(updated);
    setSelectedSetId(updated[0].id);
  };

  const handleUndo = () => {
    setEditedSets(null);
    setError("");
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(currentSets, null, 2);
    const blob = new Blob([jsonStr + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preset-sets.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
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
      const now = new Date();
      setLastSaveTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
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

  if (!selectedSet) return null;

  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6 pb-32">
      {/* Left: Set list */}
      <div className="hidden lg:block">
        <div className="rounded-card bg-card shadow-card overflow-hidden divide-y divide-separator">
          {currentSets.map((set) => (
            <button
              key={set.id}
              onClick={() => {
                setSelectedSetId(set.id);
                setSelectedSlotIndex(0);
              }}
              className={`w-full text-left p-4 transition ${
                set.id === selectedSetId ? "bg-fill" : "hover:bg-fill"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-subhead font-semibold truncate">{set.name}</div>
                  <div className="text-footnote text-secondary truncate">
                    {set.description || "(tên)"}
                  </div>
                </div>
                {set.recommended && (
                  <span className="text-footnote font-medium px-2 py-1 rounded-badge bg-accent/10 text-accent-text whitespace-nowrap flex-shrink-0">
                    {adminCopy.defaultChip}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={handleAddSet}
          className="mt-3 w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition"
        >
          {adminCopy.addSet}
        </button>
      </div>

      {/* Right: Editor */}
      <div className="space-y-6">
        {/* Set info */}
        <div>
          <h3 className="text-footnote font-medium text-secondary mb-3">{adminCopy.setInfo}</h3>
          <div className="rounded-card bg-card shadow-card overflow-hidden divide-y divide-separator">
            <div className="p-4">
              <label className="text-footnote font-medium text-secondary block mb-1.5">
                {adminCopy.setName}
              </label>
              <input
                type="text"
                maxLength={60}
                value={selectedSet.name}
                onChange={(e) => handleSetNameChange(e.target.value)}
                className="w-full h-11 rounded-control border border-separator bg-card px-3 text-callout text-label"
              />
            </div>
            <div className="p-4">
              <label className="text-footnote font-medium text-secondary block mb-1.5">
                {adminCopy.setDescription}
              </label>
              <textarea
                maxLength={240}
                value={selectedSet.description}
                onChange={(e) => handleSetDescriptionChange(e.target.value)}
                className="w-full rounded-control border border-separator bg-card px-3 py-2 text-callout text-label resize-none"
                rows={3}
              />
            </div>
            <div className="p-4">
              <label className="text-footnote font-medium text-secondary block mb-1.5">
                {adminCopy.setId}
              </label>
              <input
                type="text"
                maxLength={40}
                value={selectedSet.id}
                onChange={(e) => handleSetIdChange(e.target.value)}
                className="w-full h-11 rounded-control border border-separator bg-card px-3 text-callout text-label font-mono"
              />
            </div>
            {([
              ["name", adminCopy.authorName, 60],
              ["handle", adminCopy.authorHandle, 30],
              ["avatar", adminCopy.authorAvatar, 300],
              ["link", adminCopy.authorLink, 300],
            ] as const).map(([field, label, max]) => (
              <div key={field} className="p-4">
                <label className="text-footnote font-medium text-secondary block mb-1.5">
                  {label}
                </label>
                <input
                  type="text"
                  maxLength={max}
                  value={selectedSet.author?.[field] ?? ""}
                  onChange={(e) => handleSetAuthorChange(field, e.target.value)}
                  className="w-full h-11 rounded-control border border-separator bg-card px-3 text-callout text-label"
                />
              </div>
            ))}
            <label className="p-4 flex items-center gap-3 cursor-pointer hover:bg-fill transition">
              <input
                type="checkbox"
                checked={selectedSet.recommended ?? false}
                onChange={(e) => handleSetDefault(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-callout text-label">{adminCopy.makeDefault}</span>
            </label>
            <label className="p-4 flex items-center gap-3 cursor-pointer hover:bg-fill transition">
              <input
                type="checkbox"
                checked={selectedSet.unlisted ?? false}
                onChange={(e) => handleSetUnlisted(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-callout text-label">{adminCopy.unlisted}</span>
            </label>
          </div>
        </div>

        {/* Slots */}
        <div>
          <h3 className="text-footnote font-medium text-secondary mb-3">{adminCopy.slots}</h3>
          <div className="rounded-card bg-card shadow-card overflow-hidden divide-y divide-separator">
            {/* Segmented control for slots */}
            <div className="p-1 flex gap-1 bg-fill rounded-control m-4 h-11">
              {selectedSet.slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSlotIndex(i)}
                  className={`flex-1 h-11 rounded-badge text-subhead font-medium transition ${
                    i === selectedSlotIndex
                      ? "bg-card shadow-thumb text-label"
                      : "text-label hover:bg-fill-strong"
                  }`}
                >
                  <div>M{i + 1}</div>
                  <div className="text-footnote text-secondary truncate">{slot.label}</div>
                </button>
              ))}
            </div>

            {/* Slot editor */}
            <div className="p-4 space-y-4">
              <div>
                <label className="text-footnote font-medium text-secondary block mb-1.5">
                  {adminCopy.slotLabel}
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={selectedSet.slots[selectedSlotIndex].label}
                  onChange={(e) => handleSlotLabelChange(e.target.value)}
                  className="w-full h-11 rounded-control border border-separator bg-card px-3 text-callout text-label"
                />
              </div>

              <div>
                <label className="text-footnote font-medium text-secondary block mb-1.5">
                  {adminCopy.slotNote}
                </label>
                <textarea
                  maxLength={160}
                  value={selectedSet.slots[selectedSlotIndex].note || ""}
                  onChange={(e) => handleSlotNoteChange(e.target.value)}
                  className="w-full rounded-control border border-separator bg-card px-3 py-2 text-callout text-label resize-none"
                  rows={2}
                />
              </div>

              {/* Copy from other slots */}
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  i !== selectedSlotIndex && (
                    <button
                      key={i}
                      onClick={() => handleCopySlotFrom(i)}
                      className="flex-1 h-10 rounded-full bg-accent/10 text-accent-text text-footnote font-medium hover:bg-accent/15 transition"
                    >
                      {adminCopy.copyFromM1.replace("M1", `M${i + 1}`)}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* SlotCard */}
          <div className="mt-6 rounded-card bg-card shadow-card p-4">
            <SlotCard
              settings={selectedSet.slots[selectedSlotIndex].settings}
              onChange={handleSlotSettingsChange}
              full
            />
          </div>
        </div>

        {/* Set actions */}
        <div className="rounded-card bg-card shadow-card p-4 flex gap-2">
          <button
            onClick={handleDuplicateSet}
            className="flex-1 h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition"
          >
            {adminCopy.duplicateSet}
          </button>
          <button
            onClick={handleDeleteSet}
            disabled={currentSets.length <= 1}
            className="flex-1 h-11 rounded-full text-danger text-subhead font-semibold hover:bg-danger-fill transition disabled:opacity-40"
          >
            {adminCopy.deleteSet}
          </button>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-separator bg-card safe-area-pad">
        <div className="max-w-page mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="text-footnote">
            {error && <span className="text-danger">{adminCopy.errorPrefix} {error}</span>}
            {!error && isDirty && <span className="text-warning">{adminCopy.unsavedChanges}</span>}
            {!error && !isDirty && lastSaveTime && (
              <span className="text-success">
                {adminCopy.savedAt} {lastSaveTime}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={!isDirty}
              className="h-11 px-4 rounded-full text-accent-text text-subhead font-semibold hover:bg-accent/10 transition disabled:opacity-40"
            >
              {adminCopy.undo}
            </button>
            <button
              onClick={handleDownloadJson}
              className="h-11 px-4 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition"
            >
              {adminCopy.downloadJson}
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="h-11 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 transition disabled:opacity-40"
            >
              {adminCopy.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
