"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppId, CGraph } from "@/lib/constellation";
import { tick3d, type Body } from "@/lib/layout3d";
import { project, depthScale, depthFog, depthFont, screenDeltaToWorld, focusRingLayout, hashPhase, selectLabelsToRender, type Point3, type ProjectResult } from "@/lib/constellationView";
import { fold } from "@/lib/fold";
import { constellation as C, nav, search } from "@/app/content";
import { registerPageSearch } from "@/lib/pageSearch";

// Đồ thị 3D vẽ trên canvas (DESIGN.md › Constellation). Toàn bộ trạng thái động nằm trong một object `Engine`
// tạo một lần cho mỗi đồ thị và một vòng requestAnimationFrame; React chỉ giữ phần giao diện phủ lên trên
// (nút zoom, vùng aria-live) và được báo khi đổi nút đang chọn. Tìm nút dùng thanh tìm kiếm chung trên thanh điều hướng.

const ZMIN = 0.45, ZMAX = 3.5, RIPPLE = 0.35, LOCK = 0.25, MAX_LABEL = 28;
/** Tự xoay khi chưa ai chạm vào: rad/giây quanh trục đứng, như trái đất */
const SPIN = 0.12;
/** Lề khi tự vừa khung (đồ thị tràn viền): chừa vừa đủ cho nhãn hai bên và nút zoom phía dưới (px) */
const FIT_PAD_X = 48, FIT_PAD_Y = 52;
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;

interface Node extends Body {
  id: string;
  label: string;
  href?: string;
  hub: boolean;
  mine: boolean;
  /** Màu nút chính: màu app của đồ thị, hoặc của app gốc ở đồ thị tổng hợp */
  tone: string;
  /** App gốc của nút ở đồ thị tổng hợp (để tính tâm cụm từng app) */
  app?: string;
  /** Pha và tần số đung đưa, cố định theo id */
  ph: [number, number, number];
  f: number;
  /** Đích trên vòng quanh nút đang chọn */
  t: Point3 | null;
  lock: boolean;
  q: ProjectResult;
  r: number;
}

interface Engine {
  yaw: number;
  pitch: number;
  zoom: number;
  cam: Point3;
  tYaw: number | null;
  tPitch: number | null;
  tZoom: number | null;
  tCam: Point3 | null;
  alpha: number;
  sel: number;
  hov: number;
  ringR: number;
  lockT: number;
  rip: { i: number; t0: number } | null;
  T: number;
  W: number;
  H: number;
  touch: boolean;
  /** Đã chạm một lần vào nút đang chọn (màn cảm ứng): hiện chỉ dẫn mở trang */
  tapped: boolean;
  /** Chưa ai tương tác: tự xoay và luôn vừa khung. Hết khi người dùng chạm, lăn, bấm phím, tìm hoặc chọn nút. */
  idle: boolean;
  /** Zoom để cả đồ thị vừa khung, tính lại mỗi lần vẽ */
  fit: number;
  /** Thời điểm bắt đầu tăng tốc độ quay (ease-in) sau khi bỏ chọn */
  spinResumeT: number | null;
}

/** Tín hiệu chạy dọc một liên kết, như xung thần kinh */
interface Signal {
  edge: number;
  dir: 1 | -1;
  t0: number;
  dur: number;
  color: string;
}

interface Api {
  index(id: string): number;
  focus(i: number): void;
  clear(): void;
  open(i: number): void;
  zoomBy(k: number): void;
  cursor(dir: 1 | -1): void;
  enter(): void;
  setMine(ids: Set<string>): void;
  setOnly(app: string | null): void;
}

export interface ConstellationProps {
  graph: CGraph;
  /** Tên của đồ thị cho trình đọc màn hình */
  title: string;
  /** Nút của người dùng (túi đồ, giỏ màu): vòng chấm ngoài và nhãn luôn hiện */
  mine?: string[];
  /** Nút chọn sẵn khi URL không có ?n= */
  autoFocus?: string;
  /** Đặt ở góc trên trái, đè lên canvas */
  header?: React.ReactNode;
  /** Nút zoom −/+ ở góc dưới phải. Tắt cho đồ thị tổng hợp ở landing: vẫn zoom được bằng chụm hoặc Ctrl + lăn */
  controls?: boolean;
  /** Hệ số zoom ở trạng thái chờ so với vừa khung (1.3³ ≈ bấm + 3 lần) */
  zoom?: number;
  /** Chú giải màu ở đáy (đồ thị tổng hợp): 4 chấm + tên app, bấm để làm nổi cụm nút của app đó, bấm lại để bỏ */
  legend?: boolean;
  /** Bớt nhãn khi chờ (đồ thị tổng hợp ở landing): mỗi app chỉ hiện nhãn vài nút chính nhiều liên kết nhất; đang lọc theo app thì hiện đủ nút chính của app đó */
  quietLabels?: boolean;
  className?: string;
}

const LEGEND: AppId[] = ["console", "colors", "wiki", "blog"];
const LEGEND_DOT: Record<AppId, string> = { console: "bg-app-console", colors: "bg-app-colors", wiki: "bg-app-wiki", blog: "bg-app-blog" };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (a: number, b: number, k: number) => a + (b - a) * k;
const short = (s: string) => (s.length > MAX_LABEL ? `${s.slice(0, MAX_LABEL - 1)}…` : s);

export function Constellation({ graph, title, mine = [], autoFocus, header, controls = true, zoom = 1, legend = false, quietLabels = false, className }: ConstellationProps) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const tipText = useRef<HTMLSpanElement>(null);
  const api = useRef<Api | null>(null);
  const focusRef = useRef<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const [showFirstHint, setShowFirstHint] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  const [only, setOnly] = useState<AppId | null>(null);
  // Zoom lúc chờ đọc qua ref: landing đổi zoom theo mốc cuộn mà không dựng lại engine
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
    api.current?.setOnly(only);
  }, [zoom, only]);
  const uid = useId();
  const hintSeenKey = `graph-hint-seen-${graph.app}`;
  const hintOn = useRef(false);
  // Chỉ dẫn lần đầu: tắt và nhớ ngay ở lần tương tác đầu tiên (gọi từ engine nên đọc ref, không đọc state)
  const dismissHint = () => {
    if (!hintOn.current) return;
    hintOn.current = false;
    localStorage.setItem(hintSeenKey, "1");
    setShowFirstHint(false);
  };

  useEffect(() => {
    const box = boxRef.current!, cv = cvRef.current!, ctx = cv.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const v = (k: string) => css.getPropertyValue(`--color-${k}`).trim();
    const color = { bg: v("bg"), label: v("label"), tertiary: v("tertiary"), accent: v("accent") };
    // Màu tín hiệu: ngẫu nhiên trong bảng màu của trang (cam Alpha + màu 4 app)
    const palette = ["accent", "app-console", "app-colors", "app-wiki", "app-blog"].map(v);
    const tones = new Map<string, string>();
    const tone = (app: string) => tones.get(app) ?? (tones.set(app, v(`app-${app}`)), tones.get(app)!);
    const font = getComputedStyle(cv).fontFamily;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const padX = FIT_PAD_X, padY = FIT_PAD_Y;

    const at = new Map(graph.nodes.map((n, i) => [n.id, i]));
    const nb: number[][] = graph.nodes.map(() => []);
    const edges: [number, number, number][] = [];
    for (const [a, b] of graph.edges) {
      const i = at.get(a), j = at.get(b);
      if (i === undefined || j === undefined || i === j) continue;
      edges.push([i, j, hashPhase(a + b)]);
      nb[i].push(j);
      nb[j].push(i);
    }
    const pairs = edges.map(([a, b]) => [a, b] as [number, number]);
    const N: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      label: short(n.label),
      href: n.href,
      hub: !!n.hub,
      mine: false,
      tone: tone(n.app ?? (graph.app === "all" ? "console" : graph.app)),
      app: n.app,
      x: n.x,
      y: n.y,
      z: n.z,
      vx: 0,
      vy: 0,
      vz: 0,
      ph: [hashPhase(n.id), hashPhase(`${n.id}y`), hashPhase(`${n.id}z`)],
      f: 0.5 + (hashPhase(`${n.id}f`) / (2 * Math.PI)) * 0.5,
      t: null,
      lock: false,
      q: { x: 0, y: 0, z: 0, s: 1 },
      r: 0,
    }));
    const hubs = N.map((_, i) => i).filter((i) => N[i].hub).sort((a, b) => nb[b].length - nb[a].length);
    // Thứ hạng của nút chính trong app của nó (0 = nhiều liên kết nhất), cho quietLabels
    const rank = new Int16Array(N.length), seen: Record<string, number> = {};
    for (const i of hubs) rank[i] = seen[N[i].app ?? ""] = (seen[N[i].app ?? ""] ?? -1) + 1;
    // Lọc theo app (chú giải): nút ngoài app mờ đi
    let onlyApp: string | null = null;
    const off = (i: number) => onlyApp !== null && N[i].app !== onlyApp;
    const e: Engine = { yaw: 0.4, pitch: -0.15, zoom: 1, cam: { x: 0, y: 0, z: 0 }, tYaw: null, tPitch: null, tZoom: null, tCam: null, alpha: 0, sel: -1, hov: -1, ringR: 75, lockT: 0, rip: null, T: 0, W: 0, H: 0, touch: false, tapped: false, idle: true, fit: 0, spinResumeT: null };

    // Vòng vẽ: chạy liên tục khi có đung đưa và đồ thị đang hiện; khi giảm chuyển động thì chỉ chạy lúc có thay đổi
    let raf = 0, dirty = true, inView = true, opened = false, dragN = -1, lastT = 0, fitted = false;
    const ctrlX = new Float32Array(edges.length), ctrlY = new Float32Array(edges.length);
    const signals: Signal[] = [];
    const endIdle = () => {
      e.idle = false;
      dismissHint();
    };
    const visible = () => inView && !document.hidden;
    const kick = () => {
      dirty = true;
      if (!raf && visible()) raf = requestAnimationFrame(frame);
    };

    const size = { width: 0, height: 0 };
    const scratch: Point3 = { x: 0, y: 0, z: 0 };
    const ord = N.map((_, i) => i);
    const prio = new Array<number>(N.length);
    const cand: number[] = [];

    // Đung đưa chỉ cộng lúc chiếu, không ghi vào vị trí
    const sway = (n: Node, i: number): Point3 => {
      if (reduce.matches || i === e.sel) return n;
      const a = n.t ? 1.6 : 2.6, w = e.T * n.f;
      scratch.x = n.x + Math.sin(w + n.ph[0]) * a;
      scratch.y = n.y + Math.sin(w * 1.13 + n.ph[1]) * a;
      scratch.z = n.z + Math.sin(w * 0.87 + n.ph[2]) * a;
      return scratch;
    };

    const draw = () => {
      const { W, H } = e, rm = reduce.matches;
      size.width = W;
      size.height = H;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < N.length; i++) N[i].q = project(sway(N[i], i), e, size);
      const act = e.sel >= 0 ? new Set([e.sel, ...nb[e.sel]]) : null;

      ctx.lineCap = "round";
      ctx.setLineDash([0, 6]);
      for (let k = 0; k < edges.length; k++) {
        const [a, b, ph] = edges[k];
        const hi = a === e.sel || b === e.sel, A = N[a].q, B = N[b].q;
        // Cạnh xa mảnh và nhạt hơn cạnh gần (phối cảnh)
        const dz = (A.z + B.z) / 2;
        ctx.globalAlpha = hi ? 0.95 : act || off(a) || off(b) ? 0.08 : 0.55 * depthFog(dz);
        ctx.strokeStyle = hi ? N[e.sel].tone : color.tertiary;
        ctx.lineWidth = (hi ? 2.2 : 1.6) * depthScale(dz);
        const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
        const bend = rm ? L * 0.06 : L * (0.06 + 0.05 * Math.sin(e.T * 0.7 + ph));
        ctrlX[k] = (A.x + B.x) / 2 - (dy / L) * bend;
        ctrlY[k] = (A.y + B.y) / 2 + (dx / L) * bend;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.quadraticCurveTo(ctrlX[k], ctrlY[k], B.x, B.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Tín hiệu: chấm sáng kèm đuôi chạy theo đường cong của liên kết, chiều và màu ngẫu nhiên
      for (let i = signals.length - 1; i >= 0; i--) {
        const g = signals[i], s = (e.T - g.t0) / g.dur;
        if (s >= 1) {
          signals.splice(i, 1);
          continue;
        }
        const [a, b] = edges[g.edge], A = N[a].q, B = N[b].q;
        const on = act ? a === e.sel || b === e.sel : !off(a) && !off(b);
        ctx.fillStyle = g.color;
        for (let k = 0; k < 4; k++) {
          const u0 = s - k * 0.035;
          if (u0 < 0) break;
          const u = g.dir > 0 ? u0 : 1 - u0, w = 1 - u;
          const x = w * w * A.x + 2 * w * u * ctrlX[g.edge] + u * u * B.x, y = w * w * A.y + 2 * w * u * ctrlY[g.edge] + u * u * B.y;
          // hiện dần lúc rời nút, tắt dần lúc tới nút
          ctx.globalAlpha = (on ? 0.95 : 0.12) * (1 - k * 0.25) * Math.min(1, s * 6, (1 - s) * 6);
          ctx.beginPath();
          ctx.arc(x, y, 2.4 - k * 0.45, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      ord.sort((a, b) => N[b].q.z - N[a].q.z);
      // Cỡ chấm: tỉ lệ thẳng với phối cảnh (gần lớn, xa nhỏ), zoom thì căn bậc hai cho đỡ phình; không theo khổ màn hình
      for (const i of ord) {
        const n = N[i], q = n.q, sel = i === e.sel;
        const pulse = sel && !rm ? 1 + 0.06 * Math.sin(e.T * 2.2) : 1;
        n.r = (n.hub ? 6.5 : 3.8) * Math.sqrt(e.zoom) * depthScale(q.z) * (sel ? 1.35 * pulse : 1);
        ctx.globalAlpha = act ? (act.has(i) ? 1 : 0.12) : off(i) ? 0.12 : depthFog(q.z);
        ctx.fillStyle = sel || n.hub ? n.tone : act ? color.label : color.tertiary;
        ctx.beginPath();
        ctx.arc(q.x, q.y, n.r, 0, 2 * Math.PI);
        ctx.fill();
        if (n.mine) {
          ctx.fillStyle = color.label;
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(q.x + Math.cos(a) * (n.r + 5), q.y + Math.sin(a) * (n.r + 5), 1.3, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }

      // Khung lấy nét bốn góc khóa vào nút đang chọn: thu từ 1.8× về 1× trong LOCK giây
      if (e.sel >= 0) {
        const n = N[e.sel], q = n.q;
        const k = rm ? 1 : clamp((e.T - e.lockT) / LOCK, 0, 1);
        const h = (n.r + 9) * (1 + 0.8 * (1 - k) ** 2), l = Math.max(5, h * 0.42);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color.accent;
        ctx.lineWidth = e.hov === e.sel ? 2.5 : 2;
        ctx.lineCap = "square";
        ctx.beginPath();
        for (const [sx, sy] of CORNERS) {
          const cx = q.x + sx * h, cy = q.y + sy * h;
          ctx.moveTo(cx - sx * l, cy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy - sy * l);
        }
        ctx.stroke();
      }

      if (e.rip) {
        const q = N[e.rip.i].q, k = clamp((e.T - e.rip.t0) / RIPPLE, 0, 1);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = N[e.rip.i].tone;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(q.x, q.y, N[e.rip.i].r + 6 + k * 48, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Nhãn: ưu tiên nút chọn, nút đang rê, nút của tôi, nút kề, rồi nút chính nhiều liên kết; nhãn chồng nhau thì bỏ nhãn sau
      cand.length = 0;
      const quietTop = W < 640 ? 2 : 4;
      for (let i = 0; i < N.length; i++) {
        const n = N[i];
        const hubOn = n.hub && !off(i) && (!quietLabels || onlyApp !== null || rank[i] < quietTop);
        const p = i === e.sel ? 0 : i === e.hov ? 1 : act ? (act.has(i) ? (n.mine ? 2 : 3) : -1) : n.mine && !off(i) ? 2 : hubOn ? 4 : -1;
        if (p >= 0) {
          prio[i] = p;
          cand.push(i);
        }
      }
      // Collect label data for collision detection
      const labelData: Array<{ idx: number; priority: number; width: number; height: number; x: number; y: number; align: CanvasTextAlign; sel: boolean; fs: number }> = [];
      ctx.globalAlpha = 1;
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = 5;
      ctx.strokeStyle = color.bg;
      ctx.fillStyle = color.label;
      for (const i of cand) {
        const n = N[i], q = n.q, sel = i === e.sel;
        let x = q.x + n.r + 7, y = q.y, align: CanvasTextAlign = "left";
        const fs = sel ? 15 : depthFont(q.z);
        ctx.font = `400 ${fs}px ${font}`;
        if (sel) {
          x = q.x;
          y = q.y - n.r - 22;
          align = "center";
        } else if (act && q.x < N[e.sel].q.x - 4) {
          x = q.x - n.r - 7;
          align = "right";
        }
        const w = ctx.measureText(n.label).width;
        // Nhãn sắp tràn khỏi khung thì lật sang phía bên kia nút (nhãn giữa thì kẹp vào trong), không để bị cắt cụt ở mép
        if (align === "left" && x + w > W - 4 && q.x - n.r - 7 - w >= 4) {
          x = q.x - n.r - 7;
          align = "right";
        } else if (align === "right" && x - w < 4 && q.x + n.r + 7 + w <= W - 4) {
          x = q.x + n.r + 7;
          align = "left";
        } else if (align === "center") x = clamp(x, w / 2 + 4, W - w / 2 - 4);
        const h = sel ? 22 : fs + 5;
        y = clamp(y, h / 2, H - h / 2);
        labelData.push({ idx: i, priority: prio[i], width: w, height: h, x, y, align, sel, fs });
      }
      // Filter labels by collision detection
      const labelsToRender = selectLabelsToRender(labelData.map(l => ({ idx: l.idx, priority: l.priority, width: l.width + 4, height: l.height, x: l.x - (l.align === "center" ? l.width / 2 : l.align === "right" ? l.width : 0), y: l.y })));
      const renderSet = new Set(labelsToRender);
      // Vẽ nhãn xa trước, gần sau để nhãn gần nằm trên; chữ nhạt dần khi ra xa, đậm lên khi tới gần (cùng độ đậm với chấm)
      labelData.sort((a, b) => N[b.idx].q.z - N[a.idx].q.z);
      for (const ld of labelData) {
        if (!renderSet.has(ld.idx)) continue;
        ctx.globalAlpha = ld.sel || act ? 1 : depthFog(N[ld.idx].q.z);
        ctx.font = `400 ${ld.fs}px ${font}`;
        ctx.textAlign = ld.align;
        const label = N[ld.idx].label;
        ctx.strokeText(label, ld.x, ld.y);
        ctx.fillText(label, ld.x, ld.y);
      }
      ctx.globalAlpha = 1;

      // Chỉ dẫn "Bấm lần nữa để mở": rê chuột lên nút đang chọn, hoặc ngay sau lần chạm đầu
      const tip = tipRef.current;
      if (tip) {
        const i = e.sel, show = i >= 0 && !!N[i].href && !e.rip && (e.hov === i || e.tapped);
        if (show) {
          if (tipText.current) tipText.current.textContent = e.touch ? C.focusHint : C.focusHintMouse;
          const q = N[i].q;
          tip.style.transform = `translate(${clamp(q.x - tip.offsetWidth / 2, 8, W - tip.offsetWidth - 8)}px, ${clamp(q.y + N[i].r + 22, 8, H - tip.offsetHeight - 8)}px)`;
        }
        tip.classList.toggle("opacity-0", !show);
        tip.classList.toggle("opacity-100", show);
      }

      // Zoom vừa khung: điểm xa nhất so với nửa khung (trừ lề); kích thước chiếu tỉ lệ thuận với zoom nên chia là ra zoom cần
      let far = 0;
      for (const n of N) far = Math.max(far, Math.abs(n.q.x - W / 2) / Math.max(40, W / 2 - padX), Math.abs(n.q.y - H / 2) / Math.max(40, H / 2 - padY));
      e.fit = far > 0 ? e.zoom / far : 0;
    };

    function frame(now: number) {
      raf = 0;
      if (!visible() || !e.W) return;
      e.T = now / 1000;
      const dt = lastT ? Math.min(0.05, e.T - lastT) : 0;
      lastT = e.T;
      let busy = !reduce.matches || !!e.rip || (e.sel >= 0 && e.T - e.lockT < LOCK);
      if (e.idle) {
        if (!reduce.matches) {
          let spinRate = SPIN;
          // Ease-in spin resumption: ramp up from 0 over 0.4 seconds
          if (e.spinResumeT !== null && e.T - e.spinResumeT < 0.4) {
            const k = (e.T - e.spinResumeT) / 0.4;
            spinRate = SPIN * k * k; // quadratic ease-in
          } else if (e.spinResumeT !== null) {
            e.spinResumeT = null;
          }
          e.yaw += dt * spinRate;
        }
        const z = clamp(e.fit * zoomRef.current, ZMIN, ZMAX);
        // lần đầu nhảy thẳng tới zoom vừa khung, sau đó bám theo mềm khi xoay
        if (e.fit && Math.abs(z - e.zoom) > 0.002) e.zoom = reduce.matches || !fitted ? z : ease(e.zoom, z, 0.08);
        if (e.fit) fitted = true;
      }
      // Sinh tín hiệu ngẫu nhiên; đang chọn nút thì phần lớn chạy trên liên kết của nút đó
      if (!reduce.matches && edges.length && signals.length < Math.min(36, Math.ceil(edges.length / 5)) && Math.random() < 0.3) {
        const own = e.sel >= 0 && nb[e.sel].length && Math.random() < 0.7 ? edges.flatMap((ed, k) => (ed[0] === e.sel || ed[1] === e.sel ? [k] : [])) : null;
        signals.push({
          edge: own ? own[Math.floor(Math.random() * own.length)] : Math.floor(Math.random() * edges.length),
          dir: Math.random() < 0.5 ? 1 : -1,
          t0: e.T,
          dur: 0.9 + Math.random() * 0.9,
          color: palette[Math.floor(Math.random() * palette.length)],
        });
      }
      if (e.alpha > 0.004) {
        for (let i = 0; i < N.length; i++) N[i].pin = N[i].lock || i === dragN;
        e.alpha = tick3d(N, pairs, e.alpha);
        busy = true;
      }
      if (e.tYaw !== null && e.tPitch !== null) {
        const d = ((((e.tYaw - e.yaw + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
        e.yaw += d * 0.1;
        e.pitch = ease(e.pitch, e.tPitch, 0.1);
        busy = true;
        if (Math.abs(d) < 0.002 && Math.abs(e.tPitch - e.pitch) < 0.002) e.tYaw = e.tPitch = null;
      }
      if (e.tZoom !== null) {
        e.zoom = ease(e.zoom, e.tZoom, 0.09);
        busy = true;
        if (Math.abs(e.tZoom - e.zoom) < 0.003) {
          e.zoom = e.tZoom;
          e.tZoom = null;
        }
      }
      if (e.tCam) {
        const t = e.tCam;
        e.cam = { x: ease(e.cam.x, t.x, 0.1), y: ease(e.cam.y, t.y, 0.1), z: ease(e.cam.z, t.z, 0.1) };
        busy = true;
        if (Math.hypot(e.cam.x - t.x, e.cam.y - t.y, e.cam.z - t.z) < 0.05) {
          e.cam = t;
          e.tCam = null;
        }
      }
      if (e.sel >= 0) {
        const S = N[e.sel];
        for (let i = 0; i < N.length; i++) {
          const n = N[i];
          if (i === e.sel || i === dragN) continue;
          if (n.t) {
            if (Math.abs(n.x - n.t.x) + Math.abs(n.y - n.t.y) + Math.abs(n.z - n.t.z) > 0.05) busy = true;
            n.x = ease(n.x, n.t.x, 0.07);
            n.y = ease(n.y, n.t.y, 0.07);
            n.z = ease(n.z, n.t.z, 0.07);
            continue;
          }
          // Nút không liên quan nằm trong vòng thì lùi ra ngoài
          const dx = n.x - S.x, dy = n.y - S.y, dz = n.z - S.z, d = Math.hypot(dx, dy, dz) || 1, want = e.ringR + 45;
          if (d < want) {
            const k = ((want - d) * 0.06) / d;
            n.x += dx * k;
            n.y += dy * k;
            n.z += dz * k;
            busy = true;
          }
        }
      }
      if (e.rip && e.T - e.rip.t0 >= RIPPLE) {
        const href = N[e.rip.i].href!;
        e.rip = null;
        opened = true;
        router.push(href);
      }
      if (busy || dirty) draw();
      dirty = false;
      if (e.idle && e.fit && Math.abs(clamp(e.fit * zoomRef.current, ZMIN, ZMAX) - e.zoom) > 0.002) busy = true;
      if (busy && !raf) raf = requestAnimationFrame(frame);
    }

    // Giảm chuyển động: nhảy thẳng tới đích thay vì nội suy
    const snap = () => {
      if (!reduce.matches) return;
      if (e.tCam) e.cam = e.tCam;
      if (e.tZoom !== null) e.zoom = e.tZoom;
      e.tCam = null;
      e.tZoom = null;
      for (const n of N) if (n.t) Object.assign(n, n.t);
    };

    const focus = (i: number) => {
      endIdle();
      for (const n of N) {
        n.t = null;
        n.lock = false;
      }
      const S = N[i];
      e.sel = i;
      e.hov = -1;
      e.tapped = false;
      e.lockT = e.T;
      S.lock = true;
      e.tCam = { x: S.x, y: S.y, z: S.z };
      const { targets, ringR } = focusRingLayout(i, N, nb[i], e);
      targets.forEach((p, j) => (N[j].t = p));
      e.ringR = ringR;
      e.tZoom = clamp((0.36 * 420) / ringR, 1.1, 2.4);
      snap();
      setFocusId(S.id);
      setLive(C.announce(S.label, nb[i].length, !!S.href));
      kick();
    };

    const clear = () => {
      for (const n of N) {
        n.t = null;
        n.lock = false;
      }
      e.sel = -1;
      e.tapped = false;
      e.tCam = { x: 0, y: 0, z: 0 };
      e.tZoom = 1;
      e.alpha = Math.max(e.alpha, 0.35);
      e.idle = true;
      e.spinResumeT = e.T;
      snap();
      setFocusId(null);
      setLive("");
      kick();
    };

    const open = (i: number) => {
      const href = N[i].href;
      if (!href || opened || e.rip) return;
      if (reduce.matches) {
        opened = true;
        router.push(href);
        return;
      }
      e.rip = { i, t0: e.T };
      kick();
    };

    // Con trỏ: kéo nền để xoay, kéo nút để dời, hai ngón để zoom; chạm không kéo thì chọn / mở
    const ptrs = new Map<number, [number, number]>();
    let mode: "rot" | "node" | "pinch" | null = null, moved = false, start: [number, number] = [0, 0], last: [number, number] = [0, 0], pinch0 = 1, zoom0 = 1;
    const rel = (ev: PointerEvent): [number, number] => {
      const b = cv.getBoundingClientRect();
      return [ev.clientX - b.left, ev.clientY - b.top];
    };
    const pick = (x: number, y: number) => {
      let best = -1, bz = Infinity;
      for (let i = 0; i < N.length; i++) {
        const q = N[i].q;
        if (Math.hypot(q.x - x, q.y - y) < N[i].r + (e.touch ? 16 : 10) && q.z < bz) {
          bz = q.z;
          best = i;
        }
      }
      return best;
    };
    const onDown = (ev: PointerEvent) => {
      endIdle();
      e.touch = ev.pointerType !== "mouse";
      setTouchMode(e.touch);
      cv.setPointerCapture(ev.pointerId);
      const p = rel(ev);
      ptrs.set(ev.pointerId, p);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
        zoom0 = e.zoom;
        e.tZoom = null;
        dragN = -1;
        mode = "pinch";
        return;
      }
      start = last = p;
      moved = false;
      dragN = pick(p[0], p[1]);
      mode = dragN >= 0 ? "node" : "rot";
      e.tYaw = e.tPitch = null;
      e.spinResumeT = null;
      cv.style.cursor = "grabbing";
    };
    const onMove = (ev: PointerEvent) => {
      const p = rel(ev);
      if (ev.pointerType === "mouse") e.touch = false;
      if (!ptrs.has(ev.pointerId)) {
        const h = pick(p[0], p[1]);
        if (h !== e.hov) {
          e.hov = h;
          cv.style.cursor = h >= 0 ? "pointer" : "grab";
          kick();
        }
        return;
      }
      ptrs.set(ev.pointerId, p);
      if (mode === "pinch") {
        if (ptrs.size === 2) {
          const [a, b] = [...ptrs.values()];
          e.zoom = clamp((zoom0 * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch0, ZMIN, ZMAX);
          kick();
        }
        return;
      }
      const dx = p[0] - last[0], dy = p[1] - last[1];
      last = p;
      if (Math.hypot(p[0] - start[0], p[1] - start[1]) > (e.touch ? 8 : 4)) moved = true;
      if (!moved) return;
      if (mode === "rot") {
        e.yaw += dx * 0.008;
        e.pitch = clamp(e.pitch + dy * 0.008, -1.3, 1.3);
      } else if (mode === "node") {
        const n = N[dragN], d = screenDeltaToWorld(dx, dy, n.q.s, e);
        n.t = null;
        n.x += d.x;
        n.y += d.y;
        n.z += d.z;
        if (dragN === e.sel) e.cam = { x: n.x, y: n.y, z: n.z };
        e.alpha = Math.max(e.alpha, 0.35);
      }
      kick();
    };
    const onUp = (ev: PointerEvent) => {
      ptrs.delete(ev.pointerId);
      if (mode === "pinch") {
        if (!ptrs.size) mode = null;
        return;
      }
      if (ev.type === "pointerup" && !moved) {
        if (mode === "node") {
          if (dragN === e.sel) open(dragN);
          else {
            focus(dragN);
            e.tapped = e.touch;
          }
        } else if (mode === "rot" && e.sel >= 0) clear();
      }
      mode = null;
      dragN = -1;
      cv.style.cursor = e.hov >= 0 ? "pointer" : "grab";
      kick();
    };
    const onLeave = (ev: PointerEvent) => {
      if (ev.pointerType === "mouse" && e.hov !== -1) {
        e.hov = -1;
        kick();
      }
    };
    // Trang cuộn được (landing: đồ thị nằm giữa nội dung) thì lăn chuột để cuộn trang; zoom bằng Ctrl/⌘ + lăn hoặc chụm trên trackpad.
    // Trang đồ thị toàn màn hình không cuộn nên lăn chuột là zoom. Cùng một luật cho mọi đồ thị.
    const pageScrolls = () => document.documentElement.scrollHeight > innerHeight + 1;
    const onWheel = (ev: WheelEvent) => {
      if (pageScrolls() && !ev.ctrlKey && !ev.metaKey) return;
      ev.preventDefault();
      endIdle();
      e.tZoom = null;
      e.zoom = clamp(e.zoom * Math.exp(-ev.deltaY * 0.0015), ZMIN, ZMAX);
      kick();
    };

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      // Kích thước bố cục (không tính transform): thẻ ở landing có thể đang thu nhỏ trong hoạt ảnh tách lúc đồ thị được dựng,
      // đo bằng getBoundingClientRect sẽ kẹt canvas ở độ phân giải thấp và chữ mờ khi thẻ về đúng cỡ
      const w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      e.W = w;
      e.H = h;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Màn cảm ứng: trang cuộn được thì vuốt dọc cuộn trang; đồ thị toàn màn hình thì vuốt xoay
      cv.style.touchAction = pageScrolls() ? "pan-y" : "none";
      kick();
    });
    ro.observe(box);
    const io = new IntersectionObserver(([en]) => {
      inView = en.isIntersecting;
      kick();
    });
    io.observe(box);
    document.addEventListener("visibilitychange", kick);
    reduce.addEventListener("change", kick);

    api.current = {
      index: (id) => at.get(id) ?? -1,
      focus,
      clear,
      open,
      setOnly: (app) => {
        onlyApp = app;
        kick();
      },
      zoomBy: (k) => {
        endIdle();
        e.tZoom = clamp((e.tZoom ?? e.zoom) * k, ZMIN, ZMAX);
        snap();
        kick();
      },
      // Bàn phím: mũi tên đưa con trỏ qua các nút kề theo chiều kim đồng hồ (chưa chọn nút nào thì qua các nút chính)
      cursor: (dir) => {
        endIdle();
        const S = e.sel >= 0 ? N[e.sel].q : null;
        const list = S ? [...nb[e.sel]].sort((a, b) => Math.atan2(N[a].q.y - S.y, N[a].q.x - S.x) - Math.atan2(N[b].q.y - S.y, N[b].q.x - S.x)) : hubs;
        if (!list.length) return;
        const k = list.indexOf(e.hov);
        const next = list[k < 0 ? (dir > 0 ? 0 : list.length - 1) : (k + dir + list.length) % list.length];
        e.hov = next;
        e.touch = false;
        setLive(C.cursor(N[next].label));
        kick();
      },
      enter: () => {
        if (e.hov >= 0 && e.hov !== e.sel) focus(e.hov);
        else if (e.sel >= 0) open(e.sel);
        else if (hubs.length) focus(hubs[0]);
      },
      setMine: (ids) => {
        for (const n of N) n.mine = ids.has(n.id);
        kick();
      },
    };
    kick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
      reduce.removeEventListener("change", kick);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("wheel", onWheel);
      api.current = null;
    };
  }, [graph, router]);

  // Nút của tôi đổi (túi đồ đọc sau hydrate, thêm vào giỏ) thì chỉ đổi cờ, không dựng lại engine
  const mineKey = mine.join(" ");
  useEffect(() => {
    api.current?.setMine(new Set(mineKey.split(" ")));
  }, [mineKey, graph]);

  // Chỉ dẫn lần đầu: hiện khi chưa thấy bao giờ; ở landing CSS chỉ cho hiện khi đang đứng ở mốc đồ thị (.graph-hint, data-graph-view)
  useEffect(() => {
    if (localStorage.getItem(hintSeenKey)) return;
    hintOn.current = true;
    setTouchMode(matchMedia("(pointer: coarse)").matches);
    setShowFirstHint(true);
  }, [hintSeenKey]);

  // Nút chọn sẵn: ?n= trong URL lúc mở trang, không có thì autoFocus. Đọc URL ngay khi effect chạy, trước effect ghi ?n= bên dưới.
  const initial = useRef<{ graph: CGraph; n: string | null } | null>(null);
  useEffect(() => {
    if (initial.current?.graph !== graph) initial.current = { graph, n: new URLSearchParams(location.search).get("n") };
    const id = initial.current.n ?? autoFocus;
    if (!id) return;
    const timer = setTimeout(() => {
      const a = api.current, i = a?.index(id) ?? -1;
      if (a && i >= 0 && !focusRef.current) a.focus(i);
    }, 450);
    return () => clearTimeout(timer);
  }, [graph, autoFocus]);

  // ?n= theo nút đang chọn, để từ trang chi tiết quay lại đúng chỗ. Bỏ qua lần chạy đầu để không xóa ?n= lúc mở trang.
  const firstSync = useRef(true);
  useEffect(() => {
    focusRef.current = focusId;
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    const url = new URL(location.href);
    if (focusId) url.searchParams.set("n", focusId);
    else url.searchParams.delete("n");
    if (url.href !== location.href) history.replaceState(history.state, "", url);
  }, [focusId]);

  // Lọc theo app (chú giải) nằm trong URL (?app=) để chia sẻ đúng trạng thái: đọc lúc mở trang, ghi lại mỗi lần đổi
  const onlySynced = useRef(false);
  useEffect(() => {
    if (!legend) return;
    if (!onlySynced.current) {
      onlySynced.current = true;
      const a = new URLSearchParams(location.search).get("app");
      if (LEGEND.includes(a as AppId)) setOnly(a as AppId);
      return;
    }
    const url = new URL(location.href);
    if (only) url.searchParams.set("app", only);
    else url.searchParams.delete("app");
    if (url.href !== location.href) history.replaceState(history.state, "", url);
  }, [legend, only]);

  // Thanh tìm trên thanh điều hướng gợi ý nút của đồ thị này (khi đồ thị đang hiện); chọn thì bay tới nút, chọn lại nút đang chọn thì mở
  useEffect(
    () =>
      registerPageSearch({
        kind: "pick",
        placeholder: search.graphPlaceholder,
        active: () => !!boxRef.current?.offsetParent,
        find: (query) => {
          const q = fold(query.trim());
          if (!q) return [];
          return graph.nodes
            .map((n) => ({ n, at: fold(n.label).indexOf(q) }))
            .filter((m) => m.at >= 0)
            .sort((a, b) => a.at - b.at || Number(!!b.n.hub) - Number(!!a.n.hub) || a.n.label.length - b.n.label.length)
            .map(({ n }) => ({ id: n.id, label: n.label }));
        },
        show: (id) => {
          const a = api.current, i = a?.index(id) ?? -1;
          if (!a || i < 0) return false;
          if (id !== focusRef.current) a.focus(i);
          return true;
        },
        pick: (id) => {
          const a = api.current, i = a?.index(id) ?? -1;
          if (!a || i < 0) return;
          if (id === focusRef.current) a.open(i);
          else a.focus(i);
          cvRef.current?.focus({ preventScroll: true });
        },
      }),
    [graph],
  );

  const onCanvasKey = (ev: React.KeyboardEvent) => {
    const a = api.current;
    if (!a) return;
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") a.cursor(1);
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") a.cursor(-1);
    else if (ev.key === "Enter" || ev.key === " ") a.enter();
    else if (ev.key === "Escape") a.clear();
    else if (ev.key === "+" || ev.key === "=") a.zoomBy(1.3);
    else if (ev.key === "-") a.zoomBy(1 / 1.3);
    else return;
    ev.preventDefault();
  };

  // Nút zoom nhỏ gọn (chấm 32px) nhưng vùng chạm vẫn 44px
  const roundButton = "group grid size-11 place-items-center rounded-full text-label";
  const roundFace = "grid size-8 place-items-center rounded-full bg-card shadow-thumb transition-colors group-hover:bg-fill group-active:bg-fill-strong";

  return (
    <div ref={boxRef} className={`relative overflow-hidden bg-bg ${className ?? "h-full"}`}>
      <canvas
        ref={cvRef}
        role="application"
        tabIndex={0}
        aria-label={title}
        aria-describedby={`${uid}-help`}
        onKeyDown={onCanvasKey}
        className="absolute inset-0 size-full cursor-grab touch-none outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      />

      {header && <div className="absolute top-4 left-4 z-10 md:top-6 md:left-6">{header}</div>}

      {controls && <div className="absolute right-2 bottom-2 z-10 flex md:right-4 md:bottom-4">
        <button type="button" aria-label={C.zoomOut} onClick={() => api.current?.zoomBy(1 / 1.3)} className={roundButton}>
          <span className={roundFace}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M3 7h8" />
            </svg>
          </span>
        </button>
        <button type="button" aria-label={C.zoomIn} onClick={() => api.current?.zoomBy(1.3)} className={roundButton}>
          <span className={roundFace}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M7 3v8M3 7h8" />
            </svg>
          </span>
        </button>
      </div>}

      {legend && (
        <div role="group" aria-label={C.legend} className="graph-legend absolute inset-x-2 bottom-4 z-10 flex justify-center transition-opacity duration-300 ease-ios">
          <div className="grid grid-cols-2 rounded-card bg-card p-1 shadow-thumb sm:flex">
            {LEGEND.map((app) => (
              <button
                key={app}
                type="button"
                aria-pressed={only === app}
                onClick={() => {
                  dismissHint();
                  setOnly(only === app ? null : app);
                }}
                className={`inline-flex h-11 items-center gap-2 rounded-full px-3 text-footnote font-semibold text-label transition-colors ${only === app ? "bg-fill-strong" : "hover:bg-fill"}`}
              >
                <span aria-hidden="true" className={`size-2.5 rounded-full ${LEGEND_DOT[app]}`} />
                {nav.apps.find((a) => a.href === `/${app}`)!.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFirstHint && (
        <p
          role="status"
          className={`graph-hint pointer-events-none absolute transition-opacity duration-300 ease-ios ${controls ? "bottom-16" : "bottom-28"} left-1/2 z-10 inline-flex h-8 -translate-x-1/2 items-center rounded-full bg-label px-3 text-footnote font-semibold whitespace-nowrap text-card`}
        >
          {touchMode ? C.firstInteractionHint : C.firstInteractionHintMouse}
        </p>
      )}

      <div
        ref={tipRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-10 inline-flex h-8 items-center gap-1.5 rounded-full bg-label px-3 text-footnote font-semibold whitespace-nowrap text-card opacity-0 transition-opacity duration-200 ease-ios"
      >
        <span ref={tipText}>{C.focusHintMouse}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
        </svg>
      </div>

      <p id={`${uid}-help`} className="sr-only">
        {C.instructions}
      </p>
      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </div>
  );
}

export default Constellation;
