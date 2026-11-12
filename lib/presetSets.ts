// Bộ preset M1–M4 do admin soạn (trang /admin khi chạy npm run dev), lưu ở data/preset-sets.json.
// File này là ranh giới tin cậy: mọi dữ liệu đọc từ JSON hay gửi lên API đều qua validatePresetSets.
import { APERTURES, SHUTTERS, ISOS, PP_FIELDS, FOCUS_AREAS, METERING_MODES, FACE_PRIORITY, SOFT_SKIN, AUTO_REVIEW, FLASH_MODES, EXP_COMP_SETS, AWB_PRIORITIES, PRE_AF, STEADY_SHOT, E_FRONT_CURTAIN, LIVE_VIEW, type SlotSettings } from "./zve10/dat.ts";
import recipes from "./zve10/presets.ts";

/** Cài đặt một ô. recipeId: id công thức màu trong lib/zve10/presets.json, "custom" nếu chỉnh tay PP. bankIds: recipe ids for PP2–PP10. */
export type SlotDraft = SlotSettings & { recipeId?: string; bankIds?: Partial<Record<number, string>> };
export type PresetSlot = { label: string; note?: string; settings: SlotDraft };
/** Người soạn bộ. avatar chỉ https; link http hoặc https. */
export type PresetAuthor = { name: string; handle: string; avatar?: string; link?: string };
export type PresetSet = {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
  /** true: ẩn khỏi danh sách chia sẻ (/bo-m1-m4, /console) và trang /bo-m1-m4/[id]; vẫn dùng ở Tạo bộ M1–M4. */
  unlisted?: boolean;
  author?: PresetAuthor;
  slots: [PresetSlot, PresetSlot, PresetSlot, PresetSlot];
};

export class PresetError extends Error {}

/** Giới hạn độ dài chữ của bộ, dùng cho validate và maxLength ở /admin và editor KOL. id, name, description trùng supabase/kol.sql. */
export const PRESET_LIMITS = {
  id: 40,
  name: 60,
  description: 240,
  slotLabel: 40,
  slotNote: 160,
  authorHandle: 30,
  authorName: 60,
  url: 300,
} as const;

const MODES = ["P", "A", "S", "M", "keep"];
const FOCUS = ["MF", "AF-S", "AF-C", "keep"];
const FOCUS_AREA_VALUES = ["keep", ...FOCUS_AREAS];
const METERING_VALUES = ["keep", ...METERING_MODES];
const FACE_PRIORITY_VALUES = ["keep", ...FACE_PRIORITY];
const SOFT_SKIN_VALUES = ["keep", ...SOFT_SKIN];
const AUTO_REVIEW_VALUES = ["keep", ...AUTO_REVIEW];
const FLASH_MODE_VALUES = ["keep", ...FLASH_MODES];
const EXP_COMP_SET_VALUES = ["keep", ...EXP_COMP_SETS];
const AWB_PRIORITY_VALUES = ["keep", ...AWB_PRIORITIES];
const PRE_AF_VALUES = ["keep", ...PRE_AF];
const STEADY_SHOT_VALUES = ["keep", ...STEADY_SHOT];
const E_FRONT_CURTAIN_VALUES = ["keep", ...E_FRONT_CURTAIN];
const LIVE_VIEW_VALUES = ["keep", ...LIVE_VIEW];
const ISO_VALUES = ISOS.filter((x) => x !== "AUTO");
const RECIPE_IDS = new Set(recipes.map((r) => r.id));

function text(v: unknown, field: string, max: number, required = true): string {
  if (v === undefined && !required) return "";
  if (typeof v !== "string" || (required && !v.trim())) throw new PresetError(`${field}: cần chữ, không được trống`);
  if (v.length > max) throw new PresetError(`${field}: tối đa ${max} ký tự`);
  return v.trim();
}

/** Đường dẫn đầy đủ, chỉ các giao thức cho phép. Không import lib/profile.ts (có "use client", file này chạy cả trên server). */
function webUrl(v: unknown, field: string, protocols: string[]): string {
  const s = text(v, field, PRESET_LIMITS.url);
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new PresetError(`${field}: cần đường dẫn đầy đủ, ví dụ https://…`);
  }
  if (!protocols.includes(u.protocol)) throw new PresetError(`${field}: chỉ nhận ${protocols.map((p) => p.slice(0, -1)).join(" hoặc ")}`);
  return u.href;
}

function validateAuthor(raw: unknown, field: string): PresetAuthor {
  if (!raw || typeof raw !== "object") throw new PresetError(`${field}: cần tên và handle`);
  const r = raw as Record<string, unknown>;
  const handle = text(r.handle, `${field}.handle`, PRESET_LIMITS.authorHandle);
  if (!/^[a-z0-9-]+$/.test(handle)) throw new PresetError(`${field}.handle: chỉ dùng chữ thường không dấu, số và dấu gạch ngang`);
  const avatar = r.avatar === undefined ? undefined : webUrl(r.avatar, `${field}.avatar`, ["https:"]);
  const link = r.link === undefined ? undefined : webUrl(r.link, `${field}.link`, ["http:", "https:"]);
  return { name: text(r.name, `${field}.name`, PRESET_LIMITS.authorName), handle, ...(avatar ? { avatar } : {}), ...(link ? { link } : {}) };
}

function oneOf<T extends string>(v: unknown, options: readonly T[], field: string): T {
  const s = typeof v === "number" ? String(v) : v;
  if (typeof s !== "string" || !options.includes(s as T)) throw new PresetError(`${field}: giá trị "${String(v)}" không hợp lệ`);
  return s as T;
}

function num(v: unknown, field: string, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) throw new PresetError(`${field}: cần số từ ${min} đến ${max}`);
  return v;
}

/** Một giá trị Picture Profile theo PP_FIELDS: enum theo danh sách, số theo khoảng. Dùng chung với lib/ppMods.ts. */
export function ppValue(f: (typeof PP_FIELDS)[number], v: unknown, field: string): string | number {
  return f.kind === "enum" ? oneOf(v, f.options as readonly string[], field) : num(v, field, f.min!, f.max!);
}

function validateSlot(raw: unknown, field: string): SlotDraft {
  if (!raw || typeof raw !== "object") throw new PresetError(`${field}: thiếu cài đặt`);
  const r = raw as Record<string, unknown>;
  const out: SlotDraft = {};
  if (r.mode !== undefined) out.mode = oneOf(r.mode, MODES, `${field}.mode`) as SlotDraft["mode"];
  if (r.focus !== undefined) out.focus = oneOf(r.focus, FOCUS, `${field}.focus`) as SlotDraft["focus"];
  if (r.focusArea !== undefined) out.focusArea = oneOf(r.focusArea, FOCUS_AREA_VALUES, `${field}.focusArea`) as SlotDraft["focusArea"];
  if (r.metering !== undefined) out.metering = oneOf(r.metering, METERING_VALUES, `${field}.metering`) as SlotDraft["metering"];
  if (r.facePriority !== undefined) out.facePriority = oneOf(r.facePriority, FACE_PRIORITY_VALUES, `${field}.facePriority`) as SlotDraft["facePriority"];
  if (r.softSkin !== undefined) out.softSkin = oneOf(r.softSkin, SOFT_SKIN_VALUES, `${field}.softSkin`) as SlotDraft["softSkin"];
  if (r.autoReview !== undefined) out.autoReview = oneOf(r.autoReview, AUTO_REVIEW_VALUES, `${field}.autoReview`) as SlotDraft["autoReview"];
  if (r.flashMode !== undefined) out.flashMode = oneOf(r.flashMode, FLASH_MODE_VALUES, `${field}.flashMode`) as SlotDraft["flashMode"];
  if (r.expCompSet !== undefined) out.expCompSet = oneOf(r.expCompSet, EXP_COMP_SET_VALUES, `${field}.expCompSet`) as SlotDraft["expCompSet"];
  if (r.awbPriority !== undefined) out.awbPriority = oneOf(r.awbPriority, AWB_PRIORITY_VALUES, `${field}.awbPriority`) as SlotDraft["awbPriority"];
  if (r.preAF !== undefined) out.preAF = oneOf(r.preAF, PRE_AF_VALUES, `${field}.preAF`) as SlotDraft["preAF"];
  if (r.steadyShot !== undefined) out.steadyShot = oneOf(r.steadyShot, STEADY_SHOT_VALUES, `${field}.steadyShot`) as SlotDraft["steadyShot"];
  if (r.eFrontCurtain !== undefined) out.eFrontCurtain = oneOf(r.eFrontCurtain, E_FRONT_CURTAIN_VALUES, `${field}.eFrontCurtain`) as SlotDraft["eFrontCurtain"];
  if (r.liveView !== undefined) out.liveView = oneOf(r.liveView, LIVE_VIEW_VALUES, `${field}.liveView`) as SlotDraft["liveView"];
  if (r.aperture !== undefined) out.aperture = r.aperture === "keep" ? "keep" : oneOf(typeof r.aperture === "number" ? APERTURES.find((a) => Number(a) === r.aperture) : r.aperture, APERTURES, `${field}.aperture`);
  if (r.shutter !== undefined) out.shutter = r.shutter === "keep" ? "keep" : oneOf(r.shutter, SHUTTERS, `${field}.shutter`);
  if (r.iso !== undefined) {
    const iso = typeof r.iso === "string" && r.iso.toLowerCase() === "auto" ? "auto" : r.iso;
    out.iso = iso === "keep" || iso === "auto" ? iso : oneOf(iso, ISO_VALUES, `${field}.iso`);
  }
  if (r.wb !== undefined) {
    if (r.wb === "keep") out.wb = "keep";
    else {
      const w = (r.wb ?? {}) as Record<string, unknown>;
      const mode = oneOf(w.mode, ["awb", "ctemp"] as const, `${field}.wb.mode`);
      out.wb = {
        mode,
        ...(mode === "ctemp" ? { kelvin: num(w.kelvin, `${field}.wb.kelvin`, 2500, 9900) } : {}),
        ab: w.ab === undefined ? 0 : num(w.ab, `${field}.wb.ab`, -7, 7),
        gm: w.gm === undefined ? 0 : num(w.gm, `${field}.wb.gm`, -7, 7),
        ...(w.priority !== undefined ? { priority: text(w.priority, `${field}.wb.priority`, 20) } : {}),
      };
    }
  }
  if (r.pp !== undefined) {
    if (r.pp === "keep") out.pp = "keep";
    else if (r.pp && typeof r.pp === "object") {
      const pp: Record<string, string | number> = {};
      for (const f of PP_FIELDS) {
        const v = (r.pp as Record<string, unknown>)[f.key];
        if (v === undefined) continue;
        pp[f.key] = ppValue(f, v, `${field}.pp.${f.key}`);
      }
      out.pp = pp;
    } else throw new PresetError(`${field}.pp: cần "keep" hoặc bộ thông số PP`);
  }
  if (r.ppOn !== undefined) out.ppOn = Boolean(r.ppOn);
  if (r.ppBanks !== undefined) {
    if (r.ppBanks && typeof r.ppBanks === "object") {
      const ppBanks: Partial<Record<number, Record<string, any>>> = {};
      for (const [kStr, bank] of Object.entries(r.ppBanks)) {
        const k = Number(kStr);
        if (!Number.isInteger(k) || k < 2 || k > 10) throw new PresetError(`${field}.ppBanks: bank phải từ 2 đến 10, nhận ${kStr}`);
        if (!bank || typeof bank !== "object") throw new PresetError(`${field}.ppBanks.${k}: cần bộ thông số`);
        const bankObj: Record<string, any> = {};
        for (const f of PP_FIELDS) {
          const v = (bank as Record<string, unknown>)[f.key];
          if (v === undefined) continue;
          bankObj[f.key] = ppValue(f, v, `${field}.ppBanks.${k}.${f.key}`);
        }
        ppBanks[k] = bankObj;
      }
      out.ppBanks = ppBanks;
    } else if (r.ppBanks !== null) throw new PresetError(`${field}.ppBanks: cần bộ bank PP`);
  }
  if (r.recipeId !== undefined) {
    const id = text(r.recipeId, `${field}.recipeId`, 40);
    if (id !== "custom" && !RECIPE_IDS.has(id)) throw new PresetError(`${field}.recipeId: không có công thức "${id}"`);
    if (id !== "custom") {
      const recipe = recipes.find((rc) => rc.id === id);
      if (recipe?.blocked) throw new PresetError(`${field}.recipeId: công thức "${id}" không thể ghi vào file (${recipe.blocked})`);
    }
    out.recipeId = id;
  }
  if (r.bankIds !== undefined) {
    if (r.bankIds && typeof r.bankIds === "object") {
      const bankIds: Partial<Record<number, string>> = {};
      for (const [kStr, id] of Object.entries(r.bankIds)) {
        const k = Number(kStr);
        if (!Number.isInteger(k) || k < 2 || k > 10) throw new PresetError(`${field}.bankIds: bank phải từ 2 đến 10, nhận ${kStr}`);
        const recipeId = text(id, `${field}.bankIds.${k}`, 40);
        if (!RECIPE_IDS.has(recipeId)) throw new PresetError(`${field}.bankIds.${k}: không có công thức "${recipeId}"`);
        const recipe = recipes.find((rc) => rc.id === recipeId);
        if (recipe?.blocked) throw new PresetError(`${field}.bankIds.${k}: công thức "${recipeId}" không thể ghi vào file (${recipe.blocked})`);
        bankIds[k] = recipeId;
      }
      out.bankIds = bankIds;
    } else if (r.bankIds !== null) throw new PresetError(`${field}.bankIds: cần object hoặc null`);
  }
  return out;
}

export function validatePresetSets(raw: unknown): PresetSet[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new PresetError("Cần ít nhất một bộ preset");
  if (raw.length > 50) throw new PresetError("Tối đa 50 bộ preset");
  const ids = new Set<string>();
  const sets = raw.map((s, i): PresetSet => {
    const f = `Bộ ${i + 1}`;
    if (!s || typeof s !== "object") throw new PresetError(`${f}: dữ liệu không hợp lệ`);
    const r = s as Record<string, unknown>;
    const id = text(r.id, `${f}.id`, PRESET_LIMITS.id);
    if (!/^[a-z0-9-]+$/.test(id)) throw new PresetError(`${f}.id: chỉ dùng chữ thường không dấu, số và dấu gạch ngang`);
    if (ids.has(id)) throw new PresetError(`${f}.id: trùng "${id}"`);
    ids.add(id);
    if (r.unlisted !== undefined && typeof r.unlisted !== "boolean") throw new PresetError(`${f}.unlisted: cần true hoặc false`);
    if (!Array.isArray(r.slots) || r.slots.length !== 4) throw new PresetError(`${f}: cần đúng 4 ô M1–M4`);
    const slots = r.slots.map((sl, j) => {
      const sf = `${f}.M${j + 1}`;
      const o = (sl ?? {}) as Record<string, unknown>;
      const note = text(o.note, `${sf}.note`, PRESET_LIMITS.slotNote, false);
      return { label: text(o.label, `${sf}.label`, PRESET_LIMITS.slotLabel), ...(note ? { note } : {}), settings: validateSlot(o.settings, sf) };
    }) as PresetSet["slots"];
    return {
      id,
      name: text(r.name, `${f}.name`, PRESET_LIMITS.name),
      description: text(r.description, `${f}.description`, PRESET_LIMITS.description),
      ...(r.recommended ? { recommended: true } : {}),
      ...(r.unlisted === true ? { unlisted: true } : {}),
      ...(r.author !== undefined ? { author: validateAuthor(r.author, `${f}.author`) } : {}),
      slots,
    };
  });
  if (sets.filter((s) => s.recommended).length > 1) throw new PresetError("Chỉ một bộ được đánh dấu mặc định");
  return sets;
}

/** Bộ mặc định cho người mới: bộ có recommended, nếu không có thì bộ đầu tiên. */
export const defaultSet = (sets: PresetSet[]) => sets.find((s) => s.recommended) ?? sets[0];

/** Bộ được liệt kê công khai: bỏ bộ có unlisted. Bộ ẩn vẫn nằm trong sets để Tạo bộ M1–M4 dùng và id của nó vẫn bị chiếm. */
export const listedSets = (sets: PresetSet[]) => sets.filter((s) => !s.unlisted);

/** Bản sao sâu cài đặt 4 ô, để người dùng chỉnh mà không sửa vào dữ liệu gốc. */
export const cloneSlots = (set: PresetSet): SlotDraft[] => set.slots.map((s) => structuredClone(s.settings));
