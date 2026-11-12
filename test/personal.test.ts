import { test } from "node:test";
import assert from "node:assert/strict";
import { relatedIds, keepRelated } from "../lib/personal.ts";

const edges: [string, string][] = [["cam", "hub"], ["hub", "lens"], ["lens", "far"], ["cam", "post"], ["x", "y"]];

test("personal: relatedIds reaches two hops from the bag and no further", () => {
  assert.deepEqual([...relatedIds(edges, ["cam"])].sort(), ["cam", "hub", "lens", "post"]);
  assert.deepEqual([...relatedIds(edges, ["cam"], 1)].sort(), ["cam", "hub", "post"]);
  assert.equal(relatedIds(edges, ["cam"]).has("far"), false);
  assert.equal(relatedIds(edges, ["cam"]).has("x"), false);
});

test("personal: seeds missing from the graph are ignored", () => {
  assert.equal(relatedIds(edges, ["nope"]).size, 0);
  assert.deepEqual([...relatedIds(edges, ["nope", "x"])].sort(), ["x", "y"]);
});

test("personal: keepRelated never empties a list", () => {
  const items = [{ id: "cam" }, { id: "far" }];
  assert.deepEqual(keepRelated(items, (i) => i.id, new Set(["cam"])), [{ id: "cam" }]);
  assert.equal(keepRelated(items, (i) => i.id, new Set(["other"])), items);
  assert.equal(keepRelated(items, (i) => i.id, null), items);
  assert.equal(keepRelated(items, (i) => i.id, new Set()), items);
});

test("personal: a camera in the combined graph reaches its guide chapters and blog posts", async () => {
  const { allGraph } = await import("../lib/appGraphs.ts");
  const g = allGraph();
  const ids = relatedIds(g.edges, ["a7c-ii"]);
  const apps = new Set(g.nodes.filter((n) => ids.has(n.id)).map((n) => n.app));
  assert.ok(ids.size > 50 && ids.size < g.nodes.length, `reach ${ids.size}/${g.nodes.length}`);
  for (const app of ["console", "blog", "wiki"]) assert.ok(apps.has(app as never), app);
});
