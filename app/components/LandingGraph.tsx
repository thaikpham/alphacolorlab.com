"use client";

import { useEffect, useRef, useState } from "react";
import { constellation, landing } from "@/app/content";
import type { CGraph } from "@/lib/constellation";
import { MineConstellation } from "./MineConstellation";
import { SearchField } from "./SearchField";
import { EnterLink } from "./EnterLink";
import { AccountButton } from "./AccountButton";

/** Đồ thị tổng hợp của landing, nằm nền suốt flow 3 bước (LandingFlow). Bước 1 và 2: zoom gần làm nền (1.3³), mọi nút điều khiển ẩn
 * (.graph-legend). Bước 3 (`active`): vừa khung, đã lọc theo túi đồ; góc trên trái là chú giải 4 app,
 * góc trên phải là kính lúp (mở ô tìm ngay bên dưới; ô tìm duy nhất của trang vì landing không có thanh điều hướng) và nút chế độ xem,
 * sát mép phải là nút avatar mở menu người dùng (AccountButton), góc dưới phải là nút cam vào dự án (EnterLink, vào app đang chọn ở chú giải). */
export function LandingGraph({ graph, active }: { graph: CGraph; active: boolean }) {
  const [searching, setSearching] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  // Chưa tới bước đồ thị thì đồ thị chỉ làm nền (zoom gần); tới bước đồ thị thì lùi về vừa khung
  const zoom = active ? 1 : 1.3 ** 3;
  // Mở ô tìm thì đưa con trỏ vào luôn
  useEffect(() => {
    if (searching) field.current?.querySelector("input")?.focus({ preventScroll: true });
  }, [searching]);

  const searchButton = (
    <button type="button" aria-label={constellation.openSearch} aria-expanded={searching} onClick={() => setSearching(!searching)} className="group grid size-11 place-items-center rounded-full text-label">
      <span className={`grid size-8 place-items-center rounded-full shadow-thumb transition-colors group-hover:bg-fill group-active:bg-fill-strong ${searching ? "bg-fill-strong" : "bg-card"}`}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="7" cy="7" r="4.75" />
          <path d="M10.5 10.5l3 3" />
        </svg>
      </span>
    </button>
  );

  return (
    <div className="relative h-full">
      <MineConstellation graph={graph} title={landing.graphLabel} controls={false} zoom={zoom} legend legendAction={(app) => <EnterLink app={app} />} tools={searchButton} quietLabels preview />
      {/* Nút avatar và menu người dùng (hồ sơ, Danh sách/Lưới, Của tôi/Tất cả, đăng xuất): sát góc trên phải, bên phải kính lúp và nút chế độ xem */}
      <div className="graph-legend absolute top-2 right-2 z-20 rounded-full bg-card shadow-thumb transition-opacity duration-300 ease-ios md:top-4 md:right-4">
        <AccountButton previewPersonal />
      </div>
      {searching && (
        <div
          ref={field}
          onKeyDown={(e) => e.key === "Escape" && setSearching(false)}
          className="graph-legend absolute inset-x-4 top-44 z-10 flex justify-end transition-opacity duration-300 ease-ios sm:top-20 sm:left-auto sm:w-80"
        >
          <SearchField />
        </div>
      )}
    </div>
  );
}
