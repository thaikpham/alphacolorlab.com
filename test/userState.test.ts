import { test } from "node:test";
import assert from "node:assert/strict";
import { plan, SYNCED } from "../lib/userState.ts";

test("user state: the newer side wins as a whole", () => {
  assert.equal(plan(0, null), "none", "nothing local, nothing stored");
  assert.equal(plan(5, null), "push", "first sign-in uploads what this device did");
  assert.equal(plan(0, 9), "pull", "a fresh device takes the account's state");
  assert.equal(plan(5, 9), "pull");
  assert.equal(plan(9, 5), "push");
  assert.equal(plan(7, 7), "none");
});

test("user state: synced keys are the stores' own localStorage keys and events", async () => {
  const sources = await Promise.all(["cart", "compare", "gear", "profile", "model", "savedSets", "ppMods", "usePersonal"].map((f) => import("node:fs").then((fs) => fs.readFileSync(new URL(`../lib/${f}.ts`, import.meta.url), "utf8"))));
  for (const key of SYNCED) assert.ok(sources.some((src) => src.includes(`"${key}"`)), key);
});
