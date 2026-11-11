"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "./AppNav";

/** Thanh trên cùng dưới lg; landing ("/") không có. Từ lg tìm kiếm và avatar nằm trong thanh dọc AppSidebar. */
export function SiteHeader() {
  if (usePathname() === "/") return null;
  return (
    <header className="site-nav sticky top-0 z-50 lg:hidden bg-card/80 backdrop-blur-2xl border-b border-separator">
      <AppNav />
    </header>
  );
}
