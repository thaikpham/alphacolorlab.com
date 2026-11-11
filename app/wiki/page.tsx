import type { Metadata } from "next";
import { wiki } from "@/app/content";
import { products } from "@/lib/wiki";
import { SITE_URL } from "@/lib/site";

const count = (kind: string) => products().filter((p) => p.kind === kind).length;
const intro = wiki.product.intro(count("camera"), count("lens"), count("accessory"));

export const metadata: Metadata = {
  title: wiki.product.title,
  description: `${wiki.product.lead} ${intro}.`,
  alternates: {
    canonical: `${SITE_URL}/wiki`,
  },
};

// Chưa chọn gì: cột phải để trống (h1 chỉ cho trình đọc màn hình). Điện thoại thấy header + index của layout.
export default function WikiPage() {
  return <h1 className="sr-only">{wiki.product.title}</h1>;
}
