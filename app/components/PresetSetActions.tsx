"use client";

import { useState } from "react";
import Link from "next/link";
import { kolSets, glossary, recallGuideText } from "@/app/content";
import { cloneSlots, type PresetSet } from "@/lib/presetSets";
import { buildPresetFiles, loadPresetBase, saveFile, ZIP_FILENAME, type PresetSystem } from "@/lib/presetDownload";
import { InfoTip } from "./InfoTip";

/** Tải ZIP 4 file của bộ (theo hệ PAL/NTSC đã chọn) và nút "Dùng bộ này" mở Tạo bộ M1–M4 với bộ đó. Chỉ hiện cho ZV-E10. */
export function PresetSetActions({ set }: { set: PresetSet }) {
  const [system, setSystem] = useState<PresetSystem>("pal");
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setFailed(false);
    try {
      const { base, headers } = await loadPresetBase(system);
      const guide = recallGuideText({ setName: set.name, labels: set.slots.map((s) => s.label) });
      const { zip } = buildPresetFiles(cloneSlots(set), base, headers, guide);
      saveFile(zip, ZIP_FILENAME, "application/zip");
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-footnote font-medium text-secondary">{kolSets.system}</span>
          <InfoTip entry={glossary.system} />
        </div>
        <div className="flex gap-1 rounded-control bg-fill p-1">
          {(["pal", "ntsc"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSystem(v)}
              aria-pressed={system === v}
              className={`flex-1 h-11 rounded-badge text-subhead font-medium transition ${
                system === v ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={download}
          className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-callout font-semibold text-on-accent transition-colors hover:bg-accent/90"
        >
          {kolSets.download}
        </button>
        <Link href={`/tao-m1-m4?set=${set.id}`} className="inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong">
          {kolSets.use}
        </Link>
      </div>
      {failed && <p role="alert" className="text-footnote text-danger">{kolSets.downloadError}</p>}
    </div>
  );
}
