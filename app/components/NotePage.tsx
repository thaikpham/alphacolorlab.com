import { backlinks, entryHref, type Knowledge } from "@/lib/wiki";
import { wiki } from "@/app/content";
import { BackLink } from "@/app/components/BackLink";
import { LinkRow } from "@/app/components/LinkRow";
import { Markdown } from "@/app/components/Markdown";
import { list as listArticles } from "@/lib/blog";
import { Community } from "@/app/components/Community";
import { JsonLdScript } from "@/app/components/JsonLdScript";
import { breadcrumbLd } from "@/lib/jsonld";

/** Trang một ghi chú kiến thức; dùng chung cho /blog/kien-thuc và ghi chú sản phẩm ở /wiki/san-pham. */
export function NotePage({ note, back }: { note: Knowledge; back: { href: string; label: string } }) {
  const noteBacklinks = backlinks(note.slug);
  const articles = listArticles();
  const relatedArticles = articles.filter((a) => a.meta?.related?.some((r) => r.kind === "knowledge" && r.id === note.slug));

  return (
    <div className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 md:px-8 xl:px-12 pt-16 pb-24 sm:pt-24 md:pt-6">
        <BackLink href={back.href}>{back.label}</BackLink>
        <h1 className="text-title font-normal mb-3">{note.title}</h1>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-fill text-secondary text-footnote font-medium px-3 py-1">
              {note.section}
            </span>
            <span className="rounded-full bg-fill text-secondary text-footnote font-medium px-3 py-1">
              {wiki.levels[note.level as keyof typeof wiki.levels] || note.level}
            </span>
          </div>
        </div>

        <div className="mb-8">
          <Markdown body={(note as any).body || ""} />
        </div>

        {(noteBacklinks.length > 0 || relatedArticles.length > 0) && (
          <section>
            <h2 className="text-title3 font-medium mb-3">{wiki.note.backlinks}</h2>
            <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
              {noteBacklinks.map((backlink) => (
                <LinkRow
                  key={backlink.slug}
                  href={entryHref(backlink.slug)}
                  title={backlink.title}
                  detail={backlink.summary}
                  trailing={wiki.levels[backlink.level as keyof typeof wiki.levels] || backlink.level}
                />
              ))}
              {relatedArticles.map((article) => (
                <LinkRow
                  key={article.id}
                  href={`/blog/${article.id}`}
                  title={article.title}
                  detail={article.dek}
                  trailing={article.read}
                />
              ))}
            </div>
          </section>
        )}
        <JsonLdScript schema={breadcrumbLd([wiki.list.title, "/wiki"], [back.label, back.href], [note.title, entryHref(note.slug)])} />
        <Community page={`note/${note.slug}`} title={note.title} />
      </div>
    </div>
  );

}
