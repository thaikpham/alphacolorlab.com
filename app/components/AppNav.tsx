"use client";

import { useId, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { nav } from "@/app/content";
import { useWideBrowse } from "@/lib/indexView";
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

/** Nút launcher: logo chấm 3×3 (chấm giữa cam) + tên app đang dùng (chưa ở app nào thì tên dự án, ẩn dưới sm cho khỏi bị cắt), bấm bung popover 4 app (chấm màu + tên).
 * Dưới lg đây là lối đổi app duy nhất (không có thanh tab ở đáy), nên tên app hiện cả trên điện thoại. */
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
        <span className={`text-subhead font-semibold text-label ${current ? "max-w-28 truncate sm:max-w-none" : "hidden sm:inline"}`}>{current?.label ?? nav.siteName}</span>
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

/** Thanh trên cùng: dưới lg, và từ lg chỉ khi `wide` (Blog/Wiki ở Lưới và /admin, không có thanh dọc). Dưới lg: launcher trái, tìm kiếm + avatar phải;
 * đổi app bằng launcher, không có thanh tab ở đáy.
 * Từ lg khi wide: ba vùng cùng hàng h-14, logo trái đúng chỗ như thanh dọc, tìm kiếm giữa (cột 28rem), avatar phải.
 * Avatar luôn bọc một div (không đổi cây DOM khi bấm núm Danh sách/Lưới, menu không đóng); `lg:contents` để tìm kiếm và avatar thành ô của lưới. */
export function AppNav() {
  const pathname = usePathname();
  const lg = useLg();
  const wide = useWideBrowse(pathname);
  if (lg && !wide) return null;
  return (
    <div className={`mx-auto flex h-14 max-w-page items-center gap-1 px-4 sm:px-6 md:gap-4 ${wide ? "lg:grid lg:max-w-none lg:grid-cols-[1fr_minmax(0,28rem)_1fr] lg:px-3" : ""}`}>
      <Logo className={wide ? "lg:justify-self-start" : undefined} />
      <div className={`ml-auto flex min-w-0 items-center gap-1 ${wide ? "lg:contents" : ""}`}>
        {pathname !== "/search" && <SearchField />}
        <div className={wide ? "lg:justify-self-end" : undefined}>
          <AccountButton />
        </div>
      </div>
    </div>
  );
}

/** Thanh điều hướng dọc (từ lg): launcher, tìm kiếm, cao đúng `h-sidebar-head`. Avatar không nằm trong thanh: nút cố định góc trên phải (xem return).
 * Thanh trong suốt, không nhận chuột (chỉ phần đầu có nền) và nằm trên index (z-50) để gợi ý tìm kiếm không bị che.
 * Phần dưới là index của app đang mở: cột index của SplitLayout cố định ngay dưới (`top-sidebar-head`). Landing không có.
 * Blog và Wiki ở Lưới và /admin cũng không có (`wide`): thanh trên cùng của AppNav thay chỗ từ lg. */
export function AppSidebar() {
  const pathname = usePathname();
  const lg = useLg();
  const wide = useWideBrowse(pathname);
  if (pathname === "/" || wide) return null;
  return (
    <>
      <aside className="app-sidebar pointer-events-none fixed inset-y-0 left-0 z-50 hidden w-sidebar border-r border-separator lg:block">
        <div className="pointer-events-auto flex h-sidebar-head flex-col border-b border-separator bg-bg px-3">
          <div className="flex h-14 shrink-0 items-center">
            <Logo />
          </div>
          {lg && pathname !== "/search" && <div className="flex"><SearchField /></div>}
        </div>
      </aside>
      {/* Avatar luôn ở góc trên phải mọi màn có thanh dọc; lề phải của #main-content (--spacing-avatar-gutter) giữ chỗ cho nó */}
      {lg && (
        <div className="fixed top-4 right-4 z-50 rounded-full bg-card shadow-thumb">
          <AccountButton />
        </div>
      )}
    </>
  );
}
