"use client";

import { useEffect } from "react";
import { account, community, landing } from "@/app/content";
import { authReady, getSession, signIn, useSession } from "@/lib/auth";
import { useAccountSync } from "@/lib/useAccountSync";
import { GoogleG } from "./GoogleG";
import { InfoTip } from "./InfoTip";

const button = "inline-flex h-11 items-center gap-2 rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong";

/** Thẻ tài khoản ở cột phải của bước 2 landing (landing không có nút avatar): đăng nhập Google, hoàn tất vòng đăng nhập khi Google trả về "/",
 * bật đồng bộ theo tài khoản. Đã đăng nhập thì hiện avatar Google (56px) và tên, không có nút sang hồ sơ. Bản chưa bật đăng nhập thì không hiện gì. */
export function LandingStart() {
  const session = useSession();
  useEffect(() => void getSession(), []);
  const userId = session?.user.id;
  useAccountSync(userId);

  if (!authReady) return null;
  return (
    <div className="google-ring rounded-card bg-card p-5 sm:p-6">
      <h2 className="text-title3 font-medium">{community.account.menu}</h2>
      {session ? (
        <div className="mt-4 flex items-center gap-3">
          {session.user.avatar && (
            <img src={session.user.avatar} alt="" width={56} height={56} referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-full bg-fill" />
          )}
          <p className="flex min-w-0 items-center gap-2 text-callout font-semibold text-pretty">
            <GoogleG className="size-4 shrink-0" />
            {landing.start.signedIn(session.user.name ?? account.guest)}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-1">
          <button type="button" onClick={signIn} className={button}>
            <GoogleG className="size-5 shrink-0" />
            {community.account.signIn}
          </button>
          <InfoTip entry={landing.start.syncTip} />
        </div>
      )}
    </div>
  );
}
