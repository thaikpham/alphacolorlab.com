"use client";

import { useMemo } from "react";
import { kol } from "@/app/content";
import type { PresetAuthor, PresetSet } from "@/lib/presetSets";
import { useKolProfile, useRemoteSets } from "@/lib/kol";
import { KolView } from "./KolView";

/** Trang KOL. Dữ liệu repo (tác giả và bộ) hiện ngay, và là dữ liệu dự phòng khi đang tải hoặc tải lỗi. Hồ sơ từ xa, nếu có, thay thế tác giả repo; bộ từ xa được gộp sau bộ repo, id trùng thì giữ bản repo. Không có tác giả repo lẫn hồ sơ từ xa thì hiện một dòng chữ. */
export function RemoteKolView({ handle, author, repoSets, repoIds }: { handle: string; author: PresetAuthor | null; repoSets: PresetSet[]; repoIds: string[] }) {
  const remote = useKolProfile(handle);
  const taken = useMemo(() => new Set(repoIds), [repoIds]);
  const remoteSets = useRemoteSets(taken).filter((s) => s.author.handle === handle);
  const profile = remote ?? author;
  if (!profile) return <p className="mt-4 max-w-xl text-body text-secondary">{remote === undefined ? kol.loading : kol.notFound}</p>;
  const sets = [...repoSets, ...remoteSets.filter((s) => !taken.has(s.id))];
  return <KolView profile={profile} sets={sets} />;
}
