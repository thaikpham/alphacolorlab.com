import Image from "next/image";
import { Block } from "@/lib/blog";
import { blog, seo } from "@/app/content";
import { RichText } from "./RichText";
import { DataTable } from "./DataTable";

function MenuChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="inline text-tertiary">
      <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-accent-text flex-shrink-0">
      <path d="M13 4l-7.5 8L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function renderMenuPath(path: string): React.ReactNode {
  const segments = path.split(/\s*\u2192\s*/); // dữ liệu nối các mục menu bằng mũi tên U+2192
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {segments.map((seg, i) => (
        <span key={i}>
          {i > 0 && <MenuChevron />}
          <span>{seg}</span>
        </span>
      ))}
    </span>
  );
}

export function ArticleBody({ blocks }: { blocks: readonly Block[] }) {
  if (!blocks.length) return null;

  // Find first figure for priority
  const firstFigureIdx = blocks.findIndex((b) => b.t === "figure");

  return (
    <article className="space-y-5">
      {blocks.map((block, idx) => {
        switch (block.t) {
          case "tldr":
            return (
              <div key={idx} className="rounded-control bg-fill px-4 py-3">
                <div className="text-footnote font-semibold text-secondary mb-2">{blog.detail.tldrLabel}</div>
                <ul className="space-y-1.5">
                  {block.items.map((item, i) => (
                    <li key={i} className="text-subhead text-label">
                      <RichText text={item} />
                    </li>
                  ))}
                </ul>
              </div>
            );

          case "h":
            return (
              <h2 key={idx} className="text-title3 font-medium pt-8 scroll-mt-6" id={`section-${idx}`}>
                <RichText text={block.text} />
              </h2>
            );

          case "p":
            return (
              <p key={idx} className="text-body text-label leading-relaxed">
                <RichText text={block.text} />
              </p>
            );

          case "menu": {
            return (
              <div key={idx} className="rounded-control bg-fill divide-y divide-separator">
                <div className="px-4 py-3">
                  <div className="text-footnote font-medium text-secondary mb-1">{blog.detail.menuOld}</div>
                  <div className="text-subhead text-label">
                    {renderMenuPath(block.oldVi ?? block.old)}
                  </div>
                  {block.oldVi && (
                    <div lang="en" className="mt-1 text-footnote text-secondary">
                      {renderMenuPath(block.old)}
                    </div>
                  )}
                </div>
                <div className="px-4 py-3">
                  <div className="text-footnote font-medium text-secondary mb-1">{blog.detail.menuNew}</div>
                  <div className="text-subhead text-label">
                    {renderMenuPath(block.new)}
                  </div>
                </div>
              </div>
            );
          }

          case "table":
            return <DataTable key={idx} head={block.head} rows={block.rows} caption={block.caption} />;

          case "callout":
            return (
              <div key={idx} className="rounded-control bg-fill px-4 py-3">
                <div className="text-footnote font-semibold text-secondary mb-1">{block.label}</div>
                <div className="text-callout text-label">
                  <RichText text={block.text} />
                </div>
              </div>
            );

          case "compare":
            return (
              <div key={idx} className="rounded-card bg-card shadow-card overflow-hidden">
                <div className="grid grid-cols-2 border-b border-separator">
                  <div className="px-4 py-3 border-r border-separator">
                    <div className="text-footnote font-semibold text-secondary">{block.beforeLabel}</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-footnote font-semibold text-secondary">{block.afterLabel}</div>
                  </div>
                </div>
                {block.caption && (
                  <div className="px-4 py-3 text-footnote text-secondary">
                    <RichText text={block.caption} />
                  </div>
                )}
              </div>
            );

          case "checklist":
            return (
              <div key={idx}>
                <div className="mb-2 px-4 text-footnote font-semibold text-secondary">{block.label}</div>
                <ul className="rounded-card bg-card shadow-card divide-y divide-separator">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="pt-1"><CheckIcon /></span>
                      <span className="text-callout text-label">
                        <RichText text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );

          case "figure": {
            const isFirstFigure = idx === firstFigureIdx;
            const alt = block.alt || block.caption.replace(/ Ảnh:.*$/, "").trim();
            const width = block.width || 800;
            const height = block.height || 600;

            return (
              <figure key={idx} className="space-y-2">
                <div className="relative aspect-[3/2] rounded-card overflow-hidden bg-fill">
                  <Image
                    src={block.src}
                    alt={alt}
                    width={width}
                    height={height}
                    unoptimized={block.src.endsWith(".svg")}
                    loading={isFirstFigure ? "eager" : "lazy"}
                    fetchPriority={isFirstFigure ? "high" : "auto"}
                    sizes="(min-width: 720px) 672px, calc(100vw - 32px)"
                    className="h-full w-full object-contain"
                  />
                </div>
                <figcaption className="text-footnote text-secondary px-1">
                  <RichText text={block.caption} />
                </figcaption>
              </figure>
            );
          }

          case "embed":
            return (
              <div key={idx}>
                <a href={`https://${block.provider}.com/${block.provider === "youtube" ? "watch?v=" : ""}${block.id}`}
                   className="text-footnote text-accent-text underline underline-offset-2 hover:opacity-75"
                   target="_blank" rel="noopener noreferrer">
                  {block.caption}
                </a>
              </div>
            );

          case "faq":
            return (
              <div key={idx} className="space-y-3">
                <h3 className="text-title3 font-medium pt-8">{seo.faqLabel}</h3>
                <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
                  {block.items.map((item, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="text-body font-semibold mb-2">
                        <RichText text={item.q} />
                      </div>
                      <div className="text-callout text-secondary">
                        <RichText text={item.a} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </article>
  );
}
