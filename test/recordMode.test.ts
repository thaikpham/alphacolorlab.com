// Byte 0x17E (ảnh/phim) trên file máy thật. Chỉ NTSC movie và photo; chưa có mẫu PAL movie.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applySettings, decodeDat, readRecordMode } from "../lib/zve10/dat.ts";

const load = (p: string) => new Uint8Array(readFileSync(p));

test("0x17E reads 'photo' on PAL and NTSC photo samples", () => {
  for (const p of ["test/fixtures/zve10/CAMPR01P.DAT", "test/fixtures/zve10/CAMPR04P.DAT", "test/fixtures/dot6/CAMPR04N.DAT"]) {
    assert.equal(readRecordMode(load(p)), "photo", p);
  }
});

test("0x17E reads 'movie' on NTSC movie samples", () => {
  for (const p of ["test/fixtures/zve10/CAMPR05N.DAT", "test/fixtures/zve10/CAMPR06N.DAT"]) {
    assert.equal(readRecordMode(load(p)), "movie", p);
  }
});

test("decodeDat exposes recordMode for accepted M1–M4 photo files", () => {
  assert.equal(decodeDat(load("test/fixtures/zve10/CAMPR04P.DAT")).recordMode, "photo");
  assert.equal(decodeDat(load("test/fixtures/dot6/CAMPR04N.DAT")).recordMode, "photo");
});

test("decodeDat still rejects movie-named files (name gate unchanged)", () => {
  assert.throws(() => decodeDat(load("test/fixtures/zve10/CAMPR05N.DAT")), /CAMPR01…04/);
});

test("readRecordMode returns null for wrong length or magic", () => {
  assert.equal(readRecordMode(new Uint8Array(10)), null);
  const bad = load("test/fixtures/zve10/CAMPR01P.DAT");
  bad[0] = 0x00;
  assert.equal(readRecordMode(bad), null);
});

test("readRecordMode returns null when the flag byte is neither 0 nor 1", () => {
  const b = load("test/fixtures/zve10/CAMPR05N.DAT");
  b[0x17e] = 2;
  assert.equal(readRecordMode(b), null);
});

test("applySettings never writes 0x17E", () => {
  const base = load("test/fixtures/dot6/CAMPR04N.DAT");
  const out = applySettings(base, 4, { pp: { gamma: "HLG2" }, ppBanks: { 2: { gamma: "HLG2" } } });
  assert.equal(out[0x17e], base[0x17e]);
});
