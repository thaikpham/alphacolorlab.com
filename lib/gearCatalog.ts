import { fold } from "./fold.ts";
import products from "../data/products.json" with { type: "json" };
import accessories from "../data/accessories.json" with { type: "json" };

export interface Item {
  id: string;
  name: string;
  code: string;
  group: string;
  image?: string;
  guide?: boolean;
  battery?: string;
  mount?: "aps-c" | "full-frame";
}

export interface Catalog {
  body: Item[];
  lens: Item[];
  acc: Item[];
}

const GUIDE_SLUGS = ["zv-e10", "a6400", "a7c-ii"];

export function gearCatalog(): Catalog {
  const cameras = products.filter((p) => p.kind === "camera");
  const lenses = products.filter((p) => p.kind === "lens");

  // Bodies: guide cameras first, then APS-C, full-frame, compact
  const guides = cameras.filter((c) => GUIDE_SLUGS.includes(c.slug));
  const apsc = cameras.filter((c) => !GUIDE_SLUGS.includes(c.slug) && c.group === "aps-c");
  const ff = cameras.filter((c) => !GUIDE_SLUGS.includes(c.slug) && c.group === "full-frame");
  const compact = cameras.filter((c) => c.group === "compact");

  const body = [
    ...guides.map((c) => ({
      id: c.slug,
      name: c.name,
      code: c.code,
      group: c.group,
      image: c.image,
      guide: true,
    })),
    ...apsc.map((c) => ({ id: c.slug, name: c.name, code: c.code, group: c.group, image: c.image })),
    ...ff.map((c) => ({ id: c.slug, name: c.name, code: c.code, group: c.group, image: c.image })),
    ...compact.map((c) => ({ id: c.slug, name: c.name, code: c.code, group: c.group, image: c.image })),
  ];

  // Lenses: use group as mount type (aps-c or full-frame)
  const lensItems = lenses.map((l) => ({
    id: l.slug,
    name: l.name,
    code: l.code,
    group: l.group,
    image: l.image,
    mount: (l.group === "full-frame" ? "full-frame" : "aps-c") as "aps-c" | "full-frame",
  }));

  // Accessories: from curated data + batteries from product specs.
  // A Product Wiki record with the same id or code is the same item: it only adds the image, so the bag lists it once.
  const wikiAcc = products.filter((p) => p.kind === "accessory");
  const sameItem = (p: { slug: string; code: string }, a: { id: string; code: string }) => p.slug === a.id || p.code === a.code;
  const accItems: Item[] = accessories.map((a) => ({
    id: a.id,
    name: a.name,
    code: a.code,
    group: a.group,
    battery: a.battery,
    image: wikiAcc.find((p) => sameItem(p, a))?.image,
  }));
  // Phụ kiện có trong Product Wiki (ngàm chuyển, bộ chuyển tiêu cự) cũng thêm được vào túi, kèm ảnh
  for (const p of wikiAcc) if (!accessories.some((a) => sameItem(p, a))) accItems.push({ id: p.slug, name: p.name, code: p.code, group: p.group, image: p.image });

  return {
    body,
    lens: lensItems,
    acc: accItems,
  };
}

export function compatible(lens: Item, bodies: Item[]): boolean {
  const mount = lens.mount || "aps-c";
  if (mount === "full-frame") return true; // FF lenses fit all E-mount
  // APS-C lenses fit APS-C native; FF bodies can use in crop
  return bodies.some((b) => b.group === "aps-c" || b.group === "compact" || b.group === "full-frame");
}

export function validIdsByCategory(): { body: Set<string>; lens: Set<string>; acc: Set<string> } {
  const cat = gearCatalog();
  return {
    body: new Set(cat.body.map((i) => i.id)),
    lens: new Set(cat.lens.map((i) => i.id)),
    acc: new Set(cat.acc.map((i) => i.id)),
  };
}

export type GearCat = keyof Catalog;
export interface GearHit {
  cat: GearCat;
  item: Item;
}

// So khớp bỏ dấu, bỏ khoảng trắng và gạch: "ilce 6400", "A6400", "fe50mm f1.8" đều khớp
const norm = (s: string) => fold(s).replace(/[\s\-_./]/g, "");
const all = (): GearHit[] => (["body", "lens", "acc"] as const).flatMap((cat) => gearCatalog()[cat].map((item) => ({ cat, item })));

/** Món khớp đúng tên hoặc mã. null nghĩa là sản phẩm chưa có trong dự án. */
export function findGear(query: string): GearHit | null {
  const q = norm(query);
  if (!q) return null;
  return all().find(({ item }) => norm(item.name) === q || norm(item.code) === q) ?? null;
}

/** Gợi ý khi gõ: khớp đầu tên/mã trước, rồi khớp giữa chừng. */
/** Gợi ý cho tên gõ sai (hộp thoại "chưa được hỗ trợ"): bớt dần ký tự cuối tới khi có kết quả, ví dụ "A7 IIII" → "A7 III" */
export function nearGear(query: string, limit = 3): GearHit[] {
  for (let q = query.trim(); q.length >= 2; q = q.slice(0, -1).trim()) {
    const hits = suggestGear(q, limit);
    if (hits.length) return hits;
  }
  return [];
}

export function suggestGear(query: string, limit = 6): GearHit[] {
  const q = norm(query);
  if (!q) return [];
  const rank = ({ item }: GearHit) => Math.min(...[item.name, item.code].map((s) => norm(s).indexOf(q)).filter((i) => i >= 0), Infinity);
  return all()
    .map((h) => [rank(h), h] as const)
    .filter(([r]) => r < Infinity)
    .sort((a, b) => a[0] - b[0] || a[1].item.name.length - b[1].item.name.length)
    .slice(0, limit)
    .map(([, h]) => h);
}
