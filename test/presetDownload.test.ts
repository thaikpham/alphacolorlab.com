import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildPresetFiles, cardZip, CARD_PATH_PREFIX, GUIDE_FILE } from "../lib/presetDownload.ts";
import { validatePresetSets, defaultSet, cloneSlots } from "../lib/presetSets.ts";

const set = defaultSet(validatePresetSets(JSON.parse(fs.readFileSync("data/preset-sets.json", "utf8"))));
const dat = (name: string) => new Uint8Array(fs.readFileSync(`public/dat/${name}.dat`));
const GUIDE = "Hướng dẫn thử nghiệm";

for (const [system, family] of [["pal", "P"], ["ntsc", "N"]] as const) {
  test(`${system}: buildPresetFiles ra CAMPR01${family}..04${family} và zip đúng đường dẫn thẻ`, () => {
    const base = dat(`zve10-base-${system}`);
    const headers = [1, 2, 3, 4].map((i) => dat(`zve10-${system}-m${i}`));
    const { files, zip } = buildPresetFiles(cloneSlots(set), base, headers, GUIDE);

    assert.deepEqual(files.map((f) => f.name), [1, 2, 3, 4].map((i) => `CAMPR0${i}${family}.DAT`));
    assert.ok(zip.length > 0);
    const bytes = Buffer.from(zip);
    for (const f of files) assert.ok(bytes.includes(CARD_PATH_PREFIX + f.name), `thiếu ${f.name} trong zip`);
    assert.ok(bytes.includes(GUIDE_FILE));
    assert.ok(bytes.includes(GUIDE, 0, "utf8"));
  });
}

test("cardZip không có hướng dẫn thì không có HUONG_DAN.txt", () => {
  const zip = cardZip([{ name: "CAMPR01P.DAT", data: new Uint8Array([1, 2, 3]) }]);
  const bytes = Buffer.from(zip);
  assert.ok(bytes.includes(CARD_PATH_PREFIX + "CAMPR01P.DAT"));
  assert.equal(bytes.includes(GUIDE_FILE), false);
});
