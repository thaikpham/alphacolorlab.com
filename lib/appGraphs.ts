import type { AppId, CGraph, CNode, CEdge } from "./constellation.ts";
import { layout3d } from "./layout3d.ts";
import { generateSiteGraph } from "./graph.ts";
import { hubIdFromValue } from "./hubId.ts";
import { entryHref, productHref, products } from "./wiki.ts";
import { sections, sonyBodies, cameraModels, colorBank, wiki } from "../app/content.ts";
import { fold } from "./fold.ts";
import presets from "./zve10/presets.ts";

// Sony gọi GM là G Master trên trang sản phẩm
const SERIES_LABELS: Record<string, string> = { GM: "G Master", G: "Ống kính G", ZEISS: "ZEISS" };

/**
 * Alpha Console: Sections (chapters) as hubs, cameras, steps, and tools.
 * Data: sections + sonyBodies + cameraModels from content.ts.
 * Cameras are the 3 guide cameras linked to chapters.
 * Steps are linked to their chapter. Model-restricted steps linked to their camera.
 */
function buildConsoleGraph(): CGraph {
  const edges: CEdge[] = [];
  const nodeMap = new Map<string, CNode>();

  // Helper to add node with lazy initialization
  const addNode = (id: string, label: string, kind: string, hub?: boolean, href?: string) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label, kind, hub, href, x: 0, y: 0, z: 0 });
    }
  };

  const addEdge = (a: string, b: string) => {
    edges.push([a, b]);
  };

  // Map camera codes to slugs
  const codeToSlug = new Map<string, string>();
  for (const body of sonyBodies) {
    if (body.id) {
      const product = products().find((p) => p.code === body.code);
      if (product) {
        codeToSlug.set(body.id, product.slug);
      }
    }
  }

  // Add the 3 guide cameras as hubs
  const cameraIds = ["zv-e10", "a6400", "a7c-ii"]; // From sonyBodies with id field
  for (const modelId of ["zve10", "a6400", "a7c2"] as const) {
    const cameraModel = cameraModels.find((m) => m.id === modelId);
    if (cameraModel) {
      const slug = codeToSlug.get(modelId);
      if (slug) {
        addNode(slug, cameraModel.name, "camera", true, productHref(slug));
      }
    }
  }

  // Add chapter hubs
  for (const section of sections) {
    const chapterId = section.id;
    addNode(chapterId, section.title, "chapter", true, `/cai-tay/${section.id}`);
  }

  // Add summary chapter
  addNode("tom-tat", "Tóm tắt", "chapter", true, "/cai-tay/tom-tat");

  // Add tool hubs
  addNode("tao-m1-m4", "Tạo bộ M1–M4", "tool", true, "/tao-m1-m4");
  addNode("bo-m1-m4", "Bộ M1–M4 chia sẻ", "tool", true, "/bo-m1-m4");
  addNode("giai-ma", "Giải mã", "tool", true, "/giai-ma");

  // Add steps
  for (const section of sections) {
    for (const step of section.steps) {
      const stepId = `step-${section.id}-${step.n}`;
      addNode(stepId, step.title, "step", false, `/cai-tay/${section.id}`);
    }
  }

  // Add edges: cameras to chapters (all)
  for (const cameraId of cameraIds) {
    for (const section of sections) {
      const chapterId = section.id;
      addEdge(cameraId, chapterId);
    }
    // Also link cameras to the summary chapter
    addEdge(cameraId, "tom-tat");
  }

  // Add edges: chapters to their steps, and camera→step for model-restricted steps
  for (const section of sections) {
    const chapterId = section.id;
    for (const step of section.steps) {
      const stepId = `step-${section.id}-${step.n}`;
      addEdge(chapterId, stepId);

      // Model-specific edges: camera→step
      if (step.only) {
        for (const modelId of step.only) {
          const slug = codeToSlug.get(modelId);
          if (slug) {
            addEdge(slug, stepId);
          }
        }
      }
    }
  }

  // Add edges: cameras to tools
  for (const cameraId of cameraIds) {
    // M1–M4 tool linked to ZV-E10 only (decoded: true)
    if (cameraId === "zv-e10") {
      addEdge(cameraId, "tao-m1-m4");
      addEdge(cameraId, "bo-m1-m4");
    }
    // Giải mã tool linked to all 3 cameras
    addEdge(cameraId, "giai-ma");
  }

  // Link M1–M4 tool to PP1 step (step n=14 in mau-da section)
  addEdge("tao-m1-m4", "step-mau-da-14");
  // Bộ chia sẻ nạp vào trang tạo bộ (/tao-m1-m4?set=<id>)
  addEdge("bo-m1-m4", "tao-m1-m4");

  // Collect nodes in order
  const nodesList = Array.from(nodeMap.values());

  // Apply layout3d
  const layoutNodes = layout3d(nodesList, edges);

  return {
    app: "console",
    nodes: layoutNodes,
    edges,
  };
}

/**
 * Color Bank: Recipes linked to gamma/color mode hubs and white balance note.
 * Data: presets from lib/zve10/presets.ts.
 */
function buildColorsGraph(): CGraph {
  const edges: CEdge[] = [];
  const nodeMap = new Map<string, CNode>();

  const addNode = (id: string, label: string, kind: string, hub?: boolean, href?: string) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label, kind, hub, href, x: 0, y: 0, z: 0 });
    }
  };

  const addEdge = (a: string, b: string) => {
    const key = [a, b].sort().join("|");
    if (!edges.some((e) => [e[0], e[1]].sort().join("|") === key)) {
      edges.push([a, b]);
    }
  };

  // Add recipe nodes
  const gammaSet = new Set<string>();
  const modeSet = new Set<string>();

  for (const preset of presets) {
    const label = preset.name.replace(/^[A-Z]{2}-\d{3}-/, ""); // Strip "PP-001-" style prefix
    addNode(preset.id, label, "recipe", false, `/colors/${preset.id}`);

    gammaSet.add(preset.pp.gamma);
    modeSet.add(preset.pp.color_mode);
  }

  // Add gamma and color mode hubs
  for (const gamma of gammaSet) {
    const hubId = hubIdFromValue("gamma", gamma);
    addNode(hubId, `${colorBank.graph.kind.gamma} ${gamma}`, "gamma", true);
  }
  for (const mode of modeSet) {
    const hubId = hubIdFromValue("color_mode", mode);
    addNode(hubId, `${colorBank.graph.kind.mode} ${mode}`, "mode", true);
  }

  // Add WB note hub (can-bang-trang-va-nhiet-do-mau)
  const wbNoteSlug = "can-bang-trang-va-nhiet-do-mau";
  addNode(wbNoteSlug, "Cân bằng trắng", "note", true, entryHref(wbNoteSlug));

  // Add preset group hubs (if groups are meaningful)
  const groupSet = new Set<string>();
  for (const preset of presets) {
    if (preset.group && preset.group !== "standard") {
      groupSet.add(preset.group);
    }
  }
  for (const group of groupSet) {
    const groupId = `group-${fold(group).replace(/[^a-z0-9]+/g, "-")}`;
    addNode(groupId, fold(group) === "den trang" ? group : `Tông ${group.toLowerCase()}`, "group", true);
  }

  // Add edges
  for (const preset of presets) {
    const gammaHubId = hubIdFromValue("gamma", preset.pp.gamma);
    const modeHubId = hubIdFromValue("color_mode", preset.pp.color_mode);

    addEdge(preset.id, gammaHubId);
    addEdge(preset.id, modeHubId);
    addEdge(preset.id, wbNoteSlug);

    // Link to group hub if present
    if (preset.group && preset.group !== "standard") {
      const groupId = `group-${fold(preset.group).replace(/[^a-z0-9]+/g, "-")}`;
      addEdge(preset.id, groupId);
    }
  }

  const nodesList = Array.from(nodeMap.values());
  const layoutNodes = layout3d(nodesList, edges);

  return {
    app: "colors",
    nodes: layoutNodes,
    edges,
  };
}

/**
 * Product Wiki: All products with category hubs (body groups, lens groups, battery, series).
 */
function buildWikiGraph(): CGraph {
  const edges: CEdge[] = [];
  const nodeMap = new Map<string, CNode>();

  const addNode = (id: string, label: string, kind: string, hub?: boolean) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label, kind, hub, x: 0, y: 0, z: 0 });
    }
  };

  const addEdge = (a: string, b: string) => {
    const key = [a, b].sort().join("|");
    if (!edges.some((e) => [e[0], e[1]].sort().join("|") === key)) {
      edges.push([a, b]);
    }
  };

  const allProducts = products();
  const camerasByGroup = new Map<string, string[]>();
  const lensesByFormat = new Map<string, string[]>();
  const batteryToCameras = new Map<string, string[]>();
  const seriesToLenses = new Map<string, string[]>();

  // Add product nodes and collect groupings
  for (const product of allProducts) {
    addNode(product.slug, product.name, product.kind);

    if (product.kind === "camera") {
      const group = product.group || "unknown";
      if (!camerasByGroup.has(group)) {
        camerasByGroup.set(group, []);
      }
      camerasByGroup.get(group)!.push(product.slug);

      // Battery grouping
      if (product.specs?.battery) {
        if (!batteryToCameras.has(product.specs.battery)) {
          batteryToCameras.set(product.specs.battery, []);
        }
        batteryToCameras.get(product.specs.battery)!.push(product.slug);
      }
    }

    if (product.kind === "lens") {
      const format = product.group;
      if (!lensesByFormat.has(format)) {
        lensesByFormat.set(format, []);
      }
      lensesByFormat.get(format)!.push(product.slug);

      // Series grouping (skip "standard")
      if (product.specs?.series && product.specs.series !== "standard") {
        if (!seriesToLenses.has(product.specs.series)) {
          seriesToLenses.set(product.specs.series, []);
        }
        seriesToLenses.get(product.specs.series)!.push(product.slug);
      }
    }
  }

  // Add camera group hubs
  const groupMap: Record<string, string> = {
    "aps-c": "Body APS-C",
    "full-frame": "Body full-frame",
    "compact": "Máy compact",
  };
  for (const [group, slugs] of camerasByGroup) {
    const hubId = `hub-camera-${group}`;
    const label = groupMap[group] || `Body ${group}`;
    addNode(hubId, label, "group", true);
    for (const slug of slugs) {
      addEdge(slug, hubId);
    }
  }

  // Add lens format hubs
  const lensFormatMap: Record<string, string> = {
    "aps-c": "Ống kính APS-C",
    "full-frame": "Ống kính full-frame",
  };
  for (const [format, slugs] of lensesByFormat) {
    const hubId = `hub-lens-${format}`;
    const label = lensFormatMap[format] || `Ống kính ${format}`;
    addNode(hubId, label, "group", true);
    for (const slug of slugs) {
      addEdge(slug, hubId);
    }
  }

  // Add accessory hub
  const accessories = allProducts.filter((p) => p.kind === "accessory").map((p) => p.slug);
  if (accessories.length > 0) {
    addNode("hub-accessory", wiki.graphHubs.accessory, "group", true);
    for (const slug of accessories) {
      addEdge(slug, "hub-accessory");
    }
  }

  // Add battery hubs
  for (const [battery, cameras] of batteryToCameras) {
    if (cameras.length > 1) {
      const hubId = `hub-battery-${battery.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      addNode(hubId, battery, "battery", true);
      for (const slug of cameras) {
        addEdge(slug, hubId);
      }
    }
  }

  // Add series hubs
  for (const [series, lenses] of seriesToLenses) {
    if (lenses.length > 1) {
      const hubId = `hub-series-${series.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      addNode(hubId, SERIES_LABELS[series] ?? series, "series", true);
      for (const slug of lenses) {
        addEdge(slug, hubId);
      }
    }
  }

  const nodesList = Array.from(nodeMap.values()).map((n) => ({
    ...n,
    href: n.hub || n.kind === "group" || n.kind === "battery" || n.kind === "series" ? undefined : productHref(n.id),
  }));

  const layoutNodes = layout3d(nodesList, edges);

  return {
    app: "wiki",
    nodes: layoutNodes,
    edges,
  };
}

/**
 * Blog: Articles and knowledge notes with product references.
 */
function buildBlogGraph(): CGraph {
  const nodeMap = new Map<string, CNode>();

  // Reuse generateSiteGraph to build the basic graph
  const siteGraph = generateSiteGraph();

  // Convert to our node structure with hrefs

  for (const node of siteGraph.nodes) {
    let href: string | undefined;

    if (node.kind === "article") {
      href = `/blog/${node.id}`;
    } else if (node.kind === "note") {
      href = entryHref(node.id);
    } else if (node.kind === "product") {
      href = productHref(node.id);
    }

    nodeMap.set(node.id, {
      id: node.id,
      label: node.label,
      kind: node.kind,
      hub: false,
      href,
      x: 0,
      y: 0,
      z: 0,
    });
  }

  // Convert Edge objects to CEdge tuples
  const cEdges: CEdge[] = siteGraph.edges.map((e) => [e.source, e.target]);

  // Calculate degrees and mark hubs
  const degree = new Map<string, number>();
  for (const node of nodeMap.values()) {
    degree.set(node.id, 0);
  }
  for (const [source, target] of cEdges) {
    degree.set(source, (degree.get(source) ?? 0) + 1);
    degree.set(target, (degree.get(target) ?? 0) + 1);
  }

  // Hubs: knowledge notes, plus products many articles mention (articles stay leaves so the graph reads note → article)
  for (const node of nodeMap.values()) {
    if (node.kind === "note" || (node.kind === "product" && (degree.get(node.id) ?? 0) >= 6)) {
      node.hub = true;
    }
  }

  const nodesList = Array.from(nodeMap.values());
  const layoutNodes = layout3d(nodesList, cEdges);

  return {
    app: "blog",
    nodes: layoutNodes,
    edges: cEdges,
  };
}

// Memoized graph builders (computed once per process)
let consoleGraphMemo: CGraph | null = null;
let colorsGraphMemo: CGraph | null = null;
let wikiGraphMemo: CGraph | null = null;
let blogGraphMemo: CGraph | null = null;

export function consoleGraph(): CGraph {
  if (!consoleGraphMemo) {
    consoleGraphMemo = buildConsoleGraph();
  }
  return consoleGraphMemo;
}

export function colorsGraph(): CGraph {
  if (!colorsGraphMemo) {
    colorsGraphMemo = buildColorsGraph();
  }
  return colorsGraphMemo;
}

export function wikiGraph(): CGraph {
  if (!wikiGraphMemo) {
    wikiGraphMemo = buildWikiGraph();
  }
  return wikiGraphMemo;
}

export function blogGraph(): CGraph {
  if (!blogGraphMemo) {
    blogGraphMemo = buildBlogGraph();
  }
  return blogGraphMemo;
}

export function graphFor(app: "console" | "colors" | "wiki" | "blog"): CGraph {
  switch (app) {
    case "console":
      return consoleGraph();
    case "colors":
      return colorsGraph();
    case "wiki":
      return wikiGraph();
    case "blog":
      return blogGraph();
  }
}

/**
 * Landing: one graph of all four apps. Shared ids (product slugs, the white-balance note) merge into one node, which is
 * what ties the apps together; each node keeps the app it came from (`app`) for its colour. An id that means two different
 * pages in two apps (the console chapter "lay-net" and the knowledge note "lay-net") gets the later app as prefix, and the
 * two are linked: same topic, two places.
 */
let allGraphMemo: CGraph | null = null;
export function allGraph(): CGraph {
  if (allGraphMemo) return allGraphMemo;
  const order: AppId[] = ["wiki", "console", "colors", "blog"];
  const nodes = new Map<string, CNode>();
  const edges = new Map<string, CEdge>();
  for (const app of order) {
    const g = graphFor(app);
    const rename = new Map<string, string>();
    for (const n of g.nodes) {
      const had = nodes.get(n.id);
      if (!had) nodes.set(n.id, { ...n, app });
      else if (had.href !== n.href) {
        const id = `${app}/${n.id}`;
        rename.set(n.id, id);
        nodes.set(id, { ...n, id, app });
        edges.set([n.id, id].sort().join(" "), [n.id, id]);
      } else if (n.hub) had.hub = true;
    }
    for (const [a0, b0] of g.edges) {
      const a = rename.get(a0) ?? a0, b = rename.get(b0) ?? b0;
      edges.set([a, b].sort().join(" "), [a, b]);
    }
  }
  const list = [...edges.values()];
  allGraphMemo = { app: "all", nodes: layout3d([...nodes.values()], list), edges: list };
  return allGraphMemo;
}
