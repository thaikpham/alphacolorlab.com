import knowledge from "../data/knowledge.json" with { type: "json" };
import articles from "../data/articles.json" with { type: "json" };
import products from "../data/products.json" with { type: "json" };
import { resolve } from "./wikilinks.ts";
import { parseInline } from "./markdown.ts";

export type NodeKind = "recipe" | "gamma" | "mode" | "note" | "article" | "product";
export interface Node { id: string; kind: NodeKind; label: string }
export interface Edge { source: string; target: string }

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Id of the hub node for a gamma or color mode value: gamma-cine1, mode-s-gamut3-cine. */
export const hubIdFromValue = (key: "gamma" | "color_mode", value: string) => `${key === "gamma" ? "gamma" : "mode"}-${slug(value)}`;

/** Every reader-visible string of an article block (text, captions, list items, FAQ, table cells), so a link counts wherever it sits. */
const blockTexts = (b: any): string[] =>
  [b.text, b.label, b.caption, ...(b.items ?? []).flatMap((i: any) => (typeof i === "string" ? [i] : [i.q, i.a])), ...(b.head ?? []), ...(b.rows ?? []).flat()].filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );

export function generateSiteGraph() {
  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge>();
  const add = (id: string, kind: NodeKind, label: string) => nodes.has(id) || nodes.set(id, { id, kind, label });
  // Ghi chú gộp vào bài viết thì dùng chung nút của bài viết
  const nodeOf = new Map(knowledge.map((k) => [k.slug, (k as { mergedInto?: string }).mergedInto ?? k.slug]));
  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  const link = (x: string, y: string) => {
    const a = nodeOf.get(x) ?? x, b = nodeOf.get(y) ?? y;
    if (a !== b) edges.set([a, b].sort().join(" "), { source: a, target: b });
  };

  // Add all notes, articles (products added only when referenced)
  for (const a of articles) add(a.id, "article", a.title);
  for (const k of knowledge) if (!(k as { mergedInto?: string }).mergedInto) add(k.slug, k.home === "blog" ? "article" : "note", k.title);

  // Note→note links from k.links
  const noteSlug = new Map(knowledge.map((k) => [k.title, k.slug]));
  for (const k of knowledge) for (const t of k.links) {
    const target = noteSlug.get(t);
    if (target) link(k.slug, target);
  }

  // Article→note and article→article from meta.related
  for (const a of articles) {
    if (a.meta?.related) {
      for (const rel of a.meta.related) {
        if (rel.kind === "knowledge") {
          const note = knowledge.find((k) => k.slug === rel.id);
          if (note) link(a.id, note.slug);
        } else if (rel.kind === "article") {
          link(a.id, rel.id);
        }
      }
    }
  }

  // Wikilinks in article blocks and note bodies
  for (const a of articles) {
    for (const block of a.blocks || []) {
      for (const text of blockTexts(block)) {
        const inlines = parseInline(text);
        for (const inline of inlines) {
          if (inline.t === "wiki") {
            const target = resolve(inline.title);
            if (target) {
              const id = target.href.split("/").pop();
              if (id) {
                // Add product node if referenced
                if (productBySlug.has(id)) {
                  const p = productBySlug.get(id)!;
                  add(id, "product", p.name);
                }
                if (nodes.has(id) || nodeOf.has(id)) link(a.id, id);
              }
            }
          }
        }
      }
    }
  }

  for (const k of knowledge) {
    if (k.body) {
      const inlines = parseInline(k.body);
      for (const inline of inlines) {
        if (inline.t === "wiki") {
          const target = resolve(inline.title);
          if (target) {
            const id = target.href.split("/").pop();
            if (id) {
              // Add product node if referenced
              if (productBySlug.has(id)) {
                const p = productBySlug.get(id)!;
                add(id, "product", p.name);
              }
              if (nodes.has(id) || nodeOf.has(id)) link(k.slug, id);
            }
          }
        }
      }
    }
  }

  // Keep only nodes that have edges
  const nodeIds = new Set(edges.values().flatMap((e) => [e.source, e.target]));
  const filtered = [...nodes.entries()].filter(([id]) => nodeIds.has(id)).map(([, n]) => n);

  return { nodes: filtered, edges: [...edges.values()].filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)) };
}
