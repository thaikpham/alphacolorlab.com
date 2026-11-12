"use client";

import { useEffect, useState } from "react";
import { landing } from "@/app/content";
import type { CGraph } from "@/lib/constellation";
import { MineConstellation } from "./MineConstellation";
import { SearchField } from "./SearchField";

/** Đồ thị tổng hợp của landing (dính nền suốt hai màn đầu). Dưới lớp giới thiệu thì zoom gần làm nền (1.3³);
 * cuộn tới mốc đồ thị thì lùi về vừa khung (màn dọc: 1.3 lần vừa khung) để thấy trọn hình, kèm chú giải màu và ô tìm nút (ô tìm duy nhất của trang,
 * vì landing không có thanh điều hướng). Ô tìm và chú giải ẩn ngoài mốc đồ thị bằng .graph-legend. */
export function LandingGraph({ graph }: { graph: CGraph }) {
  const [zoom, setZoom] = useState(1.3 ** 3);
  useEffect(() => {
    // Màn dọc (điện thoại): vừa khung để lại nhiều khoảng trống trên dưới nên zoom thêm 1.3 lần
    const on = () => setZoom(scrollY <= innerHeight / 2 ? 1.3 ** 3 : innerHeight > innerWidth * 1.3 ? 1.3 : 1);
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
    };
  }, []);
  return (
    <div className="relative h-full">
      <MineConstellation graph={graph} title={landing.graphLabel} controls={false} zoom={zoom} legend quietLabels />
      <div className="graph-legend absolute inset-x-4 top-4 z-10 mx-auto flex max-w-md justify-center transition-opacity duration-300 ease-ios">
        <SearchField />
      </div>
    </div>
  );
}
