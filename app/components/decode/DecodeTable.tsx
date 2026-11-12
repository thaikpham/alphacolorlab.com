"use client";

// Bảng tham số giải mã. Chỉ import từ app/admin/decode (chỉ dev), không import từ /giai-ma.
import { Fragment, useMemo, useState } from "react";
import { cameraModels, codecSettingLabels, decodeConsole } from "@/app/content";
import { decodeTable } from "@/lib/decode/table";
import type { TableCell, TableRow } from "@/lib/decode/table";
import { ROUNDS_CAP, modelSummary } from "@/lib/decode/matrix";
import type { ModelSummary } from "@/lib/decode/matrix";
import type { LocalFindings, ValueStatus } from "@/lib/decode/status";
import type { GameModel } from "@/lib/game/types";

const VALUE_TONE: Record<ValueStatus, string> = {
  confirmed: "bg-success-fill text-success",
  predicted: "bg-accent/10 text-accent-text",
  pending: "bg-warning-fill text-warning",
  unknown: "bg-fill text-secondary",
};
const STATUSES: ValueStatus[] = ["confirmed", "predicted", "pending", "unknown"];
export const segment = (on: boolean) =>
  `h-11 px-4 rounded-badge text-subhead transition ${on ? "bg-card shadow-thumb font-semibold text-label" : "font-medium text-label hover:bg-fill-strong"}`;

// Cài đặt chỉ có trong codec: nhãn tiếng Việt từ codecSettingLabels; id lạ thì dùng nhãn gốc của hàng
const rowLabel = (row: TableRow) => (!row.inCatalog && codecSettingLabels[row.settingId]) || row.label.vi;

function CellBadge({ cell, name, camera }: { cell: TableCell | null; name: string; camera: string }) {
  const t = decodeConsole.table;
  if (!cell) return <span className="sr-only">{t.absent}</span>;
  if (cell.numeric) {
    const tone = cell.located ? "bg-success-fill text-success" : "bg-fill text-secondary";
    return (
      <>
        <span aria-hidden="true" className={`inline-flex min-w-12 justify-center rounded-badge px-2 py-0.5 font-semibold ${tone}`}>
          {t.scale}
        </span>
        <span className="sr-only">{`${t.where}: ${cell.where ?? t.notLocated}. ${t.observed(cell.observedCount)}`}</span>
      </>
    );
  }
  // Số đếm của ô đã gồm mọi giá trị của hàng chỉ có trong codec (lib/decode/table.ts)
  const total = cell.confirmed + cell.predicted + cell.pending + cell.unknown;
  if (total === 0) return <span className="sr-only">{t.codecOnly}</span>;
  const tone =
    cell.confirmed === total
      ? "bg-success-fill text-success"
      : cell.confirmed > 0 || cell.located
        ? "bg-warning-fill text-warning"
        : "bg-fill text-secondary";
  return (
    <>
      <span aria-hidden="true" className={`inline-flex min-w-12 justify-center rounded-badge px-2 py-0.5 font-semibold tabular-nums ${tone}`}>
        {`${cell.confirmed}/${total}`}
      </span>
      <span className="sr-only">{t.cell(name, camera, cell.confirmed, total)}</span>
    </>
  );
}

const roundsText = (n: number) =>
  n >= ROUNDS_CAP
    ? decodeConsole.strip.roundsUnknown
    : n === 0
      ? decodeConsole.strip.roundsDone
      : decodeConsole.strip.roundsLeft(n);

// Còn thiếu: có máy nào đó mà giá trị trong danh mục chưa đủ xác nhận
const hasMissing = (row: TableRow) =>
  Object.values(row.cells).some((c) => c && !c.numeric && c.predicted + c.pending + c.unknown > 0);

function RowDetail({
  row,
  focused,
  onToggle,
}: {
  row: TableRow;
  focused: boolean;
  onToggle: (settingId: string) => void;
}) {
  const t = decodeConsole.table;
  return (
    <div className="space-y-3 pb-3">
      <div className="grid gap-4 md:grid-cols-3">
        {cameraModels.map((c) => {
          const cell = row.cells[c.id];
          return (
            <div key={c.id} className="min-w-0 space-y-2">
              <p className="text-subhead font-semibold">{c.name}</p>
              {!cell ? (
                <p className="text-footnote text-secondary">{t.absent}</p>
              ) : (
                <>
                  <p className="text-footnote text-secondary">
                    {t.where}: <span className="text-label">{cell.where ?? t.notLocated}</span>
                  </p>
                  {cell.numeric ? (
                    <>
                      <p className="text-footnote text-label">{t.observed(cell.observedCount)}</p>
                      <p className="text-footnote text-secondary">{t.numeric}</p>
                    </>
                  ) : (
                    <ul className="space-y-2">
                      {cell.values.map((v) => (
                        <li key={v.valueId} className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-footnote">
                            <span className="text-label">{v.label.vi}</span>
                            <span className={`rounded-badge px-2 py-0.5 font-medium ${VALUE_TONE[v.status]}`}>{t.legend[v.status]}</span>
                            {v.code !== null && (
                              <span className="text-secondary tabular-nums">{`${decodeConsole.round.codeOf} ${v.code}`}</span>
                            )}
                            {!v.inCatalog && <span className="text-secondary">{t.codecOnly}</span>}
                          </div>
                          {v.evidence.length > 0 && (
                            <p className="break-all text-footnote text-secondary">{v.evidence.join(", ")}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      {row.inCatalog && hasMissing(row) && (
        <button
          type="button"
          aria-pressed={focused}
          onClick={() => onToggle(row.settingId)}
          className={`h-11 px-4 rounded-full text-subhead font-semibold transition-colors ${focused ? "bg-accent/10 text-accent-text" : "bg-fill text-label hover:bg-fill-strong"}`}
        >
          {focused ? t.priorityOn : t.priority}
        </button>
      )}
    </div>
  );
}

export function DecodeTable({
  local,
  focus,
  onToggleFocus,
  current,
}: {
  local: LocalFindings;
  focus: string[];
  onToggleFocus: (settingId: string) => void;
  current: GameModel;
}) {
  const t = decodeConsole.table;
  const [filter, setFilter] = useState<"all" | "missing">("all");
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => decodeTable(local), [local]);
  const summaries = useMemo(
    () => Object.fromEntries(cameraModels.map((c) => [c.id, modelSummary(c.id, local)])) as Record<GameModel, ModelSummary>,
    [local]
  );
  const visible = filter === "missing" ? rows.filter(hasMissing) : rows;

  return (
    <section aria-labelledby="decode-table" className="rounded-card bg-card p-4 shadow-card sm:p-5">
      <h2 id="decode-table" className="text-subhead font-semibold">{t.title}</h2>
      <ul className="mt-3 divide-y divide-separator">
        {cameraModels.map((c) => {
          const s = summaries[c.id];
          return (
            <li key={c.id} aria-current={c.id === current ? "true" : undefined} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
              <span className={`text-subhead ${c.id === current ? "font-semibold" : ""}`}>{c.name}</span>
              <span className="text-footnote text-secondary tabular-nums">
                {[
                  decodeConsole.strip.confirmed(s.confirmed, s.values),
                  decodeConsole.strip.located(s.located, s.settings),
                  roundsText(s.roundsLeft),
                ].join(", ")}
              </span>
            </li>
          );
        })}
      </ul>

      <div role="group" aria-label={t.title} className="mt-2 inline-flex rounded-control bg-fill p-1">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={segment(filter === "all")}>
          {t.all}
        </button>
        <button type="button" aria-pressed={filter === "missing"} onClick={() => setFilter("missing")} className={segment(filter === "missing")}>
          {t.missing}
        </button>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["done", "bg-success-fill text-success"],
            ["partial", "bg-warning-fill text-warning"],
            ["none", "bg-fill text-secondary"],
          ] as const
        ).map(([k, tone]) => (
          <li key={k} className={`rounded-badge px-2 py-0.5 text-footnote font-medium ${tone}`}>
            {t.cellLegend[k]}
          </li>
        ))}
      </ul>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-footnote">
          <thead>
            <tr className="text-secondary">
              <th scope="col" className="py-2 pr-2 text-left font-medium">{t.setting}</th>
              {cameraModels.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  aria-current={c.id === current ? "true" : undefined}
                  className={`px-1 py-2 text-center ${c.id === current ? "font-semibold text-label" : "font-medium"}`}
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {visible.map((row) => {
              const isOpen = open === row.settingId;
              const hintId = `decode-row-${row.settingId}-hint`;
              return (
                <Fragment key={row.settingId}>
                  <tr>
                    <th scope="row" className="py-1 pr-2 text-left font-normal">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-describedby={hintId}
                        onClick={() => setOpen(isOpen ? null : row.settingId)}
                        className="min-h-11 w-full text-left text-callout text-label"
                      >
                        {rowLabel(row)}
                      </button>
                      <span id={hintId} hidden>{t.detailsOf(rowLabel(row))}</span>
                    </th>
                    {cameraModels.map((c) => (
                      <td key={c.id} className="px-1 py-1 text-center align-middle">
                        <CellBadge cell={row.cells[c.id]} name={rowLabel(row)} camera={c.name} />
                      </td>
                    ))}
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={4} className="pb-3">
                        <RowDetail row={row} focused={focus.includes(row.settingId)} onToggle={onToggleFocus} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && <p className="py-3 text-footnote text-secondary">{t.noMissing}</p>}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <li key={s} className={`rounded-badge px-2 py-0.5 text-footnote font-medium ${VALUE_TONE[s]}`}>
            {t.legend[s]}
          </li>
        ))}
      </ul>
    </section>
  );
}
