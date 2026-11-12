import type { SlotDraft } from "./presetSets.ts";

/** Bank PP2–PP10 của một ô: số bank, bộ thông số và id công thức (nếu bank lấy từ công thức). */
export type BankEntry = { k: number; pp: Record<string, any>; recipeId?: string };

export const BANK_MIN = 2;
export const BANK_MAX = 10;

/** Các số bank PP2–PP10 còn trống trong ô. */
export function freeBankNumbers(settings: SlotDraft): number[] {
  const used = settings.ppBanks ?? {};
  const free: number[] = [];
  for (let k = BANK_MIN; k <= BANK_MAX; k++) if (used[k] === undefined) free.push(k);
  return free;
}

/** Danh sách bank theo số tăng dần. */
export function bankEntries(settings: SlotDraft): BankEntry[] {
  const banks = settings.ppBanks ?? {};
  const ids = settings.bankIds ?? {};
  return Object.keys(banks)
    .map(Number)
    .sort((a, b) => a - b)
    .map((k) => ({ k, pp: banks[k] ?? {}, recipeId: ids[k] }));
}

/** Ghi lại đúng dạng cartToSlots: không còn bank thì bỏ hẳn ppBanks và bankIds. Không sửa đối tượng đầu vào. */
function withBanks(settings: SlotDraft, ppBanks: SlotDraft["ppBanks"], bankIds: SlotDraft["bankIds"]): SlotDraft {
  const out: SlotDraft = { ...settings };
  delete out.ppBanks;
  delete out.bankIds;
  if (ppBanks && Object.keys(ppBanks).length > 0) out.ppBanks = ppBanks;
  if (bankIds && Object.keys(bankIds).length > 0) out.bankIds = bankIds;
  return out;
}

/** Thêm bank k từ công thức. Số ngoài 2–10 hoặc đã có bank thì trả về nguyên ô. */
export function addBank(settings: SlotDraft, k: number, pp: Record<string, any>, recipeId: string): SlotDraft {
  if (!Number.isInteger(k) || k < BANK_MIN || k > BANK_MAX) return settings;
  if ((settings.ppBanks ?? {})[k] !== undefined) return settings;
  return withBanks(settings, { ...settings.ppBanks, [k]: pp }, { ...settings.bankIds, [k]: recipeId });
}

/** Bỏ bank k (cả bộ thông số lẫn id công thức). Không có bank k thì trả về nguyên ô. */
export function removeBank(settings: SlotDraft, k: number): SlotDraft {
  if ((settings.ppBanks ?? {})[k] === undefined) return settings;
  const ppBanks = { ...settings.ppBanks };
  const bankIds = { ...settings.bankIds };
  delete ppBanks[k];
  delete bankIds[k];
  return withBanks(settings, ppBanks, bankIds);
}

/** Sửa thông số bank k bằng tay: bỏ id công thức của bank đó (không còn đúng với công thức nữa). */
export function editBank(settings: SlotDraft, k: number, pp: Record<string, any>): SlotDraft {
  if ((settings.ppBanks ?? {})[k] === undefined) return settings;
  const bankIds = { ...settings.bankIds };
  delete bankIds[k];
  return withBanks(settings, { ...settings.ppBanks, [k]: pp }, bankIds);
}
