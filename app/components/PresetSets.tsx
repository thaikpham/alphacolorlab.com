"use client";

import { useMemo } from "react";
import Link from "next/link";
import { kolSets } from "@/app/content";
import { useRemoteSetList, type RemoteSet } from "@/lib/kol";
import { readSaved, toggleSaved, useSavedSets, writeSaved } from "@/lib/savedSets";
import { Avatar } from "./ProfileShell";

/** Sưu tầm hoặc bỏ sưu tầm một bộ trên máy này (đăng nhập thì đồng bộ theo tài khoản). */
export function SaveSetButton({ id }: { id: string }) {
  const saved = useSavedSets().includes(id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => writeSaved(toggleSaved(readSaved(), id))}
      className={`inline-flex h-11 shrink-0 items-center rounded-full px-5 text-subhead font-semibold text-label transition-colors ${saved ? "bg-fill-strong" : "bg-fill hover:bg-fill-strong"}`}
    >
      {saved ? kolSets.saved : kolSets.save}
    </button>
  );
}

/** Một dòng bộ: tên, mở trang bộ, nút ở cuối (mặc định sưu tầm). byline: tên tác giả (bộ trong repo); bộ KOL đã nằm dưới tiêu đề tác giả. action: nút thay thế (trang tài khoản: bỏ sưu tầm). */
export function SetRow({ id, name, byline, action }: { id: string; name: string; byline?: string; action?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 pr-3">
      <Link href={`/bo-m1-m4/${id}`} className="flex min-h-11 flex-1 items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-fill">
        <span className="min-w-0 text-body text-label">{name}</span>
        {byline && <span className="shrink-0 text-footnote text-secondary">{byline}</span>}
      </Link>
      {action ?? <SaveSetButton id={id} />}
    </li>
  );
}

/** Một bộ KOL: ảnh tác giả, tên bộ (mở bộ), tên KOL (mở trang KOL, ẩn dưới sm), nút sưu tầm. Các link đứng cạnh nhau, không lồng trong nhau. */
function KolSetRow({ set }: { set: RemoteSet }) {
  return (
    <li className="flex items-center gap-3 pr-3">
      <Avatar name={set.author.name} src={set.author.avatar ?? null} className="ml-4 size-11 shrink-0" />
      <Link href={`/bo-m1-m4/${set.id}`} className="flex min-h-11 min-w-0 flex-1 items-center py-2.5 transition-colors hover:text-accent-text">
        <span className="truncate text-callout font-semibold text-label">{set.name}</span>
      </Link>
      <Link href={`/kol/${set.author.handle}`} className="hidden min-h-11 shrink-0 items-center text-subhead text-secondary transition-colors hover:text-label sm:flex">
        {set.author.name}
      </Link>
      <SaveSetButton id={set.id} />
    </li>
  );
}

/**
 * Bộ KOL đã công khai, mới nhất trước, một danh sách phẳng (mỗi KOL một bộ; bản cũ có nhiều bộ thì hiện hết). Tải sau khi trang mở.
 * Đang tải thì giữ chỗ bằng một hàng xám; tải xong không có bộ thì ẩn cả mục. taken: id mọi bộ trong repo (kể cả unlisted, vẫn bị chiếm).
 * hasListed: danh sách repo có bộ đang hiện. Không có bộ nào ở cả hai nguồn sau khi tải thì hiện một dòng chữ.
 */
export function KolSetGroups({ taken, hasListed }: { taken: string[]; hasListed: boolean }) {
  const takenIds = useMemo(() => new Set(taken), [taken]);
  const remote = useRemoteSetList(takenIds);
  if (remote && remote.length === 0) return hasListed ? null : <p className="text-body text-secondary">{kolSets.empty}</p>;
  return (
    <section aria-labelledby="kol-sets-title">
      <h2 id="kol-sets-title" className="text-title3 font-medium">
        {kolSets.fromKol}
      </h2>
      <ul className="mt-3 overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
        {remote === undefined ? (
          <li className="px-4 py-2.5">
            <span aria-hidden="true" className="block h-11 rounded-control bg-fill" />
          </li>
        ) : (
          remote.map((set) => <KolSetRow key={set.id} set={set} />)
        )}
      </ul>
    </section>
  );
}
