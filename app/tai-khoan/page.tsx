import type { Metadata } from "next";
import { profile } from "@/app/content";
import { SITE_URL } from "@/lib/site";
import { ProfilePage } from "@/app/components/ProfilePage";

export const metadata: Metadata = {
  title: profile.title,
  description: profile.description,
  alternates: { canonical: new URL("/tai-khoan", SITE_URL).href },
};

/** Hồ sơ của người dùng (menu avatar › Túi đồ): khoe túi đồ Sony, sửa giới thiệu, chia sẻ hồ sơ. */
export default function Page() {
  return <ProfilePage />;
}
