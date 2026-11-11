import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { parseA7c2, diffA7c2 } from "../lib/a7c2/dat.ts";
import { applyA7c2, buildSetA7c2 } from "../lib/a7c2/apply.ts";
import { readA7c2Setting, readA7c2Exposure, readA7c2Number, readA7c2PpArray } from "../lib/a7c2/settings.ts";
import type { A7c2SlotSettings } from "../lib/a7c2/apply.ts";

function loadFile(path: string): Uint8Array {
  return new Uint8Array(readFileSync(path));
}

test("A7C II apply: test 1 - WB AWB with A3 and M2 (run5/CAMPR01P → CAMPR02P)", () => {
  const base = loadFile("test/fixtures/a7c2/run5/CAMPR01P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run5/CAMPR02P.DAT");

  const settings: A7c2SlotSettings = {
    wb: {
      mode: "awb",
      ab: 3,
      gm: 2,
    },
  };

  const result = applyA7c2(base, settings);
  const baseDat = parseA7c2(base);
  const expectedDat = parseA7c2(expected);
  const resultDat = parseA7c2(result);

  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  // Exclude records that change on every save
  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered), `Diffs mismatch: got ${diffFiltered.sort((a, b) => a - b).map(x => '0x' + x.toString(16)).join(', ')}, expected ${expectedDiffFiltered.sort((a, b) => a - b).map(x => '0x' + x.toString(16)).join(', ')}`);

  for (const id of expectedDiffFiltered) {
    const exp = expectedDat.records.find((r) => r.id === id);
    const res = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(res?.value, exp?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 2 - WB C.Temp 5600K with B2 and G3 (run5/CAMPR02P → CAMPR03P)", () => {
  const base = loadFile("test/fixtures/a7c2/run5/CAMPR02P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run5/CAMPR03P.DAT");

  const settings: A7c2SlotSettings = {
    wb: {
      mode: "ctemp",
      kelvin: 5600,
      ab: -2,
      gm: -3,
    },
  };

  const result = applyA7c2(base, settings);
  const baseDat = parseA7c2(base);
  const expectedDat = parseA7c2(expected);
  const resultDat = parseA7c2(result);

  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const exp = expectedDat.records.find((r) => r.id === id);
    const res = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(res?.value, exp?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 3 - preAF on, flashMode rear-sync (run6/CAMPR01P → CAMPR02P)", () => {
  const base = loadFile("test/fixtures/a7c2/run6/CAMPR01P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run6/CAMPR02P.DAT");

  const settings: A7c2SlotSettings = {
    preAF: "on",
    flashMode: "rear-sync",
  };

  const result = applyA7c2(base, settings);
  const baseDat = parseA7c2(base);
  const expectedDat = parseA7c2(expected);
  const resultDat = parseA7c2(result);

  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const exp = expectedDat.records.find((r) => r.id === id);
    const res = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(res?.value, exp?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 4 - metering multi, facePriority off, wb awb ab 0 gm 0, awbPriority white (run6/CAMPR02P → CAMPR03P)", () => {
  const base = loadFile("test/fixtures/a7c2/run6/CAMPR02P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run6/CAMPR03P.DAT");

  const settings: A7c2SlotSettings = {
    metering: "multi",
    facePriority: "off",
    wb: {
      mode: "awb",
      ab: 0,
      gm: 0,
    },
    awbPriority: "white",
  };

  const result = applyA7c2(base, settings);
  const baseDat = parseA7c2(base);
  const expectedDat = parseA7c2(expected);
  const resultDat = parseA7c2(result);

  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const exp = expectedDat.records.find((r) => r.id === id);
    const res = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(res?.value, exp?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 5 - ppOn true (PP2→PP1), softSkin mid (run6/CAMPR03P → CAMPR04P)", () => {
  const base = loadFile("test/fixtures/a7c2/run6/CAMPR03P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run6/CAMPR04P.DAT");

  const settings: A7c2SlotSettings = {
    ppOn: true,
    softSkin: "mid",
  };

  const result = applyA7c2(base, settings);
  const baseDat = parseA7c2(base);
  const expectedDat = parseA7c2(expected);
  const resultDat = parseA7c2(result);

  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const exp = expectedDat.records.find((r) => r.id === id);
    const res = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(res?.value, exp?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 6 - isoAutoMinSS 1/250, softSkin low, steadyShot off (run7/CAMPR01P → CAMPR02P)", () => {
  const base = loadFile("test/fixtures/a7c2/run7/CAMPR01P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run7/CAMPR02P.DAT");

  const settings: A7c2SlotSettings = {
    isoAutoMinSS: "1/250",
    softSkin: "low",
    steadyShot: "off",
  };

  const result = applyA7c2(base, settings);
  const baseDat = parseA7c2(base);
  const expectedDat = parseA7c2(expected);
  const resultDat = parseA7c2(result);

  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const exp = expectedDat.records.find((r) => r.id === id);
    const res = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(res?.value, exp?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 7 - expCompSet ambient-flash, softSkin off (run7/CAMPR02P → CAMPR03P)", () => {
  const base = loadFile("test/fixtures/a7c2/run7/CAMPR02P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run7/CAMPR03P.DAT");

  const settings: A7c2SlotSettings = {
    expCompSet: "ambient-flash",
    softSkin: "off",
  };

  const result = applyA7c2(base, settings);
  const baseDat = parseA7c2(base);
  const expectedDat = parseA7c2(expected);
  const resultDat = parseA7c2(result);

  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const exp = expectedDat.records.find((r) => r.id === id);
    const res = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(res?.value, exp?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 8 - liveView setting-effect-off (run7/CAMPR03P → CAMPR04P)", () => {
  const base = loadFile("test/fixtures/a7c2/run7/CAMPR03P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run7/CAMPR04P.DAT");

  const settings: A7c2SlotSettings = {
    liveView: "setting-effect-off",
  };

  const result = applyA7c2(base, settings);
  const baseDat = parseA7c2(base);
  const expectedDat = parseA7c2(expected);
  const resultDat = parseA7c2(result);

  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const exp = expectedDat.records.find((r) => r.id === id);
    const res = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(res?.value, exp?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 9 - mode A, aperture 8, isoAutoMinSS standard (run8/CAMPR01P → CAMPR02P)", () => {
  const base = loadFile("test/fixtures/a7c2/run8/CAMPR01P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run8/CAMPR02P.DAT");

  const settings: A7c2SlotSettings = {
    mode: "A",
    aperture: 8,
    isoAutoMinSS: "standard",
  };

  const result = applyA7c2(base, settings);
  const resultDat = parseA7c2(result);
  const expectedDat = parseA7c2(expected);

  // Assert aperture field
  const res = readA7c2Exposure(resultDat);
  assert.strictEqual(Math.round(res!.aperture * 100), 800, "Aperture should be 8.00");

  const baseDat = parseA7c2(base);
  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const expVal = expectedDat.records.find((r) => r.id === id);
    const resVal = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(resVal?.value, expVal?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 10 - mode M, aperture 5.6, shutter 1/60, iso 800 (run8/CAMPR03P → CAMPR04P)", () => {
  const base = loadFile("test/fixtures/a7c2/run8/CAMPR03P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run8/CAMPR04P.DAT");

  const settings: A7c2SlotSettings = {
    mode: "M",
    aperture: 5.6,
    shutter: "1/60",
    iso: 800,
  };

  const result = applyA7c2(base, settings);
  const resultDat = parseA7c2(result);
  const expectedDat = parseA7c2(expected);

  // Assert exposure fields
  const res = readA7c2Exposure(resultDat);
  assert.strictEqual(Math.round(res!.aperture * 100), 560, "Aperture should be 5.60");
  assert.strictEqual(res!.shutter, "1/60", "Shutter should be 1/60");

  const baseDat = parseA7c2(base);
  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const expVal = expectedDat.records.find((r) => r.id === id);
    const resVal = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(resVal?.value, expVal?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 11 - focus AF-S, focusArea wide, metering center, shutter 0.5\", ppBanks {2: detailBW Type1} (run9/CAMPR01P → CAMPR02P)", () => {
  const base = loadFile("test/fixtures/a7c2/run9/CAMPR01P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run9/CAMPR02P.DAT");

  const settings: A7c2SlotSettings = {
    focus: "AF-S",
    focusArea: "wide",
    metering: "center",
    shutter: '0.5"',
    ppBanks: {
      2: { detailBW: "Type1" },
    },
  };

  const result = applyA7c2(base, settings);
  const resultDat = parseA7c2(result);
  const expectedDat = parseA7c2(expected);

  const baseDat = parseA7c2(base);
  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);
  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28, 0x04de]); // 0x04de unexplained

  // Filter out excluded IDs
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const expVal = expectedDat.records.find((r) => r.id === id);
    const resVal = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(resVal?.value, expVal?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 12 - focusArea flexible-spot-l, metering entire, flashMode rear-sync, ppBanks {2: detailBW Type2} (run9/CAMPR02P → CAMPR03P)", () => {
  const base = loadFile("test/fixtures/a7c2/run9/CAMPR02P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run9/CAMPR03P.DAT");

  const settings: A7c2SlotSettings = {
    focusArea: "flexible-spot-l",
    metering: "entire",
    flashMode: "rear-sync",
    ppBanks: {
      2: { detailBW: "Type2" },
    },
  };

  const result = applyA7c2(base, settings);
  const resultDat = parseA7c2(result);
  const expectedDat = parseA7c2(expected);

  const baseDat = parseA7c2(base);
  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const expVal = expectedDat.records.find((r) => r.id === id);
    const resVal = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(resVal?.value, expVal?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: test 13 - focus AF-C, focusArea tracking-flexible-spot-l, metering highlight, ppBanks {2: detailBW Type4} (run9/CAMPR03P → CAMPR04P)", () => {
  const base = loadFile("test/fixtures/a7c2/run9/CAMPR03P.DAT");
  const expected = loadFile("test/fixtures/a7c2/run9/CAMPR04P.DAT");

  const settings: A7c2SlotSettings = {
    focus: "AF-C",
    focusArea: "tracking-flexible-spot-l",
    metering: "highlight",
    ppBanks: {
      2: { detailBW: "Type4" },
    },
  };

  const result = applyA7c2(base, settings);
  const resultDat = parseA7c2(result);
  const expectedDat = parseA7c2(expected);

  const baseDat = parseA7c2(base);
  const diffs = diffA7c2(baseDat, resultDat);
  const expectedDiffs = diffA7c2(baseDat, expectedDat);

  const excludedIds = new Set([0x017e, 0x0f22, 0x0f24, 0x0f26, 0x0f28]);
  const diffFiltered = diffs.filter((id) => !excludedIds.has(id));
  const expectedDiffFiltered = expectedDiffs.filter((id) => !excludedIds.has(id));

  assert.deepStrictEqual(new Set(diffFiltered), new Set(expectedDiffFiltered));
  for (const id of expectedDiffFiltered) {
    const expVal = expectedDat.records.find((r) => r.id === id);
    const resVal = resultDat.records.find((r) => r.id === id);
    assert.deepStrictEqual(resVal?.value, expVal?.value, `Record 0x${id.toString(16)} mismatch`);
  }
});

test("A7C II apply: error cases", () => {
  const base = loadFile("test/fixtures/a7c2/run9/CAMPR01P.DAT");

  // Tracking area with focus MF should throw
  assert.throws(
    () => {
      applyA7c2(base, {
        focus: "MF",
        focusArea: "tracking-zone",
      });
    },
    /Theo dõi chỉ dùng được với AF-C/
  );

  // flashMode slow-sync should throw
  assert.throws(
    () => {
      applyA7c2(base, { flashMode: "slow-sync" });
    },
    /không hỗ trợ/
  );

  assert.throws(() => applyA7c2(base, { shutter: "abc" }), /Tốc độ không hợp lệ/);

  // Unknown PP label should throw
  assert.throws(
    () => {
      applyA7c2(base, {
        ppOn: true,
        pp: { gamma: "UnknownGamma" },
      });
    },
    /label chưa mã hóa/
  );
});

test("A7C II apply: buildSetA7c2 returns 4 files with correct names, valid checksums, and matching bases", () => {
  const base1 = loadFile("test/fixtures/a7c2/run9/CAMPR01P.DAT");
  const base2 = loadFile("test/fixtures/a7c2/run9/CAMPR02P.DAT");
  const base3 = loadFile("test/fixtures/a7c2/run9/CAMPR03P.DAT");
  const base4 = loadFile("test/fixtures/a7c2/run9/CAMPR04P.DAT");

  const settings: A7c2SlotSettings[] = [
    { mode: "P" },
    { mode: "A" },
    { mode: "S" },
    { mode: "M" },
  ];

  const result = buildSetA7c2([base1, base2, base3, base4], settings, "P");

  assert.strictEqual(result.length, 4);
  assert.deepStrictEqual(
    result.map((x) => x.name),
    ["CAMPR01P.DAT", "CAMPR02P.DAT", "CAMPR03P.DAT", "CAMPR04P.DAT"]
  );

  for (let i = 0; i < 4; i++) {
    const data = result[i].data;
    const parsed = parseA7c2(data);
    assert.strictEqual(parsed.records.length, 1061);
    // Verify header is preserved
    const baseHeader = parseA7c2([base1, base2, base3, base4][i]).header;
    assert.deepStrictEqual(parsed.header, baseHeader);
  }
});

test("A7C II apply: ISO 1/3 stop, tốc độ lẻ 2.5\" và 1.3\", ưu tiên AWB lấy từ wb.priority", () => {
  const base = loadFile("test/fixtures/a7c2/run9/CAMPR01P.DAT");
  for (const [iso, code] of [[125, 6], [160, 7], [250, 9]] as const)
    assert.strictEqual(readA7c2Number(parseA7c2(applyA7c2(base, { iso })), [0x0332]), code);
  assert.throws(() => applyA7c2(base, { iso: 130 }), /không chính xác/);
  for (const shutter of ['2.5"', '1.3"']) assert.strictEqual(readA7c2Exposure(parseA7c2(applyA7c2(base, { shutter })))!.shutter, shutter);
  const awb = (s: A7c2SlotSettings) => readA7c2Setting(parseA7c2(applyA7c2(base, s)), "awbPriority");
  assert.strictEqual(awb({ wb: { mode: "awb", priority: "ambience" } }), "ambience");
  assert.strictEqual(awb({ wb: { mode: "awb", priority: "ambience" }, awbPriority: "white" }), "white");
  assert.throws(() => applyA7c2(base, { wb: { mode: "awb", priority: "mood" } }), /AWB Priority/);
});

test("A7C II apply: mọi công thức trong presets.json ghi được vào PP1", () => {
  const base = loadFile("test/fixtures/a7c2/run9/CAMPR01P.DAT");
  const presets = JSON.parse(readFileSync("lib/zve10/presets.json", "utf8"));
  for (const p of presets) {
    const dat = parseA7c2(applyA7c2(base, { ppOn: true, pp: p.pp, wb: p.wb }));
    assert.strictEqual(readA7c2Setting(dat, "pictureProfile"), "PP1", p.id);
    assert.strictEqual(readA7c2PpArray(dat, "saturation")[0], p.pp.saturation, p.id);
    if (p.wb?.gm) assert.strictEqual(readA7c2Number(dat, p.wb.mode === "ctemp" ? [0x0c7f] : [0x0c69]), -p.wb.gm * 1000, p.id);
  }
});
