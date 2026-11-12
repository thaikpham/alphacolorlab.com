"use client";

import { useMemo } from "react";
import Link from "next/link";
import { colorBank } from "@/app/content";
import { useModel } from "@/lib/model";
import { useCart, writeCart, toggle, placeOf } from "@/lib/cart";
import { useMods } from "@/lib/ppMods";
import { useSelectedLayoutSegments } from "next/navigation";

interface ColorsIndexProps {
  presets: typeof import("@/lib/zve10/presets").default;
}

export function ColorsIndex({ presets: allPresets }: ColorsIndexProps) {
  const model = useModel();
  const cart = useCart();
  const mods = useMods();
  const segments = useSelectedLayoutSegments();
  const activeId = segments?.[segments.length - 1];

  const groups = useMemo(() => {
    // Tìm công thức dùng thanh tìm kiếm chung trên thanh điều hướng
    const grouped = new Map<string, typeof allPresets>();
    for (const preset of allPresets) {
      if (!grouped.has(preset.group)) {
        grouped.set(preset.group, []);
      }
      grouped.get(preset.group)!.push(preset);
    }
    return grouped;
  }, [allPresets]);

  return (
    <div className="space-y-6">
      {mods.length > 0 && (
        <section>
          <h2 className="mb-2 px-4 text-footnote text-secondary">{colorBank.mod.mine}</h2>
          <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
            {mods.map((mod) => {
              const base = allPresets.find((p) => p.id === mod.base);
              return (
                <Link
                  key={mod.id}
                  href={`/colors/${mod.base}#mod-${mod.id}`}
                  className="px-4 py-3 hover:bg-fill transition-colors active:bg-fill-strong flex items-center justify-between gap-2"
                >
                  <span className="min-w-0 truncate text-subhead font-semibold text-label">{mod.name}</span>
                  {base && <span className="flex-shrink-0 text-footnote text-secondary">{base.name}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {Array.from(groups.entries()).map(([group, items]) => (
        <section key={group}>
          <h2 className="mb-2 px-4 text-footnote text-secondary">
            {group}
          </h2>
          <div className="rounded-card bg-card shadow-card divide-y divide-separator overflow-hidden">
            {items.map((preset) => {
              const place = model === "zve10" && !preset.blocked ? placeOf(cart, preset.id) : null;
              const isFull = model === "zve10" && !place && cart.slots[cart.target].length >= 10;
              const isActive = activeId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`px-4 py-3 hover:bg-fill transition-colors active:bg-fill-strong flex items-center justify-between gap-2 ${isActive ? "bg-fill" : ""}`}
                >
                  <Link
                    href={`/colors/${preset.id}`}
                    className="flex-1 min-w-0 block"
                  >
                    <div className="text-subhead font-semibold text-label">{preset.name}</div>
                    <p className="text-footnote text-secondary mt-1 line-clamp-2">
                      {preset.description_vi}
                    </p>
                  </Link>
                  {preset.blocked ? (
                    <div className="text-footnote font-medium text-secondary whitespace-nowrap flex-shrink-0">
                      {colorBank.list.blocked}
                    </div>
                  ) : model === "zve10" ? (
                    place ? (
                      <button
                        onClick={() => writeCart(toggle(cart, preset.id))}
                        aria-pressed="true"
                        aria-label={colorBank.cart.removeButton(preset.name, place.slot)}
                        className="relative flex-shrink-0 px-2.5 h-9 rounded-full bg-accent/10 text-accent-text text-footnote font-semibold whitespace-nowrap transition hover:bg-accent/15 after:absolute after:inset-x-0 after:-inset-y-1"
                      >
                        M{place.slot} · PP{place.pp}
                      </button>
                    ) : (
                      <button
                        onClick={() => writeCart(toggle(cart, preset.id))}
                        aria-label={colorBank.cart.addButton(preset.name, cart.target)}
                        disabled={isFull}
                        className="relative flex-shrink-0 px-3 h-9 rounded-full bg-accent/10 text-accent-text text-footnote font-semibold whitespace-nowrap transition hover:bg-accent/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 after:absolute after:inset-x-0 after:-inset-y-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        M{cart.target}
                      </button>
                    )
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
