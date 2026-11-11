/**
 * Picture Profile codec tests — ppOn: false implementation, M3→M4 transformation, PP Off decode.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeDat, buildSet } from "../lib/zve10/dat.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures", "picture-profile");

const fixtures = [
  { file: "CAMPR01P.DAT", slot: 1, ppOn: true, ppSelected: 1, name: "M1" },
  { file: "CAMPR02P.DAT", slot: 2, ppOn: true, ppSelected: 1, name: "M2" },
  { file: "CAMPR03P.DAT", slot: 3, ppOn: true, ppSelected: 1, name: "M3" },
  { file: "CAMPR04P.DAT", slot: 4, ppOn: false, ppSelected: 0, name: "M4" },
];

describe("Picture Profile decode from real camera samples", () => {
  for (const fixture of fixtures) {
    test(`decode ${fixture.file} pp_selected = ${fixture.ppSelected}`, () => {
      const data = fs.readFileSync(path.join(FIXTURES_DIR, fixture.file));
      const bytes = new Uint8Array(data);
      const decoded = decodeDat(bytes);

      assert.strictEqual(decoded.pp_selected, fixture.ppSelected, `Expected pp_selected=${fixture.ppSelected}, got ${decoded.pp_selected}`);
      assert.strictEqual(decoded.slot, fixture.slot);
    });
  }

  test("M3 values match expected (PP1, HLG2, BT.2020, Type4)", () => {
    const data = fs.readFileSync(path.join(FIXTURES_DIR, "CAMPR03P.DAT"));
    const bytes = new Uint8Array(data);
    const decoded = decodeDat(bytes);

    assert.strictEqual(decoded.pp_selected, 1, "M3 should have PP1");
    assert.strictEqual(decoded.pp1.gamma, "HLG2", "M3 gamma should be HLG2");
    assert.strictEqual(decoded.pp1.color_mode, "BT.2020", "M3 color_mode should be BT.2020");
    assert.strictEqual(decoded.pp1.detail_bw, "Type4", "M3 detail_bw should be Type4");
  });

  test("M4 values match expected (PP Off)", () => {
    const data = fs.readFileSync(path.join(FIXTURES_DIR, "CAMPR04P.DAT"));
    const bytes = new Uint8Array(data);
    const decoded = decodeDat(bytes);

    assert.strictEqual(decoded.pp_selected, 0, "M4 should have PP Off");
  });
});

describe("Picture Profile ppOn: false transformation", () => {
  test("build from M3 with ppOn: false equals M4 except 0x02CC", () => {
    const m3Data = fs.readFileSync(path.join(FIXTURES_DIR, "CAMPR03P.DAT"));
    const m4Data = fs.readFileSync(path.join(FIXTURES_DIR, "CAMPR04P.DAT"));

    const m4Bytes = new Uint8Array(m4Data);
    const m3Bytes = new Uint8Array(m3Data);

    // Build M4 from M3 with ppOn: false
    const built = buildSet([m3Bytes, m3Bytes, m3Bytes, m3Bytes], [
      { ppOn: false }, // M1 (slot 1)
      { ppOn: false }, // M2
      { ppOn: false }, // M3
      { ppOn: false }, // M4
    ]);

    const builtM4 = built[3].data; // M4 is at index 3

    // Compare bytes 0x39 to 0x0FFF (payload range after checksum)
    let diffCount = 0;
    let diffBytes: number[] = [];
    for (let i = 0x39; i < 0x1000; i++) {
      if (builtM4[i] !== m4Bytes[i]) {
        diffCount++;
        diffBytes.push(i);
      }
    }

    // Allow only 0x02CC to differ (unrelated non-PP setting)
    if (diffCount > 1) {
      assert.fail(`Expected only 0x02CC to differ, but found ${diffCount} differences at: ${diffBytes.map(b => '0x' + b.toString(16).toUpperCase().padStart(4, '0')).join(', ')}`);
    }
    if (diffCount === 1) {
      assert.strictEqual(diffBytes[0], 0x02cc, `Expected only 0x02CC to differ, but found difference at 0x${diffBytes[0].toString(16).toUpperCase().padStart(4, '0')}`);
    }
  });

  test("build from M4 with ppOn: true (no pp) sets 0x0315 to 1", () => {
    const m4Data = fs.readFileSync(path.join(FIXTURES_DIR, "CAMPR04P.DAT"));
    const m4Bytes = new Uint8Array(m4Data);

    // Build M4 from itself with ppOn: true (no pp, so keep everything)
    const built = buildSet([m4Bytes, m4Bytes, m4Bytes, m4Bytes], [
      { ppOn: true }, // M1
      { ppOn: true }, // M2
      { ppOn: true }, // M3
      { ppOn: true }, // M4
    ]);

    const builtM4 = built[3].data;

    // 0x0315 should be set to 1
    assert.strictEqual(builtM4[0x315], 1, "0x0315 should be 1 when ppOn: true");
  });

  test("ppOn: false + pp throws validation error", () => {
    const m3Data = fs.readFileSync(path.join(FIXTURES_DIR, "CAMPR03P.DAT"));
    const m3Bytes = new Uint8Array(m3Data);

    assert.throws(
      () => buildSet([m3Bytes, m3Bytes, m3Bytes, m3Bytes], [
        { ppOn: false, pp: { gamma: "Cine2" } }, // Should throw
        { ppOn: false },
        { ppOn: false },
        { ppOn: false },
      ]),
      /Tắt Picture Profile thì không chỉnh thông số PP/,
      "Should throw error when ppOn: false and pp is specified"
    );
  });
});

describe("Picture Profile validation", () => {
  test("buildSet with ppOn: false alone succeeds", () => {
    const m4Data = fs.readFileSync(path.join(FIXTURES_DIR, "CAMPR04P.DAT"));
    const m4Bytes = new Uint8Array(m4Data);

    const result = buildSet([m4Bytes, m4Bytes, m4Bytes, m4Bytes], [
      { ppOn: false },
      { ppOn: false },
      { ppOn: false },
      { ppOn: false },
    ]);

    assert.strictEqual(result.length, 4);
    assert.strictEqual(result[3].data[0x315], 0, "M4 should have 0x0315 = 0");
  });
});
