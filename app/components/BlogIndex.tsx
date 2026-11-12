import { blogIndex } from "@/lib/blog";
import { entryHref, knowledge } from "@/lib/wiki";
import { blog, wiki } from "@/app/content";
import { BlogParts } from "./BlogParts";
import { ArticleIndex, type ArticleGroup } from "./ArticleIndex";
import { IndexRow } from "./IndexRow";

/** Bài theo cấp độ (rồi lộ trình), dùng cho cột index và lưới của /blog. */
export function articleGroups(): ArticleGroup[] {
  return blogIndex().map((g) => ({
    key: g.group,
    label: g.group in blog.levels ? blog.levels[g.group as keyof typeof blog.levels] : blog.categories[g.group as keyof typeof blog.categories],
    items: g.items,
  }));
}

/** /blog index column: Bài viết (one list per level, then learning paths) and Kiến thức máy ảnh (notes by group). */
export function BlogIndex() {
  const notes = knowledge().filter((k) => k.home === "knowledge");
  const group = (label: string, rows: React.ReactNode) => (
    <section key={label}>
      <h2 className="mb-2 px-4 text-footnote text-secondary">{label}</h2>
      <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">{rows}</div>
    </section>
  );
  return (
    <BlogParts
      lists={{
        articles: <ArticleIndex groups={articleGroups()} />,
        knowledge: wiki.knowledge.groups.map(({ id, label }) => {
          const rows = notes.filter((n) => n.group === id).sort((a, b) => a.title.localeCompare(b.title, "vi"));
          return rows.length ? group(label, rows.map((n) => <IndexRow key={n.slug} href={entryHref(n.slug)} title={n.title} />)) : null;
        }),
      }}
    />
  );
}
