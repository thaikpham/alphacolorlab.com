"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { profile as T } from "@/app/content";
import { decodeShare, type SharedProfile as Shared } from "@/lib/profile";
import { ProfileView } from "./ProfileView";

/** Hồ sơ người khác chia sẻ (chỉ xem). Dữ liệu nằm trong phần # của link. */
export function SharedProfile() {
  const [data, setData] = useState<Shared | null | undefined>(undefined);
  useEffect(() => {
    const read = () => setData(decodeShare(location.hash.slice(1)));
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (data) document.title = T.sharedTitle(data.name);
  }, [data]);

  if (data === undefined) return <main className="min-h-dvh" />;
  if (!data)
    return (
      <main className="mx-auto max-w-page px-4 pt-12 pb-16 sm:px-6">
        <p className="text-body text-label">{T.badShare}</p>
        <Link href="/tai-khoan" className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-5 text-subhead font-semibold text-on-accent transition-colors hover:bg-accent/90">
          {T.makeYours}
        </Link>
      </main>
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
