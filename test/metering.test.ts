/**
 * Metering, Face Priority, and Soft Skin codec tests — apply and decode from real camera samples.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeDat, applySettings, buildSet, METERING_MODES, FACE_PRIORITY, SOFT_SKIN, type SlotSettings } from "../lib/zve10/dat.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures", "metering");

const fixtures = [
  { file: "CAMPR01P.DAT", metering: "multi", facePriority: "off", softSkin: "off" },
  { file: "CAMPR02P.DAT", metering: "multi", facePriority: "on", softSkin: "off" },
  { file: "CAMPR03P.DAT", metering: "center", facePriority: "on", softSkin: "off" },
  { file: "CAMPR04P.DAT", metering: "center", facePriority: "on", softSkin: "mid" },
];

describe("metering, facePriority, softSkin decode from real camera samples", () => {
  for (const fixture of fixtures) {
    test(`decode ${fixture.file}`, () => {
      const data = fs.readFileSync(path.join(FIXTURES_DIR, fixture.file));
      const bytes = new Uint8Array(data);
      const decoded = decodeDat(bytes);

      assert.strictEqual(decoded.metering, fixture.metering, `Expected metering=${fixture.metering}, got ${decoded.metering}`);
      assert.strictEqual(decoded.facePriority, fixture.facePriority, `Expected facePriority=${fixture.facePriority}, got ${decoded.facePriority}`);
      assert.strictEqual(decoded.softSkin, fixture.softSkin, `Expected softSkin=${fixture.softSkin}, got ${decoded.softSkin}`);
    });
  }
});

describe("apply single settings to reproduce next fixture", () => {
  const transitions = [
    { from: fixtures[0], to: fixtures[1], change: "facePriority: off → on" },
    { from: fixtures[1], to: fixtures[2], change: "metering: multi → center" },
    { from: fixtures[2], to: fixtures[3], change: "softSkin: off → mid" },
  ];

  for (const t of transitions) {
    test(`apply ${t.change}`, () => {
      const baseData = fs.readFileSync(path.join(FIXTURES_DIR, t.from.file));
      const targetData = fs.readFileSync(path.join(FIXTURES_DIR, t.to.file));
      const baseBytes = new Uint8Array(baseData);
      const targetBytes = new Uint8Array(targetData);

      const settings = {
        metering: t.to.metering as any,
        facePriority: t.to.facePriority as any,
        softSkin: t.to.softSkin as any,
      };

      const result = applySettings(baseBytes, 1, settings);

      // Compare body (0x39 to 0x0FFF)
      const resultBody = result.slice(0x39, 0x1000);
      const targetBody = targetBytes.slice(0x39, 0x1000);
      assert.deepStrictEqual(resultBody, targetBody, `Body bytes don't match for ${t.change}`);

      // Verify result parses without error (checksum valid)
      const decoded = decodeDat(result);
      assert.strictEqual(decoded.metering, t.to.metering);
      assert.strictEqual(decoded.facePriority, t.to.facePriority);
      assert.strictEqual(decoded.softSkin, t.to.softSkin);
    });
  }
});

describe("apply all three settings at once", () => {
  test("M1 + all settings from M4 should reproduce M4 body", () => {
    const m1Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const m4Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[3].file));
    const m1Bytes = new Uint8Array(m1Data);
    const m4Bytes = new Uint8Array(m4Data);

    const result = applySettings(m1Bytes, 1, {
      metering: "center",
      facePriority: "on",
      softSkin: "mid",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const m4Body = m4Bytes.slice(0x39, 0x1000);
    assert.deepStrictEqual(resultBody, m4Body, "M1 + all M4 settings should match M4 body");

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.metering, "center");
    assert.strictEqual(decoded.facePriority, "on");
    assert.strictEqual(decoded.softSkin, "mid");
  });
});

describe("keep preserves body unchanged", () => {
  test("empty settings {} leaves body unchanged", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const result = applySettings(baseBytes, 1, {});

    const resultBody = result.slice(0x39, 0x1000);
    const baseBody = baseBytes.slice(0x39, 0x1000);
    assert.deepStrictEqual(resultBody, baseBody, "Body should not change with empty settings");
  });

  test("explicit keep values leave body unchanged", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const result = applySettings(baseBytes, 1, {
      metering: "keep",
      facePriority: "keep",
      softSkin: "keep",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const baseBody = baseBytes.slice(0x39, 0x1000);
    assert.deepStrictEqual(resultBody, baseBody, "Body should not change with explicit keep");
  });
});

describe("buildSet applies settings correctly", () => {
  test("buildSet with metering/facePriority/softSkin settings", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const settings: SlotSettings[] = [
      { metering: "multi", facePriority: "off", softSkin: "off" } as SlotSettings,
      { metering: "multi", facePriority: "on", softSkin: "off" } as SlotSettings,
      { metering: "center", facePriority: "on", softSkin: "off" } as SlotSettings,
      { metering: "center", facePriority: "on", softSkin: "mid" } as SlotSettings,
    ];

    const result = buildSet(baseBytes, settings);

    assert.strictEqual(result.length, 4, "buildSet should return 4 slots");
    for (let i = 0; i < 4; i++) {
      const decoded = decodeDat(result[i].data);
      assert.strictEqual(decoded.metering, settings[i].metering, `Slot ${i + 1} metering mismatch`);
      assert.strictEqual(decoded.facePriority, settings[i].facePriority, `Slot ${i + 1} facePriority mismatch`);
      assert.strictEqual(decoded.softSkin, settings[i].softSkin, `Slot ${i + 1} softSkin mismatch`);
    }
  });
});

describe("invalid values rejected", () => {
  const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
  const baseBytes = new Uint8Array(baseData);

  test("invalid metering value rejected", () => {
    assert.throws(
      () => applySettings(baseBytes, 1, { metering: "invalid" as any }),
      /Chế độ đo sáng không hợp lệ/,
      "Should reject invalid metering value"
    );
  });

  test("invalid facePriority value rejected", () => {
    assert.throws(
      () => applySettings(baseBytes, 1, { facePriority: "maybe" as any }),
      /Trạng thái ưu tiên khuôn mặt không hợp lệ/,
      "Should reject invalid facePriority value"
    );
  });

  test("invalid softSkin value rejected", () => {
    assert.throws(
      () => applySettings(baseBytes, 1, { softSkin: "ultra" as any }),
      /Mức làm mịn da không hợp lệ/,
      "Should reject invalid softSkin value"
    );
  });
});

describe("exports are correct", () => {
  test("METERING_MODES export is correct", () => {
    assert.deepStrictEqual(METERING_MODES, ["multi", "center", "spot-standard", "spot-large", "entire", "highlight"]);
  });

  test("FACE_PRIORITY export is correct", () => {
    assert.deepStrictEqual(FACE_PRIORITY, ["off", "on"]);
  });

  test("SOFT_SKIN export is correct", () => {
    assert.deepStrictEqual(SOFT_SKIN, ["off", "low", "mid", "high"]);
  });
});
