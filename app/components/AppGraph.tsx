"use client";

import Link from "next/link";
import type { AppId, CGraph } from "@/lib/constellation";
import { appHome, nav } from "@/app/content";
import { MineConstellation } from "./MineConstellation";

const HOME: Record<AppId, string> = { console: "/console", colors: "/colors", wiki: "/wiki", blog: "/blog" };

/** Sân khấu đồ thị toàn màn hình của một app (/do-thi/[app]). */
export function AppGraph({ app, graph }: { app: AppId; graph: CGraph }) {
  const t = appHome[app];

  const header = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <h1 className="text-title font-normal">{t.title}</h1>
      <Link href={HOME[app]} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-card px-4 text-subhead font-semibold text-label shadow-card transition-colors hover:bg-fill">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M3 4.5h10M3 8h10M3 11.5h10" />
        </svg>
        {appHome.views.list}
      </Link>
    </div>
  );

  return (
    <main className="h-stage-phone lg:h-stage" aria-label={nav.apps.find((a) => a.href === HOME[app])?.label}>
      <MineConstellation graph={graph} title={t.graph} header={header} />
    </main>
  );
}
