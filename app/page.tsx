import type { Metadata } from "next";
import { access, appInfo, seo } from "@/app/content";
import { SITE_URL } from "@/lib/site";
import { allGraph } from "@/lib/appGraphs";
import { Landing } from "@/app/components/Landing";
import { LegacyHomeLinks } from "@/app/components/LegacyHomeLinks";

export const metadata: Metadata = {
  title: { absolute: `${seo.homeTitle} · ${seo.siteName}` },
  description: appInfo.description,
  alternates: { canonical: SITE_URL },
};

/** Trang chủ (không có thanh điều hướng): một trang cuộn gồm giới thiệu và đồ thị toàn màn hình (Landing). */
export default function Home() {
  return (
    <main>
      <LegacyHomeLinks />
      <h1 className="sr-only">{access.pageTitle}</h1>
      <Landing graph={allGraph()} />
    </main>
  );
}
