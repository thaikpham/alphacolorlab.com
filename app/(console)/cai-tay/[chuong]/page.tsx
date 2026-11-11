import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sections, cameraModels, sonyBodies, alphaConsole as C } from "@/app/content";
import { GuideChapter, GuideSummary } from "@/app/components/GuideChapter";
import { BackLink } from "@/app/components/BackLink";
import { SITE_URL } from "@/lib/site";

const chapters = [...sections.map((s) => ({ id: s.id, title: s.title })), { id: "tom-tat", title: C.summaryTitle }];
const decodedModels = sonyBodies.filter((b) => b.decoded && b.id).map((b) => b.id).join(" ");

export function generateStaticParams() {
  return chapters.map((c) => ({ chuong: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ chuong: string }> }): Promise<Metadata> {
  const { chuong } = await params;
  const c = chapters.find((x) => x.id === chuong);
  return c ? { title: c.title, alternates: { canonical: `${SITE_URL}/cai-tay/${c.id}` } } : {};
}

const pill = "inline-flex h-11 items-center rounded-full px-5 text-subhead font-semibold text-accent-text transition-colors";

export default async function GuidePage({ params }: { params: Promise<{ chuong: string }> }) {
  const { chuong } = await params;
  const i = chapters.findIndex((c) => c.id === chuong);
  if (i < 0) notFound();
  const prev = chapters[i - 1];
  const next = chapters[i + 1];

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 pb-16 sm:pt-24 md:pt-6">
      <BackLink href="/console">{C.back}</BackLink>
      <div className="mt-4">{chuong === "tom-tat" ? <GuideSummary /> : <GuideChapter chapterId={chuong} />}</div>

      <nav aria-label={C.chapterNav} className="mt-12 flex flex-wrap items-center justify-between gap-3">
        {prev ? <Link href={`/cai-tay/${prev.id}`} className={`${pill} hover:bg-accent/10`}>{C.prev}</Link> : <span />}
        {next ? (
          <Link href={`/cai-tay/${next.id}`} className={`${pill} bg-accent/10 hover:bg-accent/15`}>{`${C.next}: ${next.title}`}</Link>
        ) : (
          <Link href="/tao-m1-m4" data-model-only={decodedModels} className={`${pill} bg-accent/10 hover:bg-accent/15`}>{C.makeSet}</Link>
        )}
      </nav>

      <footer className="mt-12 text-footnote text-secondary">
        {C.sources}:{" "}
        {cameraModels.map((m) => (
          <a key={m.id} data-model-only={m.id} className="underline text-accent-text underline-offset-2 hover:opacity-75" href={m.helpGuide}>{`Help Guide ${m.name}`}</a>
        ))}
        {" · "}{C.sourcesTail}
      </footer>
    </div>
  );
}
