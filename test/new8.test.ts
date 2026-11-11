/**
 * Codec tests for new Camera Set Memory settings — decode and apply from real camera samples.
 * M1: flashMode=fill-flash, expCompSet=ambient-only, awbPriority=standard, preAF=off, steadyShot=on, eFrontCurtain=off, liveView=setting-effect-off
 * M2: rear-sync, ambient-only, ambience, on, on, off, setting-effect-on
 * M3: slow-sync, ambient-flash, white, off, on, on, setting-effect-on
 * M4: rear-sync, ambient-only, white, on, off, on, setting-effect-on
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeDat, applySettings, buildSet, FLASH_MODES, EXP_COMP_SETS, AWB_PRIORITIES, PRE_AF, STEADY_SHOT, E_FRONT_CURTAIN, LIVE_VIEW, type SlotSettings } from "../lib/zve10/dat.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures", "new8");

const fixtures = [
  { file: "CAMPR01P.DAT", flashMode: "fill-flash", expCompSet: "ambient-only", awbPriority: "standard", preAF: "off", steadyShot: "on", eFrontCurtain: "off", liveView: "setting-effect-off" },
  { file: "CAMPR02P.DAT", flashMode: "rear-sync", expCompSet: "ambient-only", awbPriority: "ambience", preAF: "on", steadyShot: "on", eFrontCurtain: "off", liveView: "setting-effect-on" },
  { file: "CAMPR03P.DAT", flashMode: "slow-sync", expCompSet: "ambient-flash", awbPriority: "white", preAF: "off", steadyShot: "on", eFrontCurtain: "on", liveView: "setting-effect-on" },
  { file: "CAMPR04P.DAT", flashMode: "rear-sync", expCompSet: "ambient-only", awbPriority: "white", preAF: "on", steadyShot: "off", eFrontCurtain: "on", liveView: "setting-effect-on" },
];

describe("new settings decode from real camera samples", () => {
  for (const fixture of fixtures) {
    test(`decode ${fixture.file}`, () => {
      const data = fs.readFileSync(path.join(FIXTURES_DIR, fixture.file));
      const bytes = new Uint8Array(data);
      const decoded = decodeDat(bytes);

      assert.strictEqual(decoded.flashMode, fixture.flashMode, `Expected flashMode=${fixture.flashMode}, got ${decoded.flashMode}`);
      assert.strictEqual(decoded.expCompSet, fixture.expCompSet, `Expected expCompSet=${fixture.expCompSet}, got ${decoded.expCompSet}`);
      assert.strictEqual(decoded.awbPriority, fixture.awbPriority, `Expected awbPriority=${fixture.awbPriority}, got ${decoded.awbPriority}`);
      assert.strictEqual(decoded.preAF, fixture.preAF, `Expected preAF=${fixture.preAF}, got ${decoded.preAF}`);
      assert.strictEqual(decoded.steadyShot, fixture.steadyShot, `Expected steadyShot=${fixture.steadyShot}, got ${decoded.steadyShot}`);
      assert.strictEqual(decoded.eFrontCurtain, fixture.eFrontCurtain, `Expected eFrontCurtain=${fixture.eFrontCurtain}, got ${decoded.eFrontCurtain}`);
      assert.strictEqual(decoded.liveView, fixture.liveView, `Expected liveView=${fixture.liveView}, got ${decoded.liveView}`);
    });
  }
});

describe("apply single settings to reproduce next fixture", () => {
  const transitions = [
    { from: fixtures[0], to: fixtures[1], change: "M1→M2: flashMode, awbPriority, preAF, liveView" },
    { from: fixtures[1], to: fixtures[2], change: "M2→M3: flashMode, expCompSet, awbPriority, preAF, eFrontCurtain, liveView" },
    { from: fixtures[2], to: fixtures[3], change: "M3→M4: flashMode, expCompSet, awbPriority, preAF, steadyShot, eFrontCurtain" },
  ];

  for (const t of transitions) {
    test(`apply ${t.change}`, () => {
      const baseData = fs.readFileSync(path.join(FIXTURES_DIR, t.from.file));
      const targetData = fs.readFileSync(path.join(FIXTURES_DIR, t.to.file));
      const baseBytes = new Uint8Array(baseData);
      const targetBytes = new Uint8Array(targetData);

      const settings = {
        flashMode: t.to.flashMode as any,
        expCompSet: t.to.expCompSet as any,
        awbPriority: t.to.awbPriority as any,
        preAF: t.to.preAF as any,
        steadyShot: t.to.steadyShot as any,
        eFrontCurtain: t.to.eFrontCurtain as any,
        liveView: t.to.liveView as any,
      };

      const result = applySettings(baseBytes, 1, settings);

      // Compare body (0x39 to 0x0FFF), allowing 0x011D/0x011E (drift) and 0x0180 (mode) and exposure bytes to differ
      const resultBody = result.slice(0x39, 0x1000);
      const targetBody = targetBytes.slice(0x39, 0x1000);
      const diffs: number[] = [];
      for (let i = 0; i < resultBody.length; i++) {
        if (resultBody[i] !== targetBody[i]) {
          const offset = 0x39 + i;
          if (![0x011d, 0x011e, 0x0180, 0x014f, 0x0151].includes(offset)) diffs.push(offset);
        }
      }
      assert.strictEqual(diffs.length, 0, `Body bytes differ at offsets: ${diffs.map(o => "0x" + o.toString(16).toUpperCase()).join(", ")} for ${t.change}`);

      // Verify result parses without error (checksum valid)
      const decoded = decodeDat(result);
      assert.strictEqual(decoded.flashMode, t.to.flashMode);
      assert.strictEqual(decoded.expCompSet, t.to.expCompSet);
      assert.strictEqual(decoded.awbPriority, t.to.awbPriority);
      assert.strictEqual(decoded.preAF, t.to.preAF);
      assert.strictEqual(decoded.steadyShot, t.to.steadyShot);
      assert.strictEqual(decoded.eFrontCurtain, t.to.eFrontCurtain);
      assert.strictEqual(decoded.liveView, t.to.liveView);
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
      flashMode: "rear-sync",
      awbPriority: "ambience",
      preAF: "on",
      liveView: "setting-effect-on",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const m2Body = m2Bytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== m2Body[i]) {
        const offset = 0x39 + i;
        if (![0x011d, 0x011e, 0x0180, 0x014f, 0x0151].includes(offset)) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, `M1→M2: Body bytes differ at offsets: ${diffs.map(o => "0x" + o.toString(16).toUpperCase()).join(", ")}`);

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.flashMode, "rear-sync");
    assert.strictEqual(decoded.awbPriority, "ambience");
    assert.strictEqual(decoded.preAF, "on");
    assert.strictEqual(decoded.liveView, "setting-effect-on");
  });

  test("M3 built from M2 matches M3 fixture", () => {
    const m2Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[1].file));
    const m3Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[2].file));
    const m2Bytes = new Uint8Array(m2Data);
    const m3Bytes = new Uint8Array(m3Data);

    const result = applySettings(m2Bytes, 1, {
      flashMode: "slow-sync",
      expCompSet: "ambient-flash",
      awbPriority: "white",
      preAF: "off",
      eFrontCurtain: "on",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const m3Body = m3Bytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== m3Body[i]) {
        const offset = 0x39 + i;
        if (![0x011d, 0x011e, 0x0180, 0x014f, 0x0151].includes(offset)) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, `M2→M3: Body bytes differ at offsets: ${diffs.map(o => "0x" + o.toString(16).toUpperCase()).join(", ")}`);

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.flashMode, "slow-sync");
    assert.strictEqual(decoded.expCompSet, "ambient-flash");
    assert.strictEqual(decoded.awbPriority, "white");
    assert.strictEqual(decoded.preAF, "off");
    assert.strictEqual(decoded.eFrontCurtain, "on");
  });

  test("M4 built from M3 matches M4 fixture", () => {
    const m3Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[2].file));
    const m4Data = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[3].file));
    const m3Bytes = new Uint8Array(m3Data);
    const m4Bytes = new Uint8Array(m4Data);

    const result = applySettings(m3Bytes, 1, {
      flashMode: "rear-sync",
      expCompSet: "ambient-only",
      awbPriority: "white",
      preAF: "on",
      steadyShot: "off",
    });

    const resultBody = result.slice(0x39, 0x1000);
    const m4Body = m4Bytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== m4Body[i]) {
        const offset = 0x39 + i;
        if (![0x011d, 0x011e, 0x0180, 0x014f, 0x0151].includes(offset)) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, `M3→M4: Body bytes differ at offsets: ${diffs.map(o => "0x" + o.toString(16).toUpperCase()).join(", ")}`);

    const decoded = decodeDat(result);
    assert.strictEqual(decoded.flashMode, "rear-sync");
    assert.strictEqual(decoded.expCompSet, "ambient-only");
    assert.strictEqual(decoded.awbPriority, "white");
    assert.strictEqual(decoded.preAF, "on");
    assert.strictEqual(decoded.steadyShot, "off");
  });
});

describe("keep preserves settings unchanged", () => {
  test("empty settings {} leaves all settings unchanged", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const result = applySettings(baseBytes, 1, {});

    const resultBody = result.slice(0x39, 0x1000);
    const baseBody = baseBytes.slice(0x39, 0x1000);
    const diffs: number[] = [];
    for (let i = 0; i < resultBody.length; i++) {
      if (resultBody[i] !== baseBody[i]) {
        const offset = 0x39 + i;
        if (![0x011d, 0x011e, 0x0180, 0x014f, 0x0151].includes(offset)) diffs.push(offset);
      }
    }
    assert.strictEqual(diffs.length, 0, `Body should not change with empty settings`);
  });
});

describe("buildSet applies all settings correctly", () => {
  test("buildSet with M1–M4 settings", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    const settings: SlotSettings[] = [
      { flashMode: "fill-flash", expCompSet: "ambient-only", awbPriority: "standard", preAF: "off", steadyShot: "on", eFrontCurtain: "off", liveView: "setting-effect-off" },
      { flashMode: "rear-sync", expCompSet: "ambient-only", awbPriority: "ambience", preAF: "on", steadyShot: "on", eFrontCurtain: "off", liveView: "setting-effect-on" },
      { flashMode: "slow-sync", expCompSet: "ambient-flash", awbPriority: "white", preAF: "off", steadyShot: "on", eFrontCurtain: "on", liveView: "setting-effect-on" },
      { flashMode: "rear-sync", expCompSet: "ambient-only", awbPriority: "white", preAF: "on", steadyShot: "off", eFrontCurtain: "on", liveView: "setting-effect-on" },
    ];

    const result = buildSet(baseBytes, settings);

    assert.strictEqual(result.length, 4, "buildSet should return 4 slots");
    for (let i = 0; i < 4; i++) {
      const decoded = decodeDat(result[i].data);
      assert.strictEqual(decoded.flashMode, settings[i].flashMode, `Slot ${i + 1} flashMode mismatch`);
      assert.strictEqual(decoded.expCompSet, settings[i].expCompSet, `Slot ${i + 1} expCompSet mismatch`);
      assert.strictEqual(decoded.awbPriority, settings[i].awbPriority, `Slot ${i + 1} awbPriority mismatch`);
      assert.strictEqual(decoded.preAF, settings[i].preAF, `Slot ${i + 1} preAF mismatch`);
      assert.strictEqual(decoded.steadyShot, settings[i].steadyShot, `Slot ${i + 1} steadyShot mismatch`);
      assert.strictEqual(decoded.eFrontCurtain, settings[i].eFrontCurtain, `Slot ${i + 1} eFrontCurtain mismatch`);
      assert.strictEqual(decoded.liveView, settings[i].liveView, `Slot ${i + 1} liveView mismatch`);
    }
  });
});

describe("checksum validates", () => {
  test("all applied settings produce valid checksums", () => {
    const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
    const baseBytes = new Uint8Array(baseData);

    for (const fixture of fixtures) {
      const result = applySettings(baseBytes, 1, {
        flashMode: fixture.flashMode as any,
        expCompSet: fixture.expCompSet as any,
        awbPriority: fixture.awbPriority as any,
        preAF: fixture.preAF as any,
        steadyShot: fixture.steadyShot as any,
        eFrontCurtain: fixture.eFrontCurtain as any,
        liveView: fixture.liveView as any,
      });

      assert.doesNotThrow(() => decodeDat(result), `Checksum should validate for ${fixture.file}`);
    }
  });
});

describe("exports are correct", () => {
  test("all exports are defined", () => {
    assert.deepStrictEqual(FLASH_MODES, ["fill-flash", "rear-sync", "slow-sync"]);
    assert.deepStrictEqual(EXP_COMP_SETS, ["ambient-only", "ambient-flash"]);
    assert.deepStrictEqual(AWB_PRIORITIES, ["standard", "ambience", "white"]);
    assert.deepStrictEqual(PRE_AF, ["off", "on"]);
    assert.deepStrictEqual(STEADY_SHOT, ["off", "on"]);
    assert.deepStrictEqual(E_FRONT_CURTAIN, ["off", "on"]);
    assert.deepStrictEqual(LIVE_VIEW, ["setting-effect-on", "setting-effect-off"]);
  });
});
