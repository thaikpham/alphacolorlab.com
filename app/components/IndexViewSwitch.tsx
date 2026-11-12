"use client";

import { indexView as T } from "@/app/content";
import { setIndexView, useIndexView, type IndexView } from "@/lib/indexView";

const VIEWS: IndexView[] = ["list", "grid"];

/** Danh sách / Lưới: kiểu hiển thị của cột index (lưu trên máy này). */
export function IndexViewSwitch() {
  const view = useIndexView();
  return (
    <div role="group" aria-label={T.label} className="flex gap-1 rounded-control bg-fill p-1">
      {VIEWS.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setIndexView(v)}
          aria-pressed={view === v}
          className={`flex-1 h-11 rounded-badge text-subhead transition ${
            view === v ? "bg-card shadow-thumb font-semibold text-label" : "font-medium text-label hover:bg-fill-strong"
          }`}
        >
          {T[v]}
        </button>
      ))}
    </div>
  );
}
