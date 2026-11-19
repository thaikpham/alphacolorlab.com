/**
 * PP1 selection (byte 0x315) for preset sets: a slot that carries pp values and does not say ppOn: false
 * must select PP1 (0x315 = 1), on PAL and NTSC. ppOn: false keeps 0; no pp keeps the base byte.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSet, parseDat, decodeDat } from "../lib/zve10/dat.ts";
import { buildPresetFiles } from "../lib/presetDownload.ts";
import { validatePresetSets, cloneSlots } from "../lib/presetSets.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PP1_SELECT = 0x315;
const GUIDE = "test guide";

const load = (rel: string) => new Uint8Array(fs.readFileSync(path.join(ROOT, rel)));
const hybrid = validatePresetSets(JSON.parse(fs.readFileSync(path.join(ROOT, "data/preset-sets.json"), "utf8"))).find(
  (s) => s.id === "zv-e10-hybrid",
);
if (!hybrid) throw new Error("zv-e10-hybrid missing from data/preset-sets.json");

for (const [system, family] of [["pal", "P"], ["ntsc", "N"]] as const) {
  const base = load(`public/dat/zve10-base-${system}.dat`);
  const headers = [1, 2, 3, 4].map((i) => load(`public/dat/zve10-${system}-m${i}.dat`));

  describe(`zv-e10-hybrid ${system}`, () => {
    test("pp slots without ppOn set 0x315 = 1 in all four files and parse", () => {
      const { files } = buildPresetFiles(cloneSlots(hybrid), base, headers, GUIDE);
      assert.deepEqual(files.map((f) => f.name), [1, 2, 3, 4].map((i) => `CAMPR0${i}${family}.DAT`));
      for (const f of files) {
        assert.equal(f.data[PP1_SELECT], 1, `${f.name} 0x315`);
        assert.doesNotThrow(() => parseDat(f.data), f.name);
        assert.equal(decodeDat(f.data).pp_selected, 1, `${f.name} pp_selected`);
      }
    });

    test("ppOn: false keeps 0x315 = 0", () => {
      const built = buildSet(base, [{ ppOn: false }, {}, {}, {}], undefined, undefined, headers);
      assert.equal(built[0].data[PP1_SELECT], 0);
      assert.doesNotThrow(() => parseDat(built[0].data));
    });

    test("ppOn: false with pp still throws", () => {
      assert.throws(
        () => buildSet(base, [{ ppOn: false, pp: { gamma: "Cine3" } }, {}, {}, {}], undefined, undefined, headers),
        /Tắt Picture Profile/,
      );
    });

    test("no pp (or pp keep / empty) and ppOn unset keeps the base 0x315", () => {
      const built = buildSet(base, [{}, { pp: "keep" }, { pp: {} }, {}], undefined, undefined, headers);
      for (const f of built) assert.equal(f.data[PP1_SELECT], base[PP1_SELECT], `${f.name} 0x315`);
    });
  });
}
