"use client";

import { personal as T } from "@/app/content";
import { setPersonal, usePersonal, type Personal } from "@/lib/usePersonal";
import { InfoTip } from "./InfoTip";

/** Segmented "Của tôi / Tất cả": bật tắt lọc nội dung theo túi đồ. Chỉ hiện khi có gì để lọc (túi có món, đã từng bật). */
export function PersonalToggle({ state }: { state: Personal }) {
  if (!state.available) return null;
  const option = (on: boolean, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={state.on === on}
      onClick={() => setPersonal(on)}
      className={`inline-flex h-11 items-center rounded-full px-4 text-footnote font-semibold text-label transition-colors ${state.on === on ? "bg-card shadow-thumb" : ""}`}
    >
      {label}
    </button>
  );
  return (
    <div role="radiogroup" aria-label={T.label} className="inline-flex rounded-full bg-fill p-1">
      {option(true, T.mine)}
      {option(false, T.all)}
    </div>
  );
}

/** Hàng đặt ở đầu một danh sách: segmented "Của tôi / Tất cả" kèm nút "i" giải thích. Không có gì để lọc thì không hiện. */
export function PersonalBar({ state }: { state: Personal }) {
  if (!state.available) return null;
  return (
    <div className="flex items-center gap-1">
      <PersonalToggle state={state} />
      <InfoTip entry={T.tip} />
    </div>
  );
}

/** Hàng "Nội dung hiển thị" trong menu avatar (AccountButton), cùng kiểu hàng Danh sách/Lưới: nhãn bên trái, hai núm chữ bên phải.
 * Hiện khi túi đồ có món, kể cả khi chưa từng bật: đây là nơi bật cá nhân hóa mà không cần quay lại landing. Bấm núm không đóng menu. */
export function PersonalMenuRow({ preview = false }: { preview?: boolean }) {
  const state = usePersonal(preview);
  if (!state.hasGear) return null;
  return (
    <div className="flex min-h-11 items-center gap-3 px-3">
      <span className="flex-1 text-subhead font-semibold text-label">{T.short}</span>
      <div role="group" aria-label={T.label} className="flex gap-0.5 rounded-control bg-fill p-0.5">
        {([true, false] as const).map((on) => (
          <button
            key={String(on)}
            type="button"
            onClick={() => setPersonal(on)}
            aria-pressed={state.wanted === on}
            className={`relative grid h-9 place-items-center rounded-badge px-3 text-footnote font-semibold transition after:absolute after:-inset-y-1 after:inset-x-0 ${
              state.wanted === on ? "bg-card text-label shadow-thumb" : "text-secondary hover:bg-fill-strong"
            }`}
          >
            {on ? T.mine : T.all}
          </button>
        ))}
      </div>
    </div>
  );
}
