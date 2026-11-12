"use client";

import { useEffect, useMemo } from "react";
import { kol, kolSets } from "@/app/content";
import type { PresetAuthor, PresetSet } from "@/lib/presetSets";
import { useKolProfile, useRemoteSets } from "@/lib/kol";
import { BackLink } from "./BackLink";
import { KolView } from "./KolView";
import { ProfileShell } from "./ProfileShell";

/** Trang KOL. Dữ liệu repo (tác giả và bộ) hiện ngay, và là dữ liệu dự phòng khi đang tải hoặc tải lỗi. Hồ sơ từ xa, nếu có, thay thế tác giả repo; bộ từ xa được gộp sau bộ repo, id trùng thì giữ bản repo. Không có tác giả repo lẫn hồ sơ từ xa thì hiện một dòng chữ. Tiêu đề trang theo tên KOL. */
export function RemoteKolView({ handle, author, repoSets, repoIds }: { handle: string; author: PresetAuthor | null; repoSets: PresetSet[]; repoIds: string[] }) {
  const remote = useKolProfile(handle);
  const taken = useMemo(() => new Set(repoIds), [repoIds]);
  const remoteSets = useRemoteSets(taken).filter((s) => s.author.handle === handle);
  const profile = remote ?? author;
  const name = profile?.name;
  useEffect(() => {
    if (name) document.title = kol.title(name);
  }, [name]);
  const back = <BackLink href="/bo-m1-m4">{kolSets.title}</BackLink>;
  if (!profile)
    return (
      <ProfileShell lead={back}>
        <p className="text-body text-secondary">{remote === undefined ? kol.loading : kol.notFound}</p>
      </ProfileShell>
    );
  const sets = [...repoSets, ...remoteSets.filter((s) => !taken.has(s.id))];
  return <KolView profile={profile} sets={sets} lead={back} />;
}
