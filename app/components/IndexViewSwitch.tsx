"use client";

import { indexView as T } from "@/app/content";
import { setIndexView, useIndexView, type IndexApp, type IndexView } from "@/lib/indexView";

const VIEWS: IndexView[] = ["list", "grid"];

/** Danh sách: ba dòng ngang. Lưới: bốn ô vuông 2×2. */
function ViewIcon({ view }: { view: IndexView }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      {view === "list" ? (
        <path d="M3 4h10M3 8h10M3 12h10" />
      ) : (
        <>
          <rect x="3" y="3" width="4" height="4" rx="1" />
          <rect x="9" y="3" width="4" height="4" rx="1" />
          <rect x="3" y="9" width="4" height="4" rx="1" />
          <rect x="9" y="9" width="4" height="4" rx="1" />
        </>
      )}
    </svg>
  );
}

/** Danh sách / Lưới của một app (Blog hoặc Product Wiki), một hàng gọn trong menu avatar (AccountButton): tên app bên trái, hai nút icon bên phải. Lưu trên máy này (lib/indexView). */
export function IndexViewSwitch({ app, label }: { app: IndexApp; label: string }) {
  const view = useIndexView(app);
  return (
    <div className="flex min-h-11 items-center gap-3 px-3">
      <span className="flex-1 text-subhead font-semibold text-label">{label}</span>
      <div role="group" aria-label={`${T.label}: ${label}`} className="flex gap-0.5 rounded-control bg-fill p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setIndexView(app, v)}
            aria-pressed={view === v}
            aria-label={T[v]}
            className={`relative grid h-9 w-11 place-items-center rounded-badge transition after:absolute after:-inset-y-1 after:inset-x-0 ${
              view === v ? "bg-card shadow-thumb text-label" : "text-secondary hover:bg-fill-strong"
            }`}
          >
            <ViewIcon view={v} />
          </button>
        ))}
      </div>
    </div>
  );
}
