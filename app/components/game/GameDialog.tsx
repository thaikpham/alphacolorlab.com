"use client";

import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { game, cameraModels, decodeConsole } from "@/app/content";
import { useModel } from "@/lib/model";
import type { GameModel, Lang, CardFile, Mission, Verification, Score, Finding, RoundFile } from "@/lib/game/types";
import { isSupported, mapError } from "@/lib/cardWriter";
import { readSettingFiles, settingDir } from "@/lib/game/card";
import { readFirmware } from "@/lib/game/firmware";
import { planMission } from "@/lib/game/plan";
import { analyzeRound, localFindings } from "@/lib/game/analyze";
import { addLocal, readLocal } from "@/app/components/decode/localStore";
import { verify, scoreOf } from "@/lib/game/verify";
import { buildSubmission, submit, downloadableLog } from "@/lib/game/submit";
import { labelOf, settingOf, getCatalog } from "@/lib/game/catalog";
import { makeZip } from "@/lib/zve10/zip";
import { writeAndVerify } from "@/lib/cardWriter";

type GameState = {
  screen: "intro" | "backup" | "mission" | "verify";
  lang: Lang;
  model: GameModel;
  firmware: string | null;
  detectedFirmware: { model: string; version: string } | null;
  nickname: string | null;
  agreeChecked: boolean;
  cardHandle: any;
  cardLoading: boolean;
  cardError: string | null;
  beforeFiles: CardFile[] | null;
  backupZipUrl: string | null;
  mission: Mission | null;
  missionStartTime: number | null;
  savedSlots: number[];
  cardFilesAfter: CardFile[] | null;
  verifyLoading: boolean;
  verification: Verification | null;
  verifyError: string | null;
  score: Score | null;
  findings: Finding[] | null; // analyzeRound(...) của lần kiểm tra gần nhất
  retries: number;
  submitLoading: boolean;
  submitError: string | null;
  restoringBackup: boolean;
};

type GameAction =
  | { type: "setLang"; lang: Lang }
  | { type: "setModel"; model: GameModel }
  | { type: "setFirmware"; firmware: string }
  | { type: "setDetectedFirmware"; fw: { model: string; version: string } | null }
  | { type: "setNickname"; nickname: string }
  | { type: "setAgree"; checked: boolean }
  | { type: "toBackup" }
  | { type: "cardLoading" }
  | { type: "cardSuccess"; handle: any; files: CardFile[]; zipUrl: string }
  | { type: "cardError"; error: string }
  | { type: "toMission" }
  | { type: "missionReady"; mission: Mission }
  | { type: "slotSaved"; slot: number }
  | { type: "toVerify" }
  | { type: "verifyLoading" }
  | { type: "verifySuccess"; verification: Verification; score: Score; files: CardFile[]; findings: Finding[] }
  | { type: "verifyError"; error: string }
  | { type: "retryVerify" }
  | { type: "submitLoading" }
  | { type: "submitSuccess" }
  | { type: "submitError"; error: string }
  | { type: "restoringBackup" }
  | { type: "restoreSuccess" }
  | { type: "resetGame" };

const initialState: GameState = {
  screen: "intro",
  lang: "vi",
  model: "zve10",
  firmware: null,
  detectedFirmware: null,
  nickname: null,
  agreeChecked: false,
  cardHandle: null,
  cardLoading: false,
  cardError: null,
  beforeFiles: null,
  backupZipUrl: null,
  mission: null,
  missionStartTime: null,
  savedSlots: [],
  cardFilesAfter: null,
  verifyLoading: false,
  verification: null,
  verifyError: null,
  score: null,
  findings: null,
  retries: 0,
  submitLoading: false,
  submitError: null,
  restoringBackup: false,
};

// Bắt đầu lượt mới: xóa thẻ, đề bài, kết quả; giữ máy, ngôn ngữ và thông tin người chơi đã nhập
function freshRound(state: GameState, model: GameModel = state.model): GameState {
  return {
    ...initialState,
    lang: state.lang,
    model,
    nickname: state.nickname,
    firmware: state.firmware,
    detectedFirmware: state.detectedFirmware,
    agreeChecked: state.agreeChecked,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "setLang":
      return { ...state, lang: action.lang };
    case "setModel":
      // Đổi máy thì lượt đang làm (đề bài, thẻ, kết quả) không còn dùng được
      if (state.model === action.model) return state;
      return { ...freshRound(state, action.model), firmware: null, detectedFirmware: null };
    case "setFirmware":
      return { ...state, firmware: action.firmware };
    case "setDetectedFirmware":
      return { ...state, detectedFirmware: action.fw };
    case "setNickname":
      return { ...state, nickname: action.nickname };
    case "setAgree":
      return { ...state, agreeChecked: action.checked };
    case "toBackup":
      return { ...state, screen: "backup" };
    case "cardLoading":
      return { ...state, cardLoading: true, cardError: null };
    case "cardSuccess":
      return {
        ...state,
        cardLoading: false,
        cardHandle: action.handle,
        beforeFiles: action.files,
        backupZipUrl: action.zipUrl,
      };
    case "cardError":
      return { ...state, cardLoading: false, cardError: action.error };
    case "toMission":
      return { ...state, screen: "mission" };
    case "missionReady":
      return { ...state, mission: action.mission, missionStartTime: Date.now() };
    case "slotSaved":
      return { ...state, savedSlots: [...new Set([...state.savedSlots, action.slot])] };
    case "toVerify":
      return { ...state, screen: "verify", verifyLoading: true, verification: null, verifyError: null };
    case "verifyLoading":
      return { ...state, verifyLoading: true, verification: null, verifyError: null };
    case "verifySuccess":
      return {
        ...state,
        verifyLoading: false,
        verification: action.verification,
        score: action.score,
        cardFilesAfter: action.files,
        findings: action.findings,
      };
    case "verifyError":
      return { ...state, verifyLoading: false, verifyError: action.error };
    case "retryVerify":
      return { ...state, retries: state.retries + 1, verification: null, verifyError: null, verifyLoading: true };
    case "submitLoading":
      return { ...state, submitLoading: true, submitError: null };
    case "submitSuccess":
      return { ...state, submitLoading: false };
    case "submitError":
      return { ...state, submitLoading: false, submitError: action.error };
    case "restoringBackup":
      return { ...state, restoringBackup: true };
    case "restoreSuccess":
      return { ...state, restoringBackup: false };
    case "resetGame":
      return freshRound(state);
    default:
      return state;
  }
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const noop = () => () => {};

// mission: lượt do bảng giải mã lập (nếu đúng máy); onRoundDone: báo khi lượt đạt và đã lưu phát hiện
export function GameDialog({
  mission,
  onRoundDone,
  devSave,
}: {
  mission?: Mission | null;
  onRoundDone?: (findings: Finding[]) => void;
  devSave?: boolean; // nút lưu lượt vào dự án: chỉ trang admin, và chỉ khi npm run dev
} = {}) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pageModel = useModel();

  // Máy chọn ở đầu trang ("Máy của bạn") là máy của game
  useEffect(() => {
    if (pageModel in getCatalog()) dispatch({ type: "setModel", model: pageModel as GameModel });
  }, [pageModel]);

  useEffect(() => {
    const saved = localStorage.getItem("game-lang");
    if (saved === "en" || saved === "vi") {
      dispatch({ type: "setLang", lang: saved });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("game-lang", state.lang);
  }, [state.lang]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const t = game[state.lang];
  // server snapshot false: the API only exists in the browser (avoids hydration mismatch)
  const supported = useSyncExternalStore(noop, isSupported, () => false);

  const progress =
    state.screen === "intro"
      ? 0
      : state.screen === "backup"
        ? 1
        : state.screen === "mission"
          ? 2
          : 3;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-12 px-6 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors inline-flex items-center justify-center"
      >
        {t.button}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto fixed inset-0 z-50 p-4 sm:p-6 rounded-card bg-card shadow-card w-full max-w-dialog h-fit max-h-dvh overflow-y-auto"
        onClose={() => {
          // Lượt đã đạt thì lần mở sau bắt đầu lượt mới (lượt kế tiếp của bảng giải mã)
          if (state.verification?.ok) dispatch({ type: "resetGame" });
          setOpen(false);
        }}
        onCancel={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-title3 font-medium">
              {state.screen === "intro" && t.intro.title}
              {state.screen === "backup" && t.backup.title}
              {state.screen === "mission" && t.mission.title}
              {state.screen === "verify" && t.verify.title}
            </h2>
            <p className="text-footnote text-secondary mt-1">{state.screen === "intro" && t.intro.what}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Đóng"
            className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center text-secondary hover:text-label transition-colors rounded-full hover:bg-fill after:absolute after:inset-x-0 after:-inset-y-1.5"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < progress ? "bg-accent" : i === progress ? "bg-accent/40" : "bg-fill-strong"}`}
            />
          ))}
        </div>

        {/* Intro Screen */}
        {state.screen === "intro" && (
          <IntroScreen state={state} dispatch={dispatch} lang={state.lang} supported={supported} setOpen={setOpen} />
        )}

        {/* Backup Screen */}
        {state.screen === "backup" && (
          <BackupScreen state={state} dispatch={dispatch} lang={state.lang} plannedMission={mission} />
        )}

        {/* Mission Screen */}
        {state.screen === "mission" && (
          <MissionScreen state={state} dispatch={dispatch} lang={state.lang} />
        )}

        {/* Verify Screen */}
        {state.screen === "verify" && (
          <VerifyScreen state={state} dispatch={dispatch} lang={state.lang} onRoundDone={onRoundDone} devSave={devSave} />
        )}
      </dialog>
    </>
  );
}

function IntroScreen({
  state,
  dispatch,
  lang,
  supported,
  setOpen,
}: {
  state: GameState;
  dispatch: (a: GameAction) => void;
  lang: Lang;
  supported: boolean;
  setOpen: (v: boolean) => void;
}) {
  const t = game[lang];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-body text-secondary">{t.intro.lead}</p>
        <div className="rounded-control bg-fill px-3 py-2.5 text-footnote text-label">
          <p className="font-semibold mb-2">{t.intro.dataUsed}</p>
          <div className="space-y-1 text-secondary">
            {t.intro.dataItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-secondary flex-shrink-0 mt-1.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-secondary">{t.intro.notSent}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-footnote font-medium text-secondary mb-1.5">{t.intro.model}</p>
          <p className="text-subhead font-semibold">{cameraModels.find((m) => m.id === state.model)!.name}</p>
        </div>

        <div>
          <label className="text-footnote font-medium text-secondary mb-1.5 block">{t.intro.nickname}</label>
          <input
            type="text"
            placeholder={t.intro.nicknameHint}
            maxLength={32}
            value={state.nickname || ""}
            onChange={(e) => dispatch({ type: "setNickname", nickname: e.target.value })}
            className="h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label"
          />
        </div>

        <div>
          <label className="text-footnote font-medium text-secondary mb-1.5 block">{t.intro.lang}</label>
          <div className="flex gap-1 rounded-control bg-fill p-1">
            {(["vi", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => dispatch({ type: "setLang", lang: l })}
                className={`flex-1 h-9 rounded-badge text-subhead font-medium transition-colors ${
                  state.lang === l ? "bg-card shadow-thumb font-semibold" : "hover:bg-fill-strong"
                }`}
              >
                {l === "vi" ? "Tiếng Việt" : "English"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex gap-2 items-start">
        <input
          type="checkbox"
          checked={state.agreeChecked}
          onChange={(e) => dispatch({ type: "setAgree", checked: e.target.checked })}
          className="mt-1 flex-shrink-0"
        />
        <span className="text-footnote text-label">{t.intro.agree}</span>
      </label>

      {!supported && (
        <p className="text-footnote text-warning bg-warning-fill rounded-control px-3 py-2.5">{t.intro.unsupported}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition-colors"
        >
          {game[state.lang].backup.close}
        </button>
        <button
          onClick={() => dispatch({ type: "toBackup" })}
          disabled={!state.agreeChecked || !supported}
          className="flex-1 h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {t.intro.start}
        </button>
      </div>
    </div>
  );
}

function BackupScreen({
  state,
  dispatch,
  lang,
  plannedMission,
}: {
  state: GameState;
  dispatch: (a: GameAction) => void;
  lang: Lang;
  plannedMission?: Mission | null;
}) {
  const t = game[lang];

  const handleSelectCard = async () => {
    dispatch({ type: "cardLoading" });
    try {
      const picked = (await (window as any).showDirectoryPicker({ mode: "readwrite" })) as any;
      const [files, fw] = await Promise.all([readSettingFiles(picked), readFirmware(picked)]);

      const zipEntries = files.map((f) => ({ path: f.name, data: f.bytes }));
      const zipData = makeZip(zipEntries);
      const blob = new Blob([new Uint8Array(zipData)], { type: "application/zip" });
      const zipUrl = URL.createObjectURL(blob);

      dispatch({ type: "cardSuccess", handle: picked, files, zipUrl });
      if (fw) dispatch({ type: "setDetectedFirmware", fw });
    } catch (e: any) {
      dispatch({ type: "cardError", error: mapError(e).code });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-body text-secondary">{t.backup.lead}</p>
        <div className="rounded-control bg-warning-fill px-3 py-2.5 text-footnote text-label flex gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 text-warning">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
          <p>{t.backup.warning}</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSelectCard}
          disabled={state.cardLoading}
          className="w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors disabled:opacity-50"
        >
          {state.cardLoading ? t.backup.selecting : t.backup.selectCardBtn}
        </button>

        {state.beforeFiles && (
          <p className="text-footnote text-secondary">
            {t.backup.found.replace("{0}", state.beforeFiles.length.toString())}
          </p>
        )}

        {state.cardError && <p className="text-footnote text-danger">{t.backup.selectCardErr}</p>}

        {state.beforeFiles && state.backupZipUrl && (
          <a
            href={state.backupZipUrl}
            download="backup.zip"
            className="block w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors text-center leading-11"
          >
            {t.backup.downloadBtn}
          </a>
        )}
      </div>

      {state.beforeFiles && (
        <div className="space-y-3">
          <label className="text-footnote font-medium text-secondary block">{t.backup.firmwareLabel}</label>
          {state.detectedFirmware ? (
            <div className="space-y-2">
              <div className="h-11 px-3 rounded-control bg-card border border-separator flex items-center text-callout text-label">
                {state.detectedFirmware.version}
              </div>
              <p className="text-footnote text-secondary">{t.backup.firmwareSource}</p>
              {state.detectedFirmware.model !== getCatalog()[state.model].headerModel && (
                <div className="rounded-control bg-warning-fill px-3 py-2.5 text-footnote text-label flex gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 text-warning">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.5" fill="currentColor" />
                  </svg>
                  <p>{t.backup.firmwareModelMismatch.replace("{0}", state.detectedFirmware.model).replace("{1}", getCatalog()[state.model].headerModel)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder={t.intro.firmwareHint}
                value={state.firmware || ""}
                onChange={(e) => dispatch({ type: "setFirmware", firmware: e.target.value })}
                className="h-11 w-full rounded-control border border-separator bg-card px-3 text-callout text-label"
              />
              <p className="text-footnote text-secondary">{t.backup.firmwareHint}</p>
              <p className="text-footnote text-secondary">
                {t.backup.firmwareMenu[state.model]}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: "toBackup" })}
          className="flex-1 h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition-colors"
        >
          {t.backup.back}
        </button>
        <button
          onClick={() => {
            if (state.mission === null) {
              // Lượt của bảng giải mã nếu đúng máy; không thì lập lượt mới từ phát hiện đã lưu
              const picked =
                plannedMission && plannedMission.model === state.model
                  ? plannedMission
                  : planMission(state.model, { local: readLocal(), seed: Date.now() });
              dispatch({ type: "missionReady", mission: picked });
            }
            dispatch({ type: "toMission" });
          }}
          className="flex-1 h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 transition"
        >
          {t.backup.next}
        </button>
      </div>
    </div>
  );
}

function MissionScreen({
  state,
  dispatch,
  lang,
}: {
  state: GameState;
  dispatch: (a: GameAction) => void;
  lang: Lang;
}) {
  const t = game[lang];
  const elapsed = state.missionStartTime ? Math.floor((Date.now() - state.missionStartTime) / 1000) : 0;
  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;
  const timeStr = `${mm}:${ss.toString().padStart(2, "0")}`;

  if (!state.mission) {
    return <div>{t.mission.generatingMission}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-body text-secondary">{t.mission.lead}</p>
        <p className="text-footnote text-secondary tabular-nums">{t.mission.timer.replace("{0}", timeStr)}</p>
      </div>

      <div className="space-y-4">
        {(state.mission?.slots || []).map((slot) => (
          <div key={slot.slot} className="divide-y divide-separator border-y border-separator">
            <div className="px-4 py-3">
              <p className="text-footnote font-medium text-secondary">
                {state.model === "zve10"
                  ? t.mission.slotLabel(slot.slot)
                  : t.mission.slotLabelA6400(slot.slot)}
              </p>
            </div>
            <div className="space-y-2 px-4 py-3">
              {slot.steps.map((step) => {
                const setting = settingOf(state.model, step.settingId);
                const label = labelOf(state.model, step.settingId, step.valueId, lang);
                return (
                  <div key={`${step.settingId}-${step.valueId}`} className="text-footnote">
                    <div className="text-label font-medium">{setting?.label[lang] || step.settingId}</div>
                    <div className="text-secondary">{label || step.valueId}</div>
                    {setting?.path && (
                      <div className="text-secondary text-footnote mt-1">{setting.path[lang]}</div>
                    )}
                  </div>
                );
              })}
            </div>
            <label className="flex gap-2 items-center px-4 py-3 hover:bg-fill transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={state.savedSlots.includes(slot.slot)}
                onChange={(e) => {
                  if (e.target.checked) {
                    dispatch({ type: "slotSaved", slot: slot.slot });
                  }
                }}
                className="flex-shrink-0"
              />
              <span className="text-subhead text-label">{t.mission.saved}</span>
            </label>
          </div>
        ))}
      </div>

      <p className="text-footnote text-secondary bg-fill rounded-control px-3 py-2.5">{t.mission.note}</p>

      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: "toBackup" })}
          className="flex-1 h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition-colors"
        >
          {t.mission.back}
        </button>
        <button
          onClick={() => dispatch({ type: "toVerify" })}
          disabled={state.savedSlots.length < 4}
          className="flex-1 h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {t.mission.done}
        </button>
      </div>
    </div>
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
function FindingsBlock({ model, findings }: { model: GameModel; findings: Finding[] }) {
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

// Chỉ khi npm run dev: lưu lượt (đề bài + 4 file) vào test/fixtures/rounds, xem app/admin/decode/api/route.ts
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
            const res = await fetch("/admin/decode/api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mission, files: list }),
            });
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

function VerifyScreen({
  state,
  dispatch,
  lang,
  onRoundDone,
  devSave,
}: {
  state: GameState;
  dispatch: (a: GameAction) => void;
  lang: Lang;
  onRoundDone?: (findings: Finding[]) => void;
  devSave?: boolean;
}) {
  const t = game[lang];
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Verify on mount
  useEffect(() => {
    if (state.screen === "verify" && !state.verification && !state.verifyError && state.mission && state.cardHandle) {
      (async () => {
        try {
          // Re-read files using the picked card handle directly
          const filesAfter = await readSettingFiles(state.cardHandle);
          const durationMs = state.missionStartTime ? Date.now() - state.missionStartTime : 0;
          const v = verify(state.mission!, filesAfter, lang, state.beforeFiles || undefined);
          const s = scoreOf(v, durationMs, state.retries);
          const findings = analyzeRound(
            state.mission!,
            toRoundFiles(filesAfter),
            state.beforeFiles ? toRoundFiles(state.beforeFiles) : undefined
          );
          // Chỉ lưu phát hiện của lượt đạt. Lượt chưa đạt được làm lại và tính lại từ đầu
          if (v.ok) {
            addLocal(localFindings(findings));
            onRoundDone?.(findings);
          }
          dispatch({ type: "verifySuccess", verification: v, score: s, files: filesAfter, findings });
        } catch (e: any) {
          dispatch({ type: "verifyError", error: "generic" });
        }
      })();
    }
  }, [state.screen, state.mission, state.cardHandle, lang, state.beforeFiles, state.retries]);

  if (state.verifyLoading) {
    return <div className="text-center py-8 text-body text-secondary">{t.verify.checkingMsg}</div>;
  }

  if (!state.verification && state.verifyError) {
    return (
      <div className="space-y-4">
        <p className="text-footnote text-danger">{t.verify.errorMsg}</p>
        <button
          onClick={() => dispatch({ type: "retryVerify" })}
          className="w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors"
        >
          {t.verify.readAgain}
        </button>
      </div>
    );
  }

  if (!state.verification?.ok && state.verification) {
    return (
      <div className="space-y-4">
        <div className="divide-y divide-separator border-y border-separator">
          {state.verification.structural.map((c) => (
            <div key={c.id} className="px-4 py-3 flex gap-3 items-start">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  c.ok ? "bg-success-fill" : "bg-danger-fill"
                }`}
              >
                {c.ok ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-success">
                    <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-danger">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
                    <line x1="8" y1="4" x2="8" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.5" fill="currentColor" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-subhead text-label font-medium">{c.message[lang]}</p>
              </div>
            </div>
          ))}
          {state.verification.checks.filter((c) => !c.ok).map((c, i) => (
            <p key={`check-${i}`} className="px-4 py-3 text-subhead text-label">
              {t.verify.checkLine(c.slot, settingOf(state.model, c.settingId)?.label[lang] ?? c.settingId, c.expected, c.actual)}
            </p>
          ))}
        </div>

        {state.findings && <FindingsBlock model={state.model} findings={state.findings} />}
        {devSave && state.mission && state.cardFilesAfter && (
          <DevSaveRound mission={state.mission} files={state.cardFilesAfter} />
        )}

        {state.verification.retrySlots.length > 0 && (
          <div className="bg-fill rounded-control px-3 py-2.5 text-footnote text-label">
            <p>{t.verify.retryMsg.replace("{0}", state.verification.retrySlots.map((s) => `M${s}`).join(", "))}</p>
          </div>
        )}

        <button
          onClick={() => dispatch({ type: "retryVerify" })}
          className="w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors"
        >
          {t.verify.readAgain}
        </button>
      </div>
    );
  }

  if (state.verification?.ok && state.score) {
    return (
      <div className="space-y-6">
        <div className="divide-y divide-separator border-y border-separator">
          <p className="px-4 py-3 text-footnote font-medium text-secondary">{t.verify.scoreBreakdown}</p>
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-subhead text-label">{t.verify.accuracy}</span>
            <span className="text-subhead font-semibold tabular-nums">
              {state.score.accuracy}
              {t.verify.maxPoints(700)}
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-subhead text-label">{t.verify.speed}</span>
            <span className="text-subhead font-semibold tabular-nums">
              {state.score.speed}
              {t.verify.maxPoints(300)}
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between items-center bg-fill">
            <span className="text-title3 font-medium text-label">{t.verify.total}</span>
            <span className="text-display font-bold tabular-nums">{state.score.total}</span>
          </div>
        </div>

        {state.findings && <FindingsBlock model={state.model} findings={state.findings} />}
        {devSave && state.mission && state.cardFilesAfter && (
          <DevSaveRound mission={state.mission} files={state.cardFilesAfter} />
        )}

        {state.submitError && (
          <div className="bg-danger-fill rounded-control px-3 py-2.5 text-footnote text-label space-y-2">
            <p>{state.submitError}</p>
            <a
              href={`data:application/json,${encodeURIComponent(
                downloadableLog(
                  buildSubmission(
                    state.mission!.id,
                    state.model,
                    state.detectedFirmware?.version || state.firmware,
                    (state.cardFilesAfter || []).some(f => f.name.endsWith("P.DAT")) ? "pal" :
                    (state.cardFilesAfter || []).some(f => f.name.endsWith("N.DAT")) ? "ntsc" : null,
                    state.nickname,
                    state.lang,
                    state.mission!,
                    state.cardFilesAfter || [],
                    state.verification!,
                    state.score,
                    state.missionStartTime ? Date.now() - state.missionStartTime : 0,
                    state.retries,
                    "0.1.0",
                    state.findings ?? undefined
                  )
                )
              )}`}
              download="game-result.json"
              className="text-accent-text underline text-footnote"
            >
              {t.verify.downloadLog}
            </a>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={async () => {
              try {
                dispatch({ type: "submitLoading" });
                // Derive region from file suffix
                const files = state.cardFilesAfter || [];
                const regionFromFiles = files.some(f => f.name.endsWith("P.DAT")) ? "pal" :
                                       files.some(f => f.name.endsWith("N.DAT")) ? "ntsc" : null;
                const submission = buildSubmission(
                  state.mission!.id,
                  state.model,
                  state.detectedFirmware?.version || state.firmware,
                  regionFromFiles,
                  state.nickname,
                  state.lang,
                  state.mission!,
                  files,
                  state.verification!,
                  state.score,
                  state.missionStartTime ? Date.now() - state.missionStartTime : 0,
                  state.retries,
                  "0.1.0",
                  state.findings ?? undefined
                );
                const result = await submit(submission);
                if (result.ok) {
                  dispatch({ type: "submitSuccess" });
                } else {
                  dispatch({ type: "submitError", error: result.error });
                }
              } catch (e: any) {
                dispatch({ type: "submitError", error: e.message });
              }
            }}
            disabled={state.submitLoading}
            className="h-12 px-6 rounded-full bg-accent text-on-accent text-subhead font-semibold hover:bg-accent/90 active:scale-98 disabled:opacity-40 transition"
          >
            {state.submitLoading ? t.verify.submitting : t.verify.submit}
          </button>

          {state.beforeFiles && (
            <button
              onClick={() => setShowRestoreConfirm(true)}
              className="h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition-colors"
            >
              {t.verify.restoreOld}
            </button>
          )}

          <button
            onClick={() => dispatch({ type: "resetGame" })}
            className="h-11 px-4 rounded-full text-subhead font-semibold text-accent-text hover:bg-accent/10 transition-colors"
          >
            {t.verify.playAgain}
          </button>
        </div>

        {showRestoreConfirm && state.beforeFiles && state.cardHandle && (
          <RestoreConfirm
            files={state.beforeFiles}
            cardHandle={state.cardHandle}
            lang={state.lang}
            onSuccess={() => setShowRestoreConfirm(false)}
          />
        )}
      </div>
    );
  }

  return null;
}

function RestoreConfirm({
  files,
  cardHandle,
  lang,
  onSuccess,
}: {
  files: CardFile[];
  cardHandle: any;
  lang: Lang;
  onSuccess: () => void;
}) {
  const t = game[lang];
  const [restoring, setRestoring] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="bg-fill rounded-control px-3 py-2.5 text-footnote space-y-2">
      <p>{t.verify.restoredNote}</p>
      {status && <p className="text-secondary">{status}</p>}
      <button
        onClick={async () => {
          setRestoring(true);
          setStatus(t.verify.restoring);
          try {
            // Group files by folder
            const filesByFolder: Record<string, Array<{ name: string; data: Uint8Array }>> = {};
            for (const f of files) {
              if (!filesByFolder[f.folder]) {
                filesByFolder[f.folder] = [];
              }
              filesByFolder[f.folder].push({ name: f.name, data: f.bytes });
            }

            // Write each folder group
            for (const [folderName, entries] of Object.entries(filesByFolder)) {
              try {
                const base = await settingDir(cardHandle);
                // settingDir returns the model folder itself when the user picked it directly
                const dirHandle = base.name === folderName ? base : await base.getDirectoryHandle(folderName, { create: false });
                await writeAndVerify(dirHandle as any, entries);
              } catch (e) {
                throw e;
              }
            }

            setStatus(t.verify.restoredStatus);
            onSuccess();
          } catch (e) {
            setStatus(t.verify.restoreError);
          }
          setRestoring(false);
        }}
        disabled={restoring}
        className="w-full h-11 rounded-full bg-accent/10 text-accent-text text-subhead font-semibold hover:bg-accent/15 transition-colors disabled:opacity-50"
      >
        {restoring ? t.verify.restoring : t.verify.restoreOld}
      </button>
    </div>
  );
}
