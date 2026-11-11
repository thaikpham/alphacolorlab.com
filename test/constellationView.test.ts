import { describe, it } from "node:test";
import assert from "node:assert";
import {
  project,
  screenDeltaToWorld,
  ringTargets,
  focusRingLayout,
  hashPhase,
  labelBoxesOverlap,
  selectLabelsToRender,
  type Point3,
  type View3,
  type Box,
} from "../lib/constellationView.ts";
import { depthScale, depthFog, depthFont } from "../lib/constellationView.ts";

describe("constellationView", () => {
  const size = { width: 1000, height: 800 };

  describe("project", () => {
    it("projects camera center to screen center", () => {
      const view: View3 = {
        cam: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        zoom: 1,
      };
      const point: Point3 = { x: 0, y: 0, z: 100 };
      const result = project(point, view, size);

      assert.strictEqual(Math.abs(result.x - size.width / 2) < 1, true);
      assert.strictEqual(Math.abs(result.y - size.height / 2) < 1, true);
    });

    it("projects point right of camera to right on screen", () => {
      const view: View3 = {
        cam: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        zoom: 1,
      };
      const point: Point3 = { x: 10, y: 0, z: 100 };
      const result = project(point, view, size);

      assert.strictEqual(result.x > size.width / 2, true);
    });

    it("projects farther point to smaller scale", () => {
      const view: View3 = {
        cam: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        zoom: 1,
      };
      const near: Point3 = { x: 0, y: 0, z: 50 };
      const far: Point3 = { x: 0, y: 0, z: 200 };

      const resultNear = project(near, view, size);
      const resultFar = project(far, view, size);

      assert.strictEqual(resultNear.s > resultFar.s, true);
    });
  });

  describe("screenDeltaToWorld", () => {
    it("round-trips screen delta to world and back", () => {
      const view: View3 = {
        cam: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        zoom: 1,
      };
      const point: Point3 = { x: 0, y: 0, z: 100 };
      const proj1 = project(point, view, size);

      const dx = 10;
      const dy = 5;
      const worldDelta = screenDeltaToWorld(dx, dy, proj1.s, view);

      const movedPoint: Point3 = {
        x: point.x + worldDelta.x,
        y: point.y + worldDelta.y,
        z: point.z + worldDelta.z,
      };
      const proj2 = project(movedPoint, view, size);

      const screenDx = proj2.x - proj1.x;
      const screenDy = proj2.y - proj1.y;

      // Should be within ~1px due to rounding
      assert.strictEqual(Math.abs(screenDx - dx) < 1, true);
      assert.strictEqual(Math.abs(screenDy - dy) < 1, true);
    });
  });

  describe("ringTargets", () => {
    it("distributes neighbors evenly around center", () => {
      const view: View3 = {
        cam: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        zoom: 1,
      };
      const center: Point3 = { x: 0, y: 0, z: 100 };
      const neighbours = [
        { id: "a", x: 100, y: 0, z: 100 },
        { id: "b", x: -100, y: 0, z: 100 },
        { id: "c", x: 0, y: 100, z: 100 },
        { id: "d", x: 0, y: -100, z: 100 },
      ];
      const ringRadius = 50;

      const targets = ringTargets(center, neighbours, ringRadius, view, size);

      assert.strictEqual(targets.size, 4);
      assert.strictEqual(targets.has("a"), true);
      assert.strictEqual(targets.has("d"), true);

      // All targets should be ~ringRadius away from center
      for (const [id, pos] of targets) {
        const dist = Math.hypot(
          pos.x - center.x,
          pos.y - center.y,
          pos.z - center.z
        );
        assert.strictEqual(Math.abs(dist - ringRadius) < 2, true, `${id} distance ${dist}`);
      }
    });

    it("uses two radii for >9 neighbors", () => {
      const view: View3 = {
        cam: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        zoom: 1,
      };
      const center: Point3 = { x: 0, y: 0, z: 100 };
      const neighbours = Array.from({ length: 12 }, (_, i) => ({
        id: `n${i}`,
        x: 100 * Math.cos((i / 12) * 2 * Math.PI),
        y: 100 * Math.sin((i / 12) * 2 * Math.PI),
        z: 100,
      }));

      const targets = ringTargets(center, neighbours, 95, view, size);

      assert.strictEqual(targets.size, 12);

      // With two radii, distances should alternate
      const dists = Array.from(targets.values()).map((pos) =>
        Math.hypot(pos.x - center.x, pos.y - center.y, pos.z - center.z)
      );

      const near = dists.filter((d) => d < 85);
      const far = dists.filter((d) => d > 85);
      assert.strictEqual(near.length > 0 && far.length > 0, true);
    });
  });

  describe("hashPhase", () => {
    it("returns stable values", () => {
      const phase1 = hashPhase("node123");
      const phase2 = hashPhase("node123");
      assert.strictEqual(phase1, phase2);
    });

    it("returns different values for different ids", () => {
      const phase1 = hashPhase("node1");
      const phase2 = hashPhase("node2");
      assert.strictEqual(phase1 !== phase2, true);
    });

    it("returns value in [0, 2π)", () => {
      const phase = hashPhase("test");
      assert.strictEqual(phase >= 0 && phase < 2 * Math.PI, true);
    });
  });

  describe("labelBoxesOverlap", () => {
    it("detects overlapping boxes", () => {
      const a: Box = { x: 0, y: 0, w: 100, h: 100 };
      const b: Box = { x: 50, y: 50, w: 100, h: 100 };
      assert.strictEqual(labelBoxesOverlap(a, b), true);
    });

    it("detects non-overlapping boxes", () => {
      const a: Box = { x: 0, y: 0, w: 100, h: 100 };
      const b: Box = { x: 150, y: 150, w: 100, h: 100 };
      assert.strictEqual(labelBoxesOverlap(a, b), false);
    });

    it("detects boxes touching at edges", () => {
      const a: Box = { x: 0, y: 0, w: 100, h: 100 };
      const b: Box = { x: 100, y: 0, w: 100, h: 100 };
      assert.strictEqual(labelBoxesOverlap(a, b), false);
    });
  });
});

describe("focusRingLayout", () => {
  const view = { cam: { x: 0, y: 0, z: 0 }, yaw: 0.4, pitch: -0.15, zoom: 1 };
  const size = { width: 800, height: 600 };
  const nodes = [{ x: 0, y: 0, z: 0 }, ...Array.from({ length: 6 }, (_, k) => ({ x: Math.cos(k) * 50, y: Math.sin(k) * 50, z: k * 3 }))];

  it("đặt các nút kề cách đều trên vòng, chừa khoảng trống phía dưới cho chỉ dẫn", () => {
    const { targets, ringR } = focusRingLayout(0, nodes, [1, 2, 3, 4, 5, 6], view);
    assert.equal(ringR, 75);
    const pts = [...targets.values()].map((p) => project(p, { ...view, cam: nodes[0] }, size));
    const c = project(nodes[0], { ...view, cam: nodes[0] }, size);
    for (const p of pts) assert.ok(Math.abs(Math.hypot(p.x - c.x, p.y - c.y) / p.s - 75) < 8);
    // không nút nào nằm thẳng dưới tâm (khoảng trống 1.1 rad quanh hướng xuống)
    for (const p of pts) assert.ok(Math.abs(Math.atan2(p.x - c.x, p.y - c.y)) > 0.45);
  });

  it("hơn 9 nút kề thì dùng hai bán kính", () => {
    const many = [{ x: 0, y: 0, z: 0 }, ...Array.from({ length: 12 }, (_, k) => ({ x: k * 10 - 60, y: 20, z: 0 }))];
    const { targets, ringR } = focusRingLayout(0, many, many.slice(1).map((_, k) => k + 1), view);
    assert.equal(ringR, 95);
    assert.equal(targets.size, 12);
  });
});

describe("selectLabelsToRender", () => {
  it("selects all labels when no overlap", () => {
    const labels = [
      { idx: 0, priority: 0, width: 40, height: 18, x: 100, y: 100 },
      { idx: 1, priority: 1, width: 40, height: 18, x: 200, y: 100 },
      { idx: 2, priority: 2, width: 40, height: 18, x: 300, y: 100 },
    ];
    const result = selectLabelsToRender(labels);
    assert.deepEqual(result, [0, 1, 2]);
  });

  it("skips overlapping labels with lower priority", () => {
    const labels = [
      { idx: 0, priority: 0, width: 100, height: 18, x: 100, y: 100 },
      { idx: 1, priority: 1, width: 100, height: 18, x: 120, y: 100 }, // overlaps with 0
      { idx: 2, priority: 2, width: 100, height: 18, x: 300, y: 100 },
    ];
    const result = selectLabelsToRender(labels);
    assert.deepEqual(result, [0, 2]); // 1 skipped due to overlap
  });

  it("respects priority order over sequence", () => {
    const labels = [
      { idx: 0, priority: 1, width: 100, height: 18, x: 100, y: 100 },
      { idx: 1, priority: 0, width: 100, height: 18, x: 120, y: 100 }, // higher priority despite later in list
    ];
    const result = selectLabelsToRender(labels);
    assert.deepEqual(result, [1]); // 1 drawn first due to higher priority, 0 skipped
  });

  it("breaks priority ties by depth (higher idx closer)", () => {
    const labels = [
      { idx: 1, priority: 1, width: 100, height: 18, x: 100, y: 100 },
      { idx: 2, priority: 1, width: 100, height: 18, x: 120, y: 100 }, // same priority, but idx 2 > 1
    ];
    const result = selectLabelsToRender(labels);
    assert.deepEqual(result, [2]); // 2 drawn first (closer), 1 skipped
  });
});

it("depth: near is bigger, darker and larger text than far", () => {
  const near = -150, mid = 0, far = 150;
  assert.ok(depthScale(near) > depthScale(mid) && depthScale(mid) > depthScale(far));
  assert.equal(depthScale(mid), 1);
  assert.ok(depthScale(near) / depthScale(far) > 2, "visible size difference across the sphere");
  assert.ok(depthFog(near) > 0.9 && depthFog(far) >= 0.3 && depthFog(far) < 0.4 && depthFog(far) < depthFog(mid) && depthFog(mid) < depthFog(near));
  assert.ok(depthFog(mid) > 0.55 && depthFog(mid) < 0.65, "middle not too faint");
  assert.ok(depthFont(near) > 13 && depthFont(far) < 13 && depthFont(far) >= 11 && depthFont(near) <= 17);
  assert.equal(depthFont(mid), 13);
  assert.equal(depthFont(far) * 2 % 1, 0, "rounded to 0.5px");
});
