import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applySettings, buildSet, decodeDat } from "../lib/zve10/dat.ts";
import { IMPORT_KINDS, importDat, toSlotSettings } from "../lib/datImport.ts";
import { decodeA6400 } from "../lib/a6400/dat.ts";
import { parseA7c2, serializeA7c2 } from "../lib/a7c2/dat.ts";
import { A7C2_SETTINGS, readA7c2Setting } from "../lib/a7c2/settings.ts";
import type { A7c2SettingKey } from "../lib/a7c2/settings.ts";

const load = (p: string) => new Uint8Array(readFileSync(p));
const ZVE10_BASE = load("public/dat/zve10-base-pal.dat");
const ZVE10_HEADERS = [1, 2, 3, 4].map((i) => load(`public/dat/zve10-pal-m${i}.dat`));
const A6400_FILE = load("test/fixtures/a6400/dot1/CAMPR01P.DAT");
const A7C2_FILE = load("test/fixtures/a7c2/CAMPR01P.DAT");

test("IMPORT_KINDS lists the three bodies", () => {
  assert.deepEqual([...IMPORT_KINDS], ["zve10", "a6400", "a7c2"]);
});

test("buildSet output imports as ZV-E10 and matches decodeDat", () => {
  const built = buildSet(ZVE10_BASE, [{ mode: "M" }, {}, {}, {}], undefined, undefined, ZVE10_HEADERS);
  for (const set of built) {
    const r = importDat(set.data);
    assert.equal(r.kind, "zve10");
    if (r.kind !== "zve10") continue;
    assert.deepEqual(r.decoded, decodeDat(set.data));
    assert.equal(r.decoded.mode, "M");
  }
});

test("applySettings output round-trips through importDat", () => {
  const out = applySettings(ZVE10_BASE, 1, { mode: "M" });
  const r = importDat(out);
  assert.equal(r.kind, "zve10");
  if (r.kind === "zve10") assert.equal(r.decoded.mode, "M");
});

test("α6400 fixture imports as a6400 with the H1 values", () => {
  const r = importDat(A6400_FILE);
  assert.equal(r.kind, "a6400");
  if (r.kind !== "a6400") return;
  assert.equal(r.model, "ILCE-6400");
  assert.deepEqual(r.decoded, decodeA6400(A6400_FILE));
  assert.equal(r.decoded.fields.aperture.value, "8");
  assert.equal(r.decoded.fields.shutter.value, "1/125");
  assert.equal(r.decoded.fields.iso.value, "800");
});

test("A7C II fixture imports as a7c2 with settings read per key", () => {
  const dat = parseA7c2(A7C2_FILE);
  const r = importDat(A7C2_FILE);
  assert.equal(r.kind, "a7c2");
  if (r.kind !== "a7c2") return;
  assert.equal(r.model, "ILCE-7CM2");
  for (const key of Object.keys(A7C2_SETTINGS) as A7c2SettingKey[]) {
    assert.equal(r.settings[key], readA7c2Setting(dat, key), key);
  }
});

test("A7C II serialized bytes import as a7c2", () => {
  const again = serializeA7c2(parseA7c2(A7C2_FILE));
  const r = importDat(again);
  assert.equal(r.kind, "a7c2");
});

test("garbage input never throws and returns unknown", () => {
  let seed = 1;
  const random = new Uint8Array(4608).map(() => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed >> 16;
  });
  const cases: [string, Uint8Array][] = [
    ["empty", new Uint8Array(0)],
    ["random", random],
    ["truncated ZV-E10", load("test/fixtures/zve10/CAMPR01P.DAT").slice(0, 100)],
    ["truncated A7C II", A7C2_FILE.slice(0, 0x50)],
    ["all zero", new Uint8Array(4608)],
  ];
  for (const [label, bytes] of cases) {
    let r: ReturnType<typeof importDat> | undefined;
    assert.doesNotThrow(() => (r = importDat(bytes)), label);
    assert.equal(r?.kind, "unknown", label);
    assert.ok(r?.kind === "unknown" && r.error.length > 0, label);
  }
});

test("fileName is prefixed to the unknown error only", () => {
  const r = importDat(new Uint8Array(0), "CAMPR09P.DAT");
  assert.equal(r.kind, "unknown");
  assert.ok(r.kind === "unknown" && r.error.startsWith("CAMPR09P.DAT: "));
  const ok = importDat(A6400_FILE, "CAMPR01P.DAT");
  assert.equal(ok.kind, "a6400");
});

test("ZV-E10 movie files import read-only", () => {
  for (const f of ["CAMPR05N.DAT", "CAMPR06N.DAT"]) {
    const r = importDat(load(`test/fixtures/zve10/${f}`), f);
    assert.equal(r.kind, "zve10", f);
    if (r.kind !== "zve10") continue;
    assert.equal(r.recordMode, "movie", f);
    assert.equal(r.readOnly, true, f);
  }
});

test("ZV-E10 movie file with a broken tail imports as unsupported", () => {
  const bad = load("test/fixtures/zve10/CAMPR05N.DAT");
  bad[0x100] ^= 0xff;
  assert.deepEqual(importDat(bad, "CAMPR05N.DAT"), { kind: "unsupported", model: "ZV-E10", recordMode: "movie" });
});

test("ZV-E10 photo files import writable", () => {
  const r = importDat(load("test/fixtures/zve10/CAMPR01P.DAT"));
  assert.equal(r.kind, "zve10");
  if (r.kind !== "zve10") return;
  assert.equal(r.recordMode, "photo");
  assert.equal(r.readOnly, false);
});

test("toSlotSettings returns the values buildSet wrote", () => {
  const want = {
    mode: "M",
    aperture: "2.8",
    shutter: "1/125",
    iso: "400",
    wb: { mode: "ctemp", kelvin: 5600, ab: 0, gm: 0 },
    focus: "AF-C",
    metering: "center",
    ppOn: true,
    pp: { gamma: "Cine3" },
  } as const;
  const built = buildSet(ZVE10_BASE, [want, {}, {}, {}], undefined, undefined, ZVE10_HEADERS);
  const r = importDat(built[0].data);
  assert.equal(r.kind, "zve10");
  if (r.kind !== "zve10") return;
  const s = toSlotSettings(r.decoded);
  assert.equal(s.slot, 1);
  assert.equal(s.family, "pal");
  assert.equal(s.settings.mode, "M");
  assert.equal(s.settings.aperture, "2.8");
  assert.equal(s.settings.shutter, "1/125");
  assert.equal(s.settings.iso, "400");
  assert.deepEqual(s.settings.wb, want.wb);
  assert.equal(s.settings.focus, "AF-C");
  assert.equal(s.settings.metering, "center");
  assert.equal(s.settings.ppOn, true);
  assert.equal((s.settings.pp as Record<string, unknown>).gamma, "Cine3");
  assert.ok(s.skipped.includes("ppBanks"));
});

test("toSlotSettings drops pp when PP is off", () => {
  const built = buildSet(ZVE10_BASE, [{ ppOn: false }, {}, {}, {}], undefined, undefined, ZVE10_HEADERS);
  const r = importDat(built[0].data);
  assert.equal(r.kind, "zve10");
  if (r.kind !== "zve10") return;
  const s = toSlotSettings(r.decoded);
  assert.equal(s.settings.ppOn, false);
  assert.equal(s.settings.pp, undefined);
  assert.ok(s.skipped.includes("pp"));
});

test("toSlotSettings does not load PP1 when PP2 is the selected bank", () => {
  const r = importDat(load("test/fixtures/zve10/CAMPR01P.DAT"));
  assert.equal(r.kind, "zve10");
  if (r.kind !== "zve10") return;
  assert.equal(r.decoded.pp_selected, 2);
  const s = toSlotSettings(r.decoded);
  assert.equal(s.settings.ppOn, undefined);
  assert.equal(s.settings.pp, undefined);
  assert.ok(s.skipped.includes("ppOn") && s.skipped.includes("pp"));
});

test("dot6 NTSC photo samples map to their own slot with family ntsc", () => {
  for (const n of [1, 2, 3, 4]) {
    const f = `CAMPR0${n}N.DAT`;
    const r = importDat(load(`test/fixtures/dot6/${f}`), f);
    assert.equal(r.kind, "zve10", f);
    if (r.kind !== "zve10") continue;
    assert.equal(r.readOnly, false, f);
    const s = toSlotSettings(r.decoded);
    assert.equal(s.slot, n, f);
    assert.equal(s.family, "ntsc", f);
    assert.equal(s.settings.ppOn, true, f);
    assert.ok(s.settings.pp, f);
    assert.ok(s.skipped.includes("ppBanks"), f);
  }
});
