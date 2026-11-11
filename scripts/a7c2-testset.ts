// Tạo bộ cài đặt kiểm tra cho A7C II Memory Recall (M1–M4).
// Cách dùng: node --experimental-strip-types scripts/a7c2-testset.ts [outDir]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { buildSetA7c2 } from "../lib/a7c2/apply.ts";
import { parseA7c2 } from "../lib/a7c2/dat.ts";
import {
  readA7c2Setting,
  readA7c2Number,
  readA7c2Exposure,
  readA7c2PpArray,
  readA7c2FocusArea,
  A7C2_NUMERIC,
  A7C2_SETTINGS,
  isoFromCode,
  kelvinFromCode,
  A7C2_PP_CODES,
} from "../lib/a7c2/settings.ts";
import type { A7c2SlotSettings } from "../lib/a7c2/apply.ts";

const outDir = process.argv[2] || "/tmp/a7c2-testset";
const outPath = `${outDir}/PRIVATE/SONY/SETTING/7CM2`;

// Read base files
const bases = [
  new Uint8Array(readFileSync("test/fixtures/a7c2/run9/CAMPR01P.DAT")),
  new Uint8Array(readFileSync("test/fixtures/a7c2/run9/CAMPR02P.DAT")),
  new Uint8Array(readFileSync("test/fixtures/a7c2/run9/CAMPR03P.DAT")),
  new Uint8Array(readFileSync("test/fixtures/a7c2/run9/CAMPR04P.DAT")),
];

// Test set (M1–M4), lượt 10b (lượt 10e: cùng cài đặt, khẩu độ/tốc độ ghi vào mã APEX 260/262): mỗi mục còn nghi máy không gọi lại đổi giá trị ở mọi ô so với ô trước
// và so với trạng thái máy sau lượt 10 (mặt Tắt, Live View Tắt, da Bật Thấp, flash Fill, Pre-AF Tắt, AWB Môi trường, chỉ môi trường, 1/125, PP1 màu Cinema bão hòa +3).
const settings: A7c2SlotSettings[] = [
  // M1
  {
    mode: "P",
    focus: "AF-S",
    focusArea: "wide",
    metering: "multi",
    facePriority: "on",
    wb: { mode: "awb", ab: 0, gm: 0 },
    awbPriority: "standard",
    ppOn: true,
    pp: { gamma: "Movie", color_mode: "Movie", saturation: -2 },
    softSkin: "off",
    flashMode: "rear-sync",
    expCompSet: "ambient-flash",
    preAF: "on",
    steadyShot: "on",
    liveView: "setting-effect-on",
    iso: "auto",
    isoAutoMinSS: "standard",
  },
  // M2
  {
    mode: "A",
    aperture: 8,
    focus: "AF-C",
    focusArea: "tracking-zone",
    metering: "spot-large",
    facePriority: "off",
    wb: { mode: "ctemp", kelvin: 5600, ab: 2, gm: -1 },
    awbPriority: "white",
    ppOn: true,
    pp: { gamma: "Cine4", color_mode: "Cinema", saturation: 3 },
    softSkin: "high",
    flashMode: "fill-flash",
    expCompSet: "ambient-only",
    preAF: "off",
    steadyShot: "off",
    liveView: "setting-effect-off",
    iso: "auto",
    isoAutoMinSS: "1/250",
  },
  // M3
  {
    mode: "S",
    shutter: "1/250",
    iso: 800,
    focus: "AF-S",
    focusArea: "zone",
    metering: "center",
    facePriority: "on",
    wb: { mode: "awb", ab: -1, gm: 1 },
    awbPriority: "standard",
    ppOn: true,
    pp: { gamma: "Still", color_mode: "Still", saturation: -1, black_level: 2 },
    softSkin: "mid",
    flashMode: "rear-sync",
    expCompSet: "ambient-flash",
    preAF: "on",
    steadyShot: "on",
    liveView: "setting-effect-on",
    isoAutoMinSS: "standard",
  },
  // M4
  {
    mode: "M",
    aperture: 4,
    shutter: "1/60",
    iso: 400,
    focus: "AF-C",
    focusArea: "tracking-flexible-spot-l",
    metering: "highlight",
    facePriority: "off",
    wb: { mode: "ctemp", kelvin: 3200, ab: 0, gm: 0 },
    awbPriority: "ambience",
    ppOn: false,
    softSkin: "low",
    flashMode: "fill-flash",
    expCompSet: "ambient-only",
    preAF: "off",
    steadyShot: "off",
    liveView: "setting-effect-off",
    isoAutoMinSS: "1/125",
  },
];

// Build
const result = buildSetA7c2(bases, settings, "P");

// Write files
mkdirSync(outPath, { recursive: true });
for (const set of result) {
  const filePath = `${outPath}/${set.name}`;
  writeFileSync(filePath, set.data);
}

console.log(`ファイル保存しました: ${outPath}/`);

// Read back and print settings
console.log("\nDecoded settings:\n");

const slotNames = ["M1", "M2", "M3", "M4"];
for (let i = 0; i < 4; i++) {
  const dat = parseA7c2(result[i].data);
  console.log(`${slotNames[i]}:`);

  // Mode
  const mode = readA7c2Setting(dat, "shootMode");
  console.log(`  mode: ${mode}`);

  // Exposure
  const exp = readA7c2Exposure(dat);
  if (exp) {
    console.log(`  aperture: ${exp.aperture}`);
    console.log(`  shutter: ${exp.shutter}`);
  }
  const isoCode = readA7c2Number(dat, A7C2_NUMERIC.iso);
  const iso = isoCode === 0 ? "auto" : isoFromCode(isoCode || 0);
  console.log(`  iso: ${iso}`);

  // Focus
  console.log(`  focus: ${readA7c2Setting(dat, "focusMode")}`);
  console.log(`  focusArea: ${readA7c2FocusArea(dat)}`);

  // Metering & spot size
  const metering = readA7c2Setting(dat, "metering");
  console.log(`  metering: ${metering}`);
  if (metering === "spot") {
    const spotSize = readA7c2Setting(dat, "meteringSpotSize");
    console.log(`  meteringSpotSize: ${spotSize}`);
  }

  // WB
  const wbMode = readA7c2Setting(dat, "wb");
  console.log(`  wb: ${wbMode}`);
  if (wbMode === "c-temp") {
    const kelvinCode = readA7c2Number(dat, A7C2_NUMERIC.wbKelvin);
    console.log(`    kelvin: ${kelvinFromCode(kelvinCode || 0)}`);
  }
  // WB shifts in site convention (negate gm to convert from file format)
  const shiftRecords = wbMode === "c-temp" ? A7C2_NUMERIC.wbShiftCTemp : A7C2_NUMERIC.wbShiftAuto;
  if (shiftRecords) {
    const abVal = readA7c2Number(dat, shiftRecords.ab);
    const gmVal = readA7c2Number(dat, shiftRecords.gm);
    if (abVal !== null || gmVal !== null) {
      const ab = (abVal || 0) / 1000;
      const gm = -(gmVal || 0) / 1000;
      const abStr = ab > 0 ? `A${Math.abs(ab)}` : ab < 0 ? `B${Math.abs(ab)}` : "0";
      const gmStr = gm > 0 ? `M${Math.abs(gm)}` : gm < 0 ? `G${Math.abs(gm)}` : "0";
      console.log(`    shift: ${abStr} ${gmStr}`);
    }
  }

  // Other settings
  console.log(`  facePriority: ${readA7c2Setting(dat, "facePriority")}`);
  console.log(`  awbPriority: ${readA7c2Setting(dat, "awbPriority")}`);
  console.log(`  flashMode: ${readA7c2Setting(dat, "flashMode")}`);
  console.log(`  expCompSet: ${readA7c2Setting(dat, "expCompSet")}`);
  console.log(`  preAF: ${readA7c2Setting(dat, "preAF")}`);
  console.log(`  steadyShot: ${readA7c2Setting(dat, "steadyShot")}`);
  console.log(`  liveView: ${readA7c2Setting(dat, "liveViewDisplay")}`);
  console.log(`  softSkin: ${readA7c2Setting(dat, "softSkin")}`);
  const softSkinLevel = readA7c2Setting(dat, "softSkinLevel");
  if (softSkinLevel) console.log(`    level: ${softSkinLevel}`);
  console.log(`  isoAutoMinSS: ${readA7c2Setting(dat, "isoAutoMinSS")}`);
  const speedCode = readA7c2Number(dat, A7C2_SETTINGS.isoAutoMinSSSpeed.ids);
  if (speedCode && speedCode > 0) {
    const speeds = ["preset", "", "", "", "", "1/8000", "1/4000", "1/2000", "1/1000", "1/500", "1/250", "1/125", "1/60", "1/30", "1/15", "1/8", "1/4", "1/2", "1\"", "2\"", "4\"", "8\"", "15\"", "30\""];
    console.log(`    speed: ${speeds[speedCode] || speedCode}`);
  }

  // PP
  const ppSetting = readA7c2Setting(dat, "pictureProfile");
  console.log(`  pictureProfile: ${ppSetting}`);
  const dro = readA7c2Setting(dat, "dro");
  if (ppSetting !== "off" || dro) console.log(`    dro: ${dro}`);

  // PP1 params
  if (ppSetting !== "off") {
    const gamma = readA7c2PpArray(dat, "gamma");
    const colorMode = readA7c2PpArray(dat, "colorMode");
    const saturation = readA7c2PpArray(dat, "saturation");
    const blackLevel = readA7c2PpArray(dat, "blackLevel");

    // Find labels
    const findLabel = (codeMap: Record<string, number>, code: number) =>
      Object.entries(codeMap).find(([, v]) => v === code)?.[0] || String(code);

    if (gamma[0] !== undefined) {
      const label = findLabel(A7C2_PP_CODES.gamma, gamma[0]);
      console.log(`    pp1_gamma: ${label}`);
    }
    if (colorMode[0] !== undefined) {
      const label = findLabel(A7C2_PP_CODES.colorMode, colorMode[0]);
      console.log(`    pp1_colorMode: ${label}`);
    }
    if (saturation[0] !== undefined) console.log(`    pp1_saturation: ${saturation[0]}`);
    if (blackLevel[0] !== undefined) console.log(`    pp1_blackLevel: ${blackLevel[0]}`);
  }

  console.log();
}
