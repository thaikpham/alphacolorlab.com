import type { Metadata } from "next";
import { kolSets, alphaConsole as C } from "@/app/content";
import { BackLink } from "@/app/components/BackLink";
import { PresetSetList } from "@/app/components/PresetSetList";
import { validatePresetSets } from "@/lib/presetSets";
import presetSetsJson from "@/data/preset-sets.json";
import { SITE_URL } from "@/lib/site";

const SETS = validatePresetSets(presetSetsJson);

export const metadata: Metadata = {
  title: kolSets.title,
  alternates: { canonical: `${SITE_URL}/bo-m1-m4` },
};

export default function SharedSetsPage() {
  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <BackLink href="/console">{C.back}</BackLink>
      <section aria-labelledby="sets-heading" className="mt-4 max-w-xl">
        <h1 id="sets-heading" className="mb-6 text-title font-normal">{kolSets.title}</h1>
        <PresetSetList sets={SETS} />
      </section>
    </div>
  );
}
