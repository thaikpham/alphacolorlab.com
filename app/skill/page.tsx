import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { skillFileSize, skillFiles } from "@/lib/skill";
import { skill } from "@/app/content";
import { LinkRow } from "@/app/components/LinkRow";
import { ShareBar } from "@/app/components/Community";

export const metadata: Metadata = {
  title: skill.title,
  description: skill.description,
  alternates: { canonical: `${SITE_URL}/skill` },
};

const card = "rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden";

// Every link here is a raw file served by a route handler, not a page: plain <a> (LinkRow external), no client navigation.
export default function SkillPage() {
  return (
    <main className="min-h-dvh bg-bg text-label">
      <div className="max-w-page mx-auto px-4 sm:px-6 pt-16 pb-8 sm:pt-24">
        <div className="mb-8">
          <h1 className="text-display font-light mb-2">{skill.title}</h1>
          <p className="text-body text-secondary max-w-2xl">{skill.description}</p>
          <p className="mt-2 text-body text-secondary max-w-2xl">{skill.lead}</p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-title3 font-medium mb-3">{skill.use.title}</h2>
            <div className={card}>
              {skill.use.rows.map((r) => (
                <LinkRow key={r.href} href={r.href} title={r.title} detail={r.detail} external />
              ))}
            </div>
          </section>

          <ShareBar title={skill.title} />

          <section>
            <h2 className="text-title3 font-medium mb-3">{skill.files}</h2>
            <div className={card}>
              {skillFiles().map((f) => (
                <LinkRow key={f} href={`/skill/${f}`} title={f} trailing={`${(skillFileSize(f) / 1024).toFixed(1)} KB`} external />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
