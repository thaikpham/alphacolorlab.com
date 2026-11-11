import Link from "next/link";
import { parseInline, type Inline } from "@/lib/markdown";
import { resolve } from "@/lib/wikilinks";

const link = "text-accent-text underline underline-offset-2";

/** Render inline nodes (bold, em, links, wikilinks) as JSX. */
export function Inlines({ nodes }: { nodes: readonly Inline[] }) {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.text;
      case "strong":
        return <strong key={i} className="font-semibold">{n.text}</strong>;
      case "em":
        return <em key={i}>{n.text}</em>;
      case "link":
        return <a key={i} href={n.href} className={link}>{n.text}</a>;
      case "wiki": {
        const target = resolve(n.title);
        return target ? <Link key={i} href={target.href} className={link}>{n.display}</Link> : n.display;
      }
    }
  });
}

/** Inline markdown (**đậm**, *nghiêng*, [chữ](url), [[wikilink]]) thành JSX. Wikilink chưa có trang thì giữ chữ thường. */
export function RichText({ text }: { text: string }) {
  return <Inlines nodes={parseInline(text)} />;
}
