import { test } from "node:test";
import { strict as assert } from "node:assert";
import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, posix } from "path";
import { alphaskillRoot } from "../scripts/knowledge-vault.ts";

const projectRoot = process.cwd();
const alphaskillDir = join(projectRoot, "alphaskill");
const alphaskill = alphaskillRoot(projectRoot);
// The sibling alphaskill repo is not in CI or a fresh clone: this check skips there instead of passing silently.
const siblingSkip = existsSync(alphaskill) ? false : `alphaskill not found at ${alphaskill}; set ALPHASKILL_DIR to run the copy check`;

// Written by sync-alphaskill.ts from data/products.json, so it has no source file to compare against.
const GENERATED = new Set(["references/san-pham-sony.md", "knowledge/san-pham-sony.md"]);

/** Relative posix paths of every file under root. Like `cp -r root/* dst/`, top-level dotfiles are skipped. */
function filesUnder(root: string): string[] {
  const out: string[] = [];
  const walk = (sub: string) => {
    for (const entry of readdirSync(join(root, sub), { withFileTypes: true })) {
      if (sub === "" && entry.name.startsWith(".")) continue;
      const rel = posix.join(sub, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (entry.isFile() && !GENERATED.has(rel)) out.push(rel);
    }
  };
  walk("");
  return out.sort();
}

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

// Runs right after the sync test in this file: the sync rewrites alphaskill/, so it must not run in parallel with a reader.
test("alphaskill: skill and portable copies match the sibling sources", { skip: siblingSkip }, () => {
  const pairs = [
    { name: "skill", source: join(alphaskill, "skills", "sony-alpha-viet"), copy: join(alphaskillDir, "skill") },
    { name: "portable", source: join(alphaskill, "portable"), copy: join(alphaskillDir, "portable") },
  ];
  const problems: string[] = [];
  for (const { name, source, copy } of pairs) {
    if (!existsSync(copy)) {
      problems.push(`${name}: local copy missing, run npm run sync:skill`);
      continue;
    }
    const src = filesUnder(source);
    const dst = filesUnder(copy);
    for (const rel of src) if (!dst.includes(rel)) problems.push(`${name}: missing in copy ${rel}`);
    for (const rel of dst) if (!src.includes(rel)) problems.push(`${name}: not in source ${rel}`);
    for (const rel of src) {
      if (!dst.includes(rel)) continue;
      if (!readFileSync(join(source, rel)).equals(readFileSync(join(copy, rel)))) problems.push(`${name}: differs ${rel}`);
    }
  }
  assert.deepStrictEqual(problems, []);
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
