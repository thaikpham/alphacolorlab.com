import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanLink, cleanUsername, decodeShare, encodeShare, parseProfile } from "../lib/profile.ts";

test("profile: links only http(s), scheme added when missing", () => {
  assert.equal(cleanLink("instagram.com/me"), "https://instagram.com/me");
  assert.equal(cleanLink("http://a.vn/x"), "http://a.vn/x");
  assert.equal(cleanLink("javascript:alert(1)"), null);
  assert.equal(cleanLink("data:text/html,hi"), null);
  assert.equal(cleanLink("not a link"), null);
});

test("profile: username is lowercase a-z0-9._ without @", () => {
  assert.equal(cleanUsername("@Thái.Phạm_99!"), "thi.phm_99");
});

test("profile: parse caps bio, drops bad and duplicate links, keeps 5", () => {
  const p = parseProfile({ username: "A", bio: "x".repeat(500), links: ["a.vn", "a.vn", "javascript:x", "b.vn", "c.vn", "d.vn", "e.vn", "f.vn"] });
  assert.equal(p.bio.length, 160);
  assert.deepEqual(p.links, ["https://a.vn/", "https://b.vn/", "https://c.vn/", "https://d.vn/", "https://e.vn/"]);
});

test("profile: share link round-trips Vietnamese text and validates what comes back", () => {
  const shared = { name: "Thái Phạm", avatar: "https://lh3.googleusercontent.com/a/x", username: "thai", bio: "Chụp phố bằng A6400", links: ["https://a.vn/"], gear: { body: ["a6400"], lens: [], acc: [] } };
  assert.deepEqual(decodeShare(encodeShare(shared)), shared);
  const evil = encodeShare({ ...shared, avatar: "javascript:x", links: ["javascript:x"], gear: { body: ["not-a-camera"], lens: [], acc: [] } });
  const back = decodeShare(evil)!;
  assert.equal(back.avatar, null);
  assert.deepEqual(back.links, []);
  assert.deepEqual(back.gear.body, []);
  assert.equal(decodeShare("%%%"), null);
});
