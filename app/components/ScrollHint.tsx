"use client";

import { useEffect, useRef, useState } from "react";
import { landing } from "@/app/content";
import { easeInOut, glideMs, normalizeStops, settleStop, wheelStop } from "@/lib/scrollStops";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// html có scroll-behavior: smooth; mỗi khung hình phải đặt vị trí tức thì, không thì trình duyệt tự làm mượt chồng lên đường cong
const jump = (y: number) => scrollTo({ top: y, behavior: "instant" });
const topOf = (id: string) => (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + scrollY;

/** Mũi tên ở cạnh dưới lớp giới thiệu của landing (bấm để tới `target`, ẩn khi đã cuộn), kèm các mốc dừng khi cuộn:
 * đầu trang, từng section trong `stops`, cuối trang. Lăn chuột ở một mốc thì lướt thẳng tới mốc kề; cuộn/vuốt dừng lưng chừng
 * thì đi nốt tới mốc theo hướng vừa cuộn (lib/scrollStops). Đoạn dài hơn một màn hình cuộn tự do. Không hút khi đang giữ ngón tay. */
export function ScrollHint({ target, stops }: { target: string; stops: string[] }) {
  const [hidden, setHidden] = useState(false);
  const glide = useRef<(to: number) => void>(() => {});
  const ids = stops.join(" ");

  useEffect(() => {
    let last = scrollY, dir = 0, timer = 0, raf = 0, gliding = false, touching = false;
    const max = () => document.documentElement.scrollHeight - innerHeight;
    const marks = () => normalizeStops([0, ...ids.split(" ").map(topOf), max()], max());

    const stop = () => {
      cancelAnimationFrame(raf);
      gliding = false;
    };
    // Lướt bằng rAF để mọi trình duyệt cùng một đường cong: nhanh dần rồi chậm dần
    const to = (y: number) => {
      stop();
      if (reduced()) return jump(y);
      const from = scrollY, dist = y - from, ms = glideMs(dist), t0 = performance.now();
      if (Math.abs(dist) < 1) return;
      gliding = true;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / ms);
        jump(from + dist * easeInOut(k));
        if (k < 1) raf = requestAnimationFrame(step);
        else {
          gliding = false;
          last = scrollY;
        }
      };
      raf = requestAnimationFrame(step);
    };
    glide.current = to;

    const settle = () => {
      if (touching || gliding) return;
      const y = settleStop(scrollY, dir, marks(), innerHeight);
      if (y !== null) to(y);
    };
    // Đứng ở mốc đồ thị (mốc đầu tiên trong stops) thì báo cho CSS hiện chỉ dẫn của đồ thị
    const viewing = () => document.documentElement.toggleAttribute("data-graph-view", Math.abs(scrollY - topOf(ids.split(" ")[0])) < innerHeight * 0.3);
    const onScroll = () => {
      setHidden(scrollY > 40);
      viewing();
      if (gliding) return;
      if (scrollY !== last) dir = Math.sign(scrollY - last);
      last = scrollY;
      clearTimeout(timer);
      timer = window.setTimeout(settle, 140);
    };
    const onWheel = (ev: WheelEvent) => {
      if (ev.ctrlKey || ev.metaKey) return; // Ctrl/⌘ + lăn: zoom đồ thị
      if (gliding) return ev.preventDefault(); // nuốt quán tính bánh xe trong lúc đang lướt
      const y = wheelStop(scrollY, Math.sign(ev.deltaY), marks(), innerHeight);
      if (y === null) return;
      ev.preventDefault();
      dir = Math.sign(ev.deltaY);
      to(y);
    };
    const onTouchStart = () => {
      touching = true;
      stop();
    };
    const onTouchEnd = () => {
      touching = false;
      clearTimeout(timer);
      timer = window.setTimeout(settle, 140);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(ev.key)) stop();
    };

    // Nơi khác trong landing (nút "Xem túi đồ trên đồ thị") nhờ lướt tới một mốc: sự kiện "landing-glide", detail là id của mốc
    const onGlide = (ev: Event) => to(topOf((ev as CustomEvent<string>).detail));

    onScroll();
    addEventListener("landing-glide", onGlide);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("wheel", onWheel, { passive: false });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchend", onTouchEnd, { passive: true });
    addEventListener("touchcancel", onTouchEnd, { passive: true });
    addEventListener("keydown", onKey);
    return () => {
      stop();
      clearTimeout(timer);
      document.documentElement.removeAttribute("data-graph-view");
      removeEventListener("landing-glide", onGlide);
      removeEventListener("scroll", onScroll);
      removeEventListener("wheel", onWheel);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchend", onTouchEnd);
      removeEventListener("touchcancel", onTouchEnd);
      removeEventListener("keydown", onKey);
    };
  }, [ids]);

  return (
    <button
      type="button"
      aria-label={landing.scrollHint}
      onClick={() => glide.current(topOf(target))}
      className={`scroll-hint absolute bottom-6 left-1/2 z-10 flex size-14 -translate-x-1/2 items-center justify-center rounded-full transition-opacity duration-300 ease-ios ${hidden ? "pointer-events-none opacity-0" : "opacity-90"}`}
    >
      <svg width="40" height="40" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 13l9 9 9-9" />
      </svg>
    </button>
  );
}
