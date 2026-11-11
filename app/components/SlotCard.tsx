import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { InfoTip } from "./InfoTip";
import { glossary, sections, getStepCount, ppBanksUI, presetConsole } from "../content";
import { PpForm } from "./PpForm";
import presets from "@/lib/zve10/presets";
import { APERTURES, SHUTTERS, ISOS, FOCUS_AREAS, METERING_MODES, FACE_PRIORITY, SOFT_SKIN, AUTO_REVIEW, FLASH_MODES, EXP_COMP_SETS, AWB_PRIORITIES, PRE_AF, STEADY_SHOT, E_FRONT_CURTAIN, LIVE_VIEW } from "@/lib/zve10/dat";
import { type SlotDraft } from "@/lib/presetSets";

type Term = ComponentProps<typeof InfoTip>["entry"];
type GroupId = (typeof presetConsole.groups)[number]["id"];

const SELECT = "w-full h-11 rounded-control border border-separator bg-card px-3 text-callout text-label";
const GRID = "grid gap-x-4 gap-y-5 sm:grid-cols-2 items-start";

function Field({ id, label, term, children }: { id?: string; label: string; term?: Term; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label htmlFor={id} className="text-footnote font-medium text-secondary">
          {label}
        </label>
        {term && <InfoTip entry={term} />}
      </div>
      {children}
    </div>
  );
}

export function SlotCard({
  settings,
  onChange,
  full,
}: {
  settings: SlotDraft;
  onChange: (settings: SlotDraft) => void;
  full?: boolean;
}) {
  const uid = useId();
  const [showPpForm, setShowPpForm] = useState(false);
  const [group, setGroup] = useState<GroupId>("exposure");

  const presetsByGroup = presets.reduce(
    (acc, p) => {
      if (p.blocked) return acc; // skip blocked recipes
      if (!acc[p.group]) acc[p.group] = [];
      acc[p.group].push(p);
      return acc;
    },
    {} as Record<string, typeof presets>
  );

  const selectedPreset = presets.find((p) => p.id === settings.recipeId);

  const handlePresetChange = (recipeId: string) => {
    if (recipeId === "custom") {
      setShowPpForm(true);
    } else if (recipeId === "keep") {
      onChange({ ...settings, pp: "keep", wb: "keep", recipeId: undefined, ppOn: undefined });
    } else if (recipeId === "off") {
      onChange({ ...settings, ppOn: false, pp: "keep", recipeId: "off" });
    } else {
      const preset = presets.find((p) => p.id === recipeId);
      if (preset) {
        onChange({
          ...settings,
          recipeId,
          pp: preset.pp,
          wb: {
            mode: preset.wb.mode as "awb" | "ctemp",
            kelvin: preset.wb.kelvin,
            ab: preset.wb.ab,
            gm: preset.wb.gm,
            priority: preset.wb.priority,
          },
          ppOn: undefined,
        });
      }
    }
  };

  const recipeSelect = (
    <div className="sm:col-span-2">
      <Field id={`${uid}-recipe`} label="Công thức màu">
        <select
          id={`${uid}-recipe`}
          value={settings.recipeId ?? (settings.ppOn === false ? "off" : "keep")}
          onChange={(e) => handlePresetChange(e.target.value)}
          className={SELECT}
        >
          <option value="keep">Giữ PP gốc</option>
          <option value="off">Tắt Picture Profile</option>
          {Object.entries(presetsByGroup).map(([group, groupPresets]) => (
            <optgroup key={group} label={group}>
              {groupPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
          {settings.recipeId === "custom" && <option value="custom">Tùy chỉnh</option>}
          <option value="custom">Tùy chỉnh…</option>
        </select>
        {selectedPreset && <div className="text-secondary text-footnote mt-2">{selectedPreset.description_vi}</div>}
      </Field>
    </div>
  );

  const panels: Record<GroupId, ReactNode> = {
    exposure: (
      <div className={GRID}>
        <Field label="Chế độ chụp" term={glossary.shootMode}>
          <div className="flex gap-1 rounded-control bg-fill p-1">
            {["Giữ", "P", "A", "S", "M"].map((m) => {
              const val = m === "Giữ" ? "keep" : (m as "P" | "A" | "S" | "M");
              const isSelected = (settings.mode || "keep") === val;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ ...settings, mode: val })}
                  aria-pressed={isSelected}
                  className={`flex-1 h-11 rounded-badge text-subhead font-medium transition ${
                    isSelected ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </Field>

        <Field id={`${uid}-ap`} label="Khẩu độ" term={glossary.aperture}>
          <select
            id={`${uid}-ap`}
            value={settings.aperture === undefined || settings.aperture === "keep" ? "keep" : (settings.aperture as string)}
            onChange={(e) => onChange({ ...settings, aperture: e.target.value })}
            className={`${SELECT} tabular-nums`}
          >
            <option value="keep">Giữ gốc</option>
            {APERTURES.map((a) => (
              <option key={a} value={a}>
                F{a}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-ss`} label="Tốc độ màn trập" term={glossary.shutter}>
          <select
            id={`${uid}-ss`}
            value={settings.shutter === undefined || settings.shutter === "keep" ? "keep" : (settings.shutter as string)}
            onChange={(e) => onChange({ ...settings, shutter: e.target.value as any })}
            className={`${SELECT} tabular-nums`}
          >
            <option value="keep">Giữ gốc</option>
            {SHUTTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-iso`} label="ISO" term={glossary.iso}>
          <select
            id={`${uid}-iso`}
            value={settings.iso === undefined || settings.iso === "keep" ? "keep" : (settings.iso as string)}
            onChange={(e) => onChange({ ...settings, iso: e.target.value as any })}
            className={`${SELECT} tabular-nums`}
          >
            <option value="keep">Giữ gốc</option>
            <option value="auto">AUTO</option>
            {ISOS.slice(1).map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-metering`} label="Chế độ đo sáng" term={glossary.metering}>
          <select
            id={`${uid}-metering`}
            value={settings.metering || "keep"}
            onChange={(e) => onChange({ ...settings, metering: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {METERING_MODES.map((m) => (
              <option key={m} value={m}>
                {m === "multi" && "Đa điểm"}
                {m === "center" && "Trung tâm"}
                {m === "spot-standard" && "Điểm: Tiêu chuẩn"}
                {m === "spot-large" && "Điểm: Lớn"}
                {m === "entire" && "Trung bình toàn khung"}
                {m === "highlight" && "Vùng sáng"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-exp`} label="Cài đặt bù sáng" term={glossary.expCompSet}>
          <select
            id={`${uid}-exp`}
            value={settings.expCompSet || "keep"}
            onChange={(e) => onChange({ ...settings, expCompSet: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {EXP_COMP_SETS.map((e) => (
              <option key={e} value={e}>
                {e === "ambient-only" && "Chỉ môi trường"}
                {e === "ambient-flash" && "Môi trường & flash"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-flash`} label="Chế độ flash" term={glossary.flashMode}>
          <select
            id={`${uid}-flash`}
            value={settings.flashMode || "keep"}
            onChange={(e) => onChange({ ...settings, flashMode: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {FLASH_MODES.map((m) => (
              <option key={m} value={m}>
                {m === "fill-flash" && "Đèn flash cưỡng bức"}
                {m === "slow-sync" && "Đồng bộ chậm"}
                {m === "rear-sync" && "Đồng bộ sau"}
              </option>
            ))}
          </select>
        </Field>
      </div>
    ),

    focus: (
      <div className={GRID}>
        <Field id={`${uid}-focus`} label="Chế độ lấy nét" term={glossary.focus}>
          <select
            id={`${uid}-focus`}
            value={settings.focus || "keep"}
            onChange={(e) => onChange({ ...settings, focus: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            <option value="AF-C">AF-C</option>
            <option value="AF-S">AF-S</option>
            <option value="MF">MF</option>
          </select>
        </Field>

        <Field id={`${uid}-fa`} label="Vùng lấy nét" term={glossary.focusArea}>
          <select
            id={`${uid}-fa`}
            value={settings.focusArea || "keep"}
            onChange={(e) => {
              const val = e.target.value as any;
              // Auto-set focus to AF-C if tracking is selected and focus is not AF-C
              if (val.startsWith("tracking-") && settings.focus !== "AF-C") {
                onChange({ ...settings, focusArea: val, focus: "AF-C" });
              } else {
                onChange({ ...settings, focusArea: val });
              }
            }}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {FOCUS_AREAS.map((a) => (
              <option key={a} value={a}>
                {a === "wide" && "Rộng"}
                {a === "zone" && "Vùng"}
                {a === "flexible-spot-l" && "Điểm linh hoạt: L"}
                {a === "tracking-zone" && "Theo dõi: Vùng"}
                {a === "tracking-flexible-spot-l" && "Theo dõi: Điểm linh hoạt L"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-fp`} label="Ưu tiên mặt (đa điểm)" term={glossary.facePriority}>
          <select
            id={`${uid}-fp`}
            value={settings.facePriority || "keep"}
            onChange={(e) => onChange({ ...settings, facePriority: e.target.value as any })}
            disabled={settings.metering === "center"}
            className={`${SELECT} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="keep">Giữ gốc</option>
            {FACE_PRIORITY.map((f) => (
              <option key={f} value={f}>
                {f === "off" && "Tắt"}
                {f === "on" && "Bật"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-pre`} label="Pre-AF" term={glossary.preAF}>
          <select
            id={`${uid}-pre`}
            value={settings.preAF || "keep"}
            onChange={(e) => onChange({ ...settings, preAF: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {PRE_AF.map((s) => (
              <option key={s} value={s}>
                {s === "off" && "Tắt"}
                {s === "on" && "Bật"}
              </option>
            ))}
          </select>
        </Field>
      </div>
    ),

    color: (
      <div className={GRID}>
        {recipeSelect}

        {settings.ppOn === false ? (
          <div className="sm:col-span-2 text-footnote text-secondary">Máy dùng màu mặc định, không bật PP.</div>
        ) : full && (settings.pp === undefined || settings.pp === "keep") ? (
          <div className="sm:col-span-2 text-footnote text-secondary">Chọn công thức màu để chỉnh từng thông số Picture Profile.</div>
        ) : (
          (full || showPpForm) && (
            <div className="sm:col-span-2">
              <PpForm
                initialPreset={full ? { pp: settings.pp } : selectedPreset}
                onApply={(pp) => {
                  onChange({ ...settings, pp, recipeId: "custom" });
                  if (!full) setShowPpForm(false);
                }}
                onClose={() => setShowPpForm(false)}
                live={full}
              />
            </div>
          )
        )}

        {/* PP2–PP10 banks */}
        {settings.ppBanks && Object.keys(settings.ppBanks).length > 0 && (
          <div className="sm:col-span-2 space-y-2 border-t border-separator pt-4">
            <div className="text-footnote text-secondary mb-2">{ppBanksUI.note}</div>
            {Object.entries(settings.ppBanks).map(([kStr]) => {
              const k = Number(kStr);
              const bankId = settings.bankIds?.[k];
              const preset = bankId ? presets.find((p) => p.id === bankId) : null;
              const recipeName = preset?.name || "—";
              return (
                <div key={k} className="flex items-center justify-between gap-3 py-2">
                  <div className="text-footnote text-label">{ppBanksUI.bankLabel(k, recipeName)}</div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...settings,
                        ppBanks: Object.fromEntries(Object.entries(settings.ppBanks || {}).filter(([bk]) => Number(bk) !== k)),
                        bankIds: Object.fromEntries(Object.entries(settings.bankIds || {}).filter(([bk]) => Number(bk) !== k)),
                      })
                    }
                    aria-label={ppBanksUI.removeBank(k)}
                    className="relative h-9 px-2.5 rounded-full bg-danger-fill/10 text-danger text-footnote font-semibold transition hover:bg-danger-fill/15 after:absolute after:inset-x-0 after:-inset-y-1"
                  >
                    {ppBanksUI.removeBank(k)}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Field id={`${uid}-wb`} label="Cân bằng trắng">
          <select
            id={`${uid}-wb`}
            value={settings.wb === "keep" ? "keep" : typeof settings.wb === "object" ? (settings.wb as any).mode : "keep"}
            onChange={(e) => {
              if (e.target.value === "keep") {
                onChange({ ...settings, wb: "keep" });
              } else if (e.target.value === "awb") {
                onChange({ ...settings, wb: { mode: "awb" as const, priority: "standard", ab: 0, gm: 0 } });
              } else {
                onChange({ ...settings, wb: { mode: "ctemp" as const, kelvin: 5500, ab: 0, gm: 0 } });
              }
            }}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            <option value="awb">AWB</option>
            <option value="ctemp">Nhiệt độ màu (K)</option>
          </select>

          {settings.wb && settings.wb !== "keep" && typeof settings.wb === "object" && (
            <div className="space-y-2 mt-2">
              {(settings.wb as any).mode === "ctemp" && (
                <div>
                  <label className="text-secondary text-footnote">K: {(settings.wb as any).kelvin}</label>
                  <input
                    type="range"
                    min={2500}
                    max={9900}
                    step={100}
                    value={(settings.wb as any).kelvin || 5500}
                    onChange={(e) => {
                      const wb = settings.wb as any;
                      onChange({ ...settings, wb: { ...wb, kelvin: parseInt(e.target.value) } });
                    }}
                    className="w-full"
                  />
                </div>
              )}

              {(settings.wb as any).ab !== undefined && (
                <div>
                  <label className="text-secondary text-footnote">A–B: {(settings.wb as any).ab}</label>
                  <input
                    type="range"
                    min={-7}
                    max={7}
                    step={0.5}
                    value={(settings.wb as any).ab || 0}
                    onChange={(e) => {
                      const wb = settings.wb as any;
                      onChange({ ...settings, wb: { ...wb, ab: parseFloat(e.target.value) } });
                    }}
                    className="w-full"
                  />
                </div>
              )}

              {(settings.wb as any).gm !== undefined && (
                <div>
                  <label className="text-secondary text-footnote">G–M: {(settings.wb as any).gm}</label>
                  <input
                    type="range"
                    min={-7}
                    max={7}
                    step={0.25}
                    value={(settings.wb as any).gm || 0}
                    onChange={(e) => {
                      const wb = settings.wb as any;
                      onChange({ ...settings, wb: { ...wb, gm: parseFloat(e.target.value) } });
                    }}
                    className="w-full"
                  />
                </div>
              )}
              <div className="text-secondary text-footnote">A/B: dương về Amber, âm về Blue. G/M: dương về Magenta, âm về Green.</div>
            </div>
          )}
        </Field>

        <Field id={`${uid}-awbp`} label="Ưu tiên trong AWB" term={glossary.awbPriority}>
          <select
            id={`${uid}-awbp`}
            value={settings.awbPriority || "keep"}
            onChange={(e) => onChange({ ...settings, awbPriority: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {AWB_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p === "standard" && "Chuẩn"}
                {p === "ambience" && "Môi trường"}
                {p === "white" && "Trắng"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-skin`} label="Làm mịn da" term={glossary.softSkin}>
          <select
            id={`${uid}-skin`}
            value={settings.softSkin || "keep"}
            onChange={(e) => onChange({ ...settings, softSkin: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {SOFT_SKIN.map((s) => (
              <option key={s} value={s}>
                {s === "off" && "Tắt"}
                {s === "low" && "Bật: Thấp"}
                {s === "mid" && "Bật: Trung bình"}
                {s === "high" && "Bật: Cao"}
              </option>
            ))}
          </select>
        </Field>
      </div>
    ),

    camera: (
      <div className={GRID}>
        <Field id={`${uid}-review`} label="Tự động xem lại" term={glossary.autoReview}>
          <select
            id={`${uid}-review`}
            value={settings.autoReview || "keep"}
            onChange={(e) => onChange({ ...settings, autoReview: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {AUTO_REVIEW.map((a) => (
              <option key={a} value={a}>
                {a === "off" && "Tắt"}
                {a === "2s" && "2 giây"}
                {a === "5s" && "5 giây"}
                {a === "10s" && "10 giây"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-steady`} label="SteadyShot" term={glossary.steadyShot}>
          <select
            id={`${uid}-steady`}
            value={settings.steadyShot || "keep"}
            onChange={(e) => onChange({ ...settings, steadyShot: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {STEADY_SHOT.map((s) => (
              <option key={s} value={s}>
                {s === "off" && "Tắt"}
                {s === "on" && "Bật"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-curtain`} label="Màn trập trước điện tử" term={glossary.eFrontCurtain}>
          <select
            id={`${uid}-curtain`}
            value={settings.eFrontCurtain || "keep"}
            onChange={(e) => onChange({ ...settings, eFrontCurtain: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {E_FRONT_CURTAIN.map((s) => (
              <option key={s} value={s}>
                {s === "off" && "Tắt"}
                {s === "on" && "Bật"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-liveview`} label="Hiển thị Live View" term={glossary.liveViewDisplay}>
          <select
            id={`${uid}-liveview`}
            value={settings.liveView || "keep"}
            onChange={(e) => onChange({ ...settings, liveView: e.target.value as any })}
            className={SELECT}
          >
            <option value="keep">Giữ gốc</option>
            {LIVE_VIEW.map((l) => (
              <option key={l} value={l}>
                {l === "setting-effect-off" && "Tắt hiệu ứng cài đặt"}
                {l === "setting-effect-on" && "Bật hiệu ứng cài đặt"}
              </option>
            ))}
          </select>
        </Field>
      </div>
    ),
  };

  return (
    <div className="space-y-5">
      <div role="group" aria-label={presetConsole.slotEditor} className="flex gap-1 rounded-control bg-fill p-1">
        {presetConsole.groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            aria-pressed={group === g.id}
            className={`flex-1 h-11 rounded-badge text-subhead font-medium transition ${
              group === g.id ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Mỗi nhóm giữ DOM khi chuyển tab để PpForm không mất chỉnh sửa dở */}
      {presetConsole.groups.map((g) => (
        <div key={g.id} hidden={group !== g.id}>
          {panels[g.id]}
        </div>
      ))}

      {/* Quick Apply */}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...settings,
            mode: "A",
            iso: "auto",
            focus: "AF-C",
            focusArea: "tracking-zone",
            metering: "multi",
            facePriority: "on",
            softSkin: "mid",
            autoReview: "off",
            flashMode: "rear-sync",
            expCompSet: "ambient-flash",
            awbPriority: "white",
            preAF: "on",
            steadyShot: "off",
            eFrontCurtain: "on",
            liveView: "setting-effect-on",
            wb: { mode: "awb", priority: "standard", ab: 0, gm: 0 },
          })
        }
        className="h-11 w-full rounded-control bg-fill px-4 text-subhead font-semibold text-label"
      >
        Áp dụng theo {getStepCount("zve10")} bước
      </button>

      {/* Các mục khác trong hướng dẫn (full mode only) */}
      {full && (
        <div>
          <div className="divide-y divide-separator border-y border-separator">
            {sections.flatMap((section) =>
              section.steps.filter((step) => step.memory !== "ready").map((step) => (
                <div key={step.n} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-subhead text-label">{step.title}</div>
                    <div className="text-footnote text-secondary">{step.en}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-footnote text-label mb-1">{step.value}</div>
                    <span className="text-footnote text-secondary bg-fill rounded-badge px-2 py-1 inline-block whitespace-nowrap">
                      {step.memory === "absent" ? "ZV-E10 không có" : step.memory === "notStored" ? "Cài tay, không lưu vào ô nhớ" : "Chờ giải mã từ máy"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
