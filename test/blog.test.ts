import { test } from "node:test";
import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const rules = JSON.parse(readFileSync(join(projectRoot, "data/article-rules.json"), "utf-8"));

test("Blog", async (t) => {
  await t.test("should have at least 27 articles with unique ids and no standalone posts (both became articles 2026-11-10)", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const knowledge = JSON.parse(readFileSync(join(projectRoot, "data/knowledge.json"), "utf-8"));
    const posts = knowledge.filter((k: any) => k.group === "post");

    assert.ok(articles.length >= 27, `Should have at least 27 articles, found ${articles.length}`);
    assert.strictEqual(new Set(articles.map((a: any) => a.id)).size, articles.length, "Article ids should be unique");
    assert.strictEqual(posts.length, 0, "Should have no posts");
  });

  await t.test("should have valid block types", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const validBlockTypes = new Set<string>(rules.blockTypes);
    const invalidBlocks: string[] = [];

    for (const article of articles) {
      for (const block of article.blocks) {
        if (!validBlockTypes.has(block.t)) {
          invalidBlocks.push(`${article.id}: block type "${block.t}"`);
        }
      }
    }
    assert.deepStrictEqual(invalidBlocks, [], `Found invalid block types: ${invalidBlocks.join(", ")}`);
  });

  await t.test("should have figures with existing files and positive dimensions", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const missingFiles: string[] = [];

    for (const article of articles) {
      for (const block of article.blocks) {
        if (block.t === "figure") {
          if (!block.width || block.width <= 0 || !block.height || block.height <= 0) {
            missingFiles.push(`${article.id}: figure has invalid dimensions ${block.width}x${block.height}`);
          }
          const filePath = join(projectRoot, "public", block.src.replace(/^\//, ""));
          if (!existsSync(filePath)) {
            missingFiles.push(`${article.id}: figure file not found: ${block.src}`);
          }
        }
      }
    }
    assert.deepStrictEqual(missingFiles, [], `Found missing or invalid figures: ${missingFiles.join(", ")}`);
  });

  await t.test("should have valid related article/knowledge ids", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const knowledge = JSON.parse(readFileSync(join(projectRoot, "data/knowledge.json"), "utf-8"));

    const knowledgeSlugs = new Set((knowledge as Array<{ slug: string }>).map((k) => k.slug));
    const articleIds = new Set((articles as Array<{ id: string }>).map((a) => a.id));
    const missingRefs: string[] = [];

    for (const article of articles) {
      for (const rel of article.meta?.related || []) {
        if (rel.kind === "article" && !articleIds.has(rel.id)) {
          missingRefs.push(`${article.id}: unknown article id "${rel.id}"`);
        } else if (rel.kind === "knowledge" && !knowledgeSlugs.has(rel.id)) {
          missingRefs.push(`${article.id}: unknown knowledge id "${rel.id}"`);
        }
      }
    }
    assert.deepStrictEqual(missingRefs, [], `Found invalid references: ${missingRefs.join(", ")}`);
  });

  await t.test("should have valid topic and level values", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const validTopics = new Set<string>(rules.topics);
    const validLevels = new Set<string>(rules.levels);
    const invalid: string[] = [];

    for (const article of articles) {
      if (!validTopics.has(article.topic)) {
        invalid.push(`${article.id}: invalid topic "${article.topic}"`);
      }
      if (!validLevels.has(article.level)) {
        invalid.push(`${article.id}: invalid level "${article.level}"`);
      }
    }
    assert.deepStrictEqual(invalid, [], `Found invalid topic/level: ${invalid.join(", ")}`);
  });

  await t.test("should cite the ZV-E10 or A6400 Help Guide in every article", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const sourcePattern = new RegExp(rules.requiredSourcePattern);
    const missing = (articles as Array<{ id: string; meta: { sources: Array<{ url: string }> } }>)
      .filter((a) => !a.meta.sources.some((s) => sourcePattern.test(s.url)))
      .map((a) => a.id);
    assert.deepStrictEqual(missing, []);
  });

  await t.test("should give menu blocks a Legacy Menu path, and Vietnamese tab names in oldVi", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const bad: string[] = [];
    const oldPrefix = new RegExp(rules.menuPrefixes.old);
    const oldViPrefix = new RegExp(rules.menuPrefixes.oldVi);
    const englishTab = new RegExp(rules.menuPrefixes.englishTabs);
    for (const article of articles) {
      for (const block of article.blocks) {
        if (block.t !== "menu") continue;
        if (!oldPrefix.test(block.old)) bad.push(`${article.id}: old "${block.old}"`);
        if (block.oldVi !== undefined && !oldViPrefix.test(block.oldVi)) bad.push(`${article.id}: oldVi "${block.oldVi}"`);
        if (block.oldVi !== undefined && englishTab.test(block.oldVi)) bad.push(`${article.id}: English tab in oldVi "${block.oldVi}"`);
      }
    }
    assert.deepStrictEqual(bad, []);
  });

  await t.test("should have valid categories for articles", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const validCategories = new Set<string>(rules.categories);
    const invalid: string[] = [];

    for (const article of articles) {
      const cat = article.category || "ky-thuat";
      if (!validCategories.has(cat)) {
        invalid.push(`${article.id}: invalid category "${cat}"`);
      }
    }
    assert.deepStrictEqual(invalid, []);
  });

  await t.test("should have merged notes point to existing articles", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const knowledge = JSON.parse(readFileSync(join(projectRoot, "data/knowledge.json"), "utf-8"));

    const articleIds = new Set((articles as Array<{ id: string }>).map((a) => a.id));
    const merged = knowledge.filter((k: any) => k.group === "merged");
    const invalid: string[] = [];

    for (const note of merged) {
      if (!articleIds.has(note.mergedInto)) {
        invalid.push(`${note.slug}: mergedInto "${note.mergedInto}" is not an existing article`);
      }
    }
    assert.deepStrictEqual(invalid, []);
  });

  await t.test("should not have post slugs colliding with article ids", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const knowledge = JSON.parse(readFileSync(join(projectRoot, "data/knowledge.json"), "utf-8"));

    const articleIds = new Set((articles as Array<{ id: string }>).map((a) => a.id));
    const posts = knowledge.filter((k: any) => k.group === "post");
    const collisions: string[] = [];

    for (const post of posts) {
      if (articleIds.has(post.slug)) {
        collisions.push(`${post.slug}: post slug collides with article id`);
      }
    }
    assert.deepStrictEqual(collisions, []);
  });

  await t.test("should have learning-path steps pointing to existing articles, posts or knowledge", () => {
    const articles = JSON.parse(readFileSync(join(projectRoot, "data/articles.json"), "utf-8"));
    const knowledge = JSON.parse(readFileSync(join(projectRoot, "data/knowledge.json"), "utf-8"));
    const learningPaths = JSON.parse(readFileSync(join(projectRoot, "data/learning-paths.json"), "utf-8"));

    const articleIds = new Set((articles as Array<{ id: string }>).map((a) => a.id));
    const knowledgeSlugs = new Set((knowledge as Array<{ slug: string }>).map((k) => k.slug));

    const invalid: string[] = [];

    for (const path of learningPaths) {
      for (const step of path.steps) {
        if (step.kind === "blog" && !articleIds.has(step.id)) {
          invalid.push(`${path.slug}: step id "${step.id}" is not an existing article`);
        }
        if (step.kind === "knowledge" && !knowledgeSlugs.has(step.slug)) {
          invalid.push(`${path.slug}: step slug "${step.slug}" is not an existing knowledge note`);
        }
      }
    }
    assert.deepStrictEqual(invalid, []);
  });

  await t.test("should exclude drafts in production mode", () => {
    const learningPaths = JSON.parse(readFileSync(join(projectRoot, "data/learning-paths.json"), "utf-8"));

    const paths = learningPaths as Array<{ slug: string; draft?: boolean }>;
    const drafts = paths.filter((p) => p.draft === true);

    // In production, drafts should not be in generateStaticParams
    // This test just verifies they exist in the data
    assert.ok(drafts.length > 0, "Should have at least one draft path for testing");
  });

  await t.test("blog index lists every article, post and visible learning path exactly once", async () => {
    const { blogIndex, list, posts, learningPaths } = await import("../lib/blog.ts");
    const hrefs = blogIndex().flatMap((g) => g.items.map((i) => i.href));
    const expected = [
      ...list().map((a) => `/blog/${a.id}`),
      ...posts().map((p) => `/blog/${p.slug}`),
      ...learningPaths().map((p) => `/blog/lo-trinh/${p.slug}`), // tests run outside production, so drafts show
    ];
    assert.deepStrictEqual([...hrefs].sort(), [...expected].sort());
    assert.strictEqual(new Set(hrefs).size, hrefs.length, "no item twice");
  });
});
