"use client";

import { useEffect, useId, useRef, useState } from "react";
import { kolSets, kolStudio } from "@/app/content";
import { deleteSet, listMySets, type RemoteSet } from "@/lib/kol";
import { validatePresetSets } from "@/lib/presetSets";
import presetSetsJson from "@/data/preset-sets.json";
import { KolLoadState, useKol } from "./KolContext";
import { KolSetEditor } from "./KolSetEditor";

// Id bộ đã có trong repo: bộ KOL không được trùng.
const TAKEN: ReadonlySet<string> = new Set(validatePresetSets(presetSetsJson).map((s) => s.id));

const secondary = "inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";
const card = "overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator";
const badge = "shrink-0 rounded-badge px-2 py-1 text-footnote font-semibold";

type Editing = { set?: RemoteSet } | null;

/**
 * Bộ M1–M4 của tài khoản KOL, ở tường /tai-khoan (KolWall). Mỗi KOL có một bộ: chưa có thì mời tạo; có bộ thì hiện thẻ của bộ.
 * Nhiều hơn một bộ (dữ liệu cũ) thì vẫn hiện đủ từng hàng, không ẩn, không có nút tạo. Mỗi lần mở tải lại; lỗi thì báo, không hiện danh sách rỗng.
 * Soạn bộ thay phần danh sách: danh sách vẫn mounted, chỉ ẩn bằng hidden. Lưu xong hoặc hủy thì đóng trình soạn, tải lại danh sách và trả focus về nút đã mở (hoặc tiêu đề nếu nút đó không còn).
 * hasProfile false: không tải danh sách, chỉ có một dòng chỉ dẫn lên mục Giới thiệu.
 * onEditingChange báo khi trình soạn mở hoặc đóng. Không khóa theo form hồ sơ: các trình soạn mở cùng lúc được.
 */
export function KolSetModule({ userId, hasProfile, onEditingChange }: { userId: string; hasProfile: boolean; onEditingChange?: (editing: boolean) => void }) {
  const uid = useId();
  const [rev, setRev] = useState(0);
  const [loaded, setLoaded] = useState<{ rev: number; sets: RemoteSet[] | null } | null>(null);
  const [pending, setPending] = useState<RemoteSet | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null); // nút vừa mở trình soạn, nhận lại focus khi đóng
  const heading = useRef<HTMLHeadingElement>(null);
  const editorBox = useRef<HTMLDivElement>(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (!hasProfile) return;
    let live = true;
    listMySets(userId, TAKEN).then(
      (sets) => {
        if (live) setLoaded({ rev, sets });
      },
      () => {
        if (live) setLoaded({ rev, sets: null });
      },
    );
    return () => {
      live = false;
    };
  }, [userId, rev, hasProfile]);

  useEffect(() => {
    if (editing === null && wasEditing.current) (opener.current?.isConnected ? opener.current : heading.current)?.focus();
    // Mở trình soạn thì đưa focus vào ô đầu tiên của nó, không để focus rơi về body.
    if (editing !== null && !wasEditing.current) editorBox.current?.querySelector<HTMLElement>("input, textarea")?.focus();
    wasEditing.current = editing !== null;
  }, [editing]);

  const sets = loaded?.rev === rev ? loaded.sets : undefined;

  const edit = (el: HTMLElement, next: Exclude<Editing, null>) => {
    opener.current = el;
    setEditing(next);
    onEditingChange?.(true);
  };
  const close = () => {
    setEditing(null);
    onEditingChange?.(false);
  };
  const saved = () => {
    setRev((r) => r + 1);
    close();
  };

  const ask = (set: RemoteSet) => {
    setPending(set);
    dialog.current?.showModal();
  };

  const remove = async () => {
    if (!pending) return;
    setRemoving(true);
    setError(null);
    try {
      await deleteSet(pending.id);
      setRev((r) => r + 1);
    } catch {
      setError(kolStudio.removeFailed);
    } finally {
      setRemoving(false);
      dialog.current?.close();
    }
  };

  if (!hasProfile)
    return (
      <section aria-labelledby={`${uid}-s`}>
        <h2 id={`${uid}-s`} className="text-title3 font-medium">
          {kolStudio.mySets}
        </h2>
        <p className="mt-4 text-body text-secondary">{kolStudio.wallNoProfile}</p>
      </section>
    );

  return (
    <>
      <div ref={editorBox} hidden={editing === null}>
        {editing && <KolSetEditor key={editing.set?.id ?? "new"} userId={userId} initial={editing.set} taken={TAKEN} onDone={saved} onCancel={close} />}
      </div>
      <section aria-labelledby={`${uid}-s`} hidden={editing !== null}>
        <h2 ref={heading} tabIndex={-1} id={`${uid}-s`} className="text-title3 font-medium">
          {kolStudio.mySets}
        </h2>
        <div className="mt-4">
          {sets === undefined ? (
            <p className="text-body text-secondary">{kolSets.loading}</p>
          ) : sets === null ? (
            <div className="space-y-4">
              <p className="text-body text-secondary">{kolStudio.loadFailed}</p>
              <button type="button" onClick={() => setRev((r) => r + 1)} className={secondary}>
                {kolStudio.retry}
              </button>
            </div>
          ) : sets.length === 0 ? (
            <div className="space-y-4">
              <p className="text-body text-secondary">{kolStudio.emptySets}</p>
              <button type="button" onClick={(e) => edit(e.currentTarget, {})} className={secondary}>
                {kolStudio.newSet}
              </button>
            </div>
          ) : (
            <ul className={card}>
              {sets.map((s) => (
                <li key={s.id} className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="min-w-0 break-words text-title3 font-medium">{s.name}</h3>
                    <span className={`${badge} ${s.published ? "bg-success-fill text-success" : "bg-fill text-secondary"}`}>{s.published ? kolStudio.public : kolStudio.draft}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {s.published && (
                      <a href={`/bo-m1-m4/${s.id}`} target="_blank" rel="noopener noreferrer" className={secondary}>
                        {kolStudio.viewSet}
                      </a>
                    )}
                    <button type="button" onClick={(e) => edit(e.currentTarget, { set: s })} className={secondary}>
                      {kolStudio.edit}
                    </button>
                    <button type="button" onClick={() => ask(s)} className={secondary}>
                      {kolStudio.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error && <p role="alert" className="mt-3 text-footnote font-medium text-danger">{error}</p>}
        </div>

        <dialog
          ref={dialog}
          aria-labelledby={`${uid}-rm`}
          onClose={() => setPending(null)}
          onClick={(e) => e.target === dialog.current && dialog.current.close()}
          className="m-auto w-full max-w-sm rounded-card bg-card p-6 text-label shadow-card"
        >
          {pending && (
            <>
              <h3 id={`${uid}-rm`} className="text-title3 font-normal">
                {kolStudio.removeTitle(pending.name)}
              </h3>
              <p className="mt-2 text-body text-label">{kolStudio.removeBody}</p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => dialog.current?.close()} className={secondary}>
                  {kolStudio.keep}
                </button>
                <button type="button" onClick={remove} disabled={removing} className="inline-flex h-11 items-center rounded-full bg-danger-fill px-5 text-subhead font-semibold text-danger transition-colors hover:opacity-80 disabled:opacity-40">
                  {kolStudio.removeConfirm}
                </button>
              </div>
            </>
          )}
        </dialog>
      </section>
    </>
  );
}

/**
 * Tường /tai-khoan của KOL: chỉ được mount khi useIsKol đúng (ProfilePage). Hồ sơ lấy từ KolProvider (useKol), không tải lại ở đây.
 * Đang tải hoặc lỗi thì hiện KolLoadState (khung chờ hoặc nút Thử lại xám); xong thì đưa hồ sơ có hay không cho KolSetModule.
 * onEditingChange: báo khi trình soạn bộ mở hoặc đóng.
 */
export function KolWall({ userId, onEditingChange }: { userId: string; onEditingChange?: (editing: boolean) => void }) {
  const uid = useId();
  const { status, profile } = useKol();

  if (status !== "ready")
    return (
      <section aria-labelledby={`${uid}-s`}>
        <h2 id={`${uid}-s`} className="text-title3 font-medium">
          {kolStudio.mySets}
        </h2>
        <div className="mt-4">
          <KolLoadState />
        </div>
      </section>
    );

  return <KolSetModule userId={userId} hasProfile={profile !== null} onEditingChange={onEditingChange} />;
}
