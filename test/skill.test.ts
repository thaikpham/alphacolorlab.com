import { test } from "node:test";
import { strict as assert } from "node:assert";
import { execSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const projectRoot = process.cwd();
const alphaskillDir = join(projectRoot, "alphaskill");

test("alphaskill: sync-alphaskill creates necessary files", () => {
  // Run sync script
  execSync("node --experimental-strip-types scripts/sync-alphaskill.ts", {
    cwd: projectRoot,
    stdio: "inherit",
  });

  // Check for required files
  const requiredFiles = [
    "skill/SKILL.md",
    "portable/system-prompt.md",
    "skill/references/san-pham-sony.md",
    "portable/knowledge/san-pham-sony.md",
  ];

  for (const file of requiredFiles) {
    const path = join(alphaskillDir, file);
    assert.ok(readFileSync(path, "utf-8").length > 0, `${file} should exist and not be empty`);
  }
});

test("alphaskill: no file comes from data/ folder", () => {
  const forbiddenPaths = ["data/", "data-sample/", "src/", "api/"];
  let violatingFiles: string[] = [];

  function walk(dir: string, prefix = ""): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (forbiddenPaths.some((p) => (prefix + entry.name).includes(p))) {
        violatingFiles.push(prefix + entry.name);
      }
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, prefix + entry.name + "/");
      }
    }
  }

  walk(alphaskillDir);
  assert.equal(violatingFiles.length, 0, `No files from forbidden paths allowed: ${violatingFiles.join(", ")}`);
});

test("alphaskill: san-pham-sony.md contains product data and help guides", () => {
  const sanPhamPath = join(alphaskillDir, "skill/references/san-pham-sony.md");
  const content = readFileSync(sanPhamPath, "utf-8");

  // Check for key sections
  assert.ok(content.includes("## Máy ảnh"), "Should have camera section");
  assert.ok(content.includes("## Hướng dẫn chính thức"), "Should have help guide section");

  // Check for model help guides
  const helpGuides = [
    "helpguide.sony.net/ilc/2070", // ZV-E10
    "helpguide.sony.net/ilc/1810", // A6400
    "helpguide.sony.net/ilc/2360", // A7C II
  ];

  for (const guide of helpGuides) {
    assert.ok(content.includes(guide), `Should include ${guide}`);
  }
});

test("alphaskill: all files exist in alphaskill/", () => {
  assert.ok(readdirSync(alphaskillDir).length > 0, "alphaskill directory should not be empty");

  const dirs = readdirSync(alphaskillDir, { withFileTypes: true }).filter((e) => e.isDirectory());
  const dirNames = dirs.map((d) => d.name);

  assert.ok(dirNames.includes("skill"), "Should have skill directory");
  assert.ok(dirNames.includes("portable"), "Should have portable directory");
});

test("alphaskill: total module size is reasonable", () => {
  let totalSize = 0;

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isFile()) {
        totalSize += statSync(fullPath).size;
      } else if (entry.isDirectory()) {
        walk(fullPath);
      }
    }
  }

  walk(alphaskillDir);

  // Module should be between 100 KB and 500 KB
  const sizeInKB = totalSize / 1024;
  assert.ok(sizeInKB >= 100, `Module too small: ${sizeInKB.toFixed(1)} KB`);
  assert.ok(sizeInKB <= 500, `Module too large: ${sizeInKB.toFixed(1)} KB`);
});
