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
