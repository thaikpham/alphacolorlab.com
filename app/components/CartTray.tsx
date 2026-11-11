"use client";

import Link from "next/link";
import { useModel } from "@/lib/model";
import { useCart, writeCart, SLOTS } from "@/lib/cart";
import { colorBank } from "@/app/content";
import { InfoTip } from "./InfoTip";

export function CartTray() {
  const model = useModel();
  const cart = useCart();
  const hasRecipes = Object.values(cart.slots).some((slot) => slot.length > 0);

  if (model !== "zve10") return null;

  return (
    <>
      {hasRecipes && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-separator pb-safe lg:left-sidebar">
          <div className="max-w-page mx-auto px-4 sm:px-6 py-3 space-y-3">
            {/* M1–M4 segmented control with counts; "i" explains PP1–PP10 and the one WB per slot */}
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1 rounded-control bg-fill p-1">
                {SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => writeCart({ ...cart, target: slot })}
                    aria-pressed={cart.target === slot}
                    className={`flex-1 h-10 rounded-badge text-subhead font-medium transition ${
                      cart.target === slot
                        ? "bg-card shadow-thumb font-semibold text-label"
                        : "text-label hover:bg-fill-strong"
                    }`}
                  >
                    {colorBank.cart.slotLabel(slot, cart.slots[slot].length)}
                  </button>
                ))}
              </div>
              <InfoTip entry={{ term: colorBank.cart.noteTerm, lines: [{ t: colorBank.cart.note }] }} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Link
                href="/tao-m1-m4?cart"
                className="flex-1 flex items-center justify-center h-11 px-4 rounded-full bg-accent text-on-accent text-subhead font-semibold transition hover:bg-accent/90 active:scale-98"
              >
                {colorBank.cart.createFile}
              </Link>
              <button
                onClick={() => writeCart({ target: 1, slots: { 1: [], 2: [], 3: [], 4: [] } })}
                className="flex-1 h-11 rounded-full text-accent-text text-subhead font-semibold hover:bg-accent/10 transition"
              >
                {colorBank.cart.clearCart}
              </button>
            </div>
          </div>
        </div>
      )}
      {hasRecipes && <div className="h-32 sm:h-36" aria-hidden="true" />}
    </>
  );
}
