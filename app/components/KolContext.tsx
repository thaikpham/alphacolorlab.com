"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { kolStudio } from "@/app/content";
import { getMyKol, KolError, type KolProfile } from "@/lib/kol";

const secondary = "inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong disabled:opacity-40";

type Status = "idle" | "loading" | "failed" | "ready";

export type KolValue = {
  status: Status;
  userId: string | undefined;
  /** Hồ sơ KOL khi ready; null là chưa có dòng hồ sơ nào. */
  profile: KolProfile | null;
  /** Thay cả hồ sơ: sau lưu mục Giới thiệu (KolIdentityForm), hoặc tạo hồ sơ lần đầu. */
  setProfile: (p: KolProfile) => void;
  /** Sửa một phần hồ sơ đang có (ảnh bìa, ảnh mẫu). Nhận bản mới nhất, nên không đè thay đổi khác đã lưu trong lúc ghi. */
  update: (fn: (p: KolProfile) => KolProfile) => void;
  reload: () => void;
  /** Đang có một lượt ghi (ảnh bìa, ảnh mẫu, Giới thiệu): nút ghi phải khóa. */
  writing: boolean;
  /** Chạy một lượt ghi; một lúc chỉ một lượt. Đang bận thì trả false và không chạy. */
  run: (task: () => Promise<unknown>) => Promise<boolean>;
};

const KolContext = createContext<KolValue | null>(null);

// Ghi chú làm danh sách ảnh quá 16000 byte: lib/kol.ts ném lỗi này trước khi gọi mạng.
export const noteTooLong = (e: unknown) => e instanceof KolError && e.message === "note-too-long";

/**
 * Hồ sơ KOL của tài khoản đăng nhập, tải một lần cho cả /tai-khoan: ảnh bìa, tab Ảnh mẫu, mục Giới thiệu, tường bộ M1–M4.
 * userId undefined (chưa đăng nhập hoặc không phải KOL) thì không gọi getMyKol. Thử lại tăng attempt nên key đổi và trạng thái về loading.
 */
export function KolProvider({ userId, children }: { userId?: string; children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [got, setGot] = useState<{ key: string; profile: KolProfile | null; failed: boolean } | null>(null);
  const [writing, setWriting] = useState(false);
  const busy = useRef(false);
  const key = userId ? `${userId}#${attempt}` : "";

  useEffect(() => {
    if (!userId) return;
    let live = true;
    const mine = `${userId}#${attempt}`;
    getMyKol(userId).then(
      (profile) => {
        if (live) setGot({ key: mine, profile, failed: false });
      },
      () => {
        if (live) setGot({ key: mine, profile: null, failed: true });
      },
    );
    return () => {
      live = false;
    };
  }, [userId, attempt]);

  const current = got !== null && got.key === key ? got : null;
  const status: Status = !userId ? "idle" : current === null ? "loading" : current.failed ? "failed" : "ready";

  const run = async (task: () => Promise<unknown>) => {
    if (busy.current) return false;
    busy.current = true;
    setWriting(true);
    try {
      await task();
    } finally {
      busy.current = false;
      setWriting(false);
    }
    return true;
  };

  return (
    <KolContext.Provider
      value={{
        status,
        userId,
        profile: current?.profile ?? null,
        setProfile: (p) => setGot({ key, profile: p, failed: false }),
        update: (fn) => setGot((g) => (g && g.key === key && g.profile ? { key, profile: fn(g.profile), failed: false } : g)),
        reload: () => setAttempt((n) => n + 1),
        writing,
        run,
      }}
    >
      {children}
    </KolContext.Provider>
  );
}

export function useKol(): KolValue {
  const value = useContext(KolContext);
  if (!value) throw new Error("useKol must be used inside KolProvider");
  return value;
}

/** Trong khi hồ sơ đang tải: khung xám chờ. Tải lỗi: chữ và nút Thử lại xám. Đặt trong thẻ của từng việc, chỉ khi status là loading hoặc failed. */
export function KolLoadState() {
  const { status, reload } = useKol();
  if (status !== "failed") return <span aria-hidden="true" className="block h-11 rounded-control bg-fill" />;
  return (
    <div className="space-y-4">
      <p className="text-body text-secondary">{kolStudio.loadFailed}</p>
      <button type="button" onClick={reload} className={secondary}>
        {kolStudio.retry}
      </button>
    </div>
  );
}
