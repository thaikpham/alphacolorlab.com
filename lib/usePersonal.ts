"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useGear } from "./gear";
import { relatedIds } from "./personal";

// Cá nhân hóa theo túi đồ ở trình duyệt. Cờ "personalized" trong localStorage: "1" = đang lọc theo túi đồ,
// "0" = người dùng tạm xem tất cả, chưa có = chưa từng bấm "Tối ưu nội dung và Truy cập". Đồng bộ theo tài khoản (lib/userState).

const KEY = "personalized";
const EVENT = "personalized";

function subscribe(f: () => void) {
  addEventListener("storage", f);
  addEventListener(EVENT, f);
  return () => {
    removeEventListener("storage", f);
    removeEventListener(EVENT, f);
  };
}

export function setPersonal(on: boolean) {
  localStorage.setItem(KEY, on ? "1" : "0");
  dispatchEvent(new Event(EVENT));
}

/** Bỏ lựa chọn "Tất cả" đã lưu, về trạng thái chưa chọn: nơi xem trước (bước 3 của landing) lại mặc định "Của tôi". Không bật lọc cho cả site. */
export function resetPersonalOff() {
  if (localStorage.getItem(KEY) !== "0") return;
  localStorage.removeItem(KEY);
  dispatchEvent(new Event(EVENT));
}

type Links = { edges: [string, string][]; href: Record<string, string> };
let links: Promise<Links> | null = null;
const loadLinks = () => (links ??= fetch("/related.json").then((r) => r.json() as Promise<Links>).catch((e) => ((links = null), Promise.reject(e))));

export interface Personal {
  /** Túi có món và người dùng đã từng bật: có gì để bật/tắt (hiện nút "Của tôi / Tất cả") */
  available: boolean;
  /** Túi có món (có thể bật lọc) */
  hasGear: boolean;
  /** Người dùng đang chọn "Của tôi" (cờ bật, hoặc đang xem trước), kể cả khi dữ liệu nối chưa tải xong */
  wanted: boolean;
  /** Đang lọc theo túi đồ */
  on: boolean;
  /** Id nút và đường dẫn đã nối với túi đồ; null khi không lọc hoặc dữ liệu chưa tải xong */
  ids: ReadonlySet<string> | null;
  hrefs: ReadonlySet<string> | null;
}

/** preview: lọc ngay khi túi có món dù chưa bấm bật (đồ thị ở landing cho xem trước kết quả); người dùng đã tắt thì vẫn tắt. */
export function usePersonal(preview = false): Personal {
  const flag = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY), () => null);
  const bag = useGear();
  const seeds = useMemo(() => [...bag.body, ...bag.lens, ...bag.acc], [bag]);
  const wanted = seeds.length > 0 && (flag === "1" || (preview && flag !== "0"));
  const [data, setData] = useState<Links | null>(null);
  useEffect(() => {
    if (!wanted || data) return;
    let live = true;
    loadLinks().then((d) => live && setData(d), () => {});
    return () => {
      live = false;
    };
  }, [wanted, data]);
  const sets = useMemo(() => {
    if (!wanted || !data) return null;
    const ids = relatedIds(data.edges, seeds);
    if (!ids.size) return null;
    return { ids, hrefs: new Set([...ids].flatMap((id) => data.href[id] ?? [])) };
  }, [wanted, data, seeds]);
  return { available: seeds.length > 0 && (flag !== null || preview), hasGear: seeds.length > 0, wanted, on: !!sets, ids: sets?.ids ?? null, hrefs: sets?.hrefs ?? null };
}
