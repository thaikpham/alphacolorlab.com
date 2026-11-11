"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { account, community, nav } from "@/app/content";
import { authReady, getSession, signIn, signOut, useSession } from "@/lib/auth";
import { useGear } from "@/lib/gear";
import { startSync } from "@/lib/userState";
import type { AppId } from "@/lib/constellation";

const APP_OF: [string, AppId][] = [["/colors", "colors"], ["/wiki", "wiki"], ["/blog", "blog"], ["/console", "console"], ["/cai-tay", "console"], ["/tao-m1-m4", "console"], ["/bo-m1-m4", "console"], ["/giai-ma", "console"], ["/kol", "console"]];
const HOME: Record<AppId, string> = { console: "/console", colors: "/colors", wiki: "/wiki", blog: "/blog" };

/** App đang mở và nút đồ thị ứng với trang đang xem (id nút = đoạn cuối của URL, xem lib/appGraphs). */
function graphTarget(pathname: string): { app: AppId; href: string } | null {
  const app = APP_OF.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1];
  if (!app) return null;
  const last = pathname === HOME[app] ? "" : pathname.split("/").pop()!;
  return { app, href: `/do-thi/${app}${last ? `?n=${encodeURIComponent(last)}` : ""}` };
}

/** Nút avatar trên thanh điều hướng (ảnh Google, hoặc icon người khi chưa đăng nhập), mở menu: túi đồ, xem đồ thị, đăng nhập/đăng xuất.
 * Khi đăng nhập, túi đồ, giỏ, danh sách so sánh và máy đang chọn đồng bộ theo tài khoản. */
export function AccountButton() {
  const session = useSession();
  const pathname = usePathname();
  const bag = useGear();
  // Finishes a Google round trip on whatever page it lands on, and refreshes an expiring token.
  useEffect(() => void getSession(), []);
  const userId = session?.user.id;
  useEffect(() => (userId ? startSync() : undefined), [userId]);
  // Đổi trang thì đóng menu
  useEffect(() => document.getElementById("account-menu")?.hidePopover(), [pathname]);

  const name = session?.user.name ?? account.guest;
  const target = graphTarget(pathname);
  const appLabel = target ? nav.apps.find((a) => a.href === HOME[target.app])!.label : "";
  const item = "flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-subhead font-semibold text-label transition-colors hover:bg-fill";

  return (
    <>
      <button
        type="button"
        popoverTarget="account-menu"
        aria-label={`${account.menu}: ${name}`}
        className="grid size-11 shrink-0 place-items-center rounded-full text-label transition-colors hover:bg-fill active:bg-fill-strong"
      >
        {session?.user.avatar ? (
          // Google profile photo; 28px does not need the image optimizer.
          <img src={session.user.avatar} alt="" width={28} height={28} referrerPolicy="no-referrer" className="size-7 rounded-full bg-fill" />
        ) : session ? (
          <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-accent text-footnote font-semibold text-on-accent">
            {name.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <nav id="account-menu" popover="auto" aria-label={account.menu} className="account-menu rounded-card border border-separator bg-card p-2 text-label shadow-card">
        <p className="truncate px-3 pt-2 pb-3 text-subhead font-semibold">{name}</p>
        <ul className="space-y-0.5 border-t border-separator pt-2">
          <li>
            <Link href="/huong-dan" className={item}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="10" cy="10" r="7" />
                <path d="M10 7v3M10 13h0" />
              </svg>
              <span className="flex-1">{account.help}</span>
            </Link>
          </li>
          <li>
            <Link href="/tai-khoan" className={item}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
                <path d="M3.5 6.5h13v10h-13zM7.5 6.5V4.5h5v2" />
              </svg>
              <span className="flex-1">{account.bag}</span>
              <span className="text-footnote font-semibold text-secondary tabular-nums">{bag.body.length + bag.lens.length + bag.acc.length}</span>
            </Link>
          </li>
          {target && (
            <li>
              <Link href={target.href} className={item}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="10" cy="10" r="2" />
                  <circle cx="4" cy="5" r="1.5" />
                  <circle cx="16" cy="6" r="1.5" />
                  <circle cx="6" cy="16" r="1.5" />
                  <path d="M8.3 9L5.3 6M11.9 9.3l2.7-2.4M8.6 11.5l-1.6 3" />
                </svg>
                <span className="flex-1">{target.href.includes("?n=") ? account.graphHere : account.graph(appLabel)}</span>
              </Link>
            </li>
          )}
          {authReady && (
            <li>
              <button
                type="button"
                onClick={() => {
                  document.getElementById("account-menu")?.hidePopover();
                  if (session) signOut();
                  else signIn();
                }}
                className={item}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {session ? <path d="M8 4H4.5v12H8M12 6.5l3.5 3.5-3.5 3.5M15.5 10H8" /> : <path d="M12 4h3.5v12H12M8 6.5l3.5 3.5L8 13.5M11.5 10H4" />}
                </svg>
                <span className="flex-1 text-left">{session ? community.account.signOut : community.account.signIn}</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
