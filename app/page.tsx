import type { Metadata } from "next";
import { access, appInfo, landing, nav, seo } from "@/app/content";
import { SITE_URL } from "@/lib/site";
import { allGraph } from "@/lib/appGraphs";
import type { AppId } from "@/lib/constellation";
import { EnterLink } from "@/app/components/EnterLink";
import { LandingGraph } from "@/app/components/LandingGraph";
import { LegacyHomeLinks } from "@/app/components/LegacyHomeLinks";
import { ScrollHint } from "@/app/components/ScrollHint";
import { LinkRow } from "@/app/components/LinkRow";
import { GearManager } from "@/app/components/GearManager";
import { BagOnGraph, LandingStart } from "@/app/components/LandingStart";

export const metadata: Metadata = {
  title: { absolute: `${seo.homeTitle} · ${seo.siteName}` },
  description: appInfo.description,
  alternates: { canonical: SITE_URL },
};

const APPS: AppId[] = ["console", "colors", "wiki", "blog"];
const DOT: Record<AppId, string> = { console: "bg-app-console", colors: "bg-app-colors", wiki: "bg-app-wiki", blog: "bg-app-blog" };
const HREF: Record<AppId, string> = { console: "/console", colors: "/colors", wiki: "/wiki", blog: "/blog" };

/** Landing (không có thanh điều hướng), 3 màn: lớp giới thiệu phủ trên đồ thị tổng hợp, đồ thị tổng hợp hiện trọn,
 * rồi một màn gộp: túi đồ + đăng nhập Google bên trái, danh sách 4 app + nút vào dự án bên phải. */
export default function Landing() {
  return (
    <main>
      <LegacyHomeLinks />

      <h1 className="sr-only">{access.pageTitle}</h1>

      {/* Đồ thị tổng hợp dính nền (sticky) suốt hai màn đầu: lớp giới thiệu phủ lên trước, cuộn qua thì đồ thị hiện trọn (#do-thi) */}
      <div className="relative">
        <div className="sticky top-0 h-dvh">
          <LandingGraph graph={allGraph()} />
        </div>
        <section id="gioi-thieu" aria-labelledby="gioi-thieu-title" className="relative z-10 -mt-viewport flex min-h-dvh flex-col items-center justify-center overflow-x-clip intro-overlay px-4 py-24 text-center sm:px-6">
          <ScrollHint target="do-thi" stops={["do-thi", "bat-dau"]} />
          <div className="intro-glow">
            <h2 id="gioi-thieu-title" className="over-graph text-display font-light">
              {landing.intro.title[0]}
              <span className="hue-text font-normal">{landing.intro.title[1]}</span>
              {landing.intro.title[2]}
            </h2>
            <div className="over-graph mt-8 space-y-4 text-body text-label text-pretty">
              {landing.intro.lines.map(([a, b]) => (
                <p key={a}>
                  <span className="md:block md:whitespace-nowrap">{a}</span> <span className="md:block md:whitespace-nowrap">{b}</span>
                </p>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <EnterLink />
            </div>
          </div>
        </section>

        {/* Mốc đồ thị lớn: lớp giới thiệu đã qua, đồ thị tổng hợp hiện trọn */}
        <div id="do-thi" aria-hidden="true" className="h-dvh" />
      </div>

      {/* Màn cuối, gọn trong một màn hình: nền bg trượt lên che đồ thị. Hai cột từ lg: trái là thẻ túi đồ + đăng nhập Google,
          phải là thẻ 4 app + nút cam vào dự án (nút cam duy nhất của màn, nên nút "Thêm" của túi đồ dùng nền xám) */}
      <section id="bat-dau" aria-labelledby="bat-dau-title" className="relative z-10 flex min-h-dvh items-center bg-bg px-4 py-10 sm:px-6 lg:px-8">
        <h2 id="bat-dau-title" className="sr-only">
          {landing.aboutTitle}
        </h2>
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <GearManager title={landing.start.title} secondary compact />
            <div className="flex flex-wrap items-center gap-3">
              <BagOnGraph />
              <LandingStart />
            </div>
          </div>
          <div className="space-y-4">
            <ul aria-labelledby="bat-dau-title" className="overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
              {APPS.map((app) => (
                <li key={app}>
                  <LinkRow
                    href={HREF[app]}
                    title={
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true" className={`size-2.5 flex-shrink-0 rounded-full ${DOT[app]}`} />
                        {nav.apps.find((a) => a.href === HREF[app])!.label}
                      </span>
                    }
                    detail={landing.apps[app]}
                  />
                </li>
              ))}
            </ul>
            <div className="flex lg:justify-end">
              <EnterLink />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
