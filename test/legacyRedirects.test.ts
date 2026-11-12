import { test } from "node:test";
import assert from "node:assert/strict";
import { legacyRedirects } from "../lib/legacyRedirects.ts";
import { list, posts } from "../lib/blog.ts";
import { knowledge, products } from "../lib/wiki.ts";
import presets from "../lib/zve10/presets.json" with { type: "json" };

const redirects = legacyRedirects();

// Every page path this app serves that a redirect may point at.
const pages = new Set([
  "/", "/blog", "/blog/kien-thuc", "/search", "/colors", "/wiki", "/wiki/san-pham/so-sanh", "/tai-khoan",
  ...["console", "colors", "wiki", "blog"].map((app) => `/do-thi/${app}`),
  ...list().map((a) => `/blog/${a.id}`),
  ...posts().map((p) => `/blog/${p.slug}`),
  ...products().map((p) => `/wiki/san-pham/${p.slug}`),
  ...knowledge().filter((n) => n.home === "knowledge").map((n) => `/blog/kien-thuc/${n.slug}`),
  ...knowledge().filter((n) => n.home === "product").map((n) => `/wiki/san-pham/${n.slug}`),
  ...presets.map((p) => `/colors/${p.id}`),
]);

test("every fixed destination is a page of this app", () => {
  for (const r of redirects) if (!r.destination.includes(":")) assert.ok(pages.has(r.destination), `${r.source} → ${r.destination}`);
});

test("pattern destinations only reuse params their source captures", () => {
  for (const r of redirects)
    for (const [, name] of r.destination.matchAll(/:(\w+)/g)) assert.ok(r.source.includes(`:${name}`), `${r.source} → ${r.destination}`);
});

test("no rule shadows a page of this app", () => {
  for (const r of redirects) if (!r.has && !r.source.includes(":")) assert.ok(!pages.has(r.source) || r.source.startsWith("/blog/"), r.source);
  // The only /blog/<id> sources are the removed articles, which must not exist here.
  for (const r of redirects.filter((r) => /^\/blog\/[^:]/.test(r.source))) assert.ok(!pages.has(r.source), r.source);
});

test("no duplicate rules", () => {
  const keys = redirects.map((r) => `${r.source} ${JSON.stringify(r.has ?? null)}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("exact ids come before the section fallbacks", () => {
  const firstFallback = redirects.findIndex((r) => r.source.endsWith(":path*"));
  const lastExact = redirects.findLastIndex((r) => /\/(cameras|learn|recipe)\/[^:]/.test(r.source) || r.source.includes("pp-"));
  assert.ok(lastExact < firstFallback);
});

test("Product Wiki and Blog knowledge move: old wiki URLs land on the new pages", () => {
  const to = (source: string) => redirects.find((r) => r.source === source)?.destination;
  assert.equal(to("/wiki/san-pham"), "/wiki");
  assert.equal(to("/wiki/kien-thuc"), "/blog/kien-thuc");
  assert.equal(to("/wiki/kien-thuc/:path*"), "/blog/kien-thuc/:path*");
  // path-to-regexp has no "$" anchor: a literal "$" makes the rule never match
  for (const r of redirects) assert.ok(!r.source.includes("$"), r.source);
});
