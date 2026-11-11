"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { guide, sections, cameraModels, sonyBodies, getStepCount, alphaConsole as C, consoleHashRoutes, kolSets, type ModelId } from "@/app/content";
import { ModelPicker } from "./ModelPicker";
import { LinkRow } from "./LinkRow";
import { useCart } from "@/lib/cart";
import { setModel } from "@/lib/model";
import { decodeProgress } from "@/lib/decodeProgress";

const decoded = new Set(sonyBodies.filter((b) => b.decoded).map((b) => b.id));
const decodedIds = cameraModels.filter((m) => decoded.has(m.id)).map((m) => m.id).join(" ");
const others = cameraModels.filter((m) => !decoded.has(m.id)).map((m) => m.id).join(" ");
const card = "overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator";
const heading = "mb-1.5 px-4 text-footnote font-medium text-secondary";

/** Alpha Console index column: camera picker, the 4 chapters + summary, then the tools. Model-dependent text renders every variant with data-model-only (no hydration mismatch). */
export function ConsoleIndex() {
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = Object.values(useCart().slots).flat().length;

  // Entry links: /?model=<id> from Product Wiki, old one-page hashes (/#tao-preset) from bookmarks and other sites
  useEffect(() => {
    const url = new URL(window.location.href);
    const m = url.searchParams.get("model");
    if (m !== null) {
      if (cameraModels.some((c) => c.id === m)) setModel(m as ModelId);
      url.searchParams.delete("model");
      window.history.replaceState(null, "", url);
    }
    const to = (url.pathname === "/" || url.pathname === "/console") && consoleHashRoutes[url.hash.slice(1)];
    if (to) router.replace(to);
  }, [router]);

  const row = (href: string, title: React.ReactNode, trailing?: React.ReactNode) => (
    <LinkRow key={href} href={href} title={title} trailing={trailing} isActive={pathname === href || pathname.startsWith(`${href}/`)} />
  );
  const perModel = (render: (id: ModelId) => React.ReactNode) =>
    cameraModels.map((m) => <span key={m.id} data-model-only={m.id}>{render(m.id)}</span>);

  // Decoded cameras: tools first (making M1–M4 is the main job); others: the manual guide first, tools after
  // showShared: chỉ máy đã giải mã (ZV-E10) có "Bộ M1–M4 chia sẻ"; nhóm máy chưa giải mã không hiện dòng này
  const tools = (id: string, only: string, showShared: boolean) => (
    <nav aria-labelledby={id} data-model-only={only}>
      <h2 id={id} className={heading}>{C.tools}</h2>
      <div className={card}>
        {row(
          "/tao-m1-m4",
          C.makeSet,
          cameraModels.map((m) =>
            decoded.has(m.id) ? (
              cartCount > 0 && <span key={m.id} data-model-only={m.id} className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent-text tabular-nums">{C.cartCount(cartCount)}</span>
            ) : (
              <span key={m.id} data-model-only={m.id}>{C.onlyZve10}</span>
            ),
          ),
        )}
        {showShared && row("/bo-m1-m4", kolSets.title)}
        {row(
          "/giai-ma",
          C.decode,
          perModel((id) => <span className="tabular-nums">{decodeProgress(id).percent}%</span>),
        )}
      </div>
    </nav>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className={heading}>{guide.modelPicker.label}</p>
        <ModelPicker />
      </div>

      {tools("tools-top", decodedIds, true)}

      <nav aria-labelledby="guide-heading">
        <h2 id="guide-heading" className={heading}>{perModel((id) => C.guideGroup(getStepCount(id)))}</h2>
        <div className={card}>
          {sections.map((s) =>
            row(`/cai-tay/${s.id}`, s.title, <span className="tabular-nums">{perModel((id) => s.steps.filter((st) => !st.only || st.only.includes(id)).length)}</span>),
          )}
          {row("/cai-tay/tom-tat", C.summary)}
        </div>
      </nav>

      {tools("tools-bottom", others, false)}
    </div>
  );
}
