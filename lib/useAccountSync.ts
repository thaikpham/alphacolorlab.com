"use client";

import { useEffect } from "react";

/** Bật đồng bộ theo tài khoản (lib/userState) khi đã đăng nhập. userState kéo theo bảng preset, codec .DAT và mod PP,
 * nên chỉ tải khi có phiên: khách chưa đăng nhập không phải tải phần này ở trang nào. */
export function useAccountSync(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    let live = true;
    let stop: (() => void) | undefined;
    import("./userState").then((m) => {
      if (live) stop = m.startSync();
    });
    return () => {
      live = false;
      stop?.();
    };
  }, [userId]);
}
