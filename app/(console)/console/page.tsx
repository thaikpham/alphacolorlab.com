import type { Metadata } from "next";
import { hero, appInfo, seo, kolSets } from "@/app/content";
import { PresetSetList } from "@/app/components/PresetSetList";
import { validatePresetSets } from "@/lib/presetSets";
import presetSetsJson from "@/data/preset-sets.json";
import { SITE_URL } from "@/lib/site";

const SETS = validatePresetSets(presetSetsJson);

export const metadata: Metadata = {
  title: seo.homeTitle,
  description: appInfo.description,
  alternates: { canonical: `${SITE_URL}/console` },
};

// Chưa chọn gì: cột phải hiện danh sách bộ chia sẻ (md+; h1 chỉ cho trình đọc màn hình). Điện thoại thấy header + index của layout.
export default function ConsoleHome() {
  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <h1 className="sr-only">{hero.title}</h1>
      <section aria-labelledby="console-shared-heading" className="max-w-xl">
        <h2 id="console-shared-heading" className="mb-1.5 text-footnote font-medium text-secondary">{kolSets.title}</h2>
        <PresetSetList sets={SETS} />
      </section>
    </div>
  );
}
