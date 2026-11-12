import Link from "next/link";
import { cameraModels, sonyBodies, alphaConsole as C, kolSets, presetConsole } from "@/app/content";
import { UseModelButton } from "./ModelPicker";
import { SaveSetButton } from "./PresetSets";
import { PresetSetActions } from "./PresetSetActions";
import { summaryRows } from "@/lib/presetSummary";
import type { PresetSet } from "@/lib/presetSets";

// Không có hook: dùng được cả trên server (/bo-m1-m4/[id] của repo) lẫn client (bộ KOL, xem RemoteSetView).
const decoded = new Set(sonyBodies.filter((b) => b.decoded).map((b) => b.id));
const notDecoded = cameraModels.filter((m) => !decoded.has(m.id));
const heading = "mb-1.5 px-4 text-footnote font-medium text-secondary";
const card = "overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator";

/** Nội dung một bộ: mô tả, tác giả (mở /kol/<handle>), sưu tầm, cài đặt từng ô, tải và dùng (chỉ ZV-E10). */
export function SetDetail({ set }: { set: PresetSet }) {
  return (
    <section aria-labelledby="set-heading" className="mt-4 max-w-xl">
      <h1 id="set-heading" className="mb-6 text-title font-normal">{set.name}</h1>

      <div className={card}>
        <p className="px-4 py-3 text-body text-label">{set.description}</p>
        {set.author && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            {set.author.avatar ? (
              <img src={set.author.avatar} alt="" width={48} height={48} referrerPolicy="no-referrer" className="size-12 shrink-0 rounded-full bg-fill object-cover" />
            ) : (
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-fill text-title3 font-normal text-label">
                {set.author.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <Link href={`/kol/${set.author.handle}`} className="inline-flex min-h-11 min-w-0 flex-1 flex-wrap items-center gap-x-2 text-body font-semibold text-label transition-colors hover:text-accent-text">
              {set.author.name} <span className="text-footnote font-normal text-secondary">@{set.author.handle}</span>
            </Link>
            {set.author.link && (
              <a href={set.author.link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-11 items-center text-subhead font-semibold text-accent-text underline underline-offset-2 hover:opacity-75">
                {kolSets.authorLink}
              </a>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
          <SaveSetButton id={set.id} />
        </div>
      </div>

      <h2 className={`${heading} mt-6`}>{kolSets.slots}</h2>
      <div className={card}>
        {set.slots.map((slot, i) => (
          <details key={i} open={i === 0} className="disclosure group px-4 py-3">
            <summary className="flex min-h-11 cursor-pointer items-center gap-3">
              <span className="shrink-0 text-footnote font-medium text-secondary">{kolSets.slotName(i + 1)}</span>
              <span className="min-w-0 flex-1 text-body font-semibold text-label">{slot.label}</span>
              <svg className="size-4 shrink-0 text-tertiary transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            {slot.note && <p className="mt-2 rounded-control bg-fill px-3 py-2.5 text-footnote text-label">{slot.note}</p>}
            <dl className="mt-2 space-y-1 text-footnote">
              {summaryRows(slot.settings, presetConsole.summary).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-secondary">{k}</dt>
                  <dd className="text-right text-label tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>

      <section data-model-only={[...decoded].join(" ")} className="mt-6">
        <PresetSetActions set={set} />
      </section>
      {notDecoded.map((m) => (
        <section key={m.id} data-model-only={m.id} className="mt-6 max-w-xl rounded-card bg-card p-4 shadow-card sm:p-5">
          <p className="text-body text-secondary text-pretty">{kolSets.onlyZve10}</p>
          <div className="mt-4">
            <UseModelButton id="zve10">{C.notDecoded.useZve10}</UseModelButton>
          </div>
        </section>
      ))}
    </section>
  );
}
