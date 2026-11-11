"use client";

import { useId, useRef, useState } from "react";
import { useModel, setModel, type ModelId } from "@/lib/model";
import { guide, sonyBodies } from "@/app/content";
import { decodeProgress } from "@/lib/decodeProgress";
import { InfoTip } from "./InfoTip";

const copy = guide.modelPicker;
type Menu = (typeof copy.groups)[number]["menu"];

/** Decode status chip: Đã giải mã / Đang giải mã / Chưa giải mã (lib/decodeProgress.ts). */
export function Status({ id }: { id?: string }) {
  const state = decodeProgress(id).state;
  const [label, tone] =
    state === "decoded" ? [copy.decoded, "bg-success-fill text-success font-semibold"]
    : state === "decoding" ? [copy.decoding, "bg-accent/10 text-accent-text font-semibold"]
    : [copy.notDecoded, "bg-fill text-secondary font-medium"];
  return <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-footnote ${tone}`}>{label}</span>;
}

/** Nút chuyển sang một máy, ví dụ "Tôi dùng ZV-E10" trên /tao-m1-m4 khi máy đang chọn chưa giải mã. */
export function UseModelButton({ id, children }: { id: ModelId; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => setModel(id)} className="h-11 rounded-full bg-accent/10 px-5 text-subhead font-semibold text-accent-text transition-colors hover:bg-accent/15">
      {children}
    </button>
  );
}

/** Chọn máy: hàng tóm tắt mở ra bộ lọc hệ menu; chọn hệ rồi mới hiện danh sách máy Sony ngàm E của hệ đó, kèm trạng thái giải mã. Chỉ máy có hướng dẫn chọn được. */
export function ModelPicker() {
  const model = useModel();
  const name = useId(); // trang có hai bộ chọn máy (hướng dẫn, tạo preset): mỗi bộ một nhóm radio riêng
  const box = useRef<HTMLDetailsElement>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const current = sonyBodies.find((b) => b.id === model)!;
  const group = copy.groups.find((g) => g.menu === menu);

  return (
    <details ref={box} className="disclosure group max-w-xl">
      <summary className="flex min-h-11 cursor-pointer items-center gap-3 rounded-card bg-card px-4 py-3 shadow-card">
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold">{current.name}</span>
          <span className="block text-footnote text-secondary">
            {copy.groups.find((g) => g.menu === current.menu)!.title} · <span className="whitespace-nowrap">{current.code}</span>
          </span>
        </span>
        <Status id={current.id} />
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-tertiary transition-transform duration-300 ease-ios group-open:rotate-180">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1 rounded-control bg-fill p-1">
            {copy.groups.map((g) => (
              <button
                key={g.menu}
                type="button"
                onClick={() => setMenu(g.menu)}
                aria-pressed={menu === g.menu}
                className={`flex-1 h-11 rounded-badge text-subhead font-medium transition ${
                  menu === g.menu ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>
          <InfoTip entry={{ term: copy.infoTerm, lines: [...copy.groups.map((g) => ({ k: `${g.title}:`, t: g.footer })), { t: copy.legend }] }} />
        </div>

        {group ? (
          <div>
            <ul role="radiogroup" aria-label={group.title} className="overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
              {sonyBodies.filter((b) => b.menu === group.menu).map((b) => (
                <li key={b.code}>
                  <label
                    className={`flex min-h-11 items-center gap-3 px-4 py-2.5 has-focus-visible:ring-2 has-focus-visible:ring-inset has-focus-visible:ring-accent ${
                      b.id ? "cursor-pointer transition-colors hover:bg-fill" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={name}
                      className="sr-only"
                      disabled={!b.id}
                      checked={b.id === model}
                      onChange={() => {
                        setModel(b.id!);
                        box.current!.open = false;
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-subhead font-semibold ${b.id ? "text-label" : "text-secondary"}`}>{b.name}</span>
                      <span className="block text-footnote text-secondary">
                        {b.code}
                        {b.id && ` · ${copy.hasGuide}`}
                      </span>
                    </span>
                    <Status id={b.id} />
                    <span className="grid size-4 shrink-0 place-items-center text-accent-text">
                      {b.id === model && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M13 4l-7.5 8L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}
