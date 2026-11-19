"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { decodeConsole } from "@/app/content";
import { getSession } from "@/lib/auth";
import type { CardFile, DecodeModel, Finding, Mission, RoundFile, Verification } from "@/lib/decode/types";
import { isSupported, writeAndVerify } from "@/lib/cardWriter";
import { readSettingFiles, settingDir } from "@/lib/decode/card";
import { analyzeRound, localFindings } from "@/lib/decode/analyze";
import { verify } from "@/lib/decode/verify";
import { labelOf, settingOf } from "@/lib/decode/catalog";
import { addLocal, readLocal } from "@/app/components/decode/localStore";
import { fetchPlan } from "@/app/components/decode/planClient";
import { makeZip } from "@/lib/zve10/zip";

type Screen = "backup" | "mission" | "verify";

const noop = () => () => {};

// Một lượt giải mã (chỉ trang admin): sao lưu M1–M4 trên thẻ, cài 4 ô theo đề, đọc thẻ để kiểm tra và phân tích.
// mission: lượt do NextRound lập (nếu đúng máy); onRoundDone: báo khi lượt đạt và đã lưu phát hiện.
export function RoundRunner({
  model,
  mission: plannedMission,
  onRoundDone,
  devSave,
}: {
  model: DecodeModel;
  mission?: Mission | null;
  onRoundDone?: (findings: Finding[]) => void;
  devSave?: boolean; // nút lưu lượt vào dự án: chỉ trang admin, và chỉ khi npm run dev
}) {
  const c = decodeConsole.runner;
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("backup");
  const [cardHandle, setCardHandle] = useState<any>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState(false);
  const [beforeFiles, setBeforeFiles] = useState<CardFile[] | null>(null);
  const [backupZipUrl, setBackupZipUrl] = useState<string | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [savedSlots, setSavedSlots] = useState<number[]>([]);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [cardFilesAfter, setCardFilesAfter] = useState<CardFile[] | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const planCtrl = useRef<AbortController | null>(null);
  // server snapshot false: the API only exists in the browser (avoids hydration mismatch)
  const supported = useSyncExternalStore(noop, isSupported, () => false);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  // Đóng khi đang lập lượt: hủy yêu cầu để không cập nhật state sau khi unmount
  useEffect(() => () => planCtrl.current?.abort(), []);

  // Lượt đã đạt thì lần mở sau bắt đầu lượt mới (NextRound đã lập lượt kế tiếp)
  function resetRound() {
    setScreen("backup");
    setCardHandle(null);
    setCardError(false);
    setBeforeFiles(null);
    setBackupZipUrl(null);
    setMission(null);
    setSavedSlots([]);
    setVerification(null);
    setVerifyError(false);
    setCardFilesAfter(null);
    setFindings(null);
    setShowRestore(false);
  }

  function onDialogClose() {
    if (verification?.ok) resetRound();
    setOpen(false);
  }

  // Lượt của NextRound nếu đúng máy; không thì xin server lập một lượt mới từ phát hiện đã lưu
  async function startMission() {
    if (mission) {
      setScreen("mission");
      return;
    }
    if (plannedMission && plannedMission.model === model) {
      setMission(plannedMission);
      setScreen("mission");
      return;
    }
    const ctrl = new AbortController();
    planCtrl.current = ctrl;
    setPlanning(true);
    setPlanError(false);
    try {
      const plan = await fetchPlan({ model, seed: Date.now(), focus: [], local: readLocal() }, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setMission(plan.mission);
      setScreen("mission");
    } catch {
      if (!ctrl.signal.aborted) setPlanError(true);
    } finally {
      if (!ctrl.signal.aborted) setPlanning(false);
    }
  }

  // Chọn thư mục thẻ, đọc 4 file M1–M4 làm bản sao lưu (ZIP tải được)
  async function pickCard() {
    setCardLoading(true);
    setCardError(false);
    try {
      const picked = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      const files = await readSettingFiles(picked);
      const zip = makeZip(files.map((f) => ({ path: f.name, data: f.bytes })));
      setBackupZipUrl(URL.createObjectURL(new Blob([new Uint8Array(zip)], { type: "application/zip" })));
      setCardHandle(picked);
      setBeforeFiles(files);
    } catch {
      setCardError(true);
    } finally {
      setCardLoading(false);
    }
  }

  // Đọc lại thẻ sau khi lưu đủ 4 ô: kiểm cấu trúc, phân tích phát hiện so với bản sao lưu
  async function readCard() {
    if (!mission || !cardHandle) return;
    setScreen("verify");
    setVerifying(true);
    setVerifyError(false);
    setVerification(null);
    setShowRestore(false);
    try {
      const filesAfter = await readSettingFiles(cardHandle);
      const v = verify(mission, filesAfter, "vi", beforeFiles ?? undefined);
      const found = analyzeRound(
        mission,
        toRoundFiles(filesAfter),
        beforeFiles ? toRoundFiles(beforeFiles) : undefined
      );
      // Chỉ lưu phát hiện của lượt đạt. Lượt chưa đạt được làm lại và tính lại từ đầu
      if (v.ok) {
        addLocal(localFindings(found));
        onRoundDone?.(found);
      }
      setCardFilesAfter(filesAfter);
      setFindings(found);
      setVerification(v);
    } catch {
      setVerifyError(true);
    } finally {
      setVerifying(false);
    }
  }

  const stage = screen === "backup" ? 0 : screen === "mission" ? 1 : 2;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-12 px-6 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors inline-flex items-center justify-center"
      >
        {c.start}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto fixed inset-0 z-50 p-4 sm:p-6 rounded-card bg-card shadow-card w-full max-w-dialog h-fit max-h-dvh overflow-y-auto"
        onClose={onDialogClose}
        onCancel={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-title3 font-medium">
            {screen === "backup" && c.backupTitle}
            {screen === "mission" && c.missionTitle}
            {screen === "verify" && c.verifyTitle}
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Đóng"
            className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center text-secondary hover:text-label transition-colors rounded-full hover:bg-fill after:absolute after:inset-x-0 after:-inset-y-1.5"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex gap-1 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < stage ? "bg-accent" : i === stage ? "bg-accent/40" : "bg-fill-strong"}`}
            />
          ))}
        </div>

        {screen === "backup" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-body text-secondary">{c.backupLead}</p>
              <div className="rounded-control bg-warning-fill px-3 py-2.5 text-footnote text-label flex gap-2">
                <WarningIcon />
                <p>{c.backupWarning}</p>
              </div>
            </div>
            {!supported && (
              <p className="text-footnote text-warning bg-warning-fill rounded-control px-3 py-2.5">{c.unsupported}</p>
            )}
            <div className="space-y-3">
              <button
                onClick={pickCard}
                disabled={cardLoading || !supported}
                className="w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors disabled:opacity-50"
              >
                {cardLoading ? c.selecting : c.selectCard}
              </button>
              {beforeFiles && <p className="text-footnote text-secondary">{c.found(beforeFiles.length)}</p>}
              {cardError && <p className="text-footnote text-danger">{c.selectCardError}</p>}
              {beforeFiles && backupZipUrl && (
                <a
                  href={backupZipUrl}
                  download="backup.zip"
                  className="block w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors text-center leading-11"
                >
                  {c.downloadBackup}
                </a>
              )}
            </div>
            {planError && <p className="text-footnote text-danger">{decodeConsole.next.planError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition-colors"
              >
                {c.close}
              </button>
              <button
                onClick={startMission}
                disabled={planning || !beforeFiles}
                className="flex-1 h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 transition disabled:opacity-50"
              >
                {planning ? decodeConsole.next.loading : c.next}
              </button>
            </div>
          </div>
        )}

        {screen === "mission" && mission && (
          <div className="space-y-6">
            <p className="text-body text-secondary">{c.missionLead}</p>
            <div className="space-y-4">
              {mission.slots.map((slot) => (
                <div key={slot.slot} className="divide-y divide-separator border-y border-separator">
                  <div className="px-4 py-3">
                    <p className="text-footnote font-medium text-secondary">
                      {model === "zve10" ? c.slotZve10(slot.slot) : c.slotA6400(slot.slot)}
                    </p>
                  </div>
                  <div className="space-y-2 px-4 py-3">
                    {slot.steps.map((step) => {
                      const setting = settingOf(model, step.settingId);
                      const label = labelOf(model, step.settingId, step.valueId, "vi");
                      return (
                        <div key={`${step.settingId}-${step.valueId}`} className="text-footnote">
                          <div className="text-label font-medium">{setting?.label.vi || step.settingId}</div>
                          <div className="text-secondary">{label || step.valueId}</div>
                          {setting?.path && <div className="text-secondary text-footnote mt-1">{setting.path.vi}</div>}
                        </div>
                      );
                    })}
                  </div>
                  <label className="flex gap-2 items-center px-4 py-3 hover:bg-fill transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={savedSlots.includes(slot.slot)}
                      onChange={(e) => {
                        if (e.target.checked) setSavedSlots((prev) => [...new Set([...prev, slot.slot])]);
                      }}
                      className="flex-shrink-0"
                    />
                    <span className="text-subhead text-label">{c.saved}</span>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-footnote text-secondary bg-fill rounded-control px-3 py-2.5">{c.missionNote}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setScreen("backup")}
                className="flex-1 h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition-colors"
              >
                {c.back}
              </button>
              <button
                onClick={readCard}
                disabled={savedSlots.length < 4}
                className="flex-1 h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {c.readCard}
              </button>
            </div>
          </div>
        )}

        {screen === "verify" && (
          <div className="space-y-4">
            {verifying && <div className="text-center py-8 text-body text-secondary">{c.checking}</div>}
            {!verifying && verifyError && <p className="text-footnote text-danger">{c.readError}</p>}
            {!verifying && verification?.ok && (
              <p className="rounded-control bg-success-fill text-success px-3 py-2.5 text-footnote font-semibold">{c.passed}</p>
            )}
            {!verifying && verification && !verification.ok && (
              <div className="divide-y divide-separator border-y border-separator">
                {verification.structural.map((s) => (
                  <div key={s.id} className="px-4 py-3 flex gap-3 items-start">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.ok ? "bg-success-fill" : "bg-danger-fill"
                      }`}
                    >
                      {s.ok ? <CheckIcon /> : <CrossIcon />}
                    </div>
                    <div className="flex-1">
                      <p className="text-subhead text-label font-medium">{s.message.vi}</p>
                    </div>
                  </div>
                ))}
                {verification.checks
                  .filter((k) => !k.ok)
                  .map((k, i) => (
                    <p key={`check-${i}`} className="px-4 py-3 text-subhead text-label">
                      {c.checkLine(k.slot, settingOf(model, k.settingId)?.label.vi ?? k.settingId, k.expected, k.actual)}
                    </p>
                  ))}
              </div>
            )}
            {!verifying && findings && <FindingsBlock model={model} findings={findings} />}
            {!verifying && devSave && mission && cardFilesAfter && (
              <DevSaveRound mission={mission} files={cardFilesAfter} />
            )}
            {!verifying && verification && !verification.ok && verification.retrySlots.length > 0 && (
              <div className="bg-fill rounded-control px-3 py-2.5 text-footnote text-label">
                <p>{c.retry(verification.retrySlots.map((s) => `M${s}`).join(", "))}</p>
              </div>
            )}
            {!verifying && (verifyError || (verification && !verification.ok)) && (
              <button
                onClick={readCard}
                className="w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors"
              >
                {c.readAgain}
              </button>
            )}
            {/* Khôi phục M1–M4 cũ có ở cả lượt đạt lẫn chưa đạt: thẻ đã bị ghi đè khi lưu 4 ô */}
            {!verifying && beforeFiles && cardHandle && !showRestore && (
              <button
                onClick={() => setShowRestore(true)}
                className="h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition-colors"
              >
                {c.restore}
              </button>
            )}
            {!verifying && showRestore && beforeFiles && cardHandle && (
              <RestoreConfirm files={beforeFiles} cardHandle={cardHandle} onSuccess={() => setShowRestore(false)} />
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 text-warning">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-success">
      <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-danger">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="4" x2="8" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}

// File của lượt theo tên CAMPR0{ô}{N|P}.DAT (ô là số sau CAMPR0); file khác bị bỏ
function toRoundFiles(files: CardFile[]): RoundFile[] {
  return files.flatMap((f) => {
    const m = /^CAMPR0([1-4])[NP]\.DAT$/i.exec(f.name);
    return m ? [{ slot: Number(m[1]), bytes: f.bytes }] : [];
  });
}

type FindingOf<K extends Finding["kind"]> = Extract<Finding, { kind: K }>;

// Kết quả giải mã của một lượt: giá trị xác nhận, mã mới, vị trí tìm được, lỗi cần làm lại
function FindingsBlock({ model, findings }: { model: DecodeModel; findings: Finding[] }) {
  const c = decodeConsole.round;
  const name = (settingId: string) => settingOf(model, settingId)?.label.vi ?? settingId;
  const value = (settingId: string, valueId: string) => labelOf(model, settingId, valueId, "vi") ?? valueId;
  if (findings.length === 0) {
    return <div className="rounded-control bg-fill px-3 py-2.5 text-footnote text-secondary">{c.empty}</div>;
  }
  const confirms = findings.filter((f): f is FindingOf<"confirm"> => f.kind === "confirm");
  const codes = findings.filter((f): f is FindingOf<"code"> => f.kind === "code");
  const locates = findings.filter((f): f is FindingOf<"locate"> => f.kind === "locate");
  const problems = findings.filter(
    (f): f is FindingOf<"mismatch"> | FindingOf<"ambiguous"> => f.kind === "mismatch" || f.kind === "ambiguous"
  );
  return (
    <div className="rounded-control bg-fill px-3 py-2.5 text-footnote text-label space-y-3">
      <p className="font-semibold">{c.title}</p>
      {confirms.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium">{c.confirmed(confirms.length, confirms.filter((f) => f.isNew).length)}</p>
          <ul className="space-y-1">
            {confirms.map((f, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span>{`M${f.slot} · ${name(f.settingId)}: ${value(f.settingId, f.valueId)}`}</span>
                {f.isNew && (
                  <span className="rounded-badge bg-success-fill text-success font-semibold px-2 py-0.5">{c.newMark}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {codes.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium">{c.learned(codes.length)}</p>
          <ul className="space-y-1">
            {codes.map((f, i) => (
              <li key={i}>{`M${f.slot} · ${name(f.settingId)}: ${value(f.settingId, f.valueId)} (${c.codeOf} ${String(f.raw)})`}</li>
            ))}
          </ul>
        </div>
      )}
      {locates.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium">{c.located(locates.length)}</p>
          <ul className="space-y-1">
            {locates.map((f, i) => (
              <li key={i}>
                {c.locatedLine(
                  name(f.settingId),
                  f.slot,
                  f.candidates.slice(0, 4).map((x) => x.where).join(", "),
                  f.candidates.length
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {problems.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium">{c.problems(problems.length)}</p>
          <ul className="space-y-1">
            {problems.map((f, i) =>
              f.kind === "mismatch" ? (
                <li key={i}>
                  {c.mismatch(
                    f.slot,
                    name(f.settingId),
                    value(f.settingId, f.valueId),
                    f.actual ? value(f.settingId, f.actual) : null
                  )}
                </li>
              ) : (
                <li key={i}>{c.ambiguous(f.slot, f.settingIds.map(name).join(", "))}</li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Chỉ khi npm run dev: lưu lượt (đề bài + 4 file) vào test/fixtures/rounds, xem app/admin/decode/api/route.ts.
// Gửi Bearer của phiên Google (getSession làm mới token); máy chủ kiểm tài khoản quản trị.
function DevSaveRound({ mission, files }: { mission: Mission; files: CardFile[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (process.env.NODE_ENV === "production") return null;
  const c = decodeConsole.round;
  return (
    <div className="space-y-2">
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            const list = files.flatMap((f) =>
              /^CAMPR0[1-4][NP]\.DAT$/i.test(f.name) ? [{ name: f.name.toUpperCase(), base64: toBase64(f.bytes) }] : []
            );
            const token = (await getSession()).session?.accessToken;
            const res = await fetch("/admin/decode/api", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({ mission, files: list }),
            });
            if (res.status === 401 || res.status === 403) {
              setMsg(c.devNotAdmin);
              return;
            }
            const data = await res.json().catch(() => null);
            setMsg(data?.ok ? c.devSaved(String(data.dir)) : c.devFailed(String(data?.error ?? res.status)));
          } catch {
            setMsg(c.devFailed(c.devNetwork));
          } finally {
            setBusy(false);
          }
        }}
        className="h-11 px-4 rounded-full bg-fill text-subhead font-semibold text-label hover:bg-fill-strong transition-colors disabled:opacity-40"
      >
        {c.devSave}
      </button>
      {msg && <p className="text-footnote text-secondary">{msg}</p>}
    </div>
  );
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

// Ghi lại 4 file M1–M4 cũ lên thẻ, theo từng thư mục, rồi đọc lại để kiểm tra
function RestoreConfirm({
  files,
  cardHandle,
  onSuccess,
}: {
  files: CardFile[];
  cardHandle: any;
  onSuccess: () => void;
}) {
  const c = decodeConsole.runner;
  const [restoring, setRestoring] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="bg-fill rounded-control px-3 py-2.5 text-footnote space-y-2">
      <p>{c.restoreNote}</p>
      {status && <p className="text-secondary">{status}</p>}
      <button
        onClick={async () => {
          setRestoring(true);
          setStatus(c.restoring);
          try {
            const filesByFolder: Record<string, Array<{ name: string; data: Uint8Array }>> = {};
            for (const f of files) {
              if (!filesByFolder[f.folder]) filesByFolder[f.folder] = [];
              filesByFolder[f.folder].push({ name: f.name, data: f.bytes });
            }
            for (const [folderName, entries] of Object.entries(filesByFolder)) {
              const base = await settingDir(cardHandle);
              // settingDir returns the model folder itself when the user picked it directly
              const dirHandle = base.name === folderName ? base : await base.getDirectoryHandle(folderName, { create: false });
              await writeAndVerify(dirHandle as any, entries);
            }
            setStatus(c.restored);
            onSuccess();
          } catch {
            setStatus(c.restoreError);
          }
          setRestoring(false);
        }}
        disabled={restoring}
        className="w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors disabled:opacity-50"
      >
        {restoring ? c.restoring : c.restore}
      </button>
    </div>
  );
}
