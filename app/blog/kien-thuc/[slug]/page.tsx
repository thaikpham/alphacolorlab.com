import { notFound } from "next/navigation";
import { knowledgeBySlug, knowledge } from "@/lib/wiki";
import { seo } from "@/app/content";
import { NotePage } from "@/app/components/NotePage";
import { SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
  const allKnowledge = knowledge();
  return allKnowledge
    .filter((k) => k.home === 'knowledge')
    .map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const note = knowledgeBySlug(slug);

  if (!note || note.home !== 'knowledge') return {};

  return {
    title: `${note.title}${seo.blogSuffix}`,
    description: note.summary,
    alternates: {
      canonical: `${SITE_URL}/blog/kien-thuc/${slug}`,
    },
  };
}

// Blocking route: notFound() runs before the response starts, so a missing note keeps its 404 status.
export const instant = false;

export default async function KnowledgeSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const note = knowledgeBySlug(slug);

  if (!note || note.home !== 'knowledge') {
    notFound();
  }

  return <NotePage note={note} back={{ href: "/blog/kien-thuc", label: "Kiến thức máy ảnh" }} />;
}
