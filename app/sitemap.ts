import type { MetadataRoute } from "next";
// Relative imports so test/seo.test.ts can run this file under plain node.
import { SITE_URL } from "../lib/site.ts";
import { list, posts, publishedLearningPaths } from "../lib/blog.ts";
import { entryHref, knowledge, productHref, products } from "../lib/wiki.ts";
import presets from "../lib/zve10/presets.json" with { type: "json" };
import { sections } from "../app/content.ts";

type Entry = [path: string, priority: number, lastModified?: string];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: Entry[] = [
    ["/", 1],
    ["/huong-dan", 0.8],
    ...sections.map((s): Entry => [`/cai-tay/${s.id}`, 0.7]),
    ["/cai-tay/tom-tat", 0.7],
    ["/tao-m1-m4", 0.7],
    ["/colors", 0.8],
    ...presets.map((p): Entry => [`/colors/${p.id}`, 0.6]),
    ["/wiki", 0.8],
    ...products().map((p): Entry => [productHref(p.slug), 0.6]),
    ["/wiki/san-pham/so-sanh", 0.6],
    ["/blog", 0.8],
    ["/blog/kien-thuc", 0.7],
    // Notes merged into an article live at that article's URL, already listed below.
    ...knowledge().filter((n) => n.home === "knowledge").map((n): Entry => [entryHref(n.slug), 0.6]),
    ...list().map((a): Entry => [`/blog/${a.id}`, 0.7, a.updatedAt]),
    ...posts().map((p): Entry => [`/blog/${p.slug}`, 0.6]),
    ...publishedLearningPaths().map((p): Entry => [`/blog/lo-trinh/${p.slug}`, 0.6]),
    ["/search", 0.4],
    ["/skill", 0.5],
  ];
  return entries.map(([path, priority, lastModified]) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    priority,
    ...(lastModified && { lastModified }),
  }));
}
