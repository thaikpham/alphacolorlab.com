import { describe, it } from "node:test";
import assert from "node:assert";
import { consoleGraph, colorsGraph, wikiGraph, blogGraph, graphFor } from "../lib/appGraphs.ts";
import { sections } from "../app/content.ts";
import { products } from "../lib/wiki.ts";
import presets from "../lib/zve10/presets.ts";
import { RADIUS } from "../lib/layout3d.ts";

describe("appGraphs", () => {
  const graphs = [
    { name: "console", builder: consoleGraph },
    { name: "colors", builder: colorsGraph },
    { name: "wiki", builder: wikiGraph },
    { name: "blog", builder: blogGraph },
  ];

  graphs.forEach(({ name, builder }) => {
    describe(name, () => {
      let graph: ReturnType<typeof builder>;
      let buildTime: number;

      it("builds in < 2000ms", () => {
        const start = performance.now();
        graph = builder();
        buildTime = performance.now() - start;
        assert(buildTime < 2000, `${name} took ${buildTime.toFixed(1)}ms`);
        console.log(`  ${name}: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${buildTime.toFixed(1)}ms`);
      });

      it("has unique node ids", () => {
        const ids = graph.nodes.map((n) => n.id);
        const unique = new Set(ids);
        assert.strictEqual(
          ids.length,
          unique.size,
          `Duplicate ids: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(", ")}`,
        );
      });

      it("every edge endpoint exists", () => {
        const nodeIds = new Set(graph.nodes.map((n) => n.id));
        const missing = graph.edges.filter(([a, b]) => !nodeIds.has(a) || !nodeIds.has(b));
        assert.strictEqual(
          missing.length,
          0,
          `Missing endpoints: ${missing.map((e) => e.join(" → ")).join("; ")}`,
        );
      });

      it("has no duplicate or self edges", () => {
        const seen = new Set<string>();
        const dupes = [];
        for (const [a, b] of graph.edges) {
          if (a === b) {
            dupes.push(`self-edge ${a}`);
          }
          const key = [a, b].sort().join("|");
          if (seen.has(key)) {
            dupes.push(`duplicate ${a} ↔ ${b}`);
          }
          seen.add(key);
        }
        assert.strictEqual(dupes.length, 0, dupes.join("; "));
      });

      it("every node has ≥1 edge", () => {
        const nodeIds = new Set(graph.nodes.map((n) => n.id));
        const edgeNodes = new Set<string>();
        for (const [a, b] of graph.edges) {
          edgeNodes.add(a);
          edgeNodes.add(b);
        }
        const isolated = [...nodeIds].filter((id) => !edgeNodes.has(id));
        assert.strictEqual(isolated.length, 0, `Isolated nodes: ${isolated.join(", ")}`);
      });

      it("coordinates are finite and within RADIUS+1", () => {
        const bad = graph.nodes.filter(
          (n) => !Number.isFinite(n.x) || !Number.isFinite(n.y) || !Number.isFinite(n.z),
        );
        assert.strictEqual(bad.length, 0, `Non-finite coordinates: ${bad.map((n) => n.id).join(", ")}`);

        const outOfBounds = graph.nodes.filter((n) => Math.hypot(n.x, n.y, n.z) > RADIUS + 1);
        assert.strictEqual(outOfBounds.length, 0, `Out of bounds: ${outOfBounds.map((n) => n.id).join(", ")}`);
      });

      it("is deterministic", () => {
        const graph2 = builder();
        const ids1 = graph.nodes.map((n) => n.id).sort();
        const ids2 = graph2.nodes.map((n) => n.id).sort();
        assert.deepStrictEqual(ids1, ids2, "Node ids differ");

        const edges1 = graph.edges.map((e) => [e[0], e[1]].sort().join("|")).sort();
        const edges2 = graph2.edges.map((e) => [e[0], e[1]].sort().join("|")).sort();
        assert.deepStrictEqual(edges1, edges2, "Edges differ");

        // Check that coordinates are stable (same nodes have same coords)
        for (const n1 of graph.nodes) {
          const n2 = graph2.nodes.find((n) => n.id === n1.id);
          assert(n2, `Node ${n1.id} not in second build`);
          assert.strictEqual(n1.x, n2.x, `x differs for ${n1.id}`);
          assert.strictEqual(n1.y, n2.y, `y differs for ${n1.id}`);
          assert.strictEqual(n1.z, n2.z, `z differs for ${n1.id}`);
        }
      });

      it("app field is correct", () => {
        assert.strictEqual(graph.app, name);
      });
    });
  });

  describe("consoleGraph specifics", () => {
    const graph = consoleGraph();

    it("contains the 3 guide camera slugs", () => {
      const cameraIds = new Set(graph.nodes.filter((n) => n.kind === "camera").map((n) => n.id));
      assert(cameraIds.has("zv-e10"), "zv-e10 not found");
      assert(cameraIds.has("a6400"), "a6400 not found");
      assert(cameraIds.has("a7c-ii"), "a7c-ii not found");
      assert.strictEqual(cameraIds.size, 3, `Expected 3 cameras, got ${cameraIds.size}`);
    });

    it("contains all chapter ids", () => {
      const chapterIds = new Set(graph.nodes.filter((n) => n.kind === "chapter").map((n) => n.id));
      for (const section of sections) {
        assert(chapterIds.has(section.id), `Missing chapter ${section.id}`);
      }
      assert(chapterIds.has("tom-tat"), "Missing summary chapter");
    });

    it("contains all step ids with correct section", () => {
      const stepIds = new Set(graph.nodes.filter((n) => n.kind === "step").map((n) => n.id));
      for (const section of sections) {
        for (const step of section.steps) {
          const stepId = `step-${section.id}-${step.n}`;
          assert(stepIds.has(stepId), `Missing step ${stepId}`);
        }
      }
    });

    it("contains the M1–M4 tool", () => {
      const toolIds = new Set(graph.nodes.filter((n) => n.kind === "tool").map((n) => n.id));
      assert(toolIds.has("tao-m1-m4"), "Missing M1–M4 tool");
    });

    it("chapter hrefs match section ids", () => {
      for (const node of graph.nodes) {
        if (node.kind === "chapter" && node.id !== "tom-tat") {
          const sectionId = node.id;
          assert(sections.some((s) => s.id === sectionId), `Chapter ${node.id} has invalid section`);
          assert.strictEqual(node.href, `/cai-tay/${sectionId}`);
        } else if (node.id === "tom-tat") {
          assert.strictEqual(node.href, "/cai-tay/tom-tat");
        }
      }
    });

    it("tool hrefs are correct", () => {
      const m1m4 = graph.nodes.find((n) => n.id === "tao-m1-m4");
      assert.strictEqual(m1m4?.href, "/tao-m1-m4");
      const shared = graph.nodes.find((n) => n.id === "bo-m1-m4");
      assert.strictEqual(shared?.href, "/bo-m1-m4");
      assert(graph.edges.some((e) => (e[0] === "zv-e10" && e[1] === "bo-m1-m4") || (e[1] === "zv-e10" && e[0] === "bo-m1-m4")), "Bộ M1–M4 chia sẻ không nối với ZV-E10");
    });

    it("camera node ids match product slugs", () => {
      for (const node of graph.nodes) {
        if (node.kind === "camera") {
          assert(products().some((p) => p.slug === node.id), `Camera node ${node.id} not in products`);
        }
      }
    });

    it("step hrefs point to chapter pages", () => {
      for (const node of graph.nodes) {
        if (node.kind === "step") {
          const match = node.id.match(/^step-(.+)-(\d+)$/);
          assert(match, `Step id ${node.id} doesn't match pattern`);
          assert.strictEqual(node.href, `/cai-tay/${match[1]}`);
        }
      }
    });

    it("M1–M4 tool is linked to PP1 step", () => {
      const hasEdge = graph.edges.some((e) => (e[0] === "tao-m1-m4" && e[1] === "step-mau-da-14") || (e[0] === "step-mau-da-14" && e[1] === "tao-m1-m4"));
      assert(hasEdge, "M1–M4 tool not linked to PP1 step");
    });

    it("M1–M4 tool is only linked to ZV-E10 camera", () => {
      const m1m4Edges = graph.edges.filter(
        (e) =>
          (e[0] === "tao-m1-m4" && e[1].startsWith("")) ||
          (e[1] === "tao-m1-m4" && (e[0] === "zv-e10" || e[0] === "a6400" || e[0] === "a7c-ii")),
      );
      const cameraEdges = m1m4Edges.filter((e) => ["zv-e10", "a6400", "a7c-ii"].includes(e[0]) || ["zv-e10", "a6400", "a7c-ii"].includes(e[1]));
      assert(
        cameraEdges.every((e) => e[0] === "zv-e10" || e[1] === "zv-e10"),
        "M1–M4 tool linked to camera other than ZV-E10",
      );
    });
  });

  describe("colorsGraph specifics", () => {
    const graph = colorsGraph();

    it("contains all preset recipe nodes", () => {
      const recipeIds = new Set(graph.nodes.filter((n) => n.kind === "recipe").map((n) => n.id));
      for (const preset of presets) {
        assert(recipeIds.has(preset.id), `Missing preset ${preset.id}`);
      }
      assert.strictEqual(recipeIds.size, presets.length);
    });

    it("recipe labels strip the PP-###- prefix", () => {
      for (const node of graph.nodes) {
        if (node.kind === "recipe") {
          const preset = presets.find((p) => p.id === node.id);
          const expectedLabel = preset!.name.replace(/^[A-Z]{2}-\d{3}-/, "");
          assert.strictEqual(node.label, expectedLabel, `Recipe ${node.id} label incorrect`);
          assert(!node.label.match(/^[A-Z]{2}-\d{3}-/), `Recipe ${node.id} label still has prefix`);
        }
      }
    });

    it("recipe hrefs use /colors/<preset id>", () => {
      for (const node of graph.nodes) {
        if (node.kind === "recipe") {
          assert.strictEqual(node.href, `/colors/${node.id}`);
        }
      }
    });

    it("gamma and color mode hubs have no href", () => {
      for (const node of graph.nodes) {
        if (node.kind === "gamma" || node.kind === "mode") {
          assert(!node.href, `Hub ${node.id} should not have href`);
          assert(node.hub, `Hub ${node.id} should be marked hub`);
        }
      }
    });

    it("white balance note has entryHref", () => {
      const wbNode = graph.nodes.find((n) => n.id === "can-bang-trang-va-nhiet-do-mau");
      assert(wbNode, "WB note not found");
      assert.strictEqual(wbNode.href, "/blog/kien-thuc/can-bang-trang-va-nhiet-do-mau");
      assert(wbNode.hub, "WB note should be hub");
    });

    it("every recipe is linked to its gamma hub", () => {
      for (const preset of presets) {
        const gammaHubId = `gamma-${preset.pp.gamma.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const hasEdge = graph.edges.some(
          (e) =>
            (e[0] === preset.id && e[1] === gammaHubId) ||
            (e[0] === gammaHubId && e[1] === preset.id),
        );
        assert(hasEdge, `Recipe ${preset.id} not linked to gamma hub`);
      }
    });

    it("every recipe is linked to its color mode hub", () => {
      for (const preset of presets) {
        const modeHubId = `mode-${preset.pp.color_mode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const hasEdge = graph.edges.some(
          (e) =>
            (e[0] === preset.id && e[1] === modeHubId) ||
            (e[0] === modeHubId && e[1] === preset.id),
        );
        assert(hasEdge, `Recipe ${preset.id} not linked to mode hub`);
      }
    });

    it("every recipe is linked to WB note", () => {
      const wbNoteId = "can-bang-trang-va-nhiet-do-mau";
      for (const preset of presets) {
        const hasEdge = graph.edges.some(
          (e) =>
            (e[0] === preset.id && e[1] === wbNoteId) ||
            (e[0] === wbNoteId && e[1] === preset.id),
        );
        assert(hasEdge, `Recipe ${preset.id} not linked to WB note`);
      }
    });
  });

  describe("wikiGraph specifics", () => {
    const graph = wikiGraph();

    it("contains all products", () => {
      const allProducts = products();
      const nodeIds = new Set(graph.nodes.filter((n) => n.kind === "camera" || n.kind === "lens" || n.kind === "accessory").map((n) => n.id));
      for (const product of allProducts) {
        assert(nodeIds.has(product.slug), `Product ${product.slug} not in graph`);
      }
    });

    it("product node ids equal product slugs", () => {
      const allProducts = products();
      for (const node of graph.nodes) {
        if (node.kind === "camera" || node.kind === "lens" || node.kind === "accessory") {
          const product = allProducts.find((p) => p.slug === node.id);
          assert(product, `Product node ${node.id} not in products.json`);
          assert.strictEqual(node.label, product.name, `Label mismatch for ${node.id}`);
        }
      }
    });

    it("camera group hubs have correct labels", () => {
      const expected = new Map([
        ["hub-camera-aps-c", "Body APS-C"],
        ["hub-camera-full-frame", "Body full-frame"],
        ["hub-camera-compact", "Máy compact"],
      ]);
      for (const [hubId, label] of expected) {
        const node = graph.nodes.find((n) => n.id === hubId);
        if (node) {
          assert.strictEqual(node.label, label, `Hub ${hubId} label incorrect`);
          assert(node.hub, `Hub ${hubId} should be marked hub`);
        }
      }
    });

    it("lens format hubs have correct labels", () => {
      const expected = new Map([
        ["hub-lens-aps-c", "Ống kính APS-C"],
        ["hub-lens-full-frame", "Ống kính full-frame"],
      ]);
      for (const [hubId, label] of expected) {
        const node = graph.nodes.find((n) => n.id === hubId);
        if (node) {
          assert.strictEqual(node.label, label, `Hub ${hubId} label incorrect`);
          assert(node.hub, `Hub ${hubId} should be marked hub`);
        }
      }
    });

    it("product nodes have productHref or no href for hubs", () => {
      for (const node of graph.nodes) {
        if (node.kind === "camera" || node.kind === "lens" || node.kind === "accessory") {
          assert(node.href?.startsWith("/wiki/"), `Product ${node.id} has invalid href: ${node.href}`);
        } else if (node.hub) {
          assert(!node.href, `Hub ${node.id} should not have href`);
        }
      }
    });

    it("battery hubs connect cameras sharing battery", () => {
      const allProducts = products();
      const batteries = new Map<string, string[]>();
      for (const product of allProducts) {
        if (product.kind === "camera" && product.specs?.battery) {
          if (!batteries.has(product.specs.battery)) {
            batteries.set(product.specs.battery, []);
          }
          batteries.get(product.specs.battery)!.push(product.slug);
        }
      }
      for (const [battery, slugs] of batteries) {
        if (slugs.length > 1) {
          const hubId = `hub-battery-${battery.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          const hubNode = graph.nodes.find((n) => n.id === hubId);
          assert(hubNode, `Battery hub ${hubId} not found for ${battery}`);
          for (const slug of slugs) {
            const hasEdge = graph.edges.some(
              (e) =>
                (e[0] === slug && e[1] === hubId) ||
                (e[0] === hubId && e[1] === slug),
            );
            assert(hasEdge, `Camera ${slug} not linked to battery hub ${hubId}`);
          }
        }
      }
    });
  });

  describe("blogGraph specifics", () => {
    const graph = blogGraph();

    it("article nodes have /blog/ hrefs", () => {
      for (const node of graph.nodes) {
        if (node.kind === "article") {
          assert(node.href?.startsWith("/blog/"), `Article ${node.id} has invalid href: ${node.href}`);
        }
      }
    });

    it("knowledge note nodes have entryHref", () => {
      for (const node of graph.nodes) {
        if (node.kind === "note") {
          assert(node.href?.startsWith("/blog/"), `Note ${node.id} has invalid href: ${node.href}`);
          assert(node.hub, `Note ${node.id} should be marked hub`);
        }
      }
    });

    it("product nodes have productHref", () => {
      const allProducts = products();
      for (const node of graph.nodes) {
        if (node.kind === "product") {
          assert(node.href?.startsWith("/wiki/"), `Product ${node.id} has invalid href: ${node.href}`);
          const product = allProducts.find((p) => p.slug === node.id);
          assert(product, `Product node ${node.id} not in products.json`);
        }
      }
    });

    it("hubs are marked correctly", () => {
      for (const node of graph.nodes) {
        if (node.kind === "note") {
          assert(node.hub, `Knowledge note ${node.id} should be hub`);
        }
      }
      // Products mentioned by >= 6 articles/notes are hubs; articles stay leaves
      const degree = new Map<string, number>();
      for (const node of graph.nodes) {
        degree.set(node.id, 0);
      }
      for (const [a, b] of graph.edges) {
        degree.set(a, (degree.get(a) ?? 0) + 1);
        degree.set(b, (degree.get(b) ?? 0) + 1);
      }
      for (const node of graph.nodes) {
        if (node.kind === "product") assert.equal(!!node.hub, (degree.get(node.id) ?? 0) >= 6, `Product ${node.id} hub flag`);
        if (node.kind === "article") assert(!node.hub, `Article ${node.id} should be a leaf`);
      }
    });
  });

  describe("graphFor", () => {
    it("returns correct graph for each app", () => {
      assert.strictEqual(graphFor("console").app, "console");
      assert.strictEqual(graphFor("colors").app, "colors");
      assert.strictEqual(graphFor("wiki").app, "wiki");
      assert.strictEqual(graphFor("blog").app, "blog");
    });

    it("returns same instance on multiple calls", () => {
      const g1 = graphFor("console");
      const g2 = graphFor("console");
      assert.strictEqual(g1, g2);
    });
  });
});
