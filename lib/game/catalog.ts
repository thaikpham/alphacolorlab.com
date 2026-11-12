import catalogData from "../../data/game-tasks.json" with { type: "json" };
import type { GameModel, Lang, Catalog, CatalogSetting } from "./types.ts";
import { adaptersFor } from "../decode/adapters.ts";

let catalog: Catalog | null = null;

// decoded được suy ra từ adapter khi nạp, không ghi tay: cài đặt định vị được và mọi giá trị có mã đã tin cậy
// (đã hiệu chỉnh bằng file máy thật, hoặc đã thấy trong file máy thật). Nạp lười vì adapters.ts import file này.
function load(): Catalog {
  if (catalog) return catalog;
  const cat: Catalog = structuredClone(catalogData);
  catalog = cat; // adaptersFor gọi getCatalog() để lấy id và giá trị; gán trước để không đệ quy
  for (const model of Object.keys(cat) as GameModel[]) {
    const adapters = new Map(adaptersFor(model).map(a => [a.settingId, a] as const));
    for (const setting of cat[model].settings) {
      const a = adapters.get(setting.id);
      setting.decoded = !!a && a.located && setting.values.every(v => a.codeOf(v.id) !== null && (a.calibrated === true || a.staticConfirmed.includes(v.id)));
    }
  }
  return cat;
}

export function labelOf(model: GameModel, settingId: string, valueId: string, lang: Lang): string | null {
  const cat = getCatalog()[model];
  const setting = cat.settings.find(s => s.id === settingId);
  if (!setting) return null;
  const value = setting.values.find(v => v.id === valueId);
  return value ? value.label[lang] : null;
}

export function settingOf(model: GameModel, settingId: string): CatalogSetting | null {
  const cat = getCatalog()[model];
  return cat.settings.find(s => s.id === settingId) ?? null;
}

export function getCatalog(): Catalog {
  return catalog ?? load();
}
