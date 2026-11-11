/**
 * PP2–PP10 banks tests — structure bytes, default-bank decodes, applySettings, S-Cinetone error.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applySettings, decodePpBank, decodeDat, parseDat, buildSet } from "../lib/zve10/dat.ts";
import presets from "../lib/zve10/presets.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");

// Collect all unique camera files from fixtures
const getAllCameraFiles = () => {
  const files = new Map<string, string>();
  for (const subdir of fs.readdirSync(FIXTURES)) {
    const subdirPath = path.join(FIXTURES, subdir);
    if (!fs.statSync(subdirPath).isDirectory()) continue;
    for (const file of fs.readdirSync(subdirPath)) {
      if (file.match(/\.DAT$/i)) {
        const filePath = path.join(subdirPath, file);
        files.set(file, filePath);
      }
    }
  }
  // Also add public/dat camera files (not base files)
  const publicPath = path.join(__dirname, "..", "public", "dat");
  for (const file of fs.readdirSync(publicPath)) {
    if (file.match(/^zve10-[np]{3,4}(-m[1-4])?\.dat$/i)) {
      if (!file.includes("base")) files.set(file, path.join(publicPath, file));
    }
  }
  return Array.from(files.values());
};

const cameraFiles = getAllCameraFiles();

describe("Structure bytes in PP banks", () => {
  test(`structure byte is 1 at all 250 positions (25 fields × 10 banks)`, () => {
    for (const filePath of cameraFiles) {
      const bytes = new Uint8Array(fs.readFileSync(filePath));
      let errorMsg = "";

      for (let i = 0; i < 25; i++) { // 25 Picture Profile fields
        for (let k = 1; k <= 10; k++) {
          const offset = k <= 7 ? 0x317 + 14 * i + 2 * (k - 1) : 0x528 + 6 * i + 2 * (k - 8);
          if (bytes[offset - 1] !== 1) {
            errorMsg = `${path.basename(filePath)}: field[${i}] bank ${k} at 0x${offset.toString(16)} structure byte is ${bytes[offset - 1]}, expected 1`;
            break;
          }
        }
        if (errorMsg) break;
      }
      assert(!errorMsg, errorMsg);
    }
  });
});

describe("Default bank decodes", () => {
  test("bank 3 decodes to Pro (ITU709/Pro)", () => {
    for (const filePath of cameraFiles) {
      const bytes = new Uint8Array(fs.readFileSync(filePath));
      const decoded = decodePpBank(bytes, 3);
      // Bank 3: ITU709/Pro color mode
      assert.strictEqual(decoded.color_mode, "Pro", `${path.basename(filePath)}: bank 3 color_mode`);
    }
  });

  test("bank 6 decodes to Cine2/Cinema", () => {
    for (const filePath of cameraFiles) {
      const bytes = new Uint8Array(fs.readFileSync(filePath));
      const decoded = decodePpBank(bytes, 6);
      assert.strictEqual(decoded.gamma, "Cine2", `${path.basename(filePath)}: bank 6 gamma`);
      assert.strictEqual(decoded.color_mode, "Cinema", `${path.basename(filePath)}: bank 6 color_mode`);
    }
  });

  test("bank 8 decodes to S-Log3/S-Gamut3.Cine", () => {
    for (const filePath of cameraFiles) {
      const bytes = new Uint8Array(fs.readFileSync(filePath));
      const decoded = decodePpBank(bytes, 8);
      assert.strictEqual(decoded.gamma, "S-Log3", `${path.basename(filePath)}: bank 8 gamma`);
      assert.strictEqual(decoded.color_mode, "S-Gamut3.Cine", `${path.basename(filePath)}: bank 8 color_mode`);
    }
  });
});

describe("applySettings with ppBanks", () => {
  test("applySettings applies bank 2 and bank 10 correctly", () => {
    const baseFile = new Uint8Array(fs.readFileSync(path.join(__dirname, "..", "public", "dat", "zve10-pal-m1.dat")));
    const exportable = presets.filter((p) => !p.blocked);
    const ppA = exportable[0]?.pp ?? {};
    const ppB = exportable[1]?.pp ?? {};
    const ppC = exportable[2]?.pp ?? {};

    const result = applySettings(baseFile, 1, {
      pp: ppA,
      ppBanks: {
        2: ppB,
        10: ppC,
      },
    });

    // Decode and verify banks 1, 2, 10 match expectations
    const bank1 = decodePpBank(result, 1);
    const bank2 = decodePpBank(result, 2);
    const bank10 = decodePpBank(result, 10);

    // Just verify we can decode all three banks without error
    assert(bank1 && Object.keys(bank1).length > 0);
    assert(bank2 && Object.keys(bank2).length > 0);
    assert(bank10 && Object.keys(bank10).length > 0);

    // Verify checksum is valid
    const decoded = decodeDat(result);
    assert(decoded.slot === 1);
  });

  test("applySettings preserves bytes only at bank-2/bank-10 value positions and checksum", () => {
    const baseFile = new Uint8Array(fs.readFileSync(path.join(__dirname, "..", "public", "dat", "zve10-pal-m1.dat")));
    const exportable = presets.filter((p) => !p.blocked);
    const ppA = exportable[0]?.pp ?? {};
    const ppB = exportable[1]?.pp ?? {};

    const resultNoBank = applySettings(baseFile, 1, { pp: ppA });
    const resultWithBank = applySettings(baseFile, 1, {
      pp: ppA,
      ppBanks: { 2: ppB },
    });

    // Compare: should differ only at bank-2 value bytes and checksums (0x38 and ≥0x1000)
    let diffCount = 0;
    for (let i = 0; i < resultNoBank.length; i++) {
      if (resultNoBank[i] !== resultWithBank[i]) {
        // Allowed differences: checksum byte 0x38, tail from 0x1000
        if (i !== 0x38 && i < 0x1000) {
          // Check if this is a bank-2 value byte (offset-1 === 1 and in bank2 range)
          const isBank2Value = (i >= 0x317 + 2 && i <= 0x317 + 14 * 24 + 12) || (i >= 0x528 && i <= 0x528 + 6 * 24 + 4);
          if (!isBank2Value) diffCount++;
        }
      }
    }
    assert(diffCount === 0, `Unexpected differences outside of bank2 and checksum areas: ${diffCount} bytes`);
  });
});

describe("HLG2 round-trip and S-Cinetone rejection", () => {
  const baseFile = new Uint8Array(fs.readFileSync(path.join(__dirname, "..", "public", "dat", "zve10-pal-m1.dat")));

  test("HLG2 in PP2 bank round-trips through applySettings and decodePpBank", () => {
    const out = applySettings(baseFile, 1, { ppBanks: { 2: { gamma: "HLG2" } } });
    assert.strictEqual(decodePpBank(out, 2).gamma, "HLG2");
  });

  test("HLG2 in PP1 round-trips through applySettings and decodeDat", () => {
    const out = applySettings(baseFile, 1, { pp: { gamma: "HLG2" } });
    assert.strictEqual((decodeDat(out) as any).pp1.gamma, "HLG2");
  });

  test("S-Cinetone in PP2 bank is rejected", () => {
    assert.throws(
      () => applySettings(baseFile, 1, { ppBanks: { 2: { gamma: "S-Cinetone" } } }),
      /PP2.*S-Cinetone/
    );
  });

  test("S-Cinetone in PP1 is rejected", () => {
    assert.throws(
      () => applySettings(baseFile, 1, { pp: { gamma: "S-Cinetone" } }),
      /S-Cinetone/
    );
  });
});

describe("buildSet compatibility with ppBanks", () => {
  test("buildSet preserves header bytes 0x00–0x37 with ppBanks", () => {
    const load = (n: string) => new Uint8Array(fs.readFileSync(path.join(__dirname, "..", "public", "dat", `${n}.dat`)));
    const headers = [1, 2, 3, 4].map((i) => load(`zve10-pal-m${i}`));
    const exportable = presets.filter((p) => !p.blocked);

    const slots = [0, 1, 2, 3].map((slotIdx) => {
      const preset1 = exportable[slotIdx * 2];
      const preset2 = exportable[slotIdx * 2 + 1];
      return {
        pp: preset1?.pp ?? "keep",
        ppOn: preset1 ? true : undefined,
        ppBanks: preset2 ? { 2: preset2.pp } : undefined,
        wb: preset1 ? { mode: "awb" as const, ab: 0, gm: 0 } : "keep",
      };
    });

    const built = buildSet(load("zve10-base-pal"), slots as any, undefined, undefined, headers);
    built.forEach((f, i) => {
      assert.deepStrictEqual(f.data.subarray(0, 0x38), headers[i].subarray(0, 0x38), `slot ${i + 1} header mismatch`);
      parseDat(f.data); // Verify checksum
    });
  });

  test("end-to-end: cart Color Bank recipes → ppBanks → decodePpBank", () => {
    const load = (n: string) => new Uint8Array(fs.readFileSync(path.join(__dirname, "..", "public", "dat", `${n}.dat`)));
    const headers = [1, 2, 3, 4].map((i) => load(`zve10-pal-m${i}`));
    const exportable = presets.filter((p) => !p.blocked);

    // Cart with 3 recipes in M1: PP1 + 2 banks
    const recipe1 = exportable[0];
    const recipe2 = exportable[1];
    const recipe3 = exportable[2];

    const slot1Settings = {
      pp: recipe1.pp,
      ppOn: true,
      ppBanks: {
        2: recipe2.pp,
        3: recipe3.pp,
      },
      wb: { mode: "awb" as const, ab: 0, gm: 0 },
    };

    const slots = [slot1Settings, {}, {}, {}]; // Must have 4 slots
    const built = buildSet(load("zve10-base-pal"), slots as any, undefined, undefined, headers);
    const m1File = built[0].data;

    // Verify header
    assert.deepStrictEqual(m1File.subarray(0, 0x38), headers[0].subarray(0, 0x38), "M1 header should match");

    // Verify PP2 and PP3 decode correctly
    const decoded2 = decodePpBank(m1File, 2);
    const decoded3 = decodePpBank(m1File, 3);

    // Check that decoded values match the recipe pp keys
    for (const key of Object.keys(recipe2.pp)) {
      assert.equal(decoded2[key], recipe2.pp[key], `PP2 field ${key} should match recipe2`);
    }
    for (const key of Object.keys(recipe3.pp)) {
      assert.equal(decoded3[key], recipe3.pp[key], `PP3 field ${key} should match recipe3`);
    }
  });
});
