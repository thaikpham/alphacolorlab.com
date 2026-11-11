// Đối chiếu byte với codec Python (scripts/parity.py sinh golden; scripts/parity.ts replay thủ công).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applySettings, decodeDat } from "../lib/zve10/dat.ts";

const base = new Uint8Array(readFileSync("test/fixtures/dot6/CAMPR04N.DAT"));
const date = new Date(2026, 9, 28, 22, 37, 53); // header CAMPR04N: 20261028_223753
const cases = JSON.parse(readFileSync("test/fixtures/golden/cases.json", "utf8"));

for (const c of cases) {
  test(`golden ${c.name} byte-identical to Python`, () => {
    const e = c.exposure;
    const out = applySettings(base, 4, {
      pp: c.pp, wb: c.wb, mode: c.mode, focus: c.focus,
      aperture: e.aperture === "keep" ? "keep" : Number(e.aperture),
      shutter: e.shutter,
      iso: e.iso === "keep" ? "keep" : e.iso === "AUTO" ? "auto" : Number(e.iso),
    }, date);
    const golden = new Uint8Array(readFileSync(`test/fixtures/golden/${c.name}.dat`));
    assert.equal(Buffer.compare(Buffer.from(out), Buffer.from(golden)), 0);
    const d = decodeDat(out) as any;
    assert.equal(d.mode, c.mode);
    if (c.focus !== "keep") assert.equal(d.focus, c.focus);
    assert.equal(d.wb.mode, c.wb.mode);
    if (c.wb.mode === "ctemp") assert.equal(d.wb.kelvin, c.wb.kelvin);
    assert.equal(d.pp1?.gamma ?? d.pp?.gamma, c.pp.gamma);
  });
}
