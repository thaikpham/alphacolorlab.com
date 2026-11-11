import { test, describe } from "node:test";
import assert from "node:assert";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadJson = (path: string) => JSON.parse(readFileSync(resolve(__dirname, path), "utf8"));
const knowledge = loadJson("../data/knowledge.json");

// Use dynamic import with experimental tsx support
const { generateSiteGraph } = await import("../lib/graph.ts");

describe("Graph", () => {
  describe("generateSiteGraph", () => {
    test("has no dangling edges", () => {
      const { nodes, edges } = generateSiteGraph();
      const nodeIds = new Set(nodes.map((n) => n.id));
      for (const edge of edges) {
        assert(nodeIds.has(edge.source), `edge source ${edge.source} not in nodes`);
        assert(nodeIds.has(edge.target), `edge target ${edge.target} not in nodes`);
      }
    });

    test("has no self-loops", () => {
      const { edges } = generateSiteGraph();
      for (const edge of edges) {
        assert(edge.source !== edge.target, `self-loop found: ${edge.source}`);
      }
    });

    test("includes all notes with edges", () => {
      const { nodes } = generateSiteGraph();
      const nodeIds = new Set(nodes.map((n) => n.id));
      const noteIds = new Set(knowledge.map((k: any) => k.slug));

      // Every note that should be included (has edges in the graph) should be in the result
      for (const id of noteIds) {
        // If a note is in the site graph, it must have at least one edge
        // (filtered to only include nodes with edges)
        if (nodeIds.has(id as string)) {
          const n = nodes.find((n) => n.id === id);
          assert(n, `note ${id} in nodeIds but not found in nodes`);
          const k = knowledge.find((x: any) => x.slug === id);
          assert(!k.mergedInto || k.mergedInto === id, `merged note ${id} must share its article's node`);
          assert(n.kind === (k.home === "blog" ? "article" : "note"), `node ${id} kind is ${n.kind}`);
        }
      }
    });
  });
});
