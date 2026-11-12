"use client";

import { useMemo } from "react";
import { useGear } from "@/lib/gear";
import { useCart } from "@/lib/cart";
import { usePersonal } from "@/lib/usePersonal";
import { Constellation, type ConstellationProps } from "./Constellation";

/** Constellation với nút của người dùng: túi đồ (mọi đồ thị) và giỏ màu M1–M4 (Color Bank, đồ thị tổng hợp).
 * Không chọn sẵn nút nào: đồ thị mở ở trạng thái chờ (tự xoay, vừa khung) cho tới khi người dùng tương tác.
 * Đang cá nhân hóa (lib/usePersonal) thì chỉ còn các nút nối với túi đồ; bật tắt bằng hàng "Nội dung" trong menu avatar (trên đồ thị không còn nút riêng, tránh trùng).
 * preview (landing): lọc ngay khi túi đã lưu có món, để xem trước đồ thị của riêng mình.. */
export function MineConstellation({ preview, ...props }: Omit<ConstellationProps, "mine"> & { preview?: boolean }) {
  const bag = useGear();
  const cart = useCart();
  const personal = usePersonal(preview);
  const full = props.graph;
  const graph = useMemo(() => {
    const keep = personal.ids;
    // Đồ thị Product Wiki không lọc: sản phẩm luôn hiện đủ (người dùng có thể mua thêm bất kỳ món nào)
    if (!keep || full.app === "wiki") return full;
    const nodes = full.nodes.filter((n) => keep.has(n.id));
    // Đồ thị của một app không có nút nào nối với túi đồ thì giữ nguyên, không để trống
    return nodes.length ? { ...full, nodes, edges: full.edges.filter(([a, b]) => keep.has(a) && keep.has(b)) } : full;
  }, [full, personal.ids]);
  const ids = new Set(graph.nodes.map((n) => n.id));
  const app = graph.app;
  const owned = [...(app === "colors" || app === "all" ? Object.values(cart.slots).flat() : []), ...(app === "colors" ? [] : [...bag.body, ...bag.lens, ...bag.acc])];
  const mine = owned.filter((id) => ids.has(id));
  return <Constellation {...props} graph={graph} mine={mine} />;
}
