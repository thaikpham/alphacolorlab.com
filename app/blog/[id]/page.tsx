import { notFound } from "next/navigation";
import { list, byId, posts } from "@/lib/blog";
import { blog, seo } from "@/app/content";
import { BackLink } from "@/app/components/BackLink";
import { ArticleBody } from "@/app/components/ArticleBody";
import { Markdown } from "@/app/components/Markdown";
import { LinkRow } from "@/app/components/LinkRow";
import { resolve } from "@/lib/wikilinks";
import knowledgeData from "@/data/knowledge.json" with { type: "json" };
import { Community } from "@/app/components/Community";
import { SITE_URL } from "@/lib/site";
import { articleLd, breadcrumbLd, faqLd, leadImage } from "@/lib/jsonld";
import { JsonLdScript } from "@/app/components/JsonLdScript";

export async function generateStaticParams() {
  return [...list().map((a) => ({ id: a.id })), ...posts().map((p) => ({ id: p.slug }))];
}

// Ghi chú chỉ có cấp "cơ bản" / "nâng cao"; nhãn lấy từ thang cấp độ của blog
const noteLevel = (level: string) => blog.levels[level === "nâng cao" ? "mid" : "newbie"];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = byId(id);
  if (article) {
    const image = leadImage(article.blocks);
    return {
      title: `${article.title}${seo.blogSuffix}`,
      description: article.dek,
      alternates: { canonical: `${SITE_URL}/blog/${id}` },
      // A page-level openGraph replaces the layout's whole object, so siteName and locale are repeated here.
      openGraph: {
        type: "article",
        title: article.title,
        description: article.dek,
        url: `${SITE_URL}/blog/${id}`,
        siteName: seo.siteName,
        locale: "vi_VN",
        ...(image && { images: [image] }),
        ...(article.updatedAt && { modifiedTime: article.updatedAt }),
      },
    };
  }
  const post = posts().find((p) => p.slug === id);
  return post ? { title: `${post.title}${seo.blogSuffix}`, description: post.summary, alternates: { canonical: `${SITE_URL}/blog/${id}` } } : {};
}

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = byId(id);
  if (!article) {
    const post = posts().find((p) => p.slug === id);
    if (!post) notFound();
    return <PostPage post={post} />;
  }

  // Same ids as ArticleBody gives headings
  const toc = article.blocks.flatMap((b, i) => (b.t === "h" ? [{ id: `section-${i}`, text: b.text }] : []));

  const topicLabel = blog.topics[article.topic];
  const levelLabel = blog.levels[article.level];

  const relatedArticles = article.meta.related.filter((r) => r.kind === "article");
  const relatedKnowledge = article.meta.related.filter((r) => r.kind === "knowledge");

  const knowledgeBySlug = new Map(
    (knowledgeData as Array<{ slug: string; title: string }>).map((k) => [k.slug, k])
  );

  return (
    <div className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 md:px-8 xl:px-12 pt-16 pb-24 sm:pt-24 md:pt-6">
        <BackLink href="/blog">{blog.detail.back}</BackLink>

        <div className="mb-8">
          <h1 className="text-title font-normal mb-3">{article.title}</h1>
          <p className="text-body text-secondary mb-4">{article.dek}</p>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-fill text-secondary text-footnote font-medium px-3 py-1">
              {topicLabel}
            </span>
            <span className="rounded-full bg-fill text-secondary text-footnote font-medium px-3 py-1">
              {levelLabel}
            </span>
            <span className="rounded-full bg-fill text-secondary text-footnote font-medium px-3 py-1">
              {article.read}
            </span>
            {article.updatedAt && (
              <span className="rounded-full bg-fill text-secondary text-footnote font-medium px-3 py-1">
                {blog.detail.updatedLabel} {new Date(article.updatedAt).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>
        </div>

        {/* xl+: article fills the column; contents and related links (18rem) sticky on the right. DOM order keeps phones reading body, related, sources, comments. */}
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-x-12">
        <div className="mb-16 xl:col-start-1 xl:row-start-1">
          <ArticleBody blocks={article.blocks} />
        </div>

        <aside className="xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:sticky xl:top-0 xl:max-h-split xl:self-start xl:overflow-y-auto xl:-mt-6 xl:pt-6 xl:pb-6">
        {/* Contents: wide screens only, phones read straight through */}
        {toc.length > 1 && (
          <nav aria-labelledby="toc-heading" className="mb-8 hidden xl:block">
            <h2 id="toc-heading" className="mb-2 px-4 text-footnote text-secondary">{blog.detail.toc}</h2>
            <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
              {toc.map((h) => (
                <a key={h.id} href={`#${h.id}`} className="flex min-h-11 items-center px-4 py-2.5 text-subhead text-label transition-colors hover:bg-fill">{h.text}</a>
              ))}
            </div>
          </nav>
        )}

        {/* Related knowledge */}
        {relatedKnowledge.length > 0 && (
          <section className="mb-12 xl:mb-8">
            <h2 className="text-title3 font-medium mb-3">{blog.detail.relatedKnowledge}</h2>
            <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
              {relatedKnowledge.map((r) => {
                const note = knowledgeBySlug.get(r.id);
                const target = note ? resolve(note.title) : null;
                return target ? (
                  <LinkRow
                    key={r.id}
                    href={target.href}
                    title={target.title}
                  />
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section className="mb-12 xl:mb-0">
            <h2 className="text-title3 font-medium mb-3">{blog.detail.relatedArticles}</h2>
            <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
              {relatedArticles
                .map((r) => byId(r.id))
                .filter((a): a is typeof article => !!a)
                .map((a) => (
                  <LinkRow
                    key={a.id}
                    href={`/blog/${a.id}`}
                    title={a.title}
                    detail={a.dek}
                    trailing={a.read}
                  />
                ))}
            </div>
          </section>
        )}

        </aside>

        <div className="xl:col-start-1 xl:row-start-2">
        {/* Sources */}
        {article.meta.sources.length > 0 && (
          <section>
            <h2 className="text-title3 font-medium mb-3">{blog.detail.sources}</h2>
            <div className="space-y-2">
              {article.meta.sources.map((src, i) => (
                <div key={i} className="text-footnote">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-text underline underline-offset-2 hover:opacity-75"
                  >
                    {src.title}
                  </a>
                  {src.publisher && <span className="text-secondary"> · {src.publisher}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        <JsonLdScript schema={articleLd({ title: article.title, description: article.dek, path: `/blog/${article.id}`, blocks: article.blocks, updatedAt: article.updatedAt, reviewedAt: article.meta.reviewedAt, authorName: article.meta.authorName })} />
        <JsonLdScript schema={faqLd(article.blocks)} />
        <JsonLdScript schema={breadcrumbLd([blog.list.title, "/blog"], [article.title, `/blog/${article.id}`])} />
        <Community page={`post/${article.id}`} title={article.title} />
        </div>
        </div>
      </div>
    </div>
  );
}

function PostPage({ post }: { post: ReturnType<typeof posts>[number] }) {
  return (
    <div className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 md:px-8 xl:px-12 pt-16 pb-24 sm:pt-24 md:pt-6">
        <BackLink href="/blog">{blog.detail.back}</BackLink>

        <div className="mb-8">
          <h1 className="text-title font-normal mb-3">{post.title}</h1>
          <p className="text-body text-secondary mb-4">{post.summary}</p>
          <div className="flex flex-wrap gap-2">
            {[blog.categories["ky-thuat"], noteLevel(post.level)].map((label) => (
              <span key={label} className="rounded-full bg-fill text-secondary text-footnote font-medium px-3 py-1">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <Markdown body={post.body ?? ""} />
        </div>

        <JsonLdScript schema={articleLd({ title: post.title, description: post.summary, path: `/blog/${post.slug}` })} />
        <JsonLdScript schema={breadcrumbLd([blog.list.title, "/blog"], [post.title, `/blog/${post.slug}`])} />
        <Community page={`post/${post.slug}`} title={post.title} />
      </div>
    </div>
  );
}
