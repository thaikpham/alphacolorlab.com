"use client";

import { useEffect, useRef, useState } from "react";
import { landing } from "@/app/content";
import type { CGraph } from "@/lib/constellation";
import { authReady, useSession } from "@/lib/auth";
import { useGear } from "@/lib/gear";
import { resetPersonalOff } from "@/lib/usePersonal";
import { GearManager } from "./GearManager";
import { LandingGraph } from "./LandingGraph";
import { LandingStart } from "./LandingStart";

const T = landing.flow;
const STEP_KEY = "landing-step";
type Step = 1 | 2 | 3;

/** Landing là một flow 3 bước trong đúng một màn hình, không cuộn trang (cuộn theo mốc từng kéo người dùng đi khi đang nhập máy):
 * 1 giới thiệu, 2 túi đồ + đăng nhập Google (bắt buộc cả hai mới sang được bước 3), 3 đồ thị đã cá nhân hóa + nút vào dự án.
 * Đồ thị tổng hợp nằm nền suốt flow. Bước đang đứng lưu trong sessionStorage: vòng đăng nhập Google rời trang rồi quay lại "/"
 * thì về đúng bước 2. Góc dưới trái: nút quay lại + chấm đếm bước; góc dưới phải: nút cam của bước (bước 3 là EnterLink trong đồ thị). */
export function LandingFlow({ graph }: { graph: CGraph }) {
  const [step, setStep] = useState<Step>(1);
  const session = useSession();
  const bag = useGear();
  const stage = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      const s = Number(sessionStorage.getItem(STEP_KEY));
      if (s === 2 || s === 3) return setStep(s);
    }
    sessionStorage.setItem(STEP_KEY, String(step));
  }, [step]);

  const hasBag = bag.body.length + bag.lens.length + bag.acc.length > 0;
  // Bản chưa bật đăng nhập (thiếu cấu hình) thì không thể bắt đăng nhập
  const signedIn = !authReady || !!session;
  const ready = hasBag && signedIn;
  // Không đủ điều kiện thì không đứng ở bước 3 (ví dụ vừa khôi phục bước từ phiên trước rồi đăng xuất)
  const shown: Step = step === 3 && !ready ? 2 : step;
  const missing = [!hasBag && T.missing.bag, !signedIn && T.missing.login].filter(Boolean) as string[];
  // Bản chưa bật đăng nhập thì không có dòng đăng nhập
  const needs = [{ label: T.needs.bag, ok: hasBag }, ...(authReady ? [{ label: T.needs.login, ok: !!session }] : [])];
  const blocked = shown === 2 && !ready;
  // Bấm "Tiếp tục" khi còn thiếu: hiện cảnh báo cạnh nút (mỗi lần bấm tăng 1 để hẹn giờ lại), tự ẩn sau 6 giây
  const [warn, setWarn] = useState(0);
  const needsList = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!warn) return;
    const t = setTimeout(() => setWarn(0), 6000);
    return () => clearTimeout(t);
  }, [warn]);

  const go = (s: Step) => {
    // Sang bước 3 thì luôn mở ở "Của tôi", dù trước đó đã chọn "Tất cả"
    if (s === 3) resetPersonalOff();
    setStep(s);
    stage.current?.focus({ preventScroll: true });
  };

  return (
    <div ref={stage} tabIndex={-1} data-step={shown} aria-label={T.stepOf(shown, T.steps[shown - 1])} className="landing-flow relative h-dvh overflow-hidden outline-none">
      <div className="absolute inset-0">
        <LandingGraph graph={graph} active={shown === 3} />
      </div>

      {shown === 1 && (
        <section aria-labelledby="gioi-thieu-title" className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-x-clip intro-overlay px-4 py-24 text-center sm:px-6">
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
        </section>
      )}

      {shown === 2 && (
        <section aria-label={landing.start.title} className="absolute inset-0 z-10 overflow-y-auto bg-bg px-4 pt-10 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-4">
            <GearManager title={landing.start.title} compact />
            <LandingStart />
            <p className="rounded-control bg-fill px-4 py-3 text-subhead text-label text-pretty">{landing.start.note}</p>
            <ul ref={needsList} id="flow-missing" aria-label={T.needs.label} className="rounded-card bg-card shadow-card divide-y divide-separator">
              {needs.map((n) => (
                <li key={n.label} className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 text-callout">
                  <span className="text-pretty">{n.label}</span>
                  <span className={`shrink-0 rounded-badge px-2 py-0.5 text-footnote font-semibold ${n.ok ? "bg-success-fill text-success" : "bg-warning-fill text-warning"}`}>
                    {n.ok ? T.needs.done : T.needs.todo}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <nav aria-label={T.nav} className="absolute bottom-2 left-2 z-30 flex items-center gap-2 md:bottom-4 md:left-4">
        {shown > 1 && (
          <button type="button" aria-label={T.back} onClick={() => go((shown - 1) as Step)} className="group grid size-11 place-items-center rounded-full text-label">
            <span className="grid size-8 place-items-center rounded-full bg-card shadow-thumb transition-colors group-hover:bg-fill group-active:bg-fill-strong">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 4l-4 4 4 4" />
              </svg>
            </span>
          </button>
        )}
        <p className="hidden h-8 items-center gap-2 rounded-full bg-card px-3 text-footnote font-semibold text-label shadow-thumb sm:flex">
          <span aria-hidden="true" className="flex gap-1">
            {T.steps.map((name, i) => (
              <span key={name} className={`size-1.5 rounded-full ${i < shown ? "bg-accent" : "bg-fill-strong"}`} />
            ))}
          </span>
          <span className="tabular-nums">{T.count(shown, T.steps.length)}</span>
        </p>
      </nav>

      {shown < 3 && (
        <div className="absolute right-2 bottom-2 z-30 flex flex-col items-end gap-2 md:right-4 md:bottom-4">
          {/* Vùng báo luôn có trong DOM để trình đọc màn hình đọc được chữ vừa thêm vào */}
          <div role="alert">
            {blocked && warn > 0 && (
              <p className="w-72 rounded-control bg-card px-4 py-3 text-subhead font-semibold text-warning text-pretty shadow-thumb">{T.missing.lead(missing)}</p>
            )}
          </div>
          {/* Còn thiếu thì nút vẫn bấm được (aria-disabled, không disabled): bấm để biết đang thiếu gì */}
          <button
            type="button"
            aria-disabled={blocked || undefined}
            aria-describedby={blocked ? "flow-missing" : undefined}
            onClick={() => {
              if (!blocked) return go((shown + 1) as Step);
              setWarn((n) => n + 1);
              needsList.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }}
            className={`inline-flex h-12 items-center gap-2 rounded-full px-7 text-callout font-semibold transition-colors ${
              blocked ? "bg-fill-strong text-secondary" : "bg-accent text-on-accent hover:bg-accent/90"
            }`}
          >
            {shown === 1 ? T.start : T.next}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4.5L12.5 8 9 11.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
