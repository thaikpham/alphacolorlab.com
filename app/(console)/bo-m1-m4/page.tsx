import type { Metadata } from "next";
import { cameraModels, sonyBodies, kolSets, alphaConsole as C } from "@/app/content";
import { BackLink } from "@/app/components/BackLink";
import { PresetSetList } from "@/app/components/PresetSetList";
import { UseModelButton } from "@/app/components/ModelPicker";
import { validatePresetSets } from "@/lib/presetSets";
import presetSetsJson from "@/data/preset-sets.json";
import { SITE_URL } from "@/lib/site";

const SETS = validatePresetSets(presetSetsJson);

export const metadata: Metadata = {
  title: kolSets.title,
  alternates: { canonical: `${SITE_URL}/bo-m1-m4` },
};

const decoded = new Set(sonyBodies.filter((b) => b.decoded).map((b) => b.id));
const notDecoded = cameraModels.filter((m) => !decoded.has(m.id));

// Danh sách chỉ cho máy decoded (Công cụ); máy khác thấy thẻ "Công cụ này dùng cho ZV-E10" như /tao-m1-m4.
export default function SharedSetsPage() {
  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <BackLink href="/console">{C.back}</BackLink>
      <section data-model-only={[...decoded].join(" ")} aria-labelledby="sets-heading" className="mt-4 max-w-xl">
        <h1 id="sets-heading" className="mb-6 text-title font-normal">{kolSets.title}</h1>
        <PresetSetList sets={SETS} />
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
