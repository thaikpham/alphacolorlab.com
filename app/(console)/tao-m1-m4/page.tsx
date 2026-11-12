import type { Metadata } from "next";
import { cameraModels, sonyBodies, alphaConsole as C } from "@/app/content";
import { PresetBuilder } from "@/app/components/PresetBuilder";
import { UseModelButton } from "@/app/components/ModelPicker";
import { BackLink } from "@/app/components/BackLink";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: C.preset.title,
  description: C.preset.lead,
  alternates: { canonical: `${SITE_URL}/tao-m1-m4` },
};

const decoded = new Set(sonyBodies.filter((b) => b.decoded).map((b) => b.id));
const notDecoded = cameraModels.filter((m) => !decoded.has(m.id));

// Builder stays mounted for every model (hidden by html[data-model]) so a Color Bank handoff (?recipe, ?cart) survives "Tôi dùng ZV-E10".
export default function PresetPage() {
  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <BackLink href="/console">{C.back}</BackLink>
      <section data-model-only={[...decoded].join(" ")} aria-labelledby="preset-heading" className="mt-4">
        <h1 id="preset-heading" className="mb-6 text-title font-normal">{C.preset.title}</h1>
        <PresetBuilder />
      </section>
      {notDecoded.map((m) => (
        <section key={m.id} data-model-only={m.id} className="mt-4 max-w-xl rounded-card bg-card p-4 shadow-card sm:p-5">
          <h1 className="text-title3 font-medium">{C.notDecoded.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <UseModelButton id="zve10">{C.notDecoded.useZve10}</UseModelButton>
          </div>
        </section>
      ))}
    </div>
  );
}
