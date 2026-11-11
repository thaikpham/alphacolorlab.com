import { Inlines } from "./RichText";
import { DataTable } from "./DataTable";
import { parseMarkdown } from "@/lib/markdown";

export function Markdown({ body }: { body: string }) {
  const blocks = parseMarkdown(body);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.t) {
          case "h2":
            return (
              <h2 key={i} className="text-title3 font-medium mt-8 mb-3">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="text-body font-semibold mt-6 mb-2">
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="text-body leading-relaxed">
                <Inlines nodes={block.inline} />
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 text-body">
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inlines nodes={item} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal pl-5 space-y-1.5 text-body">
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inlines nodes={item} />
                  </li>
                ))}
              </ol>
            );
          case "table":
            return (
              <DataTable
                key={i}
                head={block.head}
                rows={block.rows}
              />
            );
        }
      })}
    </div>
  );
}
