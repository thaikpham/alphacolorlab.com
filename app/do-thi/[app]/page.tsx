import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appHome } from "@/app/content";
import { graphFor } from "@/lib/appGraphs";
import type { AppId } from "@/lib/constellation";
import { AppGraph } from "@/app/components/AppGraph";

const APPS: AppId[] = ["console", "colors", "wiki", "blog"];

export const generateStaticParams = () => APPS.map((app) => ({ app }));

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const { app } = await params;
  return APPS.includes(app as AppId) ? { title: `${appHome.views.graph} ${appHome[app as AppId].title}`, robots: { index: false } } : {};
}

/** Đồ thị của một app, mở từ menu người dùng ("Xem đồ thị"). Trang chính của app vẫn là danh sách 2 cột. */
export default async function GraphPage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  if (!APPS.includes(app as AppId)) notFound();
  return <AppGraph app={app as AppId} graph={graphFor(app as AppId)} />;
}
