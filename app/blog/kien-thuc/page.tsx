import { blog, seo, wiki } from "@/app/content";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: `${blog.parts.knowledge}${seo.blogSuffix}`,
  description: wiki.knowledge.lead,
  alternates: {
    canonical: `${SITE_URL}/blog/kien-thuc`,
  },
};

// Chưa chọn gì: cột phải để trống (h1 chỉ cho trình đọc màn hình). Điện thoại thấy header + index của layout.
export default function KnowledgePage() {
  return <h1 className="sr-only">{blog.parts.knowledge}</h1>;
}
