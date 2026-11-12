import type { CEdge } from "./constellation.ts";

// Bố cục lực 3D cho đồ thị chòm sao. Chạy trên server lúc build (layout3d) để mọi lần mở trang thấy cùng một hình,
// và trên trình duyệt từng bước (tick3d) khi người dùng kéo nút.

export interface Body {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Đang bị kéo hoặc khóa: lực không dời nút này. */
  pin?: boolean;
}

/** Bán kính khối đồ thị sau khi chuẩn hóa, đơn vị thế giới. Constellation đặt camera theo số này. */
export const RADIUS = 170;
// CENTER: lực hút về tâm. Với lực đẩy 1/d², hút tuyến tính càng mạnh thì mật độ trong khối càng đều (cụm dày bị ép giãn, vùng thưa được lấp).
// 0.1 đo trên đồ thị tổng hợp: độ lệch mật độ giữa các ô (CV) 0.66 → 0.22, hình chiếu 0.69 → 0.38, không còn ô trống; 0.012 cũ để lõi dày, rìa thưa.
const REST = 58, REPEL = 2400, SPRING = 0.05, CENTER = 0.1, DAMP = 0.6, DECAY = 0.985;
/** Nhiệt độ của nhịp dàn lại cuối cùng, bằng mức đồ thị dùng khi người dùng bấm Toàn cảnh */
const RELAX = 0.35;

/** Một bước mô phỏng: đẩy nhau, kéo theo cạnh, hút về tâm. alpha giảm dần về 0. Trả về alpha mới. */
export function tick3d(bodies: Body[], edges: [number, number][], alpha: number): number {
  for (let a = 0; a < bodies.length; a++) {
    const A = bodies[a];
    for (let b = a + 1; b < bodies.length; b++) {
      const B = bodies[b];
      let dx = A.x - B.x, dy = A.y - B.y, dz = A.z - B.z;
      const d2 = dx * dx + dy * dy + dz * dz + 0.01, d = Math.sqrt(d2), f = (REPEL / d2) * alpha;
      dx /= d; dy /= d; dz /= d;
      A.vx += dx * f; A.vy += dy * f; A.vz += dz * f;
      B.vx -= dx * f; B.vy -= dy * f; B.vz -= dz * f;
    }
  }
  for (const [a, b] of edges) {
    const A = bodies[a], B = bodies[b];
    let dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z;
    const d = Math.hypot(dx, dy, dz) || 1, f = (d - REST) * SPRING * alpha;
    dx /= d; dy /= d; dz /= d;
    A.vx += dx * f; A.vy += dy * f; A.vz += dz * f;
    B.vx -= dx * f; B.vy -= dy * f; B.vz -= dz * f;
  }
  for (const n of bodies) {
    n.vx -= n.x * CENTER * alpha; n.vy -= n.y * CENTER * alpha; n.vz -= n.z * CENTER * alpha;
    if (n.pin) { n.vx = n.vy = n.vz = 0; continue; }
    n.vx *= DAMP; n.vy *= DAMP; n.vz *= DAMP;
    n.x += n.vx; n.y += n.vy; n.z += n.vz;
  }
  return alpha * DECAY;
}

/** Vị trí 3D cố định cho mỗi nút: điểm xuất phát trên mặt cầu Fibonacci theo thứ tự id, chạy đủ số bước, rồi trải đều trong khối cầu bán kính RADIUS. */
export function layout3d<T extends { id: string }>(nodes: T[], edges: CEdge[], ticks = 300): (T & { x: number; y: number; z: number })[] {
  const order = nodes.map((n, i) => [n.id, i] as const).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const bodies: Body[] = nodes.map(() => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }));
  const r0 = 40 + 8 * Math.sqrt(nodes.length);
  order.forEach(([, i], k) => {
    const y = 1 - ((k + 0.5) / nodes.length) * 2, s = Math.sqrt(1 - y * y), t = k * 2.39996;
    Object.assign(bodies[i], { x: r0 * s * Math.cos(t), y: r0 * y, z: r0 * s * Math.sin(t) });
  });
  const at = new Map(nodes.map((n, i) => [n.id, i]));
  const pairs = edges.map(([a, b]) => [at.get(a), at.get(b)] as [number, number]);
  if (pairs.some(([a, b]) => a === undefined || b === undefined)) throw new Error("layout3d: cạnh trỏ tới id không có");
  let alpha = 1;
  for (let i = 0; i < ticks; i++) alpha = tick3d(bodies, pairs, alpha);
  // Trải đều trong khối cầu: giữ hướng của từng nút, đặt lại khoảng cách tới tâm theo thứ hạng (mật độ thể tích đều).
  // Lõi dày bị giãn ra, vài nút lẻ ở xa bị kéo vào, nên khi vừa khung cả đồ thị thoáng và to hơn.
  const dist = bodies.map((b) => Math.hypot(b.x, b.y, b.z));
  const rank = dist.map((_, i) => i).sort((a, b) => dist[a] - dist[b] || a - b);
  const scale = new Array<number>(bodies.length);
  rank.forEach((i, k) => (scale[i] = (RADIUS * Math.cbrt((k + 0.5) / bodies.length)) / (dist[i] || 1)));
  for (let i = 0; i < bodies.length; i++) Object.assign(bodies[i], { x: bodies[i].x * scale[i], y: bodies[i].y * scale[i], z: bodies[i].z * scale[i], vx: 0, vy: 0, vz: 0 });
  // Cho lực chạy thêm một nhịp nhẹ (như khi bấm "Toàn cảnh" trên đồ thị): các nút tự dàn lại sau khi trải đều, cân và đẹp hơn
  for (let a = RELAX; a > 0.004; ) a = tick3d(bodies, pairs, a);
  // Co về bán kính RADIUS để vòng nút kề khi chọn (đơn vị thế giới) giữ đúng tỉ lệ
  const k = RADIUS / Math.max(1, ...bodies.map((b) => Math.hypot(b.x, b.y, b.z)));
  const r = (v: number) => Math.round(v * k * 10) / 10;
  return nodes.map((n, i) => ({ ...n, x: r(bodies[i].x), y: r(bodies[i].y), z: r(bodies[i].z) }));
}
