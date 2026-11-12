import type { Metadata } from "next";
import { access, appInfo, seo } from "@/app/content";
import { SITE_URL } from "@/lib/site";
import { allGraph } from "@/lib/appGraphs";
import { LandingFlow } from "@/app/components/LandingFlow";
import { LegacyHomeLinks } from "@/app/components/LegacyHomeLinks";

export const metadata: Metadata = {
  title: { absolute: `${seo.homeTitle} · ${seo.siteName}` },
  description: appInfo.description,
  alternates: { canonical: SITE_URL },
};

/** Landing (không có thanh điều hướng): flow 3 bước trong một màn hình, không cuộn trang (LandingFlow):
 * giới thiệu, túi đồ + đăng nhập Google, rồi đồ thị đã cá nhân hóa kèm nút vào dự án. */
export default function Landing() {
  return (
    <main>
      <LegacyHomeLinks />
      <h1 className="sr-only">{access.pageTitle}</h1>
      <LandingFlow graph={allGraph()} />
    </main>
  );
}
