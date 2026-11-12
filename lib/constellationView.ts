/**
 * Pure math for Constellation 3D graph projection and interaction.
 * No React, no browser APIs—unit-testable.
 */

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface View3 {
  /** Camera world position */
  cam: Point3;
  /** Rotation: yaw (around y-axis), pitch (around x-axis), in radians */
  yaw: number;
  pitch: number;
  /** Zoom: 1 = normal, >1 closer, <1 farther */
  zoom: number;
}

export interface ProjectResult {
  x: number;
  y: number;
  z: number;
  s: number; // scale factor in screen space
}

/**
 * Project a 3D point to 2D screen with perspective.
 * Canvas origin at top-left; screen x right, y down.
 */
export function project(
  point: Point3,
  view: View3,
  size: { width: number; height: number }
): ProjectResult {
  // Công thức của bản mẫu đã duyệt: xoay quanh trục đứng (yaw) rồi trục ngang (pitch), phối cảnh tiêu cự 440,
  // zoom 1 = khối bán kính RADIUS chiếm ~42% cạnh ngắn của khung.
  const X = point.x - view.cam.x, Y = point.y - view.cam.y, Z = point.z - view.cam.z;
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
  const x1 = X * cy + Z * sy, z1 = -X * sy + Z * cy;
  const y2 = Y * cp - z1 * sp, z2 = Y * sp + z1 * cp;
  const s = (440 / (440 + z2)) * view.zoom * (Math.min(size.width, size.height) / 420);
  return { x: size.width / 2 + x1 * s, y: size.height / 2 + y2 * s, z: z2, s };
}

/** Hệ số phối cảnh theo độ sâu (z của project): gần camera > 1, xa < 1. Không gồm zoom.
 * Dùng cho cỡ chấm, cỡ chữ, nét cạnh để khi xoay nút tới gần thì lớn, đi xa thì nhỏ. */
export const depthScale = (z: number) => Math.min(1.7, Math.max(0.6, 440 / (440 + z)));

/** Độ đậm theo độ sâu (sương mù không khí) cho cả chấm, cạnh và chữ: mặt sau khối cầu ~0.3, giữa ~0.6, mặt trước 1.
 * Đường cong mũ 0.7 để phần giữa không quá nhạt. */
export const depthFog = (z: number) => {
  const t = Math.min(1, Math.max(0, (depthScale(z) - 0.72) / 0.91));
  return 0.3 + 0.7 * t ** 0.7;
};

/** Cỡ chữ nhãn theo độ sâu, làm tròn 0.5px để chữ không rung khi xoay; 11–17px quanh cỡ gốc 13px */
export const depthFont = (z: number, base = 13) => Math.round(base * Math.min(1.3, Math.max(0.85, depthScale(z) ** 0.8)) * 2) / 2;

/**
 * Convert a screen-space delta (mouse/touch drag) to world-space movement,
 * accounting for camera rotation and zoom.
 * Returns the world delta that moves a pinned node to follow the drag.
 */
export function screenDeltaToWorld(
  dx: number,
  dy: number,
  scale: number, // project(...).s của nút đang kéo (đã gồm zoom)
  view: View3
): Point3 {
  // Nghịch đảo của project trên mặt phẳng song song màn hình (độ sâu z2 giữ nguyên)
  const ux = dx / scale, uy = dy / scale;
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
  const z1 = -uy * sp;
  return { x: ux * cy - z1 * sy, y: uy * cp, z: ux * sy + z1 * cy };
}

/**
 * Compute target positions for neighbors in a ring around a center node.
 * Positions are in the camera's current view plane, evenly spaced,
 * preserving angular order around center, with a gap at the bottom.
 * Returns a Map of id -> world position.
 */
export function ringTargets(
  center: Point3,
  neighbours: Array<{ id: string; x: number; y: number; z: number }>,
  radius: number, // ring radius in world units
  view: View3,
  size: { width: number; height: number }
): Map<string, Point3> {
  const result = new Map<string, Point3>();

  if (neighbours.length === 0) return result;

  // Project center to get its screen position and depth
  const centerProj = project(center, view, size);

  // Build a camera space coordinate system based on the current view plane
  // X-axis: right on screen, Y-axis: up on screen, Z-axis: out of screen (toward camera)

  const cosY = Math.cos(view.yaw);
  const sinY = Math.sin(view.yaw);
  const cosP = Math.cos(view.pitch);
  const sinP = Math.sin(view.pitch);

  // Basis vectors in world space for the view plane
  // Right vector (screen +x)
  const rightX = cosY;
  const rightY = 0;
  const rightZ = sinY;

  // Up vector (screen +y)
  const upX = -sinY * sinP;
  const upY = cosP;
  const upZ = cosY * sinP;

  const n = neighbours.length;
  const gap = 1.1; // radians, gap at bottom for hint
  const availableAngle = 2 * Math.PI - gap;

  // Compute angles for even spacing
  // For >9 neighbors, use two radii: 95 and 67 world units
  const usesTwoRadii = n > 9;
  const radius1 = usesTwoRadii ? 95 : radius;
  const radius2 = usesTwoRadii ? 67 : radius;

  // Project each neighbor to compute their angle relative to center
  const angles: Array<{ id: string; angle: number; index: number }> = [];
  for (let i = 0; i < n; i++) {
    const proj = project(neighbours[i], view, size);
    const screenDx = proj.x - centerProj.x;
    const screenDy = proj.y - centerProj.y;
    const angle = Math.atan2(screenDy, screenDx);
    angles.push({ id: neighbours[i].id, angle, index: i });
  }

  // Sort by angle to preserve order
  angles.sort((a, b) => a.angle - b.angle);

  // Assign target angles, leaving gap at bottom (π + gap/2 to π + gap/2, wrapping)
  const gapStart = Math.PI + gap / 2;

  // Positions at even angles, skipping the gap
  for (let i = 0; i < n; i++) {
    const t = i / n; // 0 to 1
    let targetAngle = gapStart + t * availableAngle;
    if (targetAngle > Math.PI) {
      targetAngle -= 2 * Math.PI;
    }

    // Alternate radii for two-radius case
    const r = usesTwoRadii && i % 2 === 1 ? radius2 : radius1;

    // Compute world position: center + r * (cos*right + sin*up)
    const cos = Math.cos(targetAngle);
    const sin = Math.sin(targetAngle);

    const worldX = center.x + (cos * rightX + sin * upX) * r;
    const worldY = center.y + (cos * rightY + sin * upY) * r;
    const worldZ = center.z + (cos * rightZ + sin * upZ) * r;

    result.set(angles[i].id, { x: worldX, y: worldY, z: worldZ });
  }

  return result;
}

/**
 * Stable deterministic hash of an id string to a phase in [0, 2π).
 * Used for idle sway per-node frequency/phase.
 */
export function hashPhase(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash; // keep as 32-bit int
  }
  // Map hash to [0, 1)
  const normalized = Math.abs(hash) % 65536 / 65536;
  return normalized * 2 * Math.PI;
}

/**
 * AABB overlap test for label collision avoidance.
 * Box format: { x: left, y: top, w: width, h: height }
 */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function labelBoxesOverlap(a: Box, b: Box): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

/**
 * Greedy label placement with priority order and AABB overlap detection.
 * Returns indices of labels that should be drawn (in input order).
 * Priority: selected (0) < neighbors of selected (1) < hub nodes (2) < mine nodes (3) < others (4+).
 * Closer nodes (higher z) have higher priority within each group.
 */
export function selectLabelsToRender(
  labels: Array<{
    idx: number; // node index for depth comparison
    priority: number; // label priority (lower = higher priority)
    width: number; // measured label width
    height: number; // label height (typically 18 or 22px)
    x: number; // screen position
    y: number; // screen position
  }>
): number[] {
  // Sort by priority (asc), then by depth z descending (idx used as proxy: higher idx = closer in typical sort)
  const sorted = [...labels].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.idx - a.idx;
  });

  const drawn: Box[] = [];
  const result: number[] = [];

  for (const label of sorted) {
    const box = { x: label.x - label.width / 2, y: label.y - label.height / 2, w: label.width, h: label.height };
    // Check overlap with already-drawn labels
    if (!drawn.some((existing) => labelBoxesOverlap(existing, box))) {
      drawn.push(box);
      result.push(label.idx);
    }
  }

  return result;
}

/**
 * Compute ring layout for focused node's neighbors.
 * Returns { targets, ringR } where targets is a Map of index -> target position,
 * and ringR is the ring radius used.
 */
export function focusRingLayout(
  centerIdx: number,
  nodes: Array<{ x: number; y: number; z: number }>,
  neighbors: number[],
  view: View3
): { targets: Map<number, Point3>; ringR: number } {
  const S = nodes[centerIdx];
  const result = new Map<number, Point3>();

  if (neighbors.length === 0) {
    return { targets: result, ringR: 75 };
  }

  // Build camera space basis
  const cy = Math.cos(view.yaw);
  const sy = Math.sin(view.yaw);
  const cp = Math.cos(view.pitch);
  const sp = Math.sin(view.pitch);

  const R = [cy, 0, sy];
  const U = [sp * sy, cp, -sp * cy];
  const F = [-sy * cp, sp, cy * cp];

  // Compute angles in screen space
  const angles = neighbors.map((j) => {
    const n = nodes[j];
    const d = [n.x - S.x, n.y - S.y, n.z - S.z];
    return {
      j,
      a: Math.atan2(
        d[0] * U[0] + d[1] * U[1] + d[2] * U[2],
        d[0] * R[0] + d[1] * R[1] + d[2] * R[2]
      ),
    };
  });

  angles.sort((p, q) => p.a - q.a);

  const m = neighbors.length;
  const gap = 1.1;
  const span = 2 * Math.PI - gap;
  const start = Math.PI / 2 + gap / 2;
  const two = m > 9;
  const ringR = two ? 95 : 75;

  angles.forEach((o, k) => {
    const th = m === 1 ? -Math.PI / 2 : start + (k * span) / (m - 1);
    const r = two && k % 2 ? ringR - 28 : ringR;
    const depth = ((k % 3) - 1) * 6;
    const a = Math.cos(th) * r;
    const b = Math.sin(th) * r;
    result.set(o.j, {
      x: S.x + R[0] * a + U[0] * b + F[0] * depth,
      y: S.y + R[1] * a + U[1] * b + F[1] * depth,
      z: S.z + R[2] * a + U[2] * b + F[2] * depth,
    });
  });

  return { targets: result, ringR };
}
