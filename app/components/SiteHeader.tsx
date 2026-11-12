"use client";

import { usePathname } from "next/navigation";
import { useWideBrowse } from "@/lib/indexView";
import { AppNav } from "./AppNav";

/** Thanh trên cùng dưới lg; landing ("/") không có. Từ lg tìm kiếm và avatar nằm trong thanh dọc AppSidebar,
 * trừ Blog và Wiki ở Lưới (`wide`): thanh này hiện cả từ lg (`site-nav-wide`, CSS trong globals.css). */
export function SiteHeader() {
  const pathname = usePathname();
  const wide = useWideBrowse(pathname);
  if (pathname === "/") return null;
  return (
    <header className={`site-nav sticky top-0 z-50 ${wide ? "site-nav-wide" : "lg:hidden"} bg-card/80 backdrop-blur-2xl border-b border-separator`}>
      <AppNav />
    </header>
  );
}
