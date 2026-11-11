import type { Metadata } from "next";
import { profile } from "@/app/content";
import { ProfilePage } from "@/app/components/ProfilePage";

export const metadata: Metadata = {
  title: profile.title,
  robots: { index: false },
};

/** Hồ sơ của người dùng (menu avatar › Túi đồ): khoe túi đồ Sony, sửa giới thiệu, chia sẻ hồ sơ. */
export default function Page() {
  return <ProfilePage />;
}
