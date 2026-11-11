"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { buildSet, decodeDat } from "@/lib/zve10/dat.ts";
import { presetSupport, recallGuide, recallWarning, recallStatus, recallGuideText, presetConsole, glossary, cameraModels } from "../content";
import presets from "@/lib/zve10/presets";
import presetSetsJson from "@/data/preset-sets.json";
import { validatePresetSets, defaultSet, cloneSlots, type SlotDraft } from "@/lib/presetSets";
import { cardZip, loadPresetBase, saveFile, ZIP_FILENAME } from "@/lib/presetDownload";
import { SlotCard } from "./SlotCard";
import { InfoTip } from "./InfoTip";
import { DatImport } from "./DatImport";
import { resolveE10Dir, readExisting, writeAndVerify, mapError, isSupported, type FileSystemDirectoryHandle, type CardError } from "@/lib/cardWriter";
import { useModel } from "@/lib/model";
import { cartToSlots, readCart } from "@/lib/cart";
import { summaryRows, FOCUS_AREA_LABELS, METERING_LABELS, FACE_PRIORITY_LABELS, SOFT_SKIN_LABELS, AUTO_REVIEW_LABELS } from "@/lib/presetSummary";

interface PreviewRow {
  slot: number;
  mode: string | null;
  aperture: string | null;
  shutter: string | null;
  iso: string | null;
  wb: string;
  gamma: string;
  focus: string | null;
  focusArea: string | null;
  metering: string | null;
  facePriority: string | null;
  softSkin: string | null;
  autoReview: string | null;
}

const SETS = validatePresetSets(presetSetsJson);
const ChevronIcon = () => (
  <svg className="w-3 h-3 inline" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRotateIcon = () => (
  <svg className="w-4 h-4 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function PresetBuilder() {
  const model = useModel();
  const consoleRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [system, setSystem] = useState<"pal" | "ntsc">("pal");
  const defaultSetData = defaultSet(SETS);
  const [selectedSetId, setSelectedSetId] = useState(defaultSetData.id);
  const [slotSettings, setSlotSettings] = useState<SlotDraft[]>(cloneSlots(defaultSetData));
  const [baseFile, setBaseFile] = useState<Uint8Array | null>(null);
  const [slotHeaders, setSlotHeaders] = useState<Uint8Array[]>([]);
  const [previewError, setPreviewError] = useState<string>("");
  const [downloaded, setDownloaded] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<1 | 2 | 3 | 4>(1);
  const [copyOpen, setCopyOpen] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);

  const [cardSupported, setCardSupported] = useState(false);
  const [cardWriting, setCardWriting] = useState(false);
  const [cardResult, setCardResult] = useState<{ success?: number; backed?: number; error?: CardError } | null>(null);
  const pickedHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  // Detect File System Access API support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCardSupported(isSupported());
    }
  }, []);

  // /tao-m1-m4?set=<id> (từ /bo-m1-m4/[id]): chọn bộ đó và nạp cài đặt của bộ. Đặt trước effect recipe/cart để công thức Color Bank vẫn đè lên bộ.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setId = params.get("set");
    if (setId === null) return;
    params.delete("set");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? "?" + params : ""}${window.location.hash}`);
    const picked = SETS.find((s) => s.id === setId);
    if (!picked) return;
    setSelectedSetId(picked.id);
    setSlotSettings(cloneSlots(picked));
  }, []);

  // Color Bank "Dùng cho M1–M4" (/tao-m1-m4?recipe=<id> or ?cart): first slot still on "Giữ PP gốc", else M1.
  // Read params first, then delete and apply state. Param is removed before applying, so Strict Mode's second effect run is a no-op.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasRecipe = params.has("recipe");
    const recipeId = params.get("recipe");
    const hasCart = params.has("cart");
    if (!hasRecipe && !hasCart) return;

    params.delete("recipe");
    params.delete("cart");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? "?" + params : ""}${window.location.hash}`);

    if (hasRecipe) {
      const preset = presets.find((p) => p.id === recipeId && !p.blocked);
      if (!preset) return;
      setSlotSettings((slots) => {
        const i = Math.max(0, slots.findIndex((s) => !s.recipeId && s.ppOn !== false && (s.pp ?? "keep") === "keep"));
        return slots.map((s, j) => (j === i ? { ...s, recipeId: preset.id, pp: preset.pp, wb: { ...preset.wb }, ppOn: undefined } : s));
      });
    } else if (hasCart) {
      const cart = readCart();
      const slotDrafts = cartToSlots(cart, (id) => {
        const p = presets.find((x) => x.id === id);
        return p && !p.blocked ? { pp: p.pp, wb: p.wb } : null;
      });
      setSlotSettings((slots) =>
        slots.map((s, idx) => {
          const slot = (idx + 1) as 1 | 2 | 3 | 4;
          return slotDrafts[slot] ? { ...s, ...slotDrafts[slot], ppOn: undefined } : s;
        })
      );
    }

  }, []);

  // Fetch base file when system changes
  // Luôn dùng file mẫu (do ZV-E10 lưu) theo hệ PAL/NTSC; người mới không cần chọn khuôn
  useEffect(() => {
    setBaseFile(null);
    setPreviewError("");
    // Header từng ô lấy từ file do máy lưu cho đúng ô đó (đổi tên/ngày trong header làm máy báo File Error)
    loadPresetBase(system)
      .then(({ base, headers }) => {
        setSlotHeaders(headers);
        setBaseFile(base);
      })
      .catch((e) => setPreviewError("Không tải được file mẫu: " + e.message));
  }, [system]);
  const step1Done = baseFile !== null && model === "zve10";


  // Clear card result when user rebuilds (changes slotSettings)
  useEffect(() => {
    setCardResult(null);
  }, [slotSettings]);


  // Tự tạo bộ file khi mở bước 3; thuần (không setState) để render không tự kích hoạt render lại
  const build = useMemo((): { built?: { name: string; data: Uint8Array }[]; rows?: PreviewRow[]; error?: string } | null => {
    if (step !== 2) return null;

    try {
      const base = baseFile;
      if (!base) return null;

      const builtSet = buildSet(base, slotSettings, undefined, undefined, slotHeaders);

      const rows: PreviewRow[] = [];
      for (const built of builtSet) {
        try {
          const decoded = decodeDat(built.data);
          const wbStr = decoded.wb.mode === "ctemp"
            ? `${decoded.wb.kelvin}K (${decoded.wb.ab || 0}/${decoded.wb.gm || 0})`
            : `AWB ${decoded.wb.priority || ""}`;
          const gammaStr = (decoded.pp1.gamma as string) || "?";

          rows.push({
            slot: decoded.slot,
            mode: decoded.mode,
            aperture: decoded.exposure.aperture,
            shutter: decoded.exposure.shutter,
            iso: decoded.exposure.iso,
            wb: wbStr,
            gamma: gammaStr,
            focus: decoded.focus,
            focusArea: decoded.focusArea,
            metering: decoded.metering,
            facePriority: decoded.facePriority,
            softSkin: decoded.softSkin,
            autoReview: decoded.autoReview,
          });
        } catch {
          rows.push({
            slot: parseInt(built.name[5]),
            mode: null,
            aperture: null,
            shutter: null,
            iso: null,
            wb: "?",
            gamma: "?",
            focus: null,
            focusArea: null,
            metering: null,
            facePriority: null,
            softSkin: null,
            autoReview: null,
          });
        }
      }
      return { built: builtSet, rows };
    } catch (err: any) {
      return { error: err.message || "Lỗi không xác định" };
    }
  }, [step, baseFile, slotHeaders, slotSettings]);

  const preview = build?.rows ?? null;

  const downloadZip = async () => {
    const builtData = build?.built;
    if (!builtData) return;
    const selectedSet = SETS.find((s) => s.id === selectedSetId);
    const guide = recallGuideText(
      selectedSet
        ? { setName: selectedSet.name, labels: selectedSet.slots.map((s) => s.label) }
        : undefined
    );
    saveFile(cardZip(builtData, guide), ZIP_FILENAME, "application/zip");
    setDownloaded(true);
    setStep3Done(true);
  };

  const downloadSlot = (index: number) => {
    const built = build?.built?.[index];
    if (!built) return;
    saveFile(built.data, built.name, "application/octet-stream");
    setDownloaded(true);
    setStep3Done(true);
  };

  const writeToCard = async () => {
    const builtData = build?.built;
    if (!builtData) return;

    setCardWriting(true);
    setCardResult(null);

    try {
      let handle = pickedHandleRef.current;

      // Pick directory if not already picked
      if (!handle) {
        const showDirPicker = (window as any).showDirectoryPicker;
        if (!showDirPicker) throw { code: "generic", message: "showDirectoryPicker not available" } as CardError;

        handle = await showDirPicker({ id: "zve10-card", mode: "readwrite" });
        pickedHandleRef.current = handle;
      } else {
        // Request permission if handle was picked before
        if (handle.requestPermission) {
          const perm = await handle.requestPermission({ mode: "readwrite" });
          if (perm !== "granted") throw { code: "denied" } as CardError;
        }
      }

      const e10 = await resolveE10Dir(handle!);
      const existing = await readExisting(e10);

      // Download backup if there are existing files
      let backedCount = 0;
      if (existing.length > 0) {
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[-T:]/g, "");
        saveFile(cardZip(existing), `ZV-E10_backup_${timestamp}.zip`, "application/zip");
        backedCount = existing.length;
      }

      // Write and verify
      await writeAndVerify(e10, builtData);

      setCardResult({ success: builtData.length, backed: backedCount });
      setDownloaded(true);
      setStep3Done(true);

      // Auto-check first 3 items in step 4 (Unzip, connect, copy PRIVATE)
      if (recallGuide.length > 0) {
        const firstGroup = recallGuide[0];
        if (firstGroup.steps.length >= 3) {
          const newChecked = new Set(checkedSteps);
          for (let i = 0; i < 3; i++) {
            const key = `${firstGroup.title}__${firstGroup.steps[i].title}`;
            newChecked.add(key);
          }
          setCheckedSteps(newChecked);
        }
      }
    } catch (e: any) {
      const mapped = mapError(e);
      if (mapped.code === "abort") {
        setCardResult(null); // người dùng bấm Hủy ở hộp chọn thư mục: im lặng
      } else {
        pickedHandleRef.current = null; // thẻ có thể đã rút ra cắm lại: lần sau chọn lại thư mục
        setCardResult({ error: mapped });
      }
    } finally {
      setCardWriting(false);
    }
  };

  // Determine step progress status
  const stepDone = [step1Done, step2Done, step3Done, checkedSteps.size === recallGuide.reduce((sum, g) => sum + g.steps.length, 0)];

  // Step 1: Máy ảnh (model và hệ máy PAL/NTSC)
  const step1Content = (
    <div className="space-y-5">
      <p className="text-footnote text-secondary">
        {presetConsole.modelLine(cameraModels.find((m) => m.id === model)!.name)}{" "}
        <a href="/console" className="font-semibold text-accent-text underline underline-offset-2 hover:opacity-75">{presetConsole.changeModel}</a>
      </p>

      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-footnote font-medium text-secondary">Hệ của máy</span>
          <InfoTip entry={glossary.system} />
        </div>
        <div className="flex gap-1 rounded-control bg-fill p-1">
          {(["pal", "ntsc"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSystem(v)}
              aria-pressed={system === v}
              className={`flex-1 h-11 rounded-badge text-subhead font-medium transition ${
                system === v ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {previewError && (
        <div className="rounded-control bg-danger-fill text-danger text-footnote px-3 py-2">{previewError}</div>
      )}
      {baseFile && (
        <div className="flex items-center gap-1.5 text-success text-footnote font-medium">
          <CheckIcon />
          {presetConsole.status.template(system)}
        </div>
      )}
    </div>
  );

  // Helper: compare if a slot differs from the chosen set
  const slotDiffersFromSet = (slotIndex: number) => {
    const currentSlot = slotSettings[slotIndex];
    const setSlot = SETS.find((s) => s.id === selectedSetId)?.slots[slotIndex];
    if (!setSlot) return false;
    return JSON.stringify(currentSlot) !== JSON.stringify(setSlot.settings);
  };

  // Step 2: Bốn ô nhớ, bảng điều khiển: chọn bộ, chọn ô, sửa ô đang chọn ngay tại chỗ
  const activeSet = SETS.find((s) => s.id === selectedSetId);
  const activeSlot = activeSet?.slots[selectedSlot - 1];
  const activeDiffers = slotDiffersFromSet(selectedSlot - 1);

  const chooseSlot = (n: 1 | 2 | 3 | 4) => {
    setSelectedSlot(n);
    setCopyOpen(false);
  };

  const resetSlot = () => {
    if (!activeSet) return;
    const fresh = cloneSlots(activeSet)[selectedSlot - 1];
    setSlotSettings((prev) => prev.map((v, j) => (j === selectedSlot - 1 ? fresh : v)));
  };

  const copyFrom = (n: number) => {
    setSlotSettings((prev) => prev.map((v, j) => (j === selectedSlot - 1 ? structuredClone(prev[n - 1]) : v)));
    setCopyOpen(false);
  };

  const step2Content = (
    <div className="space-y-5">
      {/* Chọn bộ cài đặt: mô tả bộ nằm trong nút "i" */}
      <div>
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-footnote font-medium text-secondary">{presetConsole.setPicker}</span>
          <InfoTip
            entry={{
              term: presetConsole.setPicker,
              lines: [...(activeSet ? [{ k: activeSet.name, t: activeSet.description }] : []), { t: presetConsole.setPickerHint }],
            }}
          />
        </div>
        <div role="radiogroup" aria-label={presetConsole.setPicker} className="flex flex-wrap gap-2">
          {SETS.map((set) => {
            const on = selectedSetId === set.id;
            return (
              <button
                key={set.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setSelectedSetId(set.id);
                  setSlotSettings(cloneSlots(set));
                }}
                className={`h-11 inline-flex items-center gap-2 rounded-control px-4 text-subhead font-semibold transition ${
                  on ? "bg-card shadow-thumb text-label" : "bg-fill text-label hover:bg-fill-strong"
                }`}
              >
                {set.name}
                {set.recommended && (
                  <span className="rounded-badge bg-accent/10 px-2 py-0.5 text-footnote font-semibold text-accent-text">
                    {presetConsole.recommended}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bốn ô luôn hiện; chạm vào ô để chọn ô đang sửa */}
      <div>
        <span className="mb-2 block text-footnote font-medium text-secondary">M1–M4</span>
        <div role="group" aria-label="M1–M4" className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {([1, 2, 3, 4] as const).map((i) => {
            const idx = i - 1;
            const on = selectedSlot === i;
            const differs = slotDiffersFromSet(idx);
            const rows = summaryRows(slotSettings[idx], presetConsole.summary).map(([, v]) => v);
            const values = rows.slice(0, 4);
            const more = rows.slice(4, 7);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                onClick={() => chooseSlot(i)}
                className={`min-h-11 flex flex-col items-start gap-1.5 rounded-control p-3 text-left transition ${
                  on ? "bg-card shadow-thumb ring-2 ring-accent" : "bg-fill hover:bg-fill-strong"
                }`}
              >
                <div className="flex w-full min-w-0 items-center gap-1.5">
                  <span className="text-subhead font-semibold text-label">M{i}</span>
                  <span className="min-w-0 flex-1 truncate text-subhead text-label">{activeSet?.slots[idx].label}</span>
                  {differs && <span className="size-1.5 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />}
                  {differs && <span className="sr-only">{presetConsole.slotEdited}</span>}
                </div>
                <div className="w-full truncate text-footnote tabular-nums text-label">
                  {values.length > 0 ? values.join(" · ") : presetConsole.summary.keep}
                </div>
                {more.length > 0 && <div className="w-full truncate text-footnote text-secondary">{more.join(" · ")}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sửa ô đang chọn: hiện sẵn, không cần bấm mở */}
      <div className="space-y-4 border-t border-separator pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex w-full min-w-0 items-center gap-1.5">
            <h3 className="text-body font-semibold text-label">{`M${selectedSlot} · ${activeSlot?.label ?? ""}`}</h3>
            {activeSlot?.note && <InfoTip entry={{ term: activeSlot.label, lines: [{ t: activeSlot.note }] }} />}
          </div>
          <button
            type="button"
            onClick={resetSlot}
            disabled={!activeDiffers}
            className="h-11 px-4 rounded-control bg-fill text-callout font-semibold text-label transition hover:bg-fill-strong disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {presetConsole.resetSlot}
          </button>
          <button
            type="button"
            onClick={() => setCopyOpen((v) => !v)}
            aria-expanded={copyOpen}
            className="h-11 px-4 rounded-control bg-fill text-callout font-semibold text-label transition hover:bg-fill-strong"
          >
            {presetConsole.copySlot}
          </button>
        </div>

        {copyOpen && (
          <div role="group" aria-label={presetConsole.copySlot} className="flex flex-wrap gap-2">
            {[1, 2, 3, 4]
              .filter((n) => n !== selectedSlot)
              .map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => copyFrom(n)}
                  className="h-11 px-4 rounded-control bg-fill text-callout font-semibold text-label transition hover:bg-fill-strong"
                >
                  {presetConsole.copyFrom(n)}
                </button>
              ))}
          </div>
        )}

        {/* Đọc file máy đã lưu vào ô đang sửa; chỉ ảnh ZV-E10 có onUse */}
        <DatImport onUse={(r) => setSlotSettings((prev) => prev.map((v, j) => (j === selectedSlot - 1 ? { ...r.settings } : v)))} />

        {/* key theo ô: đổi ô thì nhóm và form màu được dựng lại đúng ô */}
        <SlotCard
          key={selectedSlot}
          settings={slotSettings[selectedSlot - 1]}
          onChange={(newSettings) => setSlotSettings((prev) => prev.map((v, j) => (j === selectedSlot - 1 ? newSettings : v)))}
        />
      </div>

      <details className="group">
        <summary className="h-11 flex items-center justify-between text-subhead font-semibold text-accent-text cursor-pointer">
          {presetConsole.supportTitle}
          <ChevronRotateIcon />
        </summary>
        <ul className="mt-3 divide-y divide-separator">
          {presetSupport.map((item, i) => {
            const statusMap = {
              co: { label: "Có trong file", color: "bg-success-fill text-success" },
              chua: { label: "Chưa giải mã", color: "bg-warning-fill text-warning" },
              khong: { label: "Ngoài Memory Recall", color: "bg-fill text-secondary" },
            };
            const status = statusMap[item.status];
            return (
              <li key={i} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="text-subhead text-label">{item.item}</div>
                  {item.note && <div className="text-footnote text-secondary">{item.note}</div>}
                </div>
                <span className={`${status.color} px-2.5 py-0.5 rounded-full text-footnote font-semibold text-right flex-shrink-0`}>
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );

  // Step 3: Kiểm tra và tải về
  const step3Content = (
    <div className="space-y-4">
      {!baseFile && (
        <div className="rounded-control bg-fill px-3 py-2.5 text-footnote text-label">
          <p className="mb-2">{presetConsole.noBase}</p>
          <button
            onClick={() => setStep(0)}
            className="h-11 px-4 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition"
          >
            Quay lại bước 1
          </button>
        </div>
      )}

      {preview && (
        <>
          {cardSupported ? (
            <>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-footnote font-medium text-label flex flex-wrap items-center gap-x-1">
                    {presetConsole.card.hintPath.map((seg, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        {i > 0 && <span aria-hidden className="text-tertiary"><ChevronIcon /></span>}
                        {seg}
                      </span>
                    ))}
                    <span className="ml-1"><InfoTip entry={{ term: presetConsole.card.hintPath.at(-1)!, lines: [{ t: presetConsole.card.hint }] }} /></span>
                  </div>
                </div>
                {/* Sau khi ghi xong, nút này lùi về tinted để nút "Nạp vào máy" là primary duy nhất */}
                <button
                  onClick={writeToCard}
                  disabled={cardWriting}
                  className={`w-full rounded-full px-6 text-subhead font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    cardResult?.success
                      ? "h-11 bg-accent/10 text-accent-text hover:bg-accent/15"
                      : "h-12 bg-accent text-on-accent hover:bg-accent/90 active:scale-98"
                  }`}
                >
                  {cardWriting ? presetConsole.card.writing : cardResult?.success ? presetConsole.card.rewrite : presetConsole.card.write}
                </button>
                <div aria-live="polite">
              {cardResult?.success && !cardResult?.error && (
                <div
                  className="rounded-control bg-success-fill px-3 py-2.5 text-footnote"
                >
                  <div className="flex gap-1 items-center mb-1 text-success">
                    <CheckIcon />
                    <div className="font-semibold text-success">{presetConsole.card.doneTitle}</div>
                  </div>
                  <div className="text-label">{presetConsole.card.done(cardResult.success)}</div>
                  {cardResult.backed ? (
                    <div className="text-label mt-1">{presetConsole.card.backup(cardResult.backed)}</div>
                  ) : null}
                </div>
              )}

              {cardResult?.error && (
                <div
                  className="rounded-control bg-danger-fill px-3 py-2.5 text-footnote"
                >
                  <div className="font-semibold text-danger mb-1">{presetConsole.card.errorTitle}</div>
                  <div className="text-label">
                    {(() => {
                      const err = presetConsole.card.errors[cardResult.error!.code as keyof typeof presetConsole.card.errors];
                      if (typeof err === "function") {
                        return err(cardResult.error!.message || "");
                      }
                      return err || presetConsole.card.errors.generic("");
                    })()}
                  </div>
                </div>
              )}
                </div>
              </div>
              <div className="space-y-2 border-t border-separator pt-4">
                <p className="text-footnote text-secondary">{presetConsole.card.orZip}</p>
                <button
                  onClick={downloadZip}
                  className="w-full h-11 rounded-full bg-accent/10 px-4 text-subhead font-semibold text-accent-text hover:bg-accent/15 transition"
                >
                  {presetConsole.downloadZip}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadZip}
                  className="flex-1 h-12 rounded-full bg-accent px-6 text-subhead font-semibold text-on-accent hover:bg-accent/90 active:scale-98 transition"
                >
                  {presetConsole.downloadZip}
                </button>
                <InfoTip entry={{ term: presetConsole.card.write, lines: [{ t: presetConsole.card.unsupported }] }} />
              </div>
            </>
          )}

          <div className="divide-y divide-separator border-t border-separator">
            {preview.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="size-8 rounded-badge bg-accent text-on-accent flex items-center justify-center text-footnote font-semibold flex-shrink-0">
                  M{r.slot}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-subhead tabular-nums font-semibold text-label">
                    {r.mode && r.aperture && r.shutter && r.iso
                      ? `${r.mode} · ${r.aperture} · ${r.shutter} · ${r.iso}`
                      : "—"}
                  </div>
                  <div className="text-footnote tabular-nums text-secondary">
                    {r.wb && r.gamma ? `${r.wb} · ${r.gamma}` : "—"}
                    {r.focus ? ` · ${r.focus}` : ""}
                    {r.focusArea ? ` · ${FOCUS_AREA_LABELS[r.focusArea] || r.focusArea}` : ""}
                    {r.metering ? ` · ${METERING_LABELS[r.metering] || r.metering}` : ""}
                    {r.facePriority ? ` · ${FACE_PRIORITY_LABELS[r.facePriority] || r.facePriority}` : ""}
                    {r.softSkin ? ` · ${SOFT_SKIN_LABELS[r.softSkin] || r.softSkin}` : ""}
                    {r.autoReview ? ` · ${AUTO_REVIEW_LABELS[r.autoReview] || r.autoReview}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => downloadSlot(i)}
                  className="h-11 px-4 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition flex-shrink-0"
                >
                  {presetConsole.downloadOne(r.slot)}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {build?.error && (
        <div className="rounded-control bg-danger-fill text-danger text-footnote px-3 py-2">
          {build.error}
        </div>
      )}
    </div>
  );

  // Step 4: Nạp vào máy
  const allStepsFlat = recallGuide.reduce((acc, g) => {
    return acc.concat(
      g.steps.map((s) => ({
        key: `${g.title}__${s.title}`,
        group: g.title,
        step: s,
      }))
    );
  }, [] as Array<{ key: string; group: string; step: any }>);

  const step4Content = (
    <div className="space-y-5">
      {recallGuide.map((group) => (
        <div key={group.title}>
          <h3 className="text-body font-semibold">{group.title}</h3>
          <p className="text-secondary text-footnote mb-3">{group.lead}</p>
          <ul className="divide-y divide-separator">
            {group.steps.map((step) => {
              const key = `${group.title}__${step.title}`;
              const isChecked = checkedSteps.has(key);
              return (
                <li key={key} className="py-3">
                  <label className="flex gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const newSet = new Set(checkedSteps);
                        if (e.target.checked) {
                          newSet.add(key);
                        } else {
                          newSet.delete(key);
                        }
                        setCheckedSteps(newSet);
                      }}
                      className="size-5 mt-0.5 shrink-0 accent-accent"
                    />
                    <div className="min-w-0">
                      <div className={`text-subhead font-semibold ${isChecked ? "text-secondary" : "text-label"}`}>
                        {step.title}
                      </div>
                      {step.path && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1 text-footnote font-medium text-label">
                          {step.path.map((seg, si) => (
                            <span key={seg} className="inline-flex items-center gap-1">
                              {si > 0 && <span className="text-tertiary"><ChevronIcon /></span>}
                              {seg}
                            </span>
                          ))}
                        </div>
                      )}
                      {step.note && (
                        <p className="mt-1 text-footnote leading-relaxed text-secondary">{step.note}</p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div role="note" className="rounded-control bg-warning-fill text-footnote px-3 py-2.5 leading-relaxed">
        <div className="font-semibold text-warning mb-0.5">{recallWarning.title}</div>
        <div className="text-label">{recallWarning.text}</div>
      </div>
      <p className="text-secondary text-footnote leading-relaxed">{recallStatus}</p>
    </div>
  );

  const stepContents = [step1Content, step2Content, step3Content, step4Content];

  return (
    <div ref={consoleRef} className="scroll-mt-24 rounded-card bg-card shadow-card overflow-clip">
      {/* Header: bốn bước nằm ngang trên mọi màn hình, dưới là tiêu đề bước đang mở */}
      <div className="px-4 pt-4 sm:px-6 sm:pt-6 border-b border-separator">
        <nav aria-label="Các bước" className="grid grid-cols-4 gap-1.5 pb-4">
          {presetConsole.steps.map((s, i) => {
            const disabled = model !== "zve10" && i > 0;
            const current = step === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => !disabled && setStep(i)}
                disabled={disabled}
                aria-current={current ? "step" : undefined}
                aria-label={`${s.short} - ${s.title}`}
                className={`min-h-11 flex flex-col justify-end gap-1.5 transition-colors ${
                  disabled
                    ? "text-secondary opacity-50 cursor-not-allowed"
                    : current
                      ? "text-label"
                      : "text-secondary hover:text-label"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-full rounded-full transition-colors ${
                    stepDone[i] ? "bg-accent" : current ? "bg-accent/40" : "bg-fill-strong"
                  }`}
                />
                <span className="text-footnote font-medium">{s.short}</span>
              </button>
            );
          })}
        </nav>
        <h2 className="pb-4 text-title3 font-medium" tabIndex={-1}>
          {presetConsole.steps[step].title}
        </h2>
      </div>

      <div className="flex flex-col">
        {/* Body */}
        <div className="px-4 py-5 sm:px-6 flex-1" data-reveal>
          {stepContents[step]}
        </div>

        {/* Footer Action Bar */}
        <div
          className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-separator bg-card px-4 py-3 sm:px-6 flex-wrap"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition"
            >
              {presetConsole.back}
            </button>
          )}
          <div className="flex-1"></div>
          {step === 0 && (
            <button
              onClick={() => {
                setStep2Done(true);
                setStep(1);
              }}
              disabled={!step1Done || model !== "zve10"}
              className="h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {presetConsole.next}
            </button>
          )}
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 transition"
            >
              {presetConsole.toPreview}
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              disabled={!preview}
              className={`h-12 px-6 rounded-full text-subhead font-semibold transition ${
                downloaded
                  ? "bg-accent text-on-accent hover:bg-accent/90"
                  : "bg-accent/10 text-accent-text hover:bg-accent/15"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {presetConsole.toInstall}
            </button>
          )}
          {step === 3 && (
            <div className="text-footnote text-secondary">
              {checkedSteps.size === allStepsFlat.length ? (
                <span className="text-success flex items-center gap-1">
                  <CheckIcon /> {presetConsole.status.allDone}
                </span>
              ) : (
                presetConsole.status.checklist(checkedSteps.size, allStepsFlat.length)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
