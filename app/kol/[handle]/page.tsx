import type { Metadata } from "next";
import { kol, kolSets } from "@/app/content";
import { BackLink } from "@/app/components/BackLink";
import { RemoteKolView } from "@/app/components/RemoteKolView";
import { listedSets, validatePresetSets, type PresetAuthor } from "@/lib/presetSets";
import presetSetsJson from "@/data/preset-sets.json";
import { SITE_URL } from "@/lib/site";

const SETS = validatePresetSets(presetSetsJson);
// Bộ ẩn (unlisted) không lên trang KOL nhưng id của chúng vẫn nằm trong REPO_IDS để bộ KOL không trùng
const LISTED = listedSets(SETS);
const REPO_IDS = SETS.map((s) => s.id);
// Tác giả trong repo: chỉ lấy tên, handle, ảnh đại diện và liên kết có trong bộ công khai
const AUTHORS: PresetAuthor[] = LISTED.flatMap((s) => (s.author ? [s.author] : [])).filter(
  (a, i, all) => all.findIndex((b) => b.handle === a.handle) === i,
);

// Không có generateStaticParams: danh sách tác giả có thể rỗng mà Cache Components không cho rỗng. instant = false cho trang chờ khi render theo yêu cầu.
export const instant = false;
// Chỉ tác giả trong repo được lập chỉ mục; KOL khác (dữ liệu từ xa) không có meta riêng
export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const author = AUTHORS.find((a) => a.handle === handle);
  if (!author) return { title: kolSets.title, robots: { index: false } };
  return { title: author.name, description: kol.description(author.name), alternates: { canonical: `${SITE_URL}/kol/${author.handle}` } };
}

export default async function KolPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const author = AUTHORS.find((a) => a.handle === handle);

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <BackLink href="/bo-m1-m4">{kolSets.title}</BackLink>
      <RemoteKolView handle={handle} author={author ?? null} repoSets={LISTED.filter((s) => s.author?.handle === handle)} repoIds={REPO_IDS} />
    </div>
  );
}
