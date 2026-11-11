import { test } from "node:test";
import assert from "node:assert/strict";
import { buildThreads, PAGE_KEY, shareLinks, type Comment } from "../lib/comments.ts";
import { list, posts, learningPaths, knowledge } from "../lib/blog.ts";
import products from "../data/products.json" with { type: "json" };
import presets from "../lib/zve10/presets.json" with { type: "json" };

const c = (id: string, parent: string | null, minute: number): Comment => ({
  id, parent_id: parent, user_id: "u", author_name: "A", author_avatar: null, body: id, like_count: 0, liked: false,
  created_at: `2026-11-08T10:${String(minute).padStart(2, "0")}:00Z`,
});

test("comments: newest thread first, replies in writing order, nested under their parent", () => {
  const threads = buildThreads([c("r2", "a", 4), c("a", null, 1), c("b", null, 2), c("r1", "a", 3), c("r1x", "r1", 5)]);
  assert.deepEqual(threads.map((t) => t.id), ["b", "a"]);
  assert.deepEqual(threads[1].replies.map((t) => t.id), ["r1", "r2"]);
  assert.deepEqual(threads[1].replies[0].replies.map((t) => t.id), ["r1x"]);
  assert.deepEqual(buildThreads([c("lost", "gone", 1)]).map((t) => t.id), ["lost"], "a reply whose parent is missing still shows");
});

test("comments: every page key the site sends passes the database check", () => {
  const keys = [
    ...products.map((p) => `product/${p.slug}`),
    ...presets.map((p) => `recipe/${p.id}`),
    ...list().map((a) => `post/${a.id}`),
    ...posts().map((p) => `post/${p.slug}`),
    ...learningPaths().map((p) => `path/${p.slug}`),
    ...knowledge().map((n) => `note/${n.slug}`),
  ];
  for (const k of keys) assert.match(k, PAGE_KEY);
});

test("share: Facebook and Threads links carry the page URL", () => {
  const l = shareLinks("https://example.test/blog/bo-cuc", "Bố cục");
  assert.equal(l.facebook, "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.test%2Fblog%2Fbo-cuc");
  assert.ok(l.threads.startsWith("https://www.threads.com/intent/post?text=") && l.threads.includes(encodeURIComponent("https://example.test/blog/bo-cuc")));
});
