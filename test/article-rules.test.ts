import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { blog } from "../app/content.ts";

const projectRoot = process.cwd();
const rules = JSON.parse(readFileSync(join(projectRoot, "data/article-rules.json"), "utf-8"));
const blogSrc = readFileSync(join(projectRoot, "lib/blog.ts"), "utf-8");

/** Literal union of one field of `export type Article`, e.g. "topic" -> ["af", "exposure", ...]. */
function articleUnion(field: string): string[] {
  const body = blogSrc.match(/export type Article = \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const union = body.match(new RegExp(`readonly ${field}: ((?:'[^']+'\\s*\\|\\s*)*'[^']+')`))?.[1] ?? "";
  return [...union.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

test("article-rules.json", async (t) => {
  await t.test("has a numeric version and lists that match the Article type in lib/blog.ts", () => {
    assert.ok(Number.isInteger(rules.version), "version must be an integer");
    assert.ok(articleUnion("topic").length > 0, "topic union not found in lib/blog.ts");
    assert.ok(articleUnion("level").length > 0, "level union not found in lib/blog.ts");
    assert.deepStrictEqual([...rules.topics].sort(), articleUnion("topic").sort(), "topics differ from Article.topic");
    assert.deepStrictEqual([...rules.levels].sort(), articleUnion("level").sort(), "levels differ from Article.level");
  });

  await t.test("every topic and level has a label in app/content.ts", () => {
    const topicLabels = blog.topics as Record<string, string>;
    const levelLabels = blog.levels as Record<string, string>;
    const missing = [
      ...rules.topics.filter((k: string) => !topicLabels[k]).map((k: string) => `topic ${k}`),
      ...rules.levels.filter((k: string) => !levelLabels[k]).map((k: string) => `level ${k}`),
    ];
    assert.deepStrictEqual(missing, []);
  });

  await t.test("every banned rule has a unique id and a pattern that compiles", () => {
    const lists = [rules.bannedPhrases, rules.faqAnswerBanned, rules.sectionLeadBanned, rules.headingBanned];
    const ids = lists.flat().map((r: { id: string }) => r.id);
    assert.strictEqual(new Set(ids).size, ids.length, "rule ids must be unique");
    for (const r of lists.flat()) {
      assert.doesNotThrow(() => new RegExp(r.pattern, r.flags), `rule ${r.id} does not compile`);
      assert.ok(r.message, `rule ${r.id} has no message`);
    }
  });
});
