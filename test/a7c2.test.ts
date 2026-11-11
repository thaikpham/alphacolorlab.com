import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { parseA7c2, serializeA7c2, headerModel, headerChecksum, diffA7c2, A7C2_HEADER_MODEL } from "../lib/a7c2/dat.ts";

// File do chính máy A7C II (firmware 2.01) lưu: M1 và M2 cùng một bộ cài đặt, khác giờ lưu
const m1 = new Uint8Array(readFileSync("test/fixtures/a7c2/CAMPR01P.DAT"));
const m2 = new Uint8Array(readFileSync("test/fixtures/a7c2/CAMPR02P.DAT"));

test("A7C II: camera files parse into 1061 records with unique ids", () => {
  for (const f of [m1, m2]) {
    const dat = parseA7c2(f);
    assert.strictEqual(headerModel(f), A7C2_HEADER_MODEL);
    assert.strictEqual(dat.records.length, 1061);
    assert.strictEqual(new Set(dat.records.map((r) => r.id)).size, 1061);
  }
});

test("A7C II: serialize(parse(file)) gives back the camera's bytes exactly", () => {
  for (const f of [m1, m2]) assert.deepStrictEqual(serializeA7c2(parseA7c2(f)), f);
});

test("A7C II: both checksums are checked, and recomputed after an edit", () => {
  const broken = m1.slice();
  broken[0x200] ^= 1;
  assert.throws(() => parseA7c2(broken), /thân file/);
  const badHeader = m1.slice();
  badHeader[0x20] ^= 1;
  assert.throws(() => parseA7c2(badHeader), /header/);

  const dat = parseA7c2(m1);
  const r = dat.records.find((x) => x.size === 1 && x.count === 1)!;
  r.value = Uint8Array.of(r.value[0] ^ 1);
  const edited = serializeA7c2(dat);
  assert.strictEqual(edited[0x39], headerChecksum(edited));
  assert.deepStrictEqual(diffA7c2(parseA7c2(m1), parseA7c2(edited)), [r.id]);
});

test("A7C II: M1 and M2 hold the same settings (only the save time differs)", () => {
  assert.deepStrictEqual(diffA7c2(parseA7c2(m1), parseA7c2(m2)), []);
});

// Game: bộ M1–M4 A7C II dựng từ file máy thật, mỗi ô đổi một bản ghi và lưu muộn hơn ô trước
import { verify } from "../lib/game/verify.ts";
import { generateMission } from "../lib/game/mission.ts";
import type { CardFile } from "../lib/game/types.ts";

function slotFile(slot: number, edit?: (b: Uint8Array) => void): CardFile {
  const dat = parseA7c2(m1);
  dat.header.set(new TextEncoder().encode(`20230429_2027${String(10 * slot).padStart(2, "0")}`), 0x15);
  const r = dat.records.find((x) => x.size === 1 && x.count === 1)!;
  r.value = Uint8Array.of((r.value[0] + slot) & 0xff);
  const bytes = serializeA7c2(dat);
  edit?.(bytes);
  return { folder: "7CM2", name: `CAMPR0${slot}P.DAT`, bytes };
}

test("A7C II game: a valid M1–M4 set passes the structural checks", () => {
  const v = verify(generateMission("a7c2", 7), [1, 2, 3, 4].map((s) => slotFile(s)), "en");
  assert.deepStrictEqual(v.structural.filter((s) => !s.ok), []);
  assert.strictEqual(v.ok, true);
});

test("A7C II game: a slot with a broken checksum or another camera's file must be redone", () => {
  const files = [1, 2, 3, 4].map((s) => slotFile(s));
  files[1] = slotFile(2, (b) => (b[0x300] ^= 1));
  files[2] = slotFile(3, (b) => b.set(new TextEncoder().encode("ILCE-7M4\0"), 5));
  const v = verify(generateMission("a7c2", 7), files, "en");
  assert.strictEqual(v.ok, false);
  assert.deepStrictEqual([...v.retrySlots].sort(), [2, 3]);
});

test("missions for undecoded cameras never ask for two values of one setting, or a greyed-out item, in slot 1", () => {
  for (const model of ["a6400", "a7c2"] as const) {
    for (let seed = 1; seed <= 400; seed++) {
      const m = generateMission(model, seed);
      const s1 = m.slots[0].steps;
      const ids = s1.map((st) => st.settingId);
      assert.strictEqual(new Set(ids).size, ids.length, `${model} seed ${seed}: ${ids}`);
      const mode = s1.find((st) => st.settingId === "focusMode")?.valueId;
      const area = s1.find((st) => st.settingId === "focusArea")?.valueId;
      if (area) assert.notStrictEqual(mode, "MF", `${model} seed ${seed}: focus area set while MF`);
      if (area?.startsWith("tracking-") && mode) assert.strictEqual(mode, "AF-C", `${model} seed ${seed}`);
      const metering = s1.find((st) => st.settingId === "metering")?.valueId;
      if (m.slots.some((sl) => sl.steps.some((st) => st.role === "target" && st.settingId === "facePriority")) && metering && s1.find((st) => st.settingId === "metering")?.role === "control") {
        assert.strictEqual(metering, "multi", `${model} seed ${seed}`);
      }
    }
  }
});

import { readA7c2Setting } from "../lib/a7c2/settings.ts";

// Lượt mẫu 2: ảnh DSC08705 (trước khi đổi) cho AF-C, Đa điểm, AWB; M2 đổi lấy nét sang AF-A, M3 đo sáng sang Điểm, M4 cân bằng trắng sang Underwater Auto
test("A7C II: decoded settings read back the values the user set on the camera", () => {
  const run = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run2/CAMPR0${n}P.DAT`)));
  const base = parseA7c2(m1);
  const read = (d: ReturnType<typeof parseA7c2>) => ["focusMode", "metering", "wb"].map((k) => readA7c2Setting(d, k as "focusMode"));
  assert.deepStrictEqual(read(base), ["AF-C", "multi", "auto"]);
  assert.deepStrictEqual(read(run(2)), ["AF-A", "multi", "auto"]);
  assert.deepStrictEqual(read(run(3)), ["AF-A", "spot", "auto"]);
  assert.deepStrictEqual(read(run(4)), ["AF-A", "spot", "underwater-auto"]);
});

import { A7C2_PP_CODES, a7c2PpIds, readA7c2PpArray, A7C2_NUMERIC, readA7c2Number, isoFromCode, kelvinFromCode } from "../lib/a7c2/settings.ts";

test("A7C II: PP1–PP11 gamma and color mode in an untouched camera file match Sony's defaults", () => {
  const dat = parseA7c2(m1);
  const g = A7C2_PP_CODES.gamma, c = A7C2_PP_CODES.colorMode;
  // PP7 (mã 15 / 11) chưa giải mã nên bỏ qua
  const gamma = [g.Movie, g.Still, g.ITU709, g.ITU709, g.Cine1, g.Cine2, 15, g["S-Log3"], g["S-Log3"], g.HLG2, g["S-Cinetone"]];
  const color = [c.Movie, c.Still, c.Pro, c["ITU709 Matrix"], c.Cinema, c.Cinema, 11, c["S-Gamut3.Cine"], c["S-Gamut3"], c["BT.2020"], c["S-Cinetone"]];
  assert.deepStrictEqual(readA7c2PpArray(dat, "gamma"), gamma);
  assert.deepStrictEqual(readA7c2PpArray(dat, "colorMode"), color);
  for (const p of ["gamma", "colorMode"] as const) {
    const [a, b, c2] = a7c2PpIds(p).map((id) => dat.records.find((r) => r.id === id)!.value.join());
    assert.ok(a === b && b === c2, `${p}: 3 bản sao phải giống nhau`);
  }
});

// Lượt mẫu 3 (từ M4 lượt 2): M1 chọn PP2, M2 PP2 Black Level +3, M3 PP2 Gamma Cine4, M4 PP2 Color Mode Black & White
test("A7C II: round 3 samples decode PP selection, Black Level, Cine4 and Black & White", () => {
  const r3 = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run3/CAMPR0${n}P.DAT`)));
  const before = parseA7c2(new Uint8Array(readFileSync("test/fixtures/a7c2/run2/CAMPR04P.DAT")));
  assert.strictEqual(readA7c2Setting(before, "pictureProfile"), "off");
  assert.strictEqual(readA7c2Setting(r3(1), "pictureProfile"), "PP2");
  assert.deepStrictEqual([readA7c2Setting(before, "dro"), readA7c2Setting(r3(1), "dro")], ["auto", "off"]); // bật PP thì DRO về Tắt
  assert.deepStrictEqual(readA7c2PpArray(r3(1), "blackLevel"), Array(11).fill(0));
  assert.deepStrictEqual(readA7c2PpArray(r3(2), "blackLevel"), [0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.strictEqual(readA7c2PpArray(r3(3), "gamma")[1], A7C2_PP_CODES.gamma.Cine4);
  assert.strictEqual(readA7c2PpArray(r3(4), "colorMode")[1], A7C2_PP_CODES.colorMode["Black & White"]);
});

// Lượt mẫu 4 trên PP2, mỗi ô đổi vài tham số với giá trị dễ nhận (M4 chưa lưu nên chưa kiểm)
test("A7C II: round 4 samples confirm the PP parameter layout and encodings", () => {
  const r4 = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run4/CAMPR0${n}P.DAT`)));
  const pp2 = (d: ReturnType<typeof parseA7c2>, k: Parameters<typeof readA7c2PpArray>[1]) => readA7c2PpArray(d, k)[1];
  const m1 = r4(1), m2 = r4(2), m3 = r4(3), m4 = r4(4);
  assert.deepStrictEqual([pp2(m1, "colorMode"), pp2(m1, "saturation"), pp2(m1, "colorPhase"), pp2(m1, "detailLevel")], [A7C2_PP_CODES.colorMode.Pro, 7, -4, -2]);
  assert.deepStrictEqual(
    [pp2(m2, "blackGammaRange"), pp2(m2, "blackGammaLevel"), pp2(m2, "kneeAutoMax"), pp2(m2, "kneeAutoSens"), pp2(m2, "depthR"), pp2(m2, "depthY")],
    [A7C2_PP_CODES.blackGammaRange.Narrow, -5, 9750, A7C2_PP_CODES.kneeAutoSens.High, 6, -6],
  );
  assert.deepStrictEqual([pp2(m3, "kneeMode"), pp2(m3, "kneePoint"), pp2(m3, "kneeSlope"), pp2(m3, "depthG"), pp2(m3, "depthB")], [A7C2_PP_CODES.kneeMode.Manual, 8750, -3, 2, -1]);
  const detail = (["detailVH", "detailBW", "detailLimit", "detailCrisp", "detailHilight", "depthC", "depthM"] as const).map((k) => pp2(m4, k));
  assert.deepStrictEqual(detail, [2, A7C2_PP_CODES.detailBW.Type5, 6, 5, 1, 3, -7]);
});

// Lượt mẫu 5 (từ M4 lượt 4: WB Underwater Auto, ISO AUTO 200–12800, tốc độ tối thiểu Standard):
// M1 ISO AUTO 400–3200 + Fast, M2 WB Auto với A3/M2, M3 WB C.Temp 5600K với B2/G3, M4 PP2 Detail Mode Manual + Tự động xem lại 10 giây.
// Máy giữ thay đổi của ô trước nên mỗi ô so với ô liền trước.
test("A7C II: round 5 samples decode ISO AUTO, Min. SS, white balance and Detail Mode; Auto Review is not stored", () => {
  const r5 = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run5/CAMPR0${n}P.DAT`)));
  const before = parseA7c2(new Uint8Array(readFileSync("test/fixtures/a7c2/run4/CAMPR04P.DAT")));
  const N = A7C2_NUMERIC;
  const iso = (d: ReturnType<typeof parseA7c2>) => [isoFromCode(readA7c2Number(d, N.isoAutoMin)!), isoFromCode(readA7c2Number(d, N.isoAutoMax)!)];
  assert.deepStrictEqual(iso(before), [200, 12800]);
  assert.strictEqual(readA7c2Setting(before, "isoAutoMinSS"), "standard");
  const m1 = r5(1), m2 = r5(2), m3 = r5(3), m4 = r5(4);
  assert.deepStrictEqual(iso(m1), [400, 3200]);
  assert.strictEqual(readA7c2Setting(m1, "isoAutoMinSS"), "fast");
  assert.strictEqual(readA7c2Setting(m2, "wb"), "auto");
  assert.deepStrictEqual([readA7c2Number(m2, N.wbShiftAuto.ab), readA7c2Number(m2, N.wbShiftAuto.gm)], [3000, -2000]); // A3, M2
  assert.strictEqual(readA7c2Setting(m3, "wb"), "c-temp");
  assert.strictEqual(kelvinFromCode(readA7c2Number(m3, N.wbKelvin)!), 5600);
  assert.deepStrictEqual([readA7c2Number(m3, N.wbShiftCTemp.ab), readA7c2Number(m3, N.wbShiftCTemp.gm)], [-2000, 3000]); // B2, G3
  assert.deepStrictEqual([readA7c2PpArray(m3, "detailMode")[1], readA7c2PpArray(m4, "detailMode")[1]], [A7C2_PP_CODES.detailMode.Auto, A7C2_PP_CODES.detailMode.Manual]);
  // Ngoài Detail Mode chỉ 0x017E đổi (bản ghi này đổi ở mọi lần lưu): Tự động xem lại không được lưu
  assert.deepStrictEqual(diffA7c2(m3, m4), [0x017e, ...a7c2PpIds("detailMode")]);
});

// Lượt mẫu 6 (nối tiếp M4 lượt 5): M1 AF-C + Vùng lấy nét Theo dõi: Vùng + ISO AUTO tốc độ tối thiểu 1/125, M2 Pre-AF Bật + flash Đồng bộ sau,
// M3 Đa điểm + Ưu tiên mặt Tắt + WB Tự động + Ưu tiên AWB Trắng, M4 PP1 + Làm mịn da Bật: Trung bình
test("A7C II: round 6 samples decode Pre-AF, flash mode, face priority, AWB priority and PP1", () => {
  const r6 = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run6/CAMPR0${n}P.DAT`)));
  const keys = ["focusMode", "preAF", "flashMode", "metering", "facePriority", "wb", "awbPriority", "pictureProfile"] as const;
  const read = (d: ReturnType<typeof parseA7c2>) => keys.map((k) => readA7c2Setting(d, k));
  const before = parseA7c2(new Uint8Array(readFileSync("test/fixtures/a7c2/run5/CAMPR04P.DAT")));
  assert.deepStrictEqual(read(before), ["AF-A", "off", "autoflash", "spot", "on", "c-temp", "standard", "PP2"]);
  assert.deepStrictEqual(read(r6(1)), ["AF-C", "off", "autoflash", "spot", "on", "c-temp", "standard", "PP2"]);
  assert.deepStrictEqual(read(r6(2)), ["AF-C", "on", "rear-sync", "spot", "on", "c-temp", "standard", "PP2"]);
  assert.deepStrictEqual(read(r6(3)), ["AF-C", "on", "rear-sync", "multi", "off", "auto", "white", "PP2"]);
  assert.deepStrictEqual(read(r6(4)), ["AF-C", "on", "rear-sync", "multi", "off", "auto", "white", "PP1"]);
});

import { readA7c2FocusArea } from "../lib/a7c2/settings.ts";

// Lượt mẫu 7 (nối tiếp M4 lượt 6): M1 Vùng lấy nét Vùng + Làm mịn da Cao, M2 ISO AUTO tốc độ tối thiểu 1/250 + Làm mịn da Thấp + SteadyShot Tắt,
// M3 Cài đặt bù sáng Môi trường & flash + Làm mịn da Tắt, M4 Hiển thị Live View Tắt hiệu ứng cài đặt
test("A7C II: round 7 samples separate focus area, Min. SS speed, soft skin, SteadyShot, Exp.comp.set and Live View", () => {
  const f = (run: number, n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run${run}/CAMPR0${n}P.DAT`)));
  const keys = ["isoAutoMinSSSpeed", "softSkin", "softSkinLevel", "steadyShot", "expCompSet", "liveViewDisplay"] as const;
  const read = (d: ReturnType<typeof parseA7c2>) => [readA7c2FocusArea(d), ...keys.map((k) => readA7c2Setting(d, k))];
  assert.deepStrictEqual(read(f(5, 4)), ["zone", "preset", "on", "low", "on", "ambient-only", "setting-effect-on"]);
  assert.deepStrictEqual(read(f(6, 1)), ["tracking-zone", "1/125", "on", "low", "on", "ambient-only", "setting-effect-on"]);
  assert.deepStrictEqual(read(f(6, 4)), ["tracking-zone", "1/125", "on", "mid", "on", "ambient-only", "setting-effect-on"]);
  assert.deepStrictEqual(read(f(7, 1)), ["zone", "1/125", "on", "high", "on", "ambient-only", "setting-effect-on"]);
  assert.deepStrictEqual(read(f(7, 2)), ["zone", "1/250", "on", "low", "off", "ambient-only", "setting-effect-on"]);
  assert.deepStrictEqual(read(f(7, 3)), ["zone", "1/250", "off", "low", "off", "ambient-flash", "setting-effect-on"]);
  assert.deepStrictEqual(read(f(7, 4)), ["zone", "1/250", "off", "low", "off", "ambient-flash", "setting-effect-off"]);
});

import { readA7c2Exposure } from "../lib/a7c2/settings.ts";

// Lượt mẫu 8 (nối tiếp M4 lượt 7): M1 vòng chế độ P + Làm mịn da Bật (Thấp), M2 A F8 + ISO AUTO tốc độ tối thiểu Chuẩn,
// M3 S 1/250, M4 M F5.6 1/60 ISO 800
test("A7C II: round 8 samples decode shoot mode, aperture, shutter speed and ISO", () => {
  const r8 = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run8/CAMPR0${n}P.DAT`)));
  const prev = parseA7c2(new Uint8Array(readFileSync("test/fixtures/a7c2/run7/CAMPR04P.DAT")));
  // Bật riêng Làm mịn da: ngoài vòng chế độ (0x0B8B, 0x11AC) và 0x017E chỉ 0x0373 đổi, mức vẫn Thấp
  assert.deepStrictEqual(diffA7c2(prev, r8(1)), [0x017e, 0x0373, 0x0b8b, 0x11ac]);
  assert.deepStrictEqual([readA7c2Setting(r8(1), "softSkin"), readA7c2Setting(r8(1), "softSkinLevel")], ["on", "low"]);
  assert.deepStrictEqual([1, 2, 3, 4].map((n) => readA7c2Setting(r8(n), "shootMode")), ["P", "A", "S", "M"]);
  assert.deepStrictEqual([readA7c2Setting(r8(2), "isoAutoMinSS"), readA7c2Setting(r8(2), "isoAutoMinSSSpeed")], ["standard", "preset"]);
  assert.strictEqual(readA7c2Exposure(r8(2))!.aperture, 8);
  assert.strictEqual(readA7c2Exposure(r8(3))!.shutter, "1/250");
  assert.deepStrictEqual(readA7c2Exposure(r8(4)), { aperture: 5.6, shutter: "1/60" });
  const N = A7C2_NUMERIC;
  assert.deepStrictEqual([readA7c2Number(r8(3), N.iso), isoFromCode(readA7c2Number(r8(4), N.iso)!)], [0, 800]);
  assert.deepStrictEqual([3, 4].map((n) => isoFromCode(readA7c2Number(r8(n), N.isoUpper)!)), [3200, 800]);
});

// Lượt mẫu 9 (nối tiếp M4 lượt 8; vài bước được làm sớm hơn ô ghi trong hướng dẫn): M1 MF + Điểm: lớn + flash cưỡng bức + 2" + PP2 Cine3, Phạm vi Rộng
// (kèm Điểm: L, AWB Môi trường, Loại2), M2 AF đơn + Rộng + Trung tâm + 0.5" + Loại1, M3 Điểm: L + TB toàn màn hình + Loại2,
// M4 AF liên tục + Theo dõi: điểm L + Vùng sáng + Loại4
test("A7C II: round 9 samples decode MF/AF-S, metering modes and spot size, focus areas, Fill-flash, AWB Ambience and PP codes", () => {
  const r9 = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run9/CAMPR0${n}P.DAT`)));
  const keys = ["focusMode", "metering", "meteringSpotSize", "awbPriority"] as const;
  const read = (d: ReturnType<typeof parseA7c2>) => [...keys.map((k) => readA7c2Setting(d, k)), readA7c2FocusArea(d)];
  assert.deepStrictEqual(read(r9(1)), ["MF", "spot", "large", "ambience", "spot-l"]);
  assert.deepStrictEqual(read(r9(2)), ["AF-S", "center", "large", "ambience", "wide"]);
  assert.deepStrictEqual(read(r9(3)), ["AF-S", "entire", "large", "ambience", "spot-l"]);
  assert.deepStrictEqual(read(r9(4)), ["AF-C", "highlight", "large", "ambience", "tracking-spot-l"]);
  assert.strictEqual(readA7c2Setting(r9(1), "flashMode"), "fill-flash");
  const C = A7C2_PP_CODES, pp2 = (d: ReturnType<typeof parseA7c2>, k: Parameters<typeof readA7c2PpArray>[1]) => readA7c2PpArray(d, k)[1];
  assert.deepStrictEqual([pp2(r9(1), "gamma"), pp2(r9(1), "blackGammaRange")], [C.gamma.Cine3, C.blackGammaRange.Wide]);
  assert.deepStrictEqual([2, 3, 4].map((n) => pp2(r9(n), "detailBW")), [C.detailBW.Type1, C.detailBW.Type2, C.detailBW.Type4]);
  assert.deepStrictEqual([readA7c2Exposure(r9(1))!.shutter, readA7c2Exposure(r9(2))!.shutter], ['2"', '0.5"']);
});

// Lượt 10d: gọi lại file có số hiển thị S 1/250 và M F4 1/60 nhưng mã APEX 1/2; máy đặt trước S 1/1000, M F11 1/1000.
// Màn hình sau khi gọi lại: M3 S 0.5", M4 M 0.5" → tốc độ lấy từ byte 262, không từ số hiển thị; khẩu độ M4 giữ F11 đang đặt.
test("A7C II: aperture and shutter are the APEX fields at 260/262 of 0x017E", async () => {
  const { applyA7c2 } = await import("../lib/a7c2/apply.ts");
  const r10d = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run10d/CAMPR0${n}P.DAT`)));
  assert.deepStrictEqual(readA7c2Exposure(r10d(3)), { aperture: 5.6, shutter: '0.5"' });
  assert.deepStrictEqual(readA7c2Exposure(r10d(4)), { aperture: 11, shutter: '0.5"' });
  // Lượt 10f (vòng khẩu ống kính ở A, thân máy đặt F11 trước): file ghi F5.6 mã ống kính 5381 (M2) và mã chuẩn 5376 (M4), máy hiện F5.6 cả hai
  const r10f = (n: number) => parseA7c2(new Uint8Array(readFileSync(`test/fixtures/a7c2/run10f2/CAMPR0${n}P.DAT`)));
  assert.deepStrictEqual([2, 4].map((n) => readA7c2Exposure(r10f(n))!.aperture), [5.6, 5.6]);
  const base = new Uint8Array(readFileSync("test/fixtures/a7c2/run9/CAMPR03P.DAT"));
  const out = parseA7c2(applyA7c2(base, { mode: "M", aperture: 4, shutter: "1/250" }));
  assert.deepStrictEqual(readA7c2Exposure(out), { aperture: 4, shutter: "1/250" });
  const r = out.records.find((x) => x.id === 0x017e)!.value, u16 = (o: number) => r[o] | (r[o + 1] << 8);
  assert.deepStrictEqual([260, 272, 262, 274, 288, 290, 292].map(u16), [5120, 5120, 6144, 6144, 400, 1, 250]);
});
