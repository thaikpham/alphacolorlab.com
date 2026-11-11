import type { Metadata } from "next";
import { guide, cameraModels, alphaConsole as C, datImport } from "@/app/content";
import { decodeProgress } from "@/lib/decodeProgress";
import { GameDialog } from "@/app/components/game/GameDialog";
import { Status } from "@/app/components/ModelPicker";
import { BackLink } from "@/app/components/BackLink";
import { InfoTip } from "@/app/components/InfoTip";
import { DatImport } from "@/app/components/DatImport";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: C.decodePage.title,
  description: guide.contribute.lead,
  alternates: { canonical: `${SITE_URL}/giai-ma` },
};

function Bar({ id, label, thin }: { id: string; label: string; thin?: boolean }) {
  const d = decodeProgress(id);
  return (
    <div className="flex items-center gap-3">
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={d.percent} className={`${thin ? "h-1.5" : "h-2"} flex-1 overflow-hidden rounded-full bg-fill`}>
        <div className={`h-full rounded-full ${d.state === "decoded" ? "bg-success" : "bg-accent"}`} style={{ width: `${d.percent}%` }} />
      </div>
      <span className="w-10 text-right text-footnote font-semibold tabular-nums">{d.percent}%</span>
    </div>
  );
}

export default function DecodePage() {
  const P = guide.contribute;
  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <BackLink href="/console">{C.back}</BackLink>
      <h1 className="mt-4 mb-8 text-title font-normal">{C.decodePage.title}</h1>
      {/* xl+: progress on the left, mini game on the right */}
      <div className="grid max-w-2xl gap-8 xl:max-w-none xl:grid-cols-2 xl:items-start">
        <div className="space-y-8">

        {/* The selected camera first, then the whole picture */}
        <section aria-labelledby="decode-current" className="rounded-card bg-card p-4 shadow-card sm:p-5">
          {cameraModels.map((m) => {
            const d = decodeProgress(m.id);
            return (
              <div key={m.id} data-model-only={m.id}>
                <div className="flex items-center gap-1.5">
                  <h2 id={m.id === cameraModels[0].id ? "decode-current" : undefined} className="text-subhead font-semibold">{P.title(m.name)}</h2>
                  <InfoTip entry={{ term: P.title(m.name), lines: [{ t: d.state === "none" ? P.basis.none : m.id === "a6400" ? P.basis.experimental(d.done, d.total) : P.basis[d.state](d.done, d.total) }] }} />
                  <span className="ml-auto"><Status id={m.id} /></span>
                </div>
                <div className="mt-3"><Bar id={m.id} label={P.progressLabel(m.name)} /></div>
              </div>
            );
          })}
        </section>

        <section aria-labelledby="decode-all">
          <h2 id="decode-all" className="mb-2 px-4 text-footnote text-secondary">{C.decodePage.all}</h2>
          <ul className="rounded-card bg-card shadow-card divide-y divide-separator">
            {cameraModels.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-16 flex-shrink-0 text-subhead font-semibold">{m.name}</span>
                <div className="min-w-0 flex-1"><Bar id={m.id} label={P.progressLabel(m.name)} thin /></div>
                <Status id={m.id} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="decode-read">
          <div className="mb-2 flex items-center gap-1.5 px-4">
            <h2 id="decode-read" className="text-footnote text-secondary">{datImport.title}</h2>
            <InfoTip entry={datImport.info} />
          </div>
          <DatImport />
        </section>

        </div>

        <section aria-labelledby="decode-game" className="rounded-card bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-1.5">
            <h2 id="decode-game" className="text-subhead font-semibold">{C.decodePage.game}</h2>
            <InfoTip entry={{ term: C.decodePage.game, lines: [{ t: P.lead }] }} />
          </div>
          <div className="mt-4"><GameDialog /></div>
        </section>
      </div>
    </div>
  );
}
