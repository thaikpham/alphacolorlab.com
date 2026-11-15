"use client";

import { kolSets } from "@/app/content";
import { useRemoteSet } from "@/lib/kol";
import { SetDetail } from "./SetDetail";

/** Bộ KOL không nằm trong repo: tải theo id trên trình duyệt. Đang tải hoặc không có thì hiện một dòng chữ. */
export function RemoteSetView({ id }: { id: string }) {
  const set = useRemoteSet(id);
  // Đang tải hoặc không có: h1 ẩn để trang vẫn có đúng một h1 (SetDetail tự có h1)
  if (set === undefined) return <><h1 className="sr-only">{kolSets.title}</h1><p className="mt-4 max-w-xl text-body text-secondary">{kolSets.loading}</p></>;
  if (set === null) return <><h1 className="sr-only">{kolSets.title}</h1><p className="mt-4 max-w-xl text-body text-secondary">{kolSets.notFound}</p></>;
  return <SetDetail set={set} />;
}
