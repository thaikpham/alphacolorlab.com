// So file Memory Recall A7C II theo thứ tự (ví dụ M1→M2→M3→M4 của một nhiệm vụ game) để giải mã:
// node --experimental-strip-types scripts/a7c2-diff.ts CAMPR01P.DAT CAMPR02P.DAT …
import { readFileSync } from "node:fs";
import { parseA7c2, diffA7c2 } from "../lib/a7c2/dat.ts";

const files = process.argv.slice(2).map((p) => ({ p, dat: parseA7c2(new Uint8Array(readFileSync(p))) }));
const hex = (v: Uint8Array) => Buffer.from(v).toString("hex");
for (let i = 1; i < files.length; i++) {
  const [a, b] = [files[i - 1], files[i]];
  const ids = diffA7c2(a.dat, b.dat);
  console.log(`${a.p} → ${b.p}: ${ids.length} bản ghi đổi`);
  for (const id of ids) {
    const ra = a.dat.records.find((r) => r.id === id)!;
    const rb = b.dat.records.find((r) => r.id === id)!;
    console.log(`  0x${id.toString(16).padStart(4, "0")} (${ra.size}×${ra.count}): ${hex(ra.value)} → ${hex(rb.value)}`);
  }
}
