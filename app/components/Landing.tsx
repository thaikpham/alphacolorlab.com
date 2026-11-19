"use client";

import { useEffect, useRef, useState } from "react";
import { landing } from "@/app/content";
import type { CGraph } from "@/lib/constellation";
import { resetPersonalOff } from "@/lib/usePersonal";
import { AccountButton } from "./AccountButton";
import { LandingGraph } from "./LandingGraph";

/** Trang chủ "/" (không có thanh điều hướng) là một trang cuộn gồm hai màn hình:
 * 1 giới thiệu, nút "Bắt đầu" cuộn xuống; 2 đồ thị tổng hợp toàn màn hình.
 * Đồ thị là một lớp cố định dưới cùng: màn 1 phủ lên và chặn chuột, màn 2 trong suốt và không nhận chuột để đồ thị bên dưới nhận.
 * Lăn chuột thường cuộn trang, kể cả trên đồ thị; Ctrl/⌘ + lăn mới zoom đồ thị. Avatar cố định góc trên phải, đặt đúng một nút. */
export function Landing({ graph }: { graph: CGraph }) {
  const [onGraph, setOnGraph] = useState(false);
  const graphScreen = useRef<HTMLDivElement>(null);
  const entered = useRef(false);

  useEffect(() => {
    const el = graphScreen.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = entry.intersectionRatio >= 0.5;
        setOnGraph(on);
        // Lần đầu vào màn đồ thị thì mở ở "Của tôi" (bỏ lựa chọn "Tất cả" đã lưu, nếu có); cuộn qua lại không đặt lại
        if (on && !entered.current) {
          entered.current = true;
          resetPersonalOff();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const start = () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    graphScreen.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div data-graph={onGraph ? "on" : "off"} className="landing-page">
      <div className="fixed inset-x-0 top-0 z-0 h-dvh">
        <LandingGraph graph={graph} on={onGraph} />
      </div>
      {/* Avatar và menu người dùng: đúng một nút ở mọi vị trí cuộn (đồng bộ tài khoản chạy một lần) */}
      <div className="fixed top-2 right-2 z-20 rounded-full bg-card shadow-thumb md:top-4 md:right-4">
        <AccountButton previewPersonal />
      </div>

      <section aria-labelledby="gioi-thieu-title" className="intro-overlay relative z-10 flex h-dvh flex-col items-center justify-center overflow-x-clip px-4 py-24 text-center sm:px-6">
        <div className="intro-glow">
          <h2 id="gioi-thieu-title" className="over-graph text-display font-light">
            {landing.intro.title[0]}
            <span className="hue-text font-normal">{landing.intro.title[1]}</span>
            {landing.intro.title[2]}
          </h2>
          <div className="over-graph mt-8 space-y-4 text-body text-label text-pretty">
            {landing.intro.lines.map(([a, b]) => (
              <p key={a}>
                <span className="md:block md:whitespace-nowrap">{a}</span> <span className="md:block md:whitespace-nowrap">{b}</span>
              </p>
            ))}
          </div>
        </div>
        <button type="button" onClick={start} className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-callout font-semibold text-on-accent transition-colors hover:bg-accent/90">
          {landing.start}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 3v10M4.5 9.5L8 13l3.5-3.5" />
          </svg>
        </button>
      </section>

      {/* Màn đồ thị: phần trống để lớp đồ thị cố định bên dưới hiện ra và nhận chuột khi cuộn tới */}
      <div ref={graphScreen} className="pointer-events-none h-dvh" />
    </div>
  );
}
