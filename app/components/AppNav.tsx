"use client";

import { useId, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { nav } from "@/app/content";
import { SearchField } from "./SearchField";
import { AccountButton } from "./AccountButton";

const isActive = (pathname: string, match: string[]) =>
  match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

const appColors = {
  "/console": "bg-app-console",
  "/colors": "bg-app-colors",
  "/wiki": "bg-app-wiki",
  "/blog": "bg-app-blog",
};

const LG = "(width >= 64rem)";
/** Từ lg chưa. Tìm kiếm và avatar chỉ mount ở một nơi (thanh trên hoặc thanh dọc): menu avatar có id cố định, đồng bộ tài khoản chạy một lần. */
const useLg = () =>
  useSyncExternalStore(
    (cb) => {
      const m = matchMedia(LG);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(LG).matches,
    () => false,
  );

/** Nút launcher: logo chấm 3×3 (chấm giữa cam) + tên app đang dùng (chưa ở app nào thì tên dự án), bấm bung popover 4 app (chấm màu + tên). */
function Logo({ className }: { className?: string }) {
  const id = useId(); // thanh trên và thanh dọc cùng mount một launcher, id phải khác nhau
  const pathname = usePathname();
  const current = nav.apps.find((app) => isActive(pathname, app.match));
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label={`${nav.tabBarLabel}: ${current?.label ?? nav.siteName}`}
        className={`flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-control px-1 transition-colors hover:bg-fill active:bg-fill-strong ${className ?? ""}`}
      >
        <div className="grid grid-cols-3 gap-0.5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className={`size-1 rounded-full ${i === 4 ? "bg-accent" : "bg-label"}`} />
          ))}
        </div>
        <span className="hidden text-subhead font-semibold text-label sm:inline">{current?.label ?? nav.siteName}</span>
      </button>
      <nav id={id} popover="auto" aria-label={nav.tabBarLabel} className="app-launcher rounded-card border border-separator bg-card p-2 text-label shadow-card">
        {nav.apps.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            aria-current={app === current ? "page" : undefined}
            onClick={(e) => e.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover()}
            className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-subhead font-semibold transition-colors hover:bg-fill ${app === current ? "bg-fill" : ""}`}
          >
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${appColors[app.href as keyof typeof appColors]}`} />
            {app.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

/** Thanh trên cùng (dưới lg; từ lg mọi thứ nằm trong thanh dọc AppSidebar): logo trái, tìm kiếm + avatar phải. */
export function AppNav() {
  const pathname = usePathname();
  if (useLg()) return null;
  return (
    <div className="mx-auto flex h-14 max-w-page items-center gap-1 px-4 sm:px-6 md:gap-4">
      <Logo />
      <div className="ml-auto flex min-w-0 items-center gap-1">
        {pathname !== "/search" && <SearchField />}
        <AccountButton />
      </div>
    </div>
  );
}

/** Thanh điều hướng dọc (từ lg): launcher + avatar, tìm kiếm, cao đúng `h-sidebar-head`.
 * Thanh trong suốt, không nhận chuột (chỉ phần đầu có nền) và nằm trên index (z-50) để gợi ý tìm kiếm không bị che.
 * Phần dưới là index của app đang mở: cột index của SplitLayout cố định ngay dưới (`top-sidebar-head`). Landing không có. */
export function AppSidebar() {
  const pathname = usePathname();
  const lg = useLg();
  if (pathname === "/") return null;
  return (
    <aside className="app-sidebar pointer-events-none fixed inset-y-0 left-0 z-50 hidden w-sidebar border-r border-separator lg:block">
      <div className="pointer-events-auto flex h-sidebar-head flex-col border-b border-separator bg-bg px-3">
      <div className="flex h-14 shrink-0 items-center justify-between">
        <Logo />
        {lg && <AccountButton />}
      </div>
      {lg && pathname !== "/search" && <div className="flex"><SearchField /></div>}
      </div>
    </aside>
  );
}

/** Thanh tab 4 app ở đáy (dưới lg). Đặt ngoài <header>: header có backdrop-filter, sẽ thành khối chứa của phần tử fixed bên trong. */
export function AppTabBar() {
  const pathname = usePathname();
  if (pathname === "/") return null; // landing không có thanh điều hướng
  const current = nav.apps.find((app) => isActive(pathname, app.match));
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 lg:hidden bg-card border-t border-separator flex justify-around items-stretch z-40 pb-safe"
      aria-label={nav.tabBarLabel}
    >
      {nav.apps.map((app) => {
        const active = app === current;
        return (
          <Link
            key={app.href}
            href={app.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-h-16 transition-colors ${
              active
                ? "text-label"
                : "text-secondary hover:text-label"
            }`}
          >
            <span className={`size-2 rounded-full ${appColors[app.href as keyof typeof appColors]}`} />
            <span className="text-footnote font-semibold">{app.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
