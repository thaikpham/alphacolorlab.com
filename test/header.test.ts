import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { buildSet, parseDat } from "../lib/zve10/dat.ts";
import presets from "../lib/zve10/presets.ts";

// Máy báo File Error khi header (tên, ngày, byte 0x35) bị đổi: mỗi ô phải mượn nguyên header 0x00–0x37 từ file máy lưu cho ô đó.
for (const sys of ["pal", "ntsc"]) {
  test(`buildSet giữ header của file máy cho từng ô (${sys})`, () => {
    const load = (n: string) => new Uint8Array(readFileSync(`public/dat/${n}.dat`));
    const headers = [1, 2, 3, 4].map((i) => load(`zve10-${sys}-m${i}`));
    const built = buildSet(load(`zve10-base-${sys}`), [{ metering: "multi" }, { softSkin: "mid" }, { autoReview: "off" }, { preAF: "on" }] as any, undefined, undefined, headers);
    built.forEach((f, i) => {
      assert.deepStrictEqual(f.data.subarray(0, 0x38), headers[i].subarray(0, 0x38));
      assert.strictEqual(f.name, parseDat(headers[i]).name);
      parseDat(f.data); // checksum 0x38 + tail hợp lệ
    });
  });

  test(`buildSet với Color Bank exportable presets giữ header M1–M4 (${sys})`, () => {
    const load = (n: string) => new Uint8Array(readFileSync(`public/dat/${n}.dat`));
    const headers = [1, 2, 3, 4].map((i) => load(`zve10-${sys}-m${i}`));
    const exportable = presets.filter((p) => !p.blocked);
    // Use first 4 exportable presets, or fill with keep
    const slots = [0, 1, 2, 3].map((i) => {
      const preset = exportable[i];
      if (!preset) return { pp: "keep", wb: "keep" };
      return {
        pp: preset.pp,
        ppOn: true,
        wb: {
          mode: preset.wb.mode as "awb" | "ctemp",
          kelvin: preset.wb.kelvin,
          ab: preset.wb.ab,
          gm: preset.wb.gm,
          priority: preset.wb.priority,
        },
      };
    });
    const built = buildSet(load(`zve10-base-${sys}`), slots as any, undefined, undefined, headers);
    built.forEach((f, i) => {
      assert.deepStrictEqual(f.data.subarray(0, 0x38), headers[i].subarray(0, 0x38), `slot ${i + 1} header mismatch`);
      assert.strictEqual(f.name, parseDat(headers[i]).name, `slot ${i + 1} name mismatch`);
      parseDat(f.data);
    });
  });

  test(`buildSet với ppBanks giữ header M1–M4 (${sys})`, () => {
    const load = (n: string) => new Uint8Array(readFileSync(`public/dat/${n}.dat`));
    const headers = [1, 2, 3, 4].map((i) => load(`zve10-${sys}-m${i}`));
    const exportable = presets.filter((p) => !p.blocked);
    // Use pairs of exportable presets for PP1 and bank 2
    const slots = [0, 1, 2, 3].map((i) => {
      const preset1 = exportable[i * 2];
      const preset2 = exportable[i * 2 + 1];
      return {
        pp: preset1?.pp ?? "keep",
        ppOn: preset1 ? true : undefined,
        ppBanks: preset2 ? { 2: preset2.pp } : undefined,
        wb: preset1 ? { mode: "awb" as const, ab: 0, gm: 0 } : "keep",
      };
    });
    const built = buildSet(load(`zve10-base-${sys}`), slots as any, undefined, undefined, headers);
    built.forEach((f, i) => {
      assert.deepStrictEqual(f.data.subarray(0, 0x38), headers[i].subarray(0, 0x38), `slot ${i + 1} header mismatch`);
      assert.strictEqual(f.name, parseDat(headers[i]).name, `slot ${i + 1} name mismatch`);
      parseDat(f.data);
    });
  });
}
