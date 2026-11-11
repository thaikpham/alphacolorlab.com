// α6400 (ILCE-6400) read-only decoder: checksum rule, offset map and H1 values on real camera files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { A6400_FIELDS, a6400Checksum38, decodeA6400, parseA6400 } from "../lib/a6400/dat.ts";

const load = (p: string) => new Uint8Array(readFileSync(p));
const DOT1 = ["CAMPR01P", "CAMPR02P", "CAMPR03P", "CAMPR04P"].map((n) => `test/fixtures/a6400/dot1/${n}.DAT`);
const SAMPLE = "test/fixtures/a6400/sample/CAMPR01P.DAT";

test("checksum rule matches byte 0x38 on all five real files", () => {
  for (const p of [...DOT1, SAMPLE]) {
    const b = load(p);
    assert.equal(a6400Checksum38(b), b[0x38], p);
    assert.equal(parseA6400(b).model, "ILCE-6400", p);
  }
});

test("decodeA6400 reproduces the H1 table on the four PAL Dot1 files", () => {
  const expected = [
    { aperture: "8", shutter: "1/125", iso: "800", wbMode: "ctemp", kelvin: 4300, ppGamma: "Movie", ppColorMode: "Movie", ppBlackLevel: 0 },
    { aperture: "5.6", shutter: "1/60", iso: "400", wbMode: "awb", kelvin: null, ppGamma: "Cine3", ppColorMode: "Cinema", ppBlackLevel: 5 },
    { aperture: "11", shutter: "1/250", iso: "1600", wbMode: "awb", kelvin: null, ppGamma: "Still", ppColorMode: "Pro", ppBlackLevel: -5 },
    { aperture: "8", shutter: "1/125", iso: "AUTO", wbMode: "ctemp", kelvin: 5500, ppGamma: "Cine2", ppColorMode: "ITU709 Matrix", ppBlackLevel: 0 },
  ];
  DOT1.forEach((p, i) => {
    const d = decodeA6400(load(p));
    assert.equal(d.fields.mode.value, "M", p);
    for (const [key, want] of Object.entries(expected[i])) {
      const got = d.fields[key as keyof typeof expected[0]];
      assert.equal(got.value, want, `${p} ${key}`);
      if (want !== null) assert.equal(got.confirmed, true, `${p} ${key} should be confirmed`);
    }
  });
});

test("a value outside the observed list is decoded but not confirmed", () => {
  // Mẫu sample/CAMPR01P.DAT: khẩu F2.8 chưa có trong file máy thật được ghi nhận.
  const d = decodeA6400(load(SAMPLE));
  assert.equal(d.fields.aperture.value, "2.8");
  assert.equal(d.fields.aperture.confirmed, false);
  assert.equal(d.fields.shutter.value, "1/60");
  assert.equal(d.fields.shutter.confirmed, true);
  assert.equal(d.fields.iso.value, "AUTO");
});

test("kelvin is null unless WB is C.Temp", () => {
  assert.equal(decodeA6400(load(DOT1[1])).fields.kelvin.value, null);
});

test("offset map matches the verified A6400 positions", () => {
  const at = Object.fromEntries(A6400_FIELDS.map((f) => [f.key, f.a6400Offset]));
  assert.deepEqual(at, {
    mode: 0x180,
    aperture: 0x141,
    shutter: 0x143,
    iso: 0x194,
    wbMode: 0x19a,
    kelvin: 0x1d8,
    ppGamma: 0x326,
    ppColorMode: 0x396,
    ppBlackLevel: 0x318,
  });
});

test("decodeA6400 does not modify its input", () => {
  const b = load(DOT1[0]);
  const copy = b.slice();
  decodeA6400(b);
  assert.deepEqual(b, copy);
});

test("rejects wrong length, magic, model and checksum", () => {
  assert.throws(() => parseA6400(new Uint8Array(10)), /4.608 byte/);
  const badMagic = load(DOT1[0]);
  badMagic[0] = 0;
  assert.throws(() => parseA6400(badMagic), /SONY!/);
  assert.throws(() => decodeA6400(load("test/fixtures/zve10/CAMPR01P.DAT")), /không phải α6400/);
  const badSum = load(DOT1[0]);
  badSum[0x40] ^= 0x01;
  assert.throws(() => parseA6400(badSum), /checksum/);
});
