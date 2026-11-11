// Mốc dừng khi cuộn landing (đồ thị, giới thiệu, 4 app, bắt đầu, cuối trang).
// Đoạn giữa hai mốc vừa một màn hình thì đi thẳng mốc kế; đoạn dài hơn thì cuộn tự do, chỉ hút khi đã gần mép.

const FIT = 1.15; // đoạn ≤ 1.15 màn hình coi là "vừa một màn"
const NEAR = 0.4; // đoạn dài: còn cách mốc < 40% màn hình thì hút vào
const AT = 2; // px: coi như đang đứng ở mốc

/** Cuộn dừng lưng chừng tại y theo hướng dir (1 xuống, -1 lên): trả về mốc cần đi tới, hoặc null để yên */
export function settleStop(y: number, dir: number, stops: number[], vh: number): number | null {
  for (let i = 0; i < stops.length - 1; i++) {
    const p = stops[i], n = stops[i + 1];
    if (y < p - AT || y > n + AT) continue;
    if (Math.abs(y - p) <= AT || Math.abs(y - n) <= AT) return null;
    if (n - p <= FIT * vh) return dir >= 0 ? n : p;
    if (dir > 0 && n - y < NEAR * vh) return n;
    if (dir < 0 && y - p < NEAR * vh) return p;
    return null;
  }
  return null;
}

/** Đang đứng ở một mốc và lăn chuột theo hướng dir: trả về mốc kề nếu đoạn giữa vừa một màn hình, không thì null (cuộn thường) */
export function wheelStop(y: number, dir: number, stops: number[], vh: number): number | null {
  const k = stops.findIndex((s) => Math.abs(y - s) <= AT);
  if (k < 0 || !dir) return null;
  const m = k + Math.sign(dir);
  if (m < 0 || m >= stops.length) return null;
  return Math.abs(stops[m] - stops[k]) <= FIT * vh ? stops[m] : null;
}

/** Mốc đã sắp xếp, bỏ trùng (cách nhau < 8px) và kẹp trong [0, max] */
export function normalizeStops(raw: number[], max: number): number[] {
  const out: number[] = [];
  for (const s of raw.map((v) => Math.round(Math.min(Math.max(v, 0), max))).sort((a, b) => a - b)) {
    if (!out.length || s - out[out.length - 1] >= 8) out.push(s);
  }
  return out;
}

/** Nhanh dần rồi chậm dần (easeInOutCubic) */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Thời gian chuyển mốc theo quãng đường: 550–950ms */
export const glideMs = (dist: number) => Math.min(950, Math.max(550, 420 + Math.abs(dist) * 0.35));
