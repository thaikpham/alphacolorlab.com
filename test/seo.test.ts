import { test } from "node:test";
import assert from "node:assert/strict";
import sitemap from "../app/sitemap.ts";
import robots from "../app/robots.ts";
import { SITE_URL } from "../lib/site.ts";
import { articleLd, breadcrumbLd, faqLd, leadImage, webSiteLd } from "../lib/jsonld.ts";
import { list, posts, publishedLearningPaths } from "../lib/blog.ts";
import { products } from "../lib/wiki.ts";

const urls = sitemap().map((e) => e.url);

test("sitemap: absolute, unique, every article, post, path and product", () => {
  assert.equal(new Set(urls).size, urls.length);
  for (const u of urls) assert.ok(u.startsWith(SITE_URL), u);
  const expected = [
    ...list().map((a) => `/blog/${a.id}`),
    ...posts().map((p) => `/blog/${p.slug}`),
    ...publishedLearningPaths().map((p) => `/blog/lo-trinh/${p.slug}`),
    ...products().map((p) => `/wiki/san-pham/${p.slug}`),
    "/skill",
  ];
  for (const path of expected) assert.ok(urls.includes(`${SITE_URL}${path}`), path);
  assert.ok(!urls.some((u) => u.includes("/admin")));
});

test("robots: only /admin is blocked (Lighthouse is-crawlable must pass everywhere else)", () => {
  const r = robots();
  assert.deepEqual((r.rules as { disallow: string[] }).disallow, ["/admin"]);
  assert.equal(r.sitemap, `${SITE_URL}/sitemap.xml`);
});

test("article JSON-LD: absolute URLs, every photo as image, dates", () => {
  const blocks = [{ t: "p" }, { t: "figure", src: "/blog/a.jpg" }, { t: "figure", src: "/blog/b.jpg" }];
  const ld = articleLd({ title: "T", description: "D", path: "/blog/x", blocks, updatedAt: "2026-11-08", authorName: "A" });
  assert.deepEqual(ld.image, [`${SITE_URL}/blog/a.jpg`, `${SITE_URL}/blog/b.jpg`]);
  assert.equal(ld.mainEntityOfPage, `${SITE_URL}/blog/x`);
  assert.equal(ld.dateModified, "2026-11-08");
  assert.equal(ld.datePublished, "2026-11-08");
  assert.deepEqual(ld.author, { "@type": "Person", name: "A" });
  assert.equal(leadImage([]), undefined);
});

test("article JSON-LD: SVG diagrams are skipped for the image, single photo stays a string", () => {
  const svgOnly = [{ t: "figure", src: "/blog/x-d1.svg" }];
  assert.equal(leadImage(svgOnly), undefined);
  assert.equal(articleLd({ title: "T", description: "D", path: "/blog/x", blocks: svgOnly }).image, undefined);

  const onePhoto = [{ t: "figure", src: "/blog/x-d1.svg" }, { t: "figure", src: "/blog/x.jpg" }];
  assert.equal(leadImage(onePhoto), `${SITE_URL}/blog/x.jpg`);
  assert.equal(articleLd({ title: "T", description: "D", path: "/blog/x", blocks: onePhoto }).image, `${SITE_URL}/blog/x.jpg`);
});

test("FAQPage: plain-text answers, null without a faq block", () => {
  const ld = faqLd([{ t: "faq", items: [{ q: "Vì sao [[ISO]] cao?", a: "**Nhiễu** tăng vì [[Tam giác phơi sáng|phơi sáng]]." }] }]);
  assert.equal(ld?.mainEntity[0].name, "Vì sao ISO cao?");
  assert.equal(ld?.mainEntity[0].acceptedAnswer.text, "Nhiễu tăng vì phơi sáng.");
  assert.equal(faqLd([{ t: "p" }]), null);
});

test("breadcrumbs start at home with positions 1..n", () => {
  const ld = breadcrumbLd(["Blog", "/blog"], ["Bài", "/blog/x"]);
  assert.deepEqual(ld.itemListElement.map((i) => [i.position, i.item]), [
    [1, `${SITE_URL}/`],
    [2, `${SITE_URL}/blog`],
    [3, `${SITE_URL}/blog/x`],
  ]);
});

test("every article headline fits Google's 110-character limit", () => {
  for (const a of list()) assert.ok(a.title.length <= 110, a.id);
});

test("site search action uses the schema.org query-input property", () => {
  assert.equal(webSiteLd().potentialAction["query-input"], "required name=search_term_string");
});
