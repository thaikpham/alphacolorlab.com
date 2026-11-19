/**
 * Khóa cũ usbConnection, pcRemote, smartphoneConnect và pcRemoteMethod trong bộ đã lưu: validatePresetSets vẫn nhận bộ có các khóa này,
 * bỏ chúng đi, và buildSet ra đúng byte như khi bộ không có.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSet, type SlotSettings } from "../lib/zve10/dat.ts";
import { validatePresetSets } from "../lib/presetSets.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (rel: string) => new Uint8Array(fs.readFileSync(path.join(ROOT, rel)));
const rawSets = (): any[] => JSON.parse(fs.readFileSync(path.join(ROOT, "data/preset-sets.json"), "utf8"));

// Giá trị hợp lệ của bản lưu cũ, khác mặc định để thử rõ là khóa được đọc hay bị bỏ
const LEGACY = { usbConnection: "mtp", pcRemote: "on", smartphoneConnect: "on", pcRemoteMethod: "wifi-ap" };

function withLegacy(): any[] {
  const raw = rawSets();
  for (const set of raw) for (const slot of set.slots) Object.assign(slot.settings, LEGACY);
  return raw;
}

test("bộ có bốn khóa cũ vẫn validate, các khóa đó bị bỏ", () => {
  const out = validatePresetSets(withLegacy());
  assert.deepEqual(out, validatePresetSets(rawSets()));
  for (const set of out) for (const slot of set.slots) for (const k of Object.keys(LEGACY)) assert.equal(k in slot.settings, false, `${set.id} ${k}`);
});

for (const system of ["pal", "ntsc"] as const) {
  test(`buildSet không đổi byte khi bộ có bốn khóa cũ (${system})`, () => {
    const base = load(`public/dat/zve10-base-${system}.dat`);
    const headers = [1, 2, 3, 4].map((i) => load(`public/dat/zve10-${system}-m${i}.dat`));
    const legacy = validatePresetSets(withLegacy());
    const clean = validatePresetSets(rawSets());
    const build = (sets: typeof clean, i: number) =>
      buildSet(base, sets[i].slots.map((s) => s.settings as SlotSettings), undefined, undefined, headers);
    clean.forEach((set, i) => assert.deepEqual(build(legacy, i), build(clean, i), `${system}/${set.id}`));
  });
}
