/**
 * Codec tests for new metering/soft skin/auto review/focus area values — decode and apply from real camera samples.
 * M1: metering=spot-standard, softSkin=low, autoReview=5s, focusArea=flexible-spot-l
 * M2: spot-large, high, 10s (same focus area)
 * M3: entire (metering only)
 * M4: highlight (metering only)
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeDat, applySettings, buildSet, METERING_MODES, SOFT_SKIN, AUTO_REVIEW, FOCUS_AREAS, type SlotSettings } from "../lib/zve10/dat.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures", "values");

const fixtures = [
  { file: "CAMPR01P.DAT", metering: "spot-standard", softSkin: "low", autoReview: "5s", focusArea: "flexible-spot-l" },
  { file: "CAMPR02P.DAT", metering: "spot-large", softSkin: "high", autoReview: "10s", focusArea: "flexible-spot-l" },
  { file: "CAMPR03P.DAT", metering: "entire", softSkin: "high", autoReview: "10s", focusArea: "flexible-spot-l" },
  { file: "CAMPR04P.DAT", metering: "highlight", softSkin: "high", autoReview: "10s", focusArea: "flexible-spot-l" },
];

describe("new values decode from real camera samples", () => {
  for (const fixture of fixtures) {
    test(`decode ${fixture.file}`, () => {
      const data = fs.readFileSync(path.join(FIXTURES_DIR, fixture.file));
      const bytes = new Uint8Array(data);
      const decoded = decodeDat(bytes);

      assert.strictEqual(decoded.metering, fixture.metering, `Expected metering=${fixture.metering}, got ${decoded.metering}`);
      assert.strictEqual(decoded.softSkin, fixture.softSkin, `Expected softSkin=${fixture.softSkin}, got ${decoded.softSkin}`);
      assert.strictEqual(decoded.autoReview, fixture.autoReview, `Expected autoReview=${fixture.autoReview}, got ${decoded.autoReview}`);
      assert.strictEqual(decoded.focusArea, fixture.focusArea, `Expected focusArea=${fixture.focusArea}, got ${decoded.focusArea}`);
    });
  }
});

describe("apply single settings to reproduce next fixture", () => {
  const transitions = [
    { from: fixtures[0], to: fixtures[1], change: "metering: spot-standard → spot-large, softSkin: low → high, autoReview: 5s → 10s" },
    { from: fixtures[1], to: fixtures[2], change: "metering: spot-large → entire" },
    { from: fixtures[2], to: fixtures[3], change: "metering: entire → highlight" },
  ];

  for (const t of transitions) {
    test(`apply ${t.change}`, () => {
      const baseData = fs.readFileSync(path.join(FIXTURES_DIR, t.from.file));
      const targetData = fs.readFileSync(path.join(FIXTURES_DIR, t.to.file));
      const baseBytes = new Uint8Array(baseData);
      const targetBytes = new Uint8Array(targetData);

      const settings = {
        metering: t.to.metering as any,
        softSkin: t.to.softSkin as any,
        autoReview: t.to.autoReview as any,
        focusArea: t.to.focusArea as any,
      };

      const result = applySettings(baseBytes, 1, settings);

      // Compare body (0x39 to 0x0FFF), allowing 0x011D to differ (drifting non-setting byte)
      const resultBody = result.slice(0x39, 0x1000);
      const targetBody = targetBytes.slice(0x39, 0x1000);
      const diffs: number[] = [];
      for (let i = 0; i < resultBody.length; i++) {
        if (resultBody[i] !== targetBody[i]) {
          const offset = 0x39 + i;
          if (offset !== 0x011d) diffs.push(offset);
        }
      }
      assert.strictEqual(diffs.length, 0, `Body bytes differ at offsets: ${diffs.map(o => "0x" + o.toString(16).toUpperCase()).join(", ")} for ${t.change}`);

      // Verify result parses without error (checksum valid)
      const decoded = decodeDat(result);
      assert.strictEqual(decoded.metering, t.to.metering);
      assert.strictEqual(decoded.softSkin, t.to.softSkin);
      assert.strictEqual(decoded.autoReview, t.to.autoReview);
      assert.strictEqual(decoded.focusArea, t.to.focusArea);
    });
  }
});

describe("apply cumulative settings through predecessors", () => {
  test("M2 built from M1 matches M2 fixture", () => {
    const m1Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const m2Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[1].file));
    const m1Bytes = new Uint8Array(m1Data);
    const m2Bytes = new Uint8Array(m2Data);

    const result = applySettings(m1Bytes, 1, {
      metering: "spot-large",
      softSkin: "high",
      autoReview: "10s",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const m2Body = m2Bytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== m2Body[i]) {
        const offset = 0x39 + i;
        if (offset !== 0x011d) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, `M2 built from M1 should match M2 body; diffs at: ${diffs.map(o => "0x" + o.toString(16).toUpperCase()).join(", ")}`);

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.metering, "spot-large");
    assert.strictEqual(decoded.softSkin, "high");
    assert.strictEqual(decoded.autoReview, "10s");
  });

  test("M3 built from M2 matches M3 fixture", () => {
    const m2Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[1].file));
    const m3Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[2].file));
    const m2Bytes = new Uint8Array(m2Data);
    const m3Bytes = new Uint8Array(m3Data);

    const result = applySettings(m2Bytes, 1, {
      metering: "entire",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const m3Body = m3Bytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== m3Body[i]) {
        const offset = 0x39 + i;
        if (offset !== 0x011d) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, `M3 built from M2 should match M3 body; diffs at: ${diffs.map(o => "0x" + o.toString(16).toUpperCase()).join(", ")}`);

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.metering, "entire");
  });

  test("M4 built from M3 matches M4 fixture", () => {
    const m3Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[2].file));
    const m4Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[3].file));
    const m3Bytes = new Uint8Array(m3Data);
    const m4Bytes = new Uint8Array(m4Data);

    const result = applySettings(m3Bytes, 1, {
      metering: "highlight",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const m4Body = m4Bytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== m4Body[i]) {
        const offset = 0x39 + i;
        if (offset !== 0x011d) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, `M4 built from M3 should match M4 body; diffs at: ${diffs.map(o => "0x" + o.toString(16).toUpperCase()).join(", ")}`);

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.metering, "highlight");
  });
});

describe("keep preserves body unchanged", () => {
  test("empty settings {} leaves body unchanged", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const result = applySettings(baseBytes, 1, {});

    const resultBody = result.slice(0x39, 0x1000);
    const baseBody = baseBytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== baseBody[i]) {
        const offset = 0x39 + i;
        if (offset !== 0x011d) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, "Body should not change with empty settings");
  });

  test("explicit keep values leave body unchanged", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const result = applySettings(baseBytes, 1, {
      metering: "keep",
      softSkin: "keep",
      autoReview: "keep",
      focusArea: "keep",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const baseBody = baseBytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== baseBody[i]) {
        const offset = 0x39 + i;
        if (offset !== 0x011d) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, "Body should not change with explicit keep");
  });
});

describe("buildSet applies settings correctly", () => {
  test("buildSet with all new values", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const settings: SlotSettings[] = [
      { metering: "spot-standard", softSkin: "low", autoReview: "5s", focusArea: "flexible-spot-l" } as SlotSettings,
      { metering: "spot-large", softSkin: "high", autoReview: "10s", focusArea: "flexible-spot-l" } as SlotSettings,
      { metering: "entire", softSkin: "high", autoReview: "10s", focusArea: "flexible-spot-l" } as SlotSettings,
      { metering: "highlight", softSkin: "high", autoReview: "10s", focusArea: "flexible-spot-l" } as SlotSettings,
    ];

    const result = buildSet(baseBytes, settings);

    assert.strictEqual(result.length, 4, "buildSet should return 4 slots");
    for (let i = 0; i < 4; i++) {
      const decoded = decodeDat(result[i].data);
      assert.strictEqual(decoded.metering, settings[i].metering, `Slot ${i + 1} metering mismatch`);
      assert.strictEqual(decoded.softSkin, settings[i].softSkin, `Slot ${i + 1} softSkin mismatch`);
      assert.strictEqual(decoded.autoReview, settings[i].autoReview, `Slot ${i + 1} autoReview mismatch`);
      assert.strictEqual(decoded.focusArea, settings[i].focusArea, `Slot ${i + 1} focusArea mismatch`);
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

  test("invalid softSkin value rejected", () => {
    assert.throws(
      () => applySettings(baseBytes, 1, { softSkin: "ultra" as any }),
      /Mức làm mịn da không hợp lệ/,
      "Should reject invalid softSkin value"
    );
  });

  test("invalid autoReview value rejected", () => {
    assert.throws(
      () => applySettings(baseBytes, 1, { autoReview: "15s" as any }),
      /Chế độ tự động xem lại không hợp lệ/,
      "Should reject invalid autoReview value"
    );
  });

  test("invalid focusArea value rejected", () => {
    assert.throws(
      () => applySettings(baseBytes, 1, { focusArea: "unknown" as any }),
      /Vùng lấy nét không hợp lệ/,
      "Should reject invalid focusArea value"
    );
  });
});

describe("exports are correct", () => {
  test("METERING_MODES export includes all new values", () => {
    assert.deepStrictEqual(METERING_MODES, ["multi", "center", "spot-standard", "spot-large", "entire", "highlight"]);
  });

  test("SOFT_SKIN export includes all new values", () => {
    assert.deepStrictEqual(SOFT_SKIN, ["off", "low", "mid", "high"]);
  });

  test("AUTO_REVIEW export includes all new values", () => {
    assert.deepStrictEqual(AUTO_REVIEW, ["off", "2s", "5s", "10s"]);
  });

  test("FOCUS_AREAS export includes flexible-spot-l", () => {
    assert(FOCUS_AREAS.includes("flexible-spot-l"), "FOCUS_AREAS should include flexible-spot-l");
    assert(FOCUS_AREAS.includes("tracking-flexible-spot-l"), "FOCUS_AREAS should include tracking-flexible-spot-l");
  });
});
