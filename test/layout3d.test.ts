import { test } from "node:test";
import assert from "node:assert/strict";
import { layout3d, RADIUS } from "../lib/layout3d.ts";

const nodes = ["a", "b", "c", "d", "e"].map((id) => ({ id }));
const edges: [string, string][] = [["a", "b"], ["b", "c"], ["c", "d"], ["a", "e"]];

test("layout3d cho cùng một hình mỗi lần chạy, không phụ thuộc thứ tự nút", () => {
  const one = layout3d(nodes, edges);
  const two = layout3d([...nodes].reverse(), edges);
  for (const n of one) assert.deepEqual(two.find((m) => m.id === n.id), n);
});

test("layout3d nằm gọn trong bán kính và các nút không chồng nhau", () => {
  const out = layout3d(nodes, edges);
  const radii = out.map((n) => Math.hypot(n.x, n.y, n.z));
  assert.ok(Math.max(...radii) <= RADIUS + 0.5);
  for (let i = 0; i < out.length; i++)
    for (let j = i + 1; j < out.length; j++) assert.ok(Math.hypot(out[i].x - out[j].x, out[i].y - out[j].y, out[i].z - out[j].z) > 10);
});

test("layout3d báo lỗi khi cạnh trỏ tới id không có", () => {
  assert.throws(() => layout3d(nodes, [["a", "z"]]));
});

test("layout3d: the combined graph fills its sphere evenly (no dense core, no empty regions)", async () => {
  const { allGraph } = await import("../lib/appGraphs.ts");
  const nodes = allGraph().nodes;
  // 33 cells of side 68 inside the sphere: every one holds nodes, and counts vary little (CV was 0.66 with the weak centre force)
  const side = 68, cells = new Map<string, number>();
  for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let z = -2; z <= 2; z++) if (Math.hypot(x, y, z) * side <= RADIUS - side * 0.4) cells.set(`${x},${y},${z}`, 0);
  for (const n of nodes) {
    const k = `${Math.round(n.x / side)},${Math.round(n.y / side)},${Math.round(n.z / side)}`;
    if (cells.has(k)) cells.set(k, cells.get(k)! + 1);
  }
  const counts = [...cells.values()], mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const cv = Math.sqrt(counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length) / mean;
  assert.equal(counts.filter((c) => c === 0).length, 0, "an empty cell inside the sphere");
  assert.ok(cv < 0.35, `cell density CV ${cv.toFixed(2)}`);
  // no two nodes sit on top of each other
  let nearest = Infinity;
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) nearest = Math.min(nearest, Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y, nodes[i].z - nodes[j].z));
  assert.ok(nearest > 10, `closest pair ${nearest.toFixed(1)}`);
});
