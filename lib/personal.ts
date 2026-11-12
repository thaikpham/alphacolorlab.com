// Cá nhân hóa theo túi đồ: tập nội dung "nối với sản phẩm của bạn" = các nút trên đồ thị tổng hợp cách một món trong túi
// tối đa HOPS cạnh. 2 bước: món → nhóm/bài/chương nối thẳng → mọi thứ nối với các mục đó (công thức màu, sản phẩm cùng dòng, cùng pin).

export const HOPS = 2;

/** Id các nút cách một hạt giống tối đa `hops` cạnh (gồm cả hạt giống có trên đồ thị). Hạt giống không có trên đồ thị bị bỏ qua. */
export function relatedIds(edges: readonly (readonly [string, string])[], seeds: readonly string[], hops = HOPS): Set<string> {
  const nb = new Map<string, string[]>();
  const link = (a: string, b: string) => (nb.get(a) ?? nb.set(a, []).get(a)!).push(b);
  for (const [a, b] of edges) {
    link(a, b);
    link(b, a);
  }
  const seen = new Set(seeds.filter((id) => nb.has(id)));
  let edge = [...seen];
  for (let h = 0; h < hops && edge.length; h++) {
    const next: string[] = [];
    for (const id of edge)
      for (const m of nb.get(id)!)
        if (!seen.has(m)) {
          seen.add(m);
          next.push(m);
        }
    edge = next;
  }
  return seen;
}

/** Lọc một danh sách theo tập đã nối. Tập rỗng hoặc lọc xong không còn mục nào thì trả nguyên danh sách:
 * một app không có mục nào nối với túi đồ (ví dụ Color Bank với máy chưa nối công thức) vẫn phải dùng được. */
export function keepRelated<T>(items: readonly T[], key: (item: T) => string, related: ReadonlySet<string> | null): readonly T[] {
  if (!related || related.size === 0) return items;
  const kept = items.filter((i) => related.has(key(i)));
  return kept.length ? kept : items;
}
