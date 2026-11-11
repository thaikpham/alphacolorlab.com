import type { Metadata } from "next";
import { kolSets } from "@/app/content";
import { BackLink } from "@/app/components/BackLink";
import { SetDetail } from "@/app/components/SetDetail";
import { RemoteSetView } from "@/app/components/RemoteSetView";
import { listedSets, validatePresetSets } from "@/lib/presetSets";
import presetSetsJson from "@/data/preset-sets.json";
import { SITE_URL } from "@/lib/site";

const SETS = validatePresetSets(presetSetsJson);
// Bộ ẩn (unlisted) không mở được; id của mọi bộ repo vẫn được giữ để bộ KOL không dùng lại
const LISTED = listedSets(SETS);
const REPO_IDS: ReadonlySet<string> = new Set(SETS.map((s) => s.id));
// Không có generateStaticParams: danh sách bộ công khai có thể rỗng mà Cache Components không cho rỗng. instant = false cho trang chờ khi render theo yêu cầu.
export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const set = LISTED.find((s) => s.id === id);
  if (!set) return { title: kolSets.title, robots: { index: false } };
  return { title: set.name, description: kolSets.description(set.name), alternates: { canonical: `${SITE_URL}/bo-m1-m4/${set.id}` } };
}

// Bộ công khai trong repo mở tại đây; id khác (bộ KOL) tải trên trình duyệt và không được lập chỉ mục.
// Id của bộ repo ẩn không đi qua bộ KOL: hiện đúng dòng "không tìm thấy" như id lạ.
export default async function SharedSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = LISTED.find((s) => s.id === id);

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <BackLink href="/bo-m1-m4">{kolSets.title}</BackLink>
      {set ? <SetDetail set={set} /> : REPO_IDS.has(id) ? <p className="mt-4 text-body text-secondary">{kolSets.notFound}</p> : <RemoteSetView id={id} />}
    </div>
  );
}
