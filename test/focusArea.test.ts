/**
 * Focus Area codec tests — apply and decode from real camera samples.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeDat, applySettings, FOCUS_AREAS } from "../lib/zve10/dat.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures", "focus-area");

const fixtures = [
  { file: "CAMPR01P.DAT", focusArea: "wide" },
  { file: "CAMPR02P.DAT", focusArea: "zone" },
  { file: "CAMPR03P.DAT", focusArea: "tracking-zone" },
  { file: "CAMPR04P.DAT", focusArea: "tracking-flexible-spot-l" },
];

describe("focusArea decode from real camera samples", () => {
  for (const fixture of fixtures) {
    test(`decode ${fixture.file} as ${fixture.focusArea}`, () => {
      const data = fs.readFileSync(path.join(FIXTURES_DIR, fixture.file));
      const bytes = new Uint8Array(data);
      const decoded = decodeDat(bytes);

      assert.strictEqual(decoded.focusArea, fixture.focusArea, `Expected ${fixture.focusArea}, got ${decoded.focusArea}`);
    });
  }
});

describe("focusArea apply settings", () => {
  const pairs: Array<{ from: typeof fixtures[0]; to: typeof fixtures[0]; id: string }> = [];
  for (let i = 0; i < fixtures.length; i++) {
    for (let j = 0; j < fixtures.length; j++) {
      if (i !== j) {
        pairs.push({ from: fixtures[i], to: fixtures[j], id: `${fixtures[i].focusArea} → ${fixtures[j].focusArea}` });
      }
    }
  }

  for (const pair of pairs) {
    test(`apply ${pair.id}`, () => {
      const baseData = fs.readFileSync(path.join(FIXTURES_DIR, pair.from.file));
      const targetData = fs.readFileSync(path.join(FIXTURES_DIR, pair.to.file));
      const baseBytes = new Uint8Array(baseData);
      const targetBytes = new Uint8Array(targetData);

      // Apply focusArea setting with AF-C
      const result = applySettings(baseBytes, 1, {
        focusArea: pair.to.focusArea as any,
        focus: "AF-C",
      });

      // Compare body (0x39 to 0x0FFF)
      const resultBody = result.slice(0x39, 0x1000);
      const targetBody = targetBytes.slice(0x39, 0x1000);
      assert.deepStrictEqual(resultBody, targetBody, `Body bytes don't match for ${pair.id}`);

      // Verify result parses without error (checksum valid)
      const decoded = decodeDat(result);
      assert.strictEqual(decoded.focusArea, pair.to.focusArea);
    });
  }
});

test("focusArea tracking requires AF-C", () => {
  const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
  const baseBytes = new Uint8Array(baseData);

  assert.throws(
    () => applySettings(baseBytes, 1, { focusArea: "tracking-zone", focus: "AF-S" }),
    /Theo dõi chỉ dùng được với AF-C/,
    "Should reject tracking-zone with AF-S"
  );
});

test("focusArea keep leaves body unchanged", () => {
  const baseData = fs.readFileSync(path.join(FIXTURES_DIR, fixtures[0].file));
  const baseBytes = new Uint8Array(baseData);

  const result = applySettings(baseBytes, 1, { focusArea: "keep" });

  // Compare body (0x39 to 0x0FFF)
  const resultBody = result.slice(0x39, 0x1000);
  const baseBody = baseBytes.slice(0x39, 0x1000);
  assert.deepStrictEqual(resultBody, baseBody, "Body should not change with focusArea: keep");
});

test("FOCUS_AREAS export is correct", () => {
  assert.deepStrictEqual(FOCUS_AREAS, ["wide", "zone", "flexible-spot-l", "tracking-zone", "tracking-flexible-spot-l"]);
});
