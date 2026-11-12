import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { adaptersFor } from "../lib/decode/adapters.ts";
import { getCatalog } from "../lib/game/catalog.ts";
import { buildSet, decodeDat } from "../lib/zve10/dat.ts";
import type { GameModel } from "../lib/game/types.ts";

const load = (path: string) => new Uint8Array(readFileSync(path));
const MODELS: GameModel[] = ["zve10", "a6400", "a7c2"];

// Cài đặt trong danh mục ZV-E10 → trường tương ứng của decodeDat
const ZVE_FIELD: Record<string, string> = {
  focusMode: "focus",
  focusArea: "focusArea",
  metering: "metering",
  facePriority: "facePriority",
  softSkin: "softSkin",
  autoReview: "autoReview",
  "flash-mode": "flashMode",
  "exp-comp-set": "expCompSet",
  "awb-priority": "awbPriority",
  "pre-af": "preAF",
  "steady-shot": "steadyShot",
  "e-front-curtain": "eFrontCurtain",
  "live-view-display": "liveView",
};

test("adaptersFor: đầu là mọi cài đặt của danh mục theo thứ tự danh mục (inCatalog); sau đó chỉ là cài đặt chỉ có trong codec", () => {
  for (const m of MODELS) {
    const ids = getCatalog()[m].settings.map((s) => s.id);
    const all = adaptersFor(m);
    assert.deepStrictEqual(all.slice(0, ids.length).map((a) => a.settingId), ids, m);
    assert.ok(all.slice(0, ids.length).every((a) => a.inCatalog), `${m} prefix inCatalog`);
    const tail = all.slice(ids.length);
    assert.ok(tail.every((a) => !a.inCatalog && !ids.includes(a.settingId)), `${m} tail`);
    assert.strictEqual(new Set(all.map((a) => a.settingId)).size, all.length, `${m} trùng id`);
  }
});

test("read không ném lỗi trên file rác và trả null", () => {
  const junk = new Uint8Array(4608);
  for (const m of MODELS) {
    for (const a of adaptersFor(m)) assert.strictEqual(a.read(junk), null, `${m}/${a.settingId}`);
  }
});

test("ZV-E10: adapter khớp từng trường decodeDat trên file máy thật (PAL)", () => {
  const catalog = getCatalog().zve10.settings;
  for (const f of ["CAMPR01P", "CAMPR04P"]) {
    const bytes = load(`test/fixtures/zve10/${f}.DAT`);
    const d = decodeDat(bytes) as unknown as Record<string, string | null>;
    for (const a of adaptersFor("zve10")) {
      if (!a.located) {
        assert.strictEqual(a.read(bytes), null, `${f} ${a.settingId} chưa định vị`);
        continue;
      }
      const field = ZVE_FIELD[a.settingId];
      if (!field) continue;
      const got = a.read(bytes);
      assert.ok(got, `${f} ${a.settingId} không đọc được`);
      const raw = d[field];
      const inCatalog = catalog.find((s) => s.id === a.settingId)!.values.some((v) => v.id === raw);
      assert.strictEqual(got.valueId, inCatalog ? raw : null, `${f} ${a.settingId}`);
    }
  }
});

test("ZV-E10: file NTSC 05N/06N không qua được parseDat nên adapter trả null (như bước bỏ ô cũ)", () => {
  for (const f of ["CAMPR05N", "CAMPR06N"]) {
    const bytes = load(`test/fixtures/zve10/${f}.DAT`);
    for (const a of adaptersFor("zve10")) assert.strictEqual(a.read(bytes), null, `${f} ${a.settingId}`);
  }
});

test("ZV-E10 adapter trả null với file α6400 (sai model)", () => {
  const bytes = load("test/fixtures/a6400/dot1/CAMPR01P.DAT");
  for (const a of adaptersFor("zve10")) assert.strictEqual(a.read(bytes), null, a.settingId);
});

test("α6400: adapter đọc được 4 file máy thật; WB thô là 14 (C.Temp) hoặc 1 (AWB)", () => {
  for (const n of ["CAMPR01P", "CAMPR02P", "CAMPR03P", "CAMPR04P"]) {
    const bytes = load(`test/fixtures/a6400/dot1/${n}.DAT`);
    for (const a of adaptersFor("a6400")) {
      if (!a.located) continue;
      assert.ok(a.read(bytes), `${n} ${a.settingId}`);
    }
    const wb = adaptersFor("a6400").find((a) => a.settingId === "wb")!.read(bytes);
    assert.ok(wb && [14, 1].includes(wb.raw as number), `${n} wb raw ${wb?.raw}`);
  }
});

// Khẩu độ và tốc độ A7C II chưa có mã (pending: APEX lệch theo ống kính), nên không kiểm tra codeOf
const A7C2_NO_CODE_YET = new Set(["aperture", "shutter"]);

test("A7C II: CAMPR01P và 02P đọc được; codeOf có mã cho mọi valueId đã đọc", () => {
  for (const n of ["CAMPR01P", "CAMPR02P"]) {
    const bytes = load(`test/fixtures/a7c2/${n}.DAT`);
    for (const a of adaptersFor("a7c2")) {
      if (!a.located) continue;
      const r = a.read(bytes);
      assert.ok(r, `${n} ${a.settingId}`);
      if (r.valueId !== null && !A7C2_NO_CODE_YET.has(a.settingId)) assert.notStrictEqual(a.codeOf(r.valueId), null, `${n} ${a.settingId} ${r.valueId}`);
    }
  }
});

test("ZV-E10: buildSet rồi đọc lại bằng adapter ra đúng giá trị đã chọn (header từ public/dat)", () => {
  const sys = "pal";
  const headers = [1, 2, 3, 4].map((i) => load(`public/dat/zve10-${sys}-m${i}.dat`));
  const base = load(`public/dat/zve10-base-${sys}.dat`);
  const settings = [{ metering: "multi" }, { softSkin: "mid" }, { autoReview: "off" }, { preAF: "on" }] as any;
  const built = buildSet(base, settings, undefined, undefined, headers);
  const want = [
    ["metering", "multi"],
    ["softSkin", "mid"],
    ["autoReview", "off"],
    ["pre-af", "on"],
  ] as const;
  const adapters = new Map(adaptersFor("zve10").map((a) => [a.settingId, a] as const));
  built.forEach((f, i) => {
    const [id, value] = want[i];
    assert.strictEqual(adapters.get(id)!.read(f.data)?.valueId, value, `ô ${i + 1} ${id}`);
  });
});
