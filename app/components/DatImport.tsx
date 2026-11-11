"use client";

import { useId, useState, type ChangeEvent } from "react";
import { importDat, toSlotSettings, type ImportResult, type SlotImport } from "@/lib/datImport.ts";
import { PP_FIELDS, type DecodedSettings } from "@/lib/zve10/dat.ts";
import { A7C2_SETTINGS } from "@/lib/a7c2/settings.ts";
import { FOCUS_AREA_LABELS, METERING_LABELS, FACE_PRIORITY_LABELS, SOFT_SKIN_LABELS, AUTO_REVIEW_LABELS } from "@/lib/presetSummary";
import { datImport as T } from "../content";

const VALUE_LABELS: Record<string, Record<string, string>> = {
  focusArea: FOCUS_AREA_LABELS,
  metering: METERING_LABELS,
  facePriority: FACE_PRIORITY_LABELS,
  softSkin: SOFT_SKIN_LABELS,
  autoReview: AUTO_REVIEW_LABELS,
};

type Item = { name: string; result: ImportResult; slot?: SlotImport };

function badgesOf({ result: r, slot }: Item): string[] {
  if (r.kind === "zve10") {
    const b = [T.badge.zve10, r.recordMode === "photo" ? T.badge.photo : T.badge.movie];
    if (r.readOnly) b.push(T.badge.readOnly);
    if (slot?.slot) b.push(T.badge.slot(slot.slot, (slot.family ?? "").toUpperCase()));
    return b;
  }
  if (r.kind === "unsupported") return [T.badge.zve10, T.badge.movie];
  if (r.kind === "a6400") return [T.badge.a6400, T.badge.experimental];
  if (r.kind === "a7c2") return [T.badge.a7c2];
  return [];
}

const label: Record<string, string> = T.label;

function skippedLabel(key: string): string {
  if (key.startsWith("pp.")) {
    const k = key.slice(3);
    return PP_FIELDS.find((f) => f.key === k)?.label ?? k;
  }
  return label[key] ?? key;
}

function SkippedNote({ skipped }: { skipped: string[] }) {
  const names = [...new Set(skipped.map(skippedLabel))];
  return <p className="rounded-control bg-fill p-3 text-footnote text-label">{`${T.skipped}: ${names.join(", ")}`}</p>;
}

type Row = { key: string; name: string; value: string | number | null; unconfirmed?: boolean };

function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="space-y-1 text-footnote">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-4">
          <dt className="text-secondary">{r.name}</dt>
          <dd className="flex items-center gap-2 text-right tabular-nums text-label">
            {r.value === null || r.value === "" ? T.none : String(r.value)}
            {r.unconfirmed && <span className="rounded-badge bg-warning-fill px-2 py-0.5 text-warning">{T.unconfirmed}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function zveRows(d: DecodedSettings): Row[] {
  const w = d.wb;
  const shift = `${w.ab ?? 0}/${w.gm ?? 0}`;
  const wb = w.mode === "ctemp" ? `${w.kelvin}K (${shift})` : w.mode ? `${String(w.mode).toUpperCase()} (${shift})` : null;
  const simple: [string, string | number | null][] = [
    ["mode", d.mode],
    ["aperture", d.exposure.aperture],
    ["shutter", d.exposure.shutter],
    ["iso", d.exposure.iso],
    ["wb", wb],
    ["awbPriority", d.awbPriority],
    ["focus", d.focus],
    ["focusArea", d.focusArea],
    ["metering", d.metering],
    ["facePriority", d.facePriority],
    ["softSkin", d.softSkin],
    ["autoReview", d.autoReview],
    ["flashMode", d.flashMode],
    ["expCompSet", d.expCompSet],
    ["preAF", d.preAF],
    ["steadyShot", d.steadyShot],
    ["eFrontCurtain", d.eFrontCurtain],
    ["liveView", d.liveView],
    ["ppOn", d.pp_selected === 0 ? T.off : `PP${d.pp_selected}`],
  ];
  const rows: Row[] = simple.map(([key, value]) => ({ key, name: label[key] ?? key, value: typeof value === "string" ? (VALUE_LABELS[key]?.[value] ?? value) : value }));
  if (d.pp_selected === 1) {
    for (const f of PP_FIELDS) rows.push({ key: `pp.${f.key}`, name: f.label, value: d.pp1[f.key] ?? null });
  }
  return rows;
}

function Body({ item, onUse }: { item: Item; onUse?: (r: SlotImport) => void }) {
  const r = item.result;
  if (r.kind === "unsupported") return <p className="text-footnote text-danger">{T.unsupported}</p>;
  if (r.kind === "zve10") {
    const slot = item.slot;
    return (
      <>
        {r.readOnly && <p className="rounded-control bg-fill p-3 text-footnote text-label">{T.movieNote}</p>}
        {slot && onUse && (
          <button type="button" onClick={() => onUse(slot)} className="h-11 rounded-control bg-fill px-4 text-callout font-semibold text-label">
            {T.useSlot}
          </button>
        )}
        <Rows rows={zveRows(r.decoded)} />
        {slot && onUse && <SkippedNote skipped={slot.skipped} />}
      </>
    );
  }
  if (r.kind === "a6400") {
    return (
      <>
        <p className="rounded-control bg-fill p-3 text-footnote text-label">{T.a6400Note}</p>
        <Rows rows={Object.entries(r.decoded.fields).map(([key, f]) => ({ key, name: label[key] ?? key, value: f.value, unconfirmed: f.value !== null && !f.confirmed }))} />
      </>
    );
  }
  if (r.kind === "a7c2") {
    const confirmed: Record<string, { confirmed: readonly string[] }> = A7C2_SETTINGS;
    return (
      <>
        <p className="rounded-control bg-fill p-3 text-footnote text-label">{T.a7c2Note}</p>
        <Rows
          rows={Object.entries(r.settings).map(([key, value]) => ({
            key,
            name: label[key] ?? key,
            value: value ?? null,
            unconfirmed: !!value && !confirmed[key]?.confirmed.includes(value),
          }))}
        />
      </>
    );
  }
  return null;
}

// Đọc file .DAT đã lưu trên máy: chỉ đọc, không ghi file. Ảnh ZV-E10 nạp được vào ô đang sửa qua onUse.
export function DatImport({ onUse }: { onUse?: (r: SlotImport) => void }) {
  const id = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    const next = await Promise.all(
      files.map(async (file): Promise<Item> => {
        let bytes: Uint8Array;
        try {
          bytes = new Uint8Array(await file.arrayBuffer());
        } catch {
          return { name: file.name, result: { kind: "unknown", error: `${file.name}: ${T.readError}` } };
        }
        const result = importDat(bytes, file.name);
        const slot = result.kind === "zve10" && !result.readOnly ? toSlotSettings(result.decoded) : undefined;
        return { name: file.name, result, slot };
      })
    );
    setItems(next);
    setBusy(false);
  }

  return (
    <div>
      <input id={id} type="file" accept=".DAT" multiple disabled={busy} onChange={pick} className="peer sr-only" />
      <label
        htmlFor={id}
        className="inline-flex h-11 cursor-pointer items-center rounded-control bg-fill px-4 text-callout font-semibold text-label peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
      >
        {busy ? T.reading : T.pick}
      </label>
      {items.length > 0 && (
        <ul className="mt-3 space-y-3">
          {items.map((item, i) => (
            <li key={i} className="space-y-3 rounded-card bg-card p-4 shadow-card">
              {item.result.kind === "unknown" ? (
                <p className="break-all text-footnote text-danger">{item.result.error}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-auto min-w-0 break-all text-subhead font-semibold">{item.name}</span>
                    {badgesOf(item).map((b) => (
                      <span key={b} className="rounded-badge bg-fill px-2 py-0.5 text-footnote text-label">
                        {b}
                      </span>
                    ))}
                  </div>
                  <Body item={item} onUse={onUse} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
