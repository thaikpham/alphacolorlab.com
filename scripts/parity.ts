// Replays /tmp/parity/cases.json through the TS codec; compare with scripts/parity.py output.
import { readFileSync, writeFileSync } from "node:fs";
import * as codec from "../lib/zve10/dat.ts";
import bundle from "../lib/zve10/profile.json" with { type: "json" };
const base = new Uint8Array(readFileSync("test/fixtures/dot6/CAMPR04N.DAT"));
const profile = (codec as any).withSupplement ? (codec as any).withSupplement(bundle.profile, bundle.supplement) : (codec as any).PROFILE ?? bundle.profile;
const date = new Date(2026, 9, 28, 22, 37, 53); // header of CAMPR04N: 20261028_223753
for (const c of JSON.parse(readFileSync("/tmp/parity/cases.json", "utf8"))) {
  const e = c.exposure;
  const s = {
    pp: c.pp, ppOn: true, wb: c.wb, mode: c.mode, focus: c.focus,
    aperture: e.aperture === "keep" ? "keep" : Number(e.aperture),
    shutter: e.shutter,
    iso: e.iso === "keep" ? "keep" : e.iso === "AUTO" ? "auto" : Number(e.iso),
  };
  try {
    const out = codec.applySettings(base, 4, s as any, date, profile);
    writeFileSync(`/tmp/parity/ts/${c.name}.dat`, out);
    console.log(c.name, "ok");
  } catch (err) { console.log(c.name, "TS-REJECT:", String((err as Error).message).replace(/\n/g, " | ")); }
}
