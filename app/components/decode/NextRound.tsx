"use client";

// Lượt giải mã tiếp theo và mini game. Dùng ở /giai-ma (công khai) và /admin/decode (chỉ dev, có nút lưu lượt). Không có bảng tham số ở đây.
// Lượt lập trên server (/giai-ma/plan): trình duyệt chỉ nhận đúng một lượt, không tải bảng trạng thái.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { alphaConsole, cameraModels, decodeConsole, guide, sonyBodies } from "@/app/content";
import { GameDialog } from "@/app/components/game/GameDialog";
import { InfoTip } from "@/app/components/InfoTip";
import { getLocalRaw, parseLocal, subscribeLocal } from "@/app/components/decode/localStore";
import { fetchPlan } from "@/app/components/decode/planClient";
import type { PlanResponse } from "@/app/components/decode/planClient";
import { useModel } from "@/lib/model";
import { labelOf, settingOf } from "@/lib/game/catalog";
import type { GameModel, SlotStep } from "@/lib/game/types";

function StepGroup({ title, steps, model }: { title: string; steps: SlotStep[]; model: GameModel }) {
  if (steps.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-footnote text-secondary">{title}</p>
      <ul className="space-y-1 text-footnote text-label">
        {steps.map((s) => (
          <li key={`${s.settingId}|${s.valueId}`}>
            {`${settingOf(model, s.settingId)?.label.vi ?? s.settingId}: ${labelOf(model, s.settingId, s.valueId, "vi") ?? s.valueId}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NextRound({
  model: modelProp,
  focus,
  showDevSave,
}: {
  model?: GameModel; // mặc định: máy đang chọn (useModel)
  focus?: string[];
  showDevSave?: boolean; // nút lưu lượt vào dự án: chỉ trang admin, và chỉ khi npm run dev
} = {}) {
  const current = useModel();
  const model = modelProp ?? current;
  const n = decodeConsole.next;
  const raw = useSyncExternalStore(subscribeLocal, getLocalRaw, () => "");
  const local = useMemo(() => parseLocal(raw), [raw]);
  const [seed, setSeed] = useState(1);
  // focus có thể là mảng mới mỗi lần render: khóa theo nội dung để không gọi lại server vô ích
  const focusKey = focus?.join("|") ?? "";
  const focusList = useMemo(() => (focusKey ? focusKey.split("|") : []), [focusKey]);
  const hasCodec = sonyBodies.some((b) => b.id === model && b.decoded === true);
  const camera = cameraModels.find((c) => c.id === model)?.name ?? model;
  const key = JSON.stringify([model, seed, focusKey, raw]);

  // Lượt của máy chưa có codec không cần lập; plan null nghĩa là lần gọi đó lỗi
  const [round, setRound] = useState<{ key: string; plan: PlanResponse | null } | null>(null);
  useEffect(() => {
    if (!hasCodec) return;
    const ctrl = new AbortController();
    fetchPlan({ model, seed, focus: focusList, local }, ctrl.signal)
      .then((plan) => {
        if (!ctrl.signal.aborted) setRound({ key, plan });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setRound({ key, plan: null });
      });
    return () => ctrl.abort();
  }, [hasCodec, key, model, seed, focusList, local]);

  // Khóa khác với lượt đang lưu nghĩa là lượt cũ, coi như đang tải
  const ready = round?.key === key ? round : null;
  const loading = hasCodec && ready === null;
  const plan = ready?.plan ?? null;
  const failed = ready !== null && plan === null;
  const nextSeed = () => setSeed((s) => s + 1);

  return (
    <>
      <section aria-labelledby="decode-next" className="rounded-card bg-card p-4 shadow-card sm:p-5">
        <h2 id="decode-next" className="text-subhead font-semibold">{n.title}</h2>
        {hasCodec ? (
          <div className="mt-4 space-y-4">
            {plan ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {plan.mission.slots.map((slot) => {
                  const targets = slot.steps.filter((s) => s.role === "target");
                  const controls = slot.steps.filter((s) => s.role === "control");
                  return (
                    <div key={slot.slot} className="space-y-3 rounded-control bg-fill p-3">
                      <p className="text-subhead font-semibold">{`M${slot.slot}`}</p>
                      <StepGroup title={n.need} steps={targets} model={model} />
                      <StepGroup title={n.keep} steps={controls} model={model} />
                      {targets.length === 0 && controls.length === 0 && (
                        <p className="text-footnote text-secondary">{n.emptySlot}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-footnote text-secondary">{failed ? n.planError : n.loading}</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-footnote text-label">
                {plan && n.yield(plan.yield.confirm, plan.yield.learn, plan.yield.locate, plan.yield.steps)}
              </p>
              <button
                type="button"
                onClick={nextSeed}
                disabled={loading}
                className="h-11 px-4 rounded-full bg-fill text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-50"
              >
                {n.another}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-footnote text-secondary">{alphaConsole.notDecoded.text(camera)}</p>
        )}
      </section>

      <section aria-labelledby="decode-game" className="rounded-card bg-card p-4 shadow-card sm:p-5">
        <div className="flex items-center gap-1.5">
          <h2 id="decode-game" className="text-subhead font-semibold">{alphaConsole.decodePage.game}</h2>
          <InfoTip entry={{ term: alphaConsole.decodePage.game, lines: [{ t: guide.contribute.lead }] }} />
        </div>
        <div className="mt-4">
          <GameDialog mission={plan?.mission ?? null} onRoundDone={nextSeed} devSave={showDevSave} />
        </div>
      </section>
    </>
  );
}
