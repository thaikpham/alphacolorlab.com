import type { Metadata } from "next";
import { profile } from "@/app/content";
import { SITE_URL } from "@/lib/site";
import { SharedProfile } from "@/app/components/SharedProfile";

export const metadata: Metadata = {
  title: profile.title,
  description: profile.sharedDescription,
  alternates: { canonical: new URL("/ho-so", SITE_URL).href },
};

/** Link chia sẻ hồ sơ: /ho-so#<dữ liệu>. Phần sau # không gửi lên máy chủ; trang đọc và kiểm tra nó trên trình duyệt. */
export default function Page() {
  return <SharedProfile />;
}
