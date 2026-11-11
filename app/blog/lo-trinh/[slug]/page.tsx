import { notFound } from "next/navigation";
import { learningPathBySlug, publishedLearningPaths, byId, isPublished } from "@/lib/blog";
import { knowledgeBySlug } from "@/lib/wiki";
import { entryHref } from "@/lib/wikilinks";
import Link from "next/link";
import { Community } from "@/app/components/Community";
import { blog, seo } from "@/app/content";
import { JsonLdScript } from "@/app/components/JsonLdScript";
import { breadcrumbLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";

// Only publish non-draft paths at build time. Draft paths render in dev only.
export async function generateStaticParams() {
  const paths = publishedLearningPaths();
  if (paths.length === 0) {
    // Return a dummy param to satisfy Next.js requirements, will 404 at runtime
    return [{ slug: '__placeholder__' }];
  }
  return paths.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const path = learningPathBySlug(slug);

  if (!path || !isPublished(path)) return {};

  return {
    title: `${path.title}${seo.blogSuffix}`,
    description: path.lead,
    alternates: {
      canonical: `${SITE_URL}/blog/lo-trinh/${slug}`,
    },
  };
}

export default async function LearningPathPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const path = learningPathBySlug(slug);

  if (!path || !isPublished(path)) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 md:px-8 pt-16 pb-8 sm:pt-24 md:pt-6">
        <Link href="/blog" className="inline-flex items-center gap-1 text-subhead font-semibold text-accent-text hover:underline">
          Blog
        </Link>
        <h1 className="text-display font-light mb-4 mt-4">{path.title}</h1>
        <p className="text-body text-secondary max-w-2xl mb-8">{path.lead}</p>

        <div className="space-y-4">
          {path.steps.map((step, idx) => {
            let title = "";
            let detail = "";
            let href = "";

            if (step.kind === "blog") {
              const article = byId(step.id || "");
              if (article) {
                title = `Bước ${idx + 1}: ${article.title}`;
                detail = article.dek;
                href = `/blog/${article.id}`;
              }
            } else if (step.kind === "knowledge") {
              const note = knowledgeBySlug(step.slug || "");
              if (note) {
                title = `Bước ${idx + 1}: ${note.title}`;
                detail = note.summary;
                // Use entryHref to resolve merged notes to their article
                href = entryHref(note.slug);
              }
            }

            if (!title) return null;

            return (
              <Link
                key={idx}
                href={href}
                className="block rounded-card bg-card shadow-card p-4 hover:bg-separator transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-subhead font-semibold mb-1">{title}</h3>
                    <p className="text-footnote text-secondary mb-2">{detail}</p>
                    <p className="text-footnote text-secondary italic">{step.reason}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-tertiary">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
        <JsonLdScript schema={breadcrumbLd([blog.list.title, "/blog"], [path.title, `/blog/lo-trinh/${path.slug}`])} />
        <Community page={`path/${path.slug}`} title={path.title} />
      </div>
    </div>
  );
}
