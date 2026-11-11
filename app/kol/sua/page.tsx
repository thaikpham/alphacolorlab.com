import type { Metadata } from "next";
import { kolStudio } from "@/app/content";
import { BackLink } from "@/app/components/BackLink";
import { KolStudio } from "@/app/components/KolStudio";

export const metadata: Metadata = {
  title: kolStudio.title,
  robots: { index: false },
};

/** Trang quản lý KOL (không công khai): hồ sơ và bộ M1–M4 của tài khoản đã được duyệt. */
export default function Page() {
  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <BackLink href="/console">{kolStudio.back}</BackLink>
      <KolStudio />
    </div>
  );
}
