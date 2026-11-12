import { blog, seo } from "@/app/content";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: seo.blogTitle,
  description: blog.list.lead,
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
};

// Chưa chọn gì: cột phải để trống (h1 chỉ cho trình đọc màn hình). Lưới: layout hiện header + index (thẻ) và ẩn nội dung này. Danh sách: điện thoại thấy header + index, md+ thấy cột phải trống.
export default function BlogPage() {
  return <h1 className="sr-only">{blog.list.title}</h1>;
}
