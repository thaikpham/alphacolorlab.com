import type { Metadata } from "next";
import Link from "next/link";
import { help } from "@/app/content";
import { SITE_URL } from "@/lib/site";
import { JsonLdScript } from "@/app/components/JsonLdScript";

export const metadata: Metadata = {
  title: help.title,
  description: help.description,
  alternates: { canonical: new URL("/huong-dan", SITE_URL).href },
};

type Item = { q: string; a: string; link?: { href: string; label: string } };

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: help.sections.flatMap((s) => s.items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))),
};

/** Trang hướng dẫn: câu hỏi thường gặp, mỗi nhóm một thẻ, mỗi câu một dòng mở/đóng (details) */
export default function HelpPage() {
  return (
    <main className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-8">
      <JsonLdScript schema={faqLd} />
      <h1 className="text-display font-light">{help.title}</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {help.sections.map((section) => (
          <section key={section.title} aria-labelledby={`help-${section.title}`} className="self-start">
            <h2 id={`help-${section.title}`} className="mb-3 px-1 text-title3 font-medium">
              {section.title}
            </h2>
            <div className="rounded-card bg-card shadow-card divide-y divide-separator">
              {(section.items as Item[]).map((item) => (
                <details key={item.q} className="disclosure group">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-5 py-3 text-callout font-semibold">
                    {item.q}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-secondary transition-transform duration-200 ease-ios group-open:rotate-180" aria-hidden="true">
                      <path d="M6 8l4 4 4-4" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-body text-label text-pretty">
                    <p>{item.a}</p>
                    {item.link && (
                      <Link href={item.link.href} className="mt-2 inline-flex min-h-11 items-center font-semibold text-accent-text underline underline-offset-4">
                        {item.link.label}
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
