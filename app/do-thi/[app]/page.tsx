import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appHome } from "@/app/content";
import { SITE_URL } from "@/lib/site";
import { graphFor } from "@/lib/appGraphs";
import type { AppId } from "@/lib/constellation";
import { AppGraph } from "@/app/components/AppGraph";

const APPS: AppId[] = ["console", "colors", "wiki", "blog"];

export const generateStaticParams = () => APPS.map((app) => ({ app }));

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const { app } = await params;
  if (!APPS.includes(app as AppId)) return {};
  const id = app as AppId;
  return {
    title: `${appHome.views.graph} ${appHome[id].title}`,
    description: appHome[id].graph,
    alternates: { canonical: new URL(`/do-thi/${id}`, SITE_URL).href },
  };
}

/** Đồ thị của một app, mở từ menu người dùng ("Xem đồ thị"). Trang chính của app vẫn là danh sách 2 cột. */
// Route chặn: notFound() chạy trước khi phản hồi bắt đầu, app lạ vẫn trả 404; bốn trang đã dựng tĩnh nên không cần shell tức thì.
export const instant = false;

export default async function GraphPage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  if (!APPS.includes(app as AppId)) notFound();
  return <AppGraph app={app as AppId} graph={graphFor(app as AppId)} />;
}
