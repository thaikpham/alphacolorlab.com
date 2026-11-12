import { test } from "node:test";
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { alphaskillRoot, hashNotes, notesDir } from "../scripts/knowledge-vault.ts";

const projectRoot = process.cwd();
const alphaskill = alphaskillRoot(projectRoot);
// The sibling alphaskill repo is not in CI or a fresh clone: both checks skip there instead of passing silently.
const skip = existsSync(alphaskill) ? false : `alphaskill not found at ${alphaskill}; set ALPHASKILL_DIR to run drift checks`;

test("knowledge drift", async (t) => {
  await t.test("vault notes match data/knowledge.lock.json", { skip }, () => {
    const lockPath = join(projectRoot, "data/knowledge.lock.json");
    assert.ok(existsSync(lockPath), "data/knowledge.lock.json is missing: run node --experimental-strip-types scripts/import-knowledge.ts");
    const lock = JSON.parse(readFileSync(lockPath, "utf-8"));
    const now = hashNotes(notesDir(alphaskill));
    assert.strictEqual(
      now.sha256,
      lock.vaultSha256,
      `vault changed since the last import (${now.noteFiles} notes now, ${lock.noteFiles} at lock): run node --experimental-strip-types scripts/import-knowledge.ts`,
    );
  });
});
