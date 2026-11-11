/**
 * Auto Review codec tests — apply and decode from real camera samples.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeDat, applySettings, buildSet, AUTO_REVIEW, type SlotSettings } from "../lib/zve10/dat.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures", "auto-review");

const fixtures = [
  { file: "CAMPR01P.DAT", autoReview: "2s" },
  { file: "CAMPR02P.DAT", autoReview: "off" },
  { file: "CAMPR03P.DAT", autoReview: "off" },
  { file: "CAMPR04P.DAT", autoReview: "off" },
];

describe("autoReview decode from real camera samples", () => {
  for (const fixture of fixtures) {
    test(`decode ${fixture.file}`, () => {
      const data = fs.readFileSync(path.join(FIXTURES_DIR, fixture.file));
      const bytes = new Uint8Array(data);
      const decoded = decodeDat(bytes);

      assert.strictEqual(decoded.autoReview, fixture.autoReview, `Expected autoReview=${fixture.autoReview}, got ${decoded.autoReview}`);
    });
  }
});

describe("apply autoReview changes", () => {
  test("M1 autoReview: 2s → M2 autoReview: off", () => {
    const m1Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const m2Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[1].file));
    const m1Bytes = new Uint8Array(m1Data);
    const m2Bytes = new Uint8Array(m2Data);

    const result = applySettings(m1Bytes, 1, { autoReview: "off" });

    // Compare body (0x39 to 0x0FFF)
    const resultBody = result.slice(0x39, 0x1000);
    const m2Body = m2Bytes.slice(0x39, 0x1000);
    assert.deepStrictEqual(resultBody, m2Body, "M1 with autoReview:off should match M2 body");

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.autoReview, "off");
  });

  test("M2 autoReview: off → M1 autoReview: 2s", () => {
    const m1Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const m2Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[1].file));
    const m1Bytes = new Uint8Array(m1Data);
    const m2Bytes = new Uint8Array(m2Data);

    const result = applySettings(m2Bytes, 1, { autoReview: "2s" });

    const resultBody = result.slice(0x39, 0x1000);
    const m1Body = m1Bytes.slice(0x39, 0x1000);
    assert.deepStrictEqual(resultBody, m1Body, "M2 with autoReview:2s should match M1 body");

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.autoReview, "2s");
  });
});

describe("keep preserves autoReview unchanged", () => {
  test("empty settings {} leaves autoReview unchanged", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const result = applySettings(baseBytes, 1, {});

    const resultBody = result.slice(0x39, 0x1000);
    const baseBody = baseBytes.slice(0x39, 0x1000);
    assert.deepStrictEqual(resultBody, baseBody, "Body should not change with empty settings");

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.autoReview, "2s");
  });

  test("explicit keep preserves autoReview unchanged", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const result = applySettings(baseBytes, 1, { autoReview: "keep" });

    const resultBody = result.slice(0x39, 0x1000);
    const baseBody = baseBytes.slice(0x39, 0x1000);
    assert.deepStrictEqual(resultBody, baseBody, "Body should not change with explicit keep");

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.autoReview, "2s");
  });
});

describe("M2, M3, M4 autoReview are identical (not stored)", () => {
  test("M2, M3, M4 bodies are all identical", () => {
    const m2Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[1].file));
    const m3Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[2].file));
    const m4Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[3].file));

    const m2Body = m2Data.slice(0x39, 0x1000);
    const m3Body = m3Data.slice(0x39, 0x1000);
    const m4Body = m4Data.slice(0x39, 0x1000);

    assert.deepStrictEqual(m2Body, m3Body, "M2 and M3 bodies should be identical");
    assert.deepStrictEqual(m3Body, m4Body, "M3 and M4 bodies should be identical");
  });
});

describe("buildSet applies autoReview correctly", () => {
  test("buildSet with autoReview settings", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const settings: SlotSettings[] = [
      { autoReview: "2s" } as SlotSettings,
      { autoReview: "off" } as SlotSettings,
      { autoReview: "off" } as SlotSettings,
      { autoReview: "off" } as SlotSettings,
    ];

    const result = buildSet(baseBytes, settings);

    assert.strictEqual(result.length, 4, "buildSet should return 4 slots");
    for (let i = 0; i < 4; i++) {
      const decoded = decodeDat(result[i].data);
      assert.strictEqual(decoded.autoReview, settings[i].autoReview, `Slot ${i + 1} autoReview mismatch`);
    }
  });
});

describe("invalid values rejected", () => {
  const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
  const baseBytes = new Uint8Array(baseData);

  test("invalid autoReview value rejected", () => {
    assert.throws(
      () => applySettings(baseBytes, 1, { autoReview: "invalid" as any }),
      /Chế độ tự động xem lại không hợp lệ/,
      "Should reject invalid autoReview value"
    );
  });
});

describe("exports are correct", () => {
  test("AUTO_REVIEW export is correct", () => {
    assert.deepStrictEqual(AUTO_REVIEW, ["off", "2s", "5s", "10s"]);
  });
});
