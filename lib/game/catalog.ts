import catalogData from "../../data/game-tasks.json" with { type: "json" };
import type { GameModel, Lang, Catalog, CatalogSetting } from "./types.ts";

const catalog: Catalog = catalogData;

export function labelOf(model: GameModel, settingId: string, valueId: string, lang: Lang): string | null {
  const cat = catalog[model];
  const setting = cat.settings.find(s => s.id === settingId);
  if (!setting) return null;
  const value = setting.values.find(v => v.id === valueId);
  return value ? value.label[lang] : null;
}

export function settingOf(model: GameModel, settingId: string): CatalogSetting | null {
  const cat = catalog[model];
  return cat.settings.find(s => s.id === settingId) ?? null;
}

export function getCatalog(): Catalog {
  return catalog;
}
