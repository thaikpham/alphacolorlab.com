import { blog, seo } from "@/app/content";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: seo.blogTitle,
  description: blog.list.lead,
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
};

// Chưa chọn gì: cột phải để trống (h1 chỉ cho trình đọc màn hình). Điện thoại thấy header + index của layout.
export default function BlogPage() {
  return <h1 className="sr-only">{blog.list.title}</h1>;
}
