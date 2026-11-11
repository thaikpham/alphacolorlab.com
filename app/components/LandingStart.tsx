"use client";

import { useEffect } from "react";
import Link from "next/link";
import { account, community, landing } from "@/app/content";
import { authReady, getSession, signIn, useSession } from "@/lib/auth";
import { startSync } from "@/lib/userState";
import { useGear } from "@/lib/gear";
import { activePageSearch } from "@/lib/pageSearch";
import { InfoTip } from "./InfoTip";

const button = "inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong";

/** Đăng nhập Google ở màn cuối của landing (landing không có nút avatar): hoàn tất vòng đăng nhập khi Google trả về "/",
 * bật đồng bộ theo tài khoản. Đã đăng nhập thì hiện tên và lối sang hồ sơ. Bản chưa bật đăng nhập thì không hiện gì. */
export function LandingStart() {
  const session = useSession();
  useEffect(() => void getSession(), []);
  const userId = session?.user.id;
  useEffect(() => (userId ? startSync() : undefined), [userId]);

  if (!authReady) return null;
  if (session)
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-callout font-semibold">{landing.start.signedIn(session.user.name ?? account.guest)}</p>
        <Link href="/tai-khoan" className={button}>
          {account.bag}
        </Link>
      </div>
    );
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={signIn} className={button}>
        {community.account.signIn}
      </button>
      <InfoTip entry={landing.start.syncTip} />
    </div>
  );
}

/** Nút xám "Xem túi đồ trên đồ thị" (chỉ hiện khi túi có món): lướt lên mốc đồ thị tổng hợp (ScrollHint nghe sự kiện "landing-glide") và chọn một món trong túi (không mở trang),
 * qua nguồn tìm mà đồ thị đã đăng ký (lib/pageSearch). Món không có nút trên đồ thị thì chỉ cuộn lên. */
export function BagOnGraph() {
  const bag = useGear();
  // Ưu tiên máy ảnh, rồi ống kính, rồi phụ kiện; trong mỗi nhóm lấy món thêm sau cùng
  const ids = [...bag.body.toReversed(), ...bag.lens.toReversed(), ...bag.acc.toReversed()];
  if (!ids.length) return null;
  const show = () => {
    const graph = activePageSearch();
    ids.some((id) => graph?.show?.(id));
    dispatchEvent(new CustomEvent("landing-glide", { detail: "do-thi" }));
  };
  return (
    <button type="button" onClick={show} className={button}>
      {landing.start.onGraph}
    </button>
  );
}
