"use client";

import { useId, useState } from "react";
import { glossary, kolSets, kolStudio, presetConsole, recallGuideText } from "@/app/content";
import { PRESET_LIMITS, type PresetSlot } from "@/lib/presetSets";
import { downloadSetZip, type PresetSystem } from "@/lib/presetDownload";
import { summaryRows } from "@/lib/presetSummary";
import { DatImport } from "./DatImport";
import { InfoTip } from "./InfoTip";
import { SlotCard } from "./SlotCard";

const field = "h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent";
const segment = (on: boolean) => `flex-1 h-11 rounded-badge text-subhead font-medium transition ${on ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"}`;

/** Bốn ô M1–M4 của một bộ: chọn ô, tên và ghi chú, chép từ ô khác, nạp từ file máy, chỉnh toàn bộ thông số, tải ZIP. Dùng chung cho /admin và editor bộ KOL. Một lần chỉ mở một ô. */
export function SlotDashboard({ setName, slots, onChange }: { setName: string; slots: PresetSlot[]; onChange: (next: PresetSlot[]) => void }) {
  const uid = useId();
  const [selected, setSelected] = useState(0);
  const [system, setSystem] = useState<PresetSystem>("pal");
  const [failed, setFailed] = useState(false);
  const current = slots[selected];

  const patch = (i: number, p: Partial<PresetSlot>) => onChange(slots.map((s, j) => (j === i ? { ...s, ...p } : s)));

  const download = async () => {
    setFailed(false);
    try {
      await downloadSetZip(slots.map((s) => s.settings), system, recallGuideText({ setName, labels: slots.map((s) => s.label) }));
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {slots.map((slot, i) => {
          const values = summaryRows(slot.settings, presetConsole.summary).map(([, v]) => v);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              className={`min-w-0 rounded-control border-2 p-3 text-left transition ${selected === i ? "border-accent bg-card shadow-card" : "border-transparent bg-fill hover:bg-fill-strong"}`}
            >
              <span className="block truncate text-subhead font-semibold text-label">{`${presetConsole.copyFrom(i + 1)} · ${slot.label}`}</span>
              <span className="mt-1 block truncate text-footnote text-label">
                {values.length > 0 ? values.slice(0, 3).join(" · ") : presetConsole.summary.keep}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-l`} className="mb-1.5 block text-footnote font-medium text-secondary">
            {kolStudio.slotLabel}
          </label>
          <input id={`${uid}-l`} value={current.label} maxLength={PRESET_LIMITS.slotLabel} onChange={(e) => patch(selected, { label: e.target.value })} className={field} />
        </div>
        <div>
          <label htmlFor={`${uid}-o`} className="mb-1.5 block text-footnote font-medium text-secondary">
            {kolStudio.slotNote}
          </label>
          <input id={`${uid}-o`} value={current.note ?? ""} maxLength={PRESET_LIMITS.slotNote} onChange={(e) => patch(selected, { note: e.target.value || undefined })} className={field} />
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-footnote font-medium text-secondary">{presetConsole.copySlot}</span>
        <div className="flex flex-wrap gap-2">
          {slots.map((_, k) => k).filter((k) => k !== selected).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => patch(selected, { settings: structuredClone(slots[k].settings) })}
              className="inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong"
            >
              {presetConsole.copyFrom(k + 1)}
            </button>
          ))}
        </div>
      </div>

      <DatImport onUse={(r) => patch(selected, { settings: { ...r.settings } })} />

      <SlotCard key={selected} dashboard settings={current.settings} onChange={(settings) => patch(selected, { settings })} />

      <div className="space-y-4 border-t border-separator pt-5">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-footnote font-medium text-secondary">{kolSets.system}</span>
            <InfoTip entry={glossary.system} />
          </div>
          <div className="flex max-w-xs gap-1 rounded-control bg-fill p-1">
            {(["pal", "ntsc"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setSystem(v)} aria-pressed={system === v} className={segment(system === v)}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={download} className="inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong">
          {kolSets.download}
        </button>
        {failed && <p role="alert" className="text-footnote font-medium text-danger">{kolSets.downloadError}</p>}
      </div>
    </div>
  );
}
