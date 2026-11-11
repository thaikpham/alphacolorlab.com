import { blogIndex } from "@/lib/blog";
import { entryHref, knowledge } from "@/lib/wiki";
import { blog, wiki } from "@/app/content";
import { BlogParts } from "./BlogParts";
import { IndexRow } from "./IndexRow";

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
        articles: blogIndex().map((g) =>
          group(
            g.group in blog.levels ? blog.levels[g.group as keyof typeof blog.levels] : blog.categories[g.group as keyof typeof blog.categories],
            g.items.map((i) => (
              <IndexRow key={i.href} href={i.href} title={i.title} detail={i.read ?? (i.steps ? blog.split.steps(i.steps) : undefined)} />
            )),
          ),
        ),
        knowledge: wiki.knowledge.groups.map(({ id, label }) => {
          const rows = notes.filter((n) => n.group === id).sort((a, b) => a.title.localeCompare(b.title, "vi"));
          return rows.length ? group(label, rows.map((n) => <IndexRow key={n.slug} href={entryHref(n.slug)} title={n.title} />)) : null;
        }),
      }}
    />
  );
}
