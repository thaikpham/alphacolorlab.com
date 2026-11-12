import { blog } from "@/app/content";
import { SplitLayout } from "@/app/components/SplitLayout";
import { BlogIndex } from "@/app/components/BlogIndex";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <SplitLayout
      header={
        <>
          <h1 className="text-display font-light">{blog.list.title}</h1>
        </>
      }
      index={<BlogIndex />}
      lists={["kien-thuc"]}
      browse="blog"
     
    >
      {children}
    </SplitLayout>
  );
}
