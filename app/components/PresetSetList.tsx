import { kolSets } from "@/app/content";
import { listedSets, type PresetSet } from "@/lib/presetSets";
import { KolSetGroups, SetRow } from "./PresetSets";

/**
 * Danh sách bộ chia sẻ, bộ KOL lên trước: mục "Bộ từ KOL" tải sau ở KolSetGroups; mục "Bộ có sẵn" là bộ trong repo đã công khai,
 * render trên server nên có sẵn trong HTML. Bộ unlisted không hiện nhưng id vẫn bị chiếm (taken lấy từ mọi bộ). Dùng ở /bo-m1-m4 và cột phải của /console.
 */
export function PresetSetList({ sets }: { sets: PresetSet[] }) {
  const listed = listedSets(sets);
  return (
    <div className="flex flex-col gap-6">
      <KolSetGroups taken={sets.map((s) => s.id)} hasListed={listed.length > 0} />
      {listed.length > 0 && (
        <section aria-labelledby="site-sets-title">
          <h2 id="site-sets-title" className="text-title3 font-medium">
            {kolSets.fromSite}
          </h2>
          <ul className="mt-3 overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
            {listed.map((set) => (
              <SetRow key={set.id} id={set.id} name={set.name} byline={set.author?.name} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
