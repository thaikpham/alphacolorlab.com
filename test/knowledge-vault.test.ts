import { test } from "node:test";
import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { alphaskillRoot, hashNotes } from "../scripts/knowledge-vault.ts";

/** Writes a throwaway vault from { "relative/path.md": body } and returns its directory. */
function makeVault(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "knowledge-vault-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

test("knowledge-vault", async (t) => {
  await t.test("alphaskillRoot defaults to ../alphaskill and honours ALPHASKILL_DIR", () => {
    assert.strictEqual(alphaskillRoot("/work/AlphaColorLab", {}), resolve("/work/alphaskill"));
    assert.strictEqual(
      alphaskillRoot("/work/AlphaColorLab", { ALPHASKILL_DIR: "/elsewhere/alphaskill" }),
      resolve("/elsewhere/alphaskill"),
    );
  });

  await t.test("hashNotes ignores file creation order", (st) => {
    const a = makeVault({ "s1/a.md": "x", "s2/b.md": "y" });
    const b = makeVault({ "s2/b.md": "y", "s1/a.md": "x" });
    st.after(() => {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    });
    assert.deepStrictEqual(hashNotes(a), hashNotes(b));
    assert.strictEqual(hashNotes(a).noteFiles, 2);
  });

  await t.test("hashNotes ignores non-note files and changes with content or path", (st) => {
    const dir = makeVault({ "s1/a.md": "x", "s2/b.md": "y" });
    st.after(() => rmSync(dir, { recursive: true, force: true }));
    const base = hashNotes(dir).sha256;

    writeFileSync(join(dir, "s1/notes.txt"), "not a note");
    assert.strictEqual(hashNotes(dir).sha256, base, "non-.md files must not change the hash");

    writeFileSync(join(dir, "s1/a.md"), "x2");
    assert.notStrictEqual(hashNotes(dir).sha256, base, "content change must change the hash");

    writeFileSync(join(dir, "s1/a.md"), "x");
    rmSync(join(dir, "s2/b.md"));
    writeFileSync(join(dir, "s3-moved.md"), "y");
    assert.notStrictEqual(hashNotes(dir).sha256, base, "a moved note must change the hash");
  });
});
