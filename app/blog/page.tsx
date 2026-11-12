import { blog, seo } from "@/app/content";
import { SITE_URL } from "@/lib/site";
import { ArticleGrid } from "@/app/components/ArticleIndex";
import { articleGroups } from "@/app/components/BlogIndex";

export const metadata = {
  title: seo.blogTitle,
  description: blog.list.lead,
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
};

// Chưa chọn gì: cột phải để trống (h1 chỉ cho trình đọc màn hình), trừ khi chọn Lưới thì hiện lưới bài ở md+. Điện thoại thấy header + index của layout.
export default function BlogPage() {
  return (
    <>
      <h1 className="sr-only">{blog.list.title}</h1>
      <ArticleGrid groups={articleGroups()} />
    </>
  );
}
