"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { profile as T } from "@/app/content";
import { decodeShare, type SharedProfile as Shared } from "@/lib/profile";
import { ProfileShell } from "./ProfileShell";
import { ProfileView } from "./ProfileView";

/** Hồ sơ người khác chia sẻ (chỉ xem). Dữ liệu nằm trong phần # của link. */
export function SharedProfile() {
  const [data, setData] = useState<Shared | null | undefined>(undefined);
  // Mở /ho-so không kèm phần # (người vào từ tìm kiếm): giải thích trang, không báo link hỏng
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    let live = true;
    const read = () => {
      const raw = location.hash.slice(1);
      void decodeShare(raw).then((d) => {
        if (!live) return;
        setEmpty(!raw);
        setData(d);
      });
    };
    read();
    addEventListener("hashchange", read);
    return () => {
      live = false;
      removeEventListener("hashchange", read);
    };
  }, []);
  useEffect(() => {
    if (data) document.title = T.sharedTitle(data.name);
  }, [data]);

  // Đang đọc, không có link và link hỏng dùng chung một <p> (chỉ đổi chữ): dòng chữ có sẵn trong HTML từ máy chủ nên là LCP ngay lần vẽ đầu
  if (!data)
    return (
      <ProfileShell>
        <p className="text-body text-label">{data === undefined ? T.opening : empty ? T.noShare : T.badShare}</p>
        {data === null && (
          <Link href="/tai-khoan" className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent transition-colors hover:bg-accent/90">
            {T.makeYours}
          </Link>
        )}
      </ProfileShell>
    );
  return (
    <ProfileView
      data={data}
      actions={
        <Link href="/tai-khoan" className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent transition-colors hover:bg-accent/90">
          {T.makeYours}
        </Link>
      }
    />
  );
}
