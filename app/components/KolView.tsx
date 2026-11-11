import Link from "next/link";
import { kol, kolSets } from "@/app/content";
import type { PresetSet } from "@/lib/presetSets";
import { PhotoGrid } from "./PhotoGrid";
import { SaveSetButton } from "./PresetSets";

const card = "overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator";
const heading = "mb-1.5 px-4 text-footnote font-medium text-secondary";

/** Thông tin KOL để hiển thị. Chỉ có trường nào thì hiện trường đó: bộ trong repo không có tiểu sử, ảnh bìa hay ảnh mẫu. */
export type KolLike = { handle: string; name: string; bio?: string; link?: string; avatar?: string; cover?: string; photos?: string[] };

/** Trang KOL: ảnh bìa (nếu có), hồ sơ, bộ M1–M4 công khai (sưu tầm được), ảnh mẫu. Không có hook nên dùng được cả trên server lẫn client. */
export function KolView({ profile, sets }: { profile: KolLike; sets: PresetSet[] }) {
  const { handle, name, bio, link, avatar, cover, photos = [] } = profile;
  return (
    <article aria-labelledby="kol-name" className="mt-4 max-w-xl">
      {cover && <img src={cover} alt="" className="aspect-[3/1] w-full rounded-card bg-fill object-cover" />}

      <div className={`${cover ? "mt-4 " : ""}${card}`}>
        <div className="flex items-center gap-4 px-4 py-4">
          {avatar ? (
            <img src={avatar} alt="" width={64} height={64} referrerPolicy="no-referrer" className="size-16 shrink-0 rounded-full bg-fill object-cover" />
          ) : (
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-full bg-fill text-title3 font-normal text-label">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <h1 id="kol-name" className="min-w-0 text-title font-normal">
            {name} <span className="text-footnote font-normal text-secondary">@{handle}</span>
          </h1>
        </div>
        {bio && <p className="px-4 py-3 text-body text-label">{bio}</p>}
        {link && (
          <div className="px-4 py-2">
            <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-11 items-center text-subhead font-semibold text-accent-text underline underline-offset-2 hover:opacity-75">
              {kolSets.authorLink}
            </a>
          </div>
        )}
      </div>

      <h2 className={`${heading} mt-6`}>{kol.sets}</h2>
      {sets.length > 0 ? (
        <ul className={card}>
          {sets.map((s) => (
            <li key={s.id} className="flex items-center gap-2 pr-3">
              <Link href={`/bo-m1-m4/${s.id}`} className="flex min-h-11 flex-1 items-center px-4 py-2.5 text-body text-label transition-colors hover:bg-fill">
                {s.name}
              </Link>
              <SaveSetButton id={s.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 text-body text-secondary">{kol.noSets}</p>
      )}

      {photos.length > 0 && (
        <>
          <h2 className={`${heading} mt-6`}>{kol.photos}</h2>
          <PhotoGrid photos={photos} name={name} />
        </>
      )}
    </article>
  );
}
