"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { access, cameraModels, type ModelId } from "@/app/content";
import { entryModel, useGear } from "@/lib/gear";

const KEY = "camera-model";
function subscribe(f: () => void) {
  addEventListener("storage", f);
  addEventListener(KEY, f);
  return () => {
    removeEventListener("storage", f);
    removeEventListener(KEY, f);
  };
}
// Máy người dùng đã tự chọn (có trong localStorage); lib/model trả mặc định ZV-E10 nên không phân biệt được người mới
const stored = () => cameraModels.find((m) => m.id === localStorage.getItem(KEY))?.id ?? null;

/** Nút cam vào dự án ở landing (lớp giới thiệu và dưới danh sách 4 app, hai màn khác nhau). Người mới: "Mở Alpha Console".
 * Túi đồ có máy được hướng dẫn: "Cài <máy>", vào thẳng máy đó (`/console?model=`). Người quay lại: "Tiếp tục với <máy>". */
export function EnterLink() {
  const bag = useGear();
  const model = useSyncExternalStore<ModelId | null>(subscribe, stored, () => null);
  const entry = entryModel(bag, model);
  const name = entry && cameraModels.find((m) => m.id === entry.model)!.name;
  return (
    <Link
      href={entry?.fromBag ? `/console?model=${entry.model}` : "/console"}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-callout font-semibold text-on-accent transition-colors hover:bg-accent/90"
    >
      {!entry ? access.enter : entry.fromBag ? access.setup(name!) : access.resume(name!)}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8h10M9 4.5L12.5 8 9 11.5" />
      </svg>
    </Link>
  );
}
