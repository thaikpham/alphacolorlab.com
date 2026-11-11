/**
 * ZIP writer tests — format, headers, and unzip compatibility.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { makeZip } from "../lib/zve10/zip.ts";

describe("makeZip - format validation", () => {
  test("output starts with PK magic", () => {
    const zip = makeZip([
      { path: "test.txt", data: new TextEncoder().encode("hello") },
    ]);
    const magic = String.fromCharCode(zip[0], zip[1]);
    assert.strictEqual(magic, "PK");
  });

  test("output contains local header", () => {
    const zip = makeZip([
      { path: "test.txt", data: new TextEncoder().encode("hello") },
    ]);
    // Look for 0x04034b50 (PK\03\04)
    const dv = new DataView(zip.buffer);
    assert.strictEqual(dv.getUint32(0, true), 0x04034b50);
  });

  test("output contains central directory", () => {
    const zip = makeZip([
      { path: "test.txt", data: new TextEncoder().encode("hello") },
      { path: "test2.txt", data: new TextEncoder().encode("world") },
    ]);
    // Look for 0x02014b50 (PK\01\02)
    let found = false;
    const dv = new DataView(zip.buffer);
    for (let i = 0; i < zip.length - 4; i++) {
      if (dv.getUint32(i, true) === 0x02014b50) {
        found = true;
        break;
      }
    }
    assert(found);
  });

  test("unzip accepts output", () => {
    const zip = makeZip([
      { path: "file1.txt", data: new TextEncoder().encode("content1") },
      { path: "file2.txt", data: new TextEncoder().encode("content2") },
    ]);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "zv-e10-zip-"));
    const zipFile = path.join(tmpDir, "test.zip");
    try {
      fs.writeFileSync(zipFile, zip);
      const result = execSync(`unzip -t "${zipFile}"`, {
        encoding: "utf-8",
      });
      assert(result.includes("OK"));
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

test("makeZip empty", () => {
  const zip = makeZip([]);
  assert(zip.length > 0); // At least EOCD
});

test("makeZip multiple files", () => {
  const entries = [
    { path: "a.txt", data: new TextEncoder().encode("aaa") },
    { path: "b.txt", data: new TextEncoder().encode("bbb") },
    { path: "c.txt", data: new TextEncoder().encode("ccc") },
  ];
  const zip = makeZip(entries);
  assert(zip.length > 0);
  // Verify starts with PK\03\04
  assert.strictEqual(zip[0], 0x50); // P
  assert.strictEqual(zip[1], 0x4b); // K
  assert.strictEqual(zip[2], 0x03);
  assert.strictEqual(zip[3], 0x04);
});
