"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cameraModels, consoleHashRoutes, type ModelId } from "@/app/content";
import { setModel } from "@/lib/model";

/** Link cũ trỏ vào trang chủ khi Alpha Console còn ở "/": "/?model=a6400" và "/#tao-preset"… chuyển sang Alpha Console. */
export function LegacyHomeLinks() {
  const router = useRouter();
  useEffect(() => {
    const url = new URL(location.href);
    const m = url.searchParams.get("model");
    const to = consoleHashRoutes[url.hash.slice(1)];
    if (m !== null && cameraModels.some((c) => c.id === m)) setModel(m as ModelId);
    if (to) router.replace(to);
    else if (m !== null) router.replace("/console");
  }, [router]);
  return null;
}
