"use client";

// Cổng /admin/decode. Bảng chỉ đến trình duyệt sau khi /admin/decode/data xác nhận phiên Google nằm trong ADMIN_EMAILS (kiểm trên máy chủ).
// Mỗi lần gọi lấy token bằng getSession() (tự làm mới khi sắp hết hạn). Dữ liệu chỉ nằm trong state: không localStorage, không cache.
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { decodeConsole } from "@/app/content";
import { authReady, getSession, signIn, signOut } from "@/lib/auth";
import { AdminDecode } from "./AdminDecode";
import type { AdminData } from "./AdminDecode";

type Phase =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "ok"; data: AdminData }
  | { kind: "forbidden" }
  | { kind: "missing" }
  | { kind: "error" };

const BTN_ACCENT =
  "h-11 px-4 rounded-full bg-accent text-on-accent text-subhead font-semibold transition hover:bg-accent/90 active:scale-98";
const BTN_FILL = "h-11 px-4 rounded-full bg-fill text-label text-subhead font-semibold transition hover:bg-fill-strong";

function Panel({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <section className="space-y-4 rounded-card bg-card p-4 shadow-card sm:p-5">
      <p className="text-body">{text}</p>
      {children}
    </section>
  );
}

export function AdminGate() {
  const g = decodeConsole.admin.gate;
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!authReady) return;
    let live = true;
    (async () => {
      let next: Phase;
      try {
        const token = (await getSession()).session?.accessToken;
        if (!token) {
          next = { kind: "signedOut" };
        } else {
          const res = await fetch("/admin/decode/data", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (res.status === 200) {
            const body = (await res.json()) as { ok: true } & AdminData;
            next = { kind: "ok", data: { rows: body.rows, summaries: body.summaries, candidates: body.candidates } };
          } else if (res.status === 401) {
            // Phiên trên máy không còn dùng được (đã đăng xuất ở nơi khác, token bị hủy): mời đăng nhập lại
            next = { kind: "signedOut" };
          } else if (res.status === 403) {
            next = { kind: "forbidden" };
          } else if (res.status === 404) {
            next = { kind: "missing" };
          } else {
            next = { kind: "error" };
          }
        }
      } catch {
        next = { kind: "error" };
      }
      if (live) setPhase(next);
    })();
    return () => {
      live = false;
    };
  }, [attempt]);

  const retry = () => {
    setPhase({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  const logout = async () => {
    await signOut();
    setPhase({ kind: "signedOut" });
  };

  if (!authReady) return <Panel text={g.noBuild} />;

  switch (phase.kind) {
    case "loading":
      return <Panel text={g.loading} />;
    case "signedOut":
      return (
        <Panel text={g.signedOut}>
          <button type="button" onClick={() => void signIn()} className={BTN_ACCENT}>
            {g.signIn}
          </button>
        </Panel>
      );
    case "forbidden":
      return (
        <Panel text={g.forbidden}>
          <button type="button" onClick={() => void logout()} className={BTN_FILL}>
            {g.signOut}
          </button>
        </Panel>
      );
    case "missing":
      return <Panel text={g.missing} />;
    case "error":
      return (
        <Panel text={g.error}>
          <button type="button" onClick={retry} className={BTN_FILL}>
            {g.retry}
          </button>
        </Panel>
      );
    case "ok":
      return (
        <div className="space-y-6">
          <Link href="/admin" className="text-subhead text-accent-text underline">
            {decodeConsole.admin.toPresets}
          </Link>
          <AdminDecode {...phase.data} />
        </div>
      );
  }
}
