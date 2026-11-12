"use client";

import { useGear } from "@/lib/gear";
import { useCart } from "@/lib/cart";
import { Constellation, type ConstellationProps } from "./Constellation";

/** Constellation với nút của người dùng: túi đồ (mọi đồ thị) và giỏ màu M1–M4 (Color Bank, đồ thị tổng hợp).
 * Không chọn sẵn nút nào: đồ thị mở ở trạng thái chờ (tự xoay, vừa khung) cho tới khi người dùng tương tác. */
export function MineConstellation(props: Omit<ConstellationProps, "mine">) {
  const bag = useGear();
  const cart = useCart();
  const ids = new Set(props.graph.nodes.map((n) => n.id));
  const app = props.graph.app;
  const owned = [...(app === "colors" || app === "all" ? Object.values(cart.slots).flat() : []), ...(app === "colors" ? [] : [...bag.body, ...bag.lens, ...bag.acc])];
  const mine = owned.filter((id) => ids.has(id));
  return <Constellation {...props} mine={mine} />;
}
