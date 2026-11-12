"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { access, cameraModels, nav, type ModelId } from "@/app/content";
import type { AppId } from "@/lib/constellation";
import { entryModel, useGear } from "@/lib/gear";
import { setPersonal } from "@/lib/usePersonal";

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

/** Nút cam vào dự án ở màn đồ thị của landing, cạnh cụm 4 app (chú giải). Đích là app đang xem ở chú giải (`app`), chưa chọn
 * app nào thì Alpha Console (vào thẳng máy được hướng dẫn nếu túi có, `/console?model=`). Túi đồ đã lưu có món: chữ là
 * "Tối ưu nội dung và Truy cập", bấm thì bật cá nhân hóa theo túi đồ (lib/usePersonal). Túi trống: "Mở <app>", hoặc
 * "Tiếp tục với <máy>" cho người quay lại, "Mở Alpha Console" cho người mới. */
export function EnterLink({ app = null }: { app?: AppId | null }) {
  const bag = useGear();
  const model = useSyncExternalStore<ModelId | null>(subscribe, stored, () => null);
  const entry = entryModel(bag, model);
  const hasGear = bag.body.length + bag.lens.length + bag.acc.length > 0;
  const name = entry && cameraModels.find((m) => m.id === entry.model)!.name;
  return (
    <Link
      href={app && app !== "console" ? `/${app}` : entry?.fromBag ? `/console?model=${entry.model}` : "/console"}
      onClick={() => hasGear && setPersonal(true)}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-callout font-semibold text-on-accent transition-colors hover:bg-accent/90"
    >
      {hasGear ? access.optimize : app ? access.open(nav.apps.find((a) => a.href === `/${app}`)!.label) : entry ? access.resume(name!) : access.enter}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8h10M9 4.5L12.5 8 9 11.5" />
      </svg>
    </Link>
  );
}
