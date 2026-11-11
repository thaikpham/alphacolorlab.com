// Product Wiki specs, read from sony.jp: spec tables, product pages and the listing feeds that name each category's products.
// Run from the repo root: node --experimental-strip-types scripts/product-specs.ts
// Every response is cached in SONYJP_CACHE (default .cache/sonyjp); a 404 is kept as a .404 marker, a picture that exists as .ok.
// Only uncached URLs are requested, one per second. Writes data/products.json and prints counts per kind and group,
// skipped codes with their reasons, unmapped Japanese values and failures.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const CACHE = process.env.SONYJP_CACHE ?? ".cache/sonyjp";
const SITE = "https://www.sony.jp";
const UA = "Mozilla/5.0 (compatible; sony-vn-catalog-research)";
const ACTIVE = 9999999999999; // retirementDateTime sentinel for products still on sale
const LENSES = "SEL1224GM SEL1224G SEL1625G SEL1635GM2 SEL1635GM SEL1635Z SELP1635G SEL2070G SEL2450G SEL2470GM2 SEL2470GM SEL2470Z SEL24105G SEL24240 SEL2860 SEL2870GM SEL28702 SELP28135G SEL50150GM SEL70200GM2 SEL70200GM SEL70200G2 SEL70200G SEL70300G SEL100400MC SEL100400GM SEL100400 SEL200600G SEL400800G SELP1020G SELP16502 SEL1655G SELP18105G SELP18110G SEL18135 SEL18200LE SELP18200 SEL55210 SEL70350G SEL14F18GM SEL16F18G SEL20F18G SEL24F14GM SEL24F28G SEL28F20 SEL35F14GM SEL35F14Z SEL35F18F SEL35F28Z SEL40F25G SEL50F12GM SEL50F14GM SEL50F14Z SEL50F18F SEL50F25G SEL55F18Z SEL85F14GM2 SEL85F14GM SEL85F18 SEL100F28GM SEL135F18GM SEL300F28GM SEL400F28GM SEL400F45GM SEL600F40GM SEL600F63GM SEL11F18 SEL15F14G SEL16F28 SEL20F28 SEL24F18Z SEL35F18 SEL50F18 SEL100M28GM SEL50M28 SEL90M28G SEL30M35 SEL814G SEL1018 SEL1670Z SELP1650 SEL2870".split(" ");
// Codes whose og:image is a variant but www.sony.jp/products/picture/<code>.jpg exists (HTTP 200, checked 2026-11-09).
const EXACT_IMAGE = new Set(["ILCE-6100", "ILCE-6600", "ZV-E10", "ZV-E10M2", "DSC-RX0M2", "ZV-1M2", "ZV-1F", "ILCE-7M3", "ILCE-7CM2", "ILCE-7CR", "ZV-E1"]);
// Japanese names on sony.jp; these are lens accessories, not lenses
const CONVERTERS: Record<string, string> = {
  SEL14TC: "1.4x Teleconverter", SEL20TC: "2x Teleconverter",
  SEL057FEC: "Fisheye Converter SEL057FEC", SEL075UWC: "Ultra Wide Converter SEL075UWC",
  "VCL-ECF2": "Fisheye Converter VCL-ECF2", "VCL-ECU2": "Ultra Wide Converter VCL-ECU2",
};
const BODIES: Record<string, string> = {
  ichigan: "ILCE-1M2 ILCE-1 ILCE-9M3 ILCE-9M2 ILCE-9 ILCE-7RM3A ILCE-7S ILCE-7RM6 ILCE-7RM5 ILCE-7RM4A ILCE-7SM3 ILCE-7M5 ILCE-7M4 ILCE-7M3 ILCE-7CR ILCE-7CM2 ILCE-7C ILCE-6700 ILCE-6600 ILCE-6400 ILCE-6100 ZV-E1 ZV-E10M2 ZV-E10",
  vlogcam: "ZV-1M2 ZV-1F",
  "cyber-shot": "DSC-RX10M5 DSC-RX1RM2 DSC-HX99 DSC-W830 DSC-RX100M7 DSC-RX100M6 DSC-RX100M5A DSC-RX10M4 DSC-RX1RM3 DSC-RX0M2",
};

// Candidate sources (new this pass). Feed categories are sony.jp's own labels; the first matching rule wins.
const CODE_GROUP: [RegExp, string][] = [
  [/^XLR-/, "xlr"], [/^BC-/, "charger"], [/^DC-|^VF-DCPL/, "dc-coupler"], [/^NP-/, "battery"],
  [/^ECM-|^C-\d/, "mic"], [/^RMT-|^RM-/, "remote"], [/^HVL-/, "flash"], [/^CLM-/, "monitor"],
  [/^FDA-/, "viewfinder"], [/^ACC-/, "other"], [/^(MRW|QDA)/, "card-reader"], [/^SL-/, "storage"],
];
const CATEGORY_GROUP: [RegExp, string][] = [
  [/マイクロホン/, "mic"], [/ポータブルデータトランスミッター/, "wireless"], [/フラッシュ/, "flash"],
  [/リモートコマンダー/, "remote"], [/バッテリー/, "battery"], [/グリップ/, "grip"], [/LCDモニター/, "monitor"],
  [/ファインダー/, "viewfinder"], [/マウントアダプター|シューアダプター/, "adapter"],
  [/ケース|レンズフード|ストラップ|レインカバー|液晶アクセサリー/, "case"], [/三脚/, "tripod"],
];
const MEDIA_NOT_IN_SCOPE = /^(DVM|DMR|DMW|BNE|BNR|5BNR|MDW|MMD)/; // tapes, optical discs and MiniDisc (録音用ミニディスク, MD DATA)
const CAMERA_CARD = /^(ILCE|ILME|ZV-|DSC-|PXW|VENICE)/; // camera bodies listed as compatibility cards in the accessory feed
const CAMPAIGN = /スペシャル|コンテンツ|情報を掲/;
const FAMILY = /シリーズ|\.\.\.|\//; // family pages and multi-model pages, not one product
const CODE = /^[A-Z0-9][A-Z0-9_\-]*$/;

// Japanese spec values to codes; the Vietnamese labels live in app/content.ts. A value not in a table is left out and listed at the end.
const MOUNT: Record<string, string> = { "Eマウント": "e-mount" };
// The first key found in the value wins, so a combined value (2Way, switchable) comes before the single types it contains.
const MIC_TYPE: Record<string, string> = { "2Way方式マイクロホン": "2-way", "エレクトレットコンデンサー型": "electret-condenser", "コンデンサー型マイクロホン": "condenser", "ダイナミック型": "dynamic" };
const MIC_PATTERN: Record<string, string> = { "単一指向性/全指向性/両指向性": "switchable", "全指向性": "omni", "無指向性": "omni", "単一指向性": "uni", "超指向性": "super", "スーパーカーディオイド": "super", "双指向性": "bi", "両指向性": "bi" };
const HP_TYPE: Record<string, string> = { "密閉ダイナミック": "closed-dynamic", "オープンバックダイナミック": "open-back-dynamic", "開放": "open", "密閉": "closed" };
const unmapped = new Set<string>();
// "-" is sony.jp's empty cell: left out without being listed as unmapped.
const coded = (table: Record<string, string>, tag: string) => (v?: string) => {
  if (v === undefined || v === "-") return undefined;
  const hit = Object.entries(table).find(([jp]) => v.includes(jp))?.[1];
  if (!hit) unmapped.add(`${tag}: ${v}`);
  return hit;
};

type Row = { section: string; label: string; value: string };
type Rec = Record<string, any>;
type Cand = { code: string; name: string; url: string; from: "cinema" | "headphone" | "mic" | "rec-media" | "feed" | "extra"; cats: string[]; retired: boolean };

const skipped: string[] = [];
const notes: string[] = [];
const note = (msg: string) => { notes.push(msg); console.log("  note:", msg); };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const keyOf = (url: string) => `${CACHE}/${Buffer.from(url).toString("base64").replace(/\//g, "_")}`;

// Cached GET. A 404 is remembered in a .404 marker and returns null; other errors throw.
async function fetchBytes(url: string): Promise<Buffer | null> {
  const key = keyOf(url);
  if (existsSync(`${key}.html`) && statSync(`${key}.html`).size > 1000) return readFileSync(`${key}.html`);
  if (existsSync(`${key}.404`)) return null;
  await sleep(1000); // one request per second
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  mkdirSync(CACHE, { recursive: true });
  if (res.status === 404) { writeFileSync(`${key}.404`, ""); return null; }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`${key}.html`, buf);
  return buf;
}

// HTML falls back to shift_jis (charset from the meta tag when present); JSON to utf-8.
async function textOf(url: string, fallback = "shift_jis"): Promise<string | null> {
  const buf = await fetchBytes(url);
  if (!buf) return null;
  const charset = buf.subarray(0, 4000).toString("latin1").match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ?? fallback;
  return new TextDecoder(charset).decode(buf);
}

async function page(url: string): Promise<string> {
  const html = await textOf(url);
  if (html === null) throw new Error(`404 ${url}`);
  return html;
}

// Picture check (HEAD, cached as .ok or .404 so a re-run makes no request).
async function alive(url: string): Promise<boolean> {
  const key = keyOf(url);
  if (existsSync(`${key}.ok`)) return true;
  if (existsSync(`${key}.404`)) return false;
  await sleep(1000);
  const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(res.status === 200 ? `${key}.ok` : `${key}.404`, "");
  return res.status === 200;
}

const clean = (h: string) =>
  h.replace(/<[^>]+>/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&times;/g, "×")
    .replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").normalize("NFKC").replace(/\s+/g, " ").trim();

function rows(html: string): Row[] {
  const out: Row[] = [];
  let section = "";
  for (const [, tr] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(([, c]) => clean(c));
    if (cells.length === 1) section = cells[0];
    else if (cells.length > 1) out.push({ section, label: cells.slice(0, -1).join(" "), value: cells.at(-1)! });
  }
  return out;
}

const num = (s: string | null | undefined) => (s ? Number(s.replace(/,/g, "")) : null);
const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function lens(code: string, r: Row[], top: string) {
  const v = (re: RegExp) => r.find((x) => re.test(x.label))?.value ?? null;
  let name = v(/^名称/)!.replace(/(\d) mm/g, "$1mm").replace(/^(E|FE)(?=\d)/, "$1 ").replace(/mmF/, "mm F");
  const series = /GM\d?$/.test(code) || /\bGM\b/.test(name) ? "GM" : /G\d?$/.test(code) || /\bG\b/.test(name) ? "G" : /Z$/.test(code) ? "ZEISS" : "standard";
  if (series === "G" && !/\bG\b/.test(name)) name += " G"; // sony.jp drops the G from a few names (FE 12-24mm F4 G)
  const f = (s: string | null) => s?.replace(/F/g, "").replace(/(\d)\.0\b/g, "$1") ?? null;
  const [focalMin, focalMax = focalMin] = v(/^焦点距離(?!イメージ)/)!.replace(/mm/g, "").split("-").map(Number);
  const oss = /レンズ内/.test(v(/^手ブレ補正$/) ?? "");
  const filter = v(/^フィルター径/) ?? "";
  const front = filter.match(/^(\d+(?:\.\d+)?)/)?.[1];
  // Super-teles take only a 40.5 mm drop-in filter at the rear; "95/40.5(差し込み…)" = front 95 + drop-in 40.5
  const dropIn = /差し込み/.test(filter) ? filter.match(/\/(\d+(?:\.\d+)?)/)?.[1] : focalMin >= 300 && front === "40.5" ? front : undefined;
  const [diameterMm, lengthMm] = (v(/^外形寸法/) ?? "").match(/[\d.]+/g)?.map(Number) ?? [];
  const modes = Math.max(0, ...[...top.matchAll(/(?:MODE|モード)\s?([23])/g)].map((m) => +m[1])) || null;
  return {
    name, kind: "lens", group: /フルサイズ/.test(v(/対応撮像画面サイズ/) ?? "") ? "full-frame" : "aps-c",
    specs: {
      focalMin, focalMax, zoom: focalMin !== focalMax,
      apertureMax: f(v(/^開放絞り/)), apertureMin: f(v(/^最小絞り/)),
      oss, ossModes: oss ? modes : null, powerZoom: /\bPZ\b/.test(name),
      series,
      weightG: num(v(/^質量/)?.match(/[\d,]+/)?.[0]), diameterMm, lengthMm,
      filterMm: dropIn === front && dropIn ? null : num(front), rearFilterMm: num(dropIn),
    },
  };
}

function camera(code: string, site: string, r: Row[], title: string, top: string) {
  const find = (re: RegExp, val?: RegExp) => r.find((x) => re.test(x.label) && (!val || val.test(x.value)))?.value ?? null;
  const name = title.split("主な仕様")[0].replace(/^VLOGCAM |^DSC-/g, "").replace(/\(.*\)/, "").replace(/α/g, "A").trim().replace(/^(RX\d+R?)([IVX]+)$/, "$1 $2")
    + (/M\dA$/.test(code) && !/A$/.test(title.split("主な仕様")[0].replace(/\(.*\)/, "").trim()) ? "A" : ""); // ILCE-7RM4A = A7R IVA
  const sensor = find(/撮像素子|イメージセンサー|センサー/, /CMOS|CCD/) ?? "";
  const exmor = sensor.match(/Exmor\s*([A-Z]*)\s*CMOS/);
  const format = /フルサイズ/.test(sensor) ? "full-frame" : /APS-C/.test(sensor) ? "aps-c" : sensor.match(/([\d./]+)型/)?.[1]?.concat(" inch") ?? null;
  const v4k = new Set<number>(), v1080 = new Set<number>();
  for (const x of r) {
    if (!/動画記録|動画撮影モード/.test(`${x.section} ${x.label}`)) continue;
    const t = `${x.label} ${x.value}`.replace(/(\d),(\d{3})/g, "$1$2");
    // "3840x2160/30p, 24p" lists rates right after the size; otherwise rates follow until the next size
    const slash = /\d{4}\s*[x×]\s*\d{3,4}\//.test(t);
    const res = [...t.matchAll(slash ? /(\d{4})\s*[x×]\s*(\d{3,4})\/([\d.p, ]+)/g : /(\d{4})\s*[x×]\s*(\d{3,4})/g)];
    res.forEach((m, i) => {
      const set = m[2] === "2160" ? v4k : m[1] === "1920" && m[2] === "1080" ? v1080 : null;
      const seg = slash ? m[3] : t.slice(m.index! + m[0].length, res[i + 1]?.index ?? t.length);
      // PAL rates (25/50/100p) mirror the NTSC ones most sony.jp pages list, so keep NTSC only
      for (const [, f] of seg.matchAll(/(\d+(?:\.\d+)?)p\b/g)) if (![25, 50, 100].includes(+f)) set?.add(Math.round(+f));
    });
  }
  const stab = r.filter((x) => /手ブレ補正/.test(`${x.section} ${x.label}`)).map((x) => x.value).join(" ");
  const mpRow = r.find((x) => /有効画素数/.test(x.label));
  const mpText = mpRow ? `${mpRow.label} ${mpRow.value}` : "";
  const mp = mpText.match(/静止画[^万]*?([\d,]+)万画素/)?.[1] ?? (/動画時/.test(mpText) ? null : mpText.match(/([\d,]+)万画素/)?.[1]);
  const lcd = (t: string | null, unit: string) => num((t?.match(new RegExp(`液晶モニタ[^約\\d]*約?\\s*([\\d,]+)\\s*${unit}`)) ?? t?.match(new RegExp(`([\\d,]+)\\s*${unit}`)))?.[1]);
  let weightG: number | null = null, weightWithBatteryG: number | null = null;
  for (const x of r.filter((x) => /質量/.test(`${x.section} ${x.label}`))) {
    const first = num(x.value.match(/[\d,]+(?=\s*g)/)?.[0]);
    if (/本体のみ|本体質量/.test(x.label)) weightG ??= first;
    else if (/バッテリー|総質量/.test(x.label)) weightWithBatteryG ??= first;
    else { weightWithBatteryG ??= first; weightG ??= num(x.value.match(/([\d,]+)\s*g\s*\(本体のみ\)/)?.[1]); }
  }
  const dims = (find(/外形寸法/) ?? "").match(/([\d.]+)[^\d.x×]{0,14}[x×]\s*([\d.]+)[^\d.x×]{0,14}[x×]\s*([\d.]+)/);
  const chip = `${r.map((x) => x.value).join(" ")} ${top}`.replace(/BIONZ\s*/g, "BIONZ ");
  const processor = chip.match(/BIONZ\s?XR2/)?.[0] ?? chip.match(/BIONZ\s?XR/)?.[0] ?? chip.match(/BIONZ\s?X\b/)?.[0] ?? null;
  return {
    name, kind: "camera",
    group: site === "ichigan" ? format : "compact",
    specs: {
      processor: processor && (/AIプロセッシングユニット/.test(top) ? `${processor} + AI Processing Unit` : processor),
      sensorFormat: format, sensorType: exmor ? ["Exmor", exmor[1], "CMOS"].filter(Boolean).join(" ") : sensor.match(/CMOS|CCD/)?.[0] ?? null,
      sensorSize: sensor.match(/\(([\d.]+)\s*[x×]\s*([\d.]+)\s*mm\)/)?.slice(1, 3).join(" x ") ?? null,
      megapixels: mp ? Math.round(num(mp)! / 10) / 10 : null,
      video4k: [...v4k].sort((a, b) => b - a), video1080: [...v1080].sort((a, b) => b - a),
      battery: (find(/電池|バッテリーシステム/, /NP-/) ?? find(/付属品/, /NP-/))?.match(/NP-[A-Z0-9]+/)?.[0] ?? null,
      shots: lcd(find(/静止画撮影可能枚数|静止画撮影時/), "枚"), videoMin: lcd(find(/実動画撮影時|実撮影時間/), "分"),
      stabilization: /イメージセンサーシフト/.test(stab) ? "ibis" : /光学/.test(stab) ? "optical" : /電子式/.test(stab) ? "electronic" : "none",
      weightG, weightWithBatteryG, dimensionsMm: dims ? dims.slice(1, 4).map(Number) : null,
    },
  };
}

// Helpers for the candidates added this pass: values come back in Vietnamese-ready codes, missing fields stay undefined.
const first = (r: Row[], re: RegExp) => r.find((x) => re.test(x.label))?.value;
const grams = (v?: string) => {
  const m = v?.match(/([\d.,]+)\s*(kg|g)(?![a-z])/i);
  return m ? Math.round(Number(m[1].replace(/,/g, "")) * (m[2].toLowerCase() === "kg" ? 1000 : 1)) : undefined;
};
const numberOf = (v?: string) => { const n = v?.match(/\d+(?:\.\d+)?/)?.[0]; return n ? Number(n) : undefined; };
const capacityGb = (v?: string) => {
  const m = v?.match(/([\d.]+)\s*(GB|TB)/i);
  return m ? Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1000 : 1) : undefined;
};
const present = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));
// Label lines outside tables (top pages and feature pages): "label：value" per line; block ends and <br> split the lines.
function specLines(html: string): Row[] {
  const out: Row[] = [];
  for (const seg of html.replace(/<(?:br|\/p|\/li|\/dt|\/dd|\/div|\/h\d|\/tr)\b[^>]*>/gi, "\n").split("\n")) {
    const m = clean(seg).match(/^([^:]{1,24}):\s*(.+)$/);
    if (m) out.push({ section: "", label: m[1].trim().split(" ").at(-1)!, value: m[2] });
  }
  return out;
}
// "幅70×高さ33×奥行95mm", "19mm×66mm×30mm、質量(約):19g", "幅 78.5 X 高さ 86.5 X 奥行き 44.5": three figures in order
const sizeMm = (v?: string) => {
  const m = v?.match(/([\d.]+)\s*(?:mm)?\s*[xX×]\s*(?:高さ|幅|奥行(?:き)?)?\s*([\d.]+)\s*(?:mm)?\s*[xX×]\s*(?:高さ|幅|奥行(?:き)?)?\s*([\d.]+)/);
  return m ? [m[1], m[2], m[3]].map(Number) : undefined;
};
// Two figures are diameter × length: "最大径x長さ (mm) 66.0 x 31.7", "最大外形寸法(約)直径 21×長さ 217 mm"
const diameterLengthMm = (v?: string) => {
  const m = v?.match(/(?:直径|最大径[^\d]{0,10})\s*([\d.]+)\s*(?:mm)?\s*[xX×]\s*(?:長さ\s*)?([\d.]+)/);
  return m ? { diameterMm: Number(m[1]), lengthMm: Number(m[2]) } : undefined;
};
// Three figures are dimensionsMm; two are diameterMm and lengthMm (the lens fields); nothing else is invented
const hardwareSize = (v?: string): Record<string, unknown> => {
  const three = sizeMm(v);
  return three ? { dimensionsMm: three } : diameterLengthMm(v) ?? {};
};
// "約150分で満充電"; "2個を同時に約155分で急速充電" is a two-battery figure, so it is left out
const chargeMin = (t: string) => {
  for (const m of t.matchAll(/(\d+)分で(?:満充電|急速充電)/g)) if (!/同時に\s*約?$/.test(t.slice(Math.max(0, m.index! - 8), m.index))) return Number(m[1]);
  return undefined;
};
// Memory-card and SSD series page: capacities from variant lines "SF-M128 （128GB SDXC UHS-II …）", "SF-64UZ (64GB …" or the
// spec table "【CEA-M960T】 960GB" / "CEB-G480T:480GB"; a variant line followed by 販売終了 or 生産完了 is left out.
// Card type and UHS bus come from the page heading "SDXC/SDHC UHS-II メモリーカード" (compatibility lists name other cards).
function seriesSpecs(prodText: string) {
  const variants = [...prodText.matchAll(/([A-Z]{2,4}-[A-Z]{0,2}\d+[A-Z]{0,2})\s*】?\s*[:：（(]?\s*(\d+)\s*(GB|TB)/g)];
  const capacitiesGb = [...new Set(variants.filter((m, i) => {
    const after = prodText.slice(m.index! + m[0].length, variants[i + 1]?.index ?? m.index! + m[0].length + 40);
    return !/販売終了|生産完了/.test(after.slice(0, 40));
  }).map((m) => capacityGb(`${m[2]}${m[3]}`)!))];
  const read = prodText.match(/(?:最大読み出し|読み出し最大|高速読み出し)[^\d]{0,12}([\d.]+)\s*MB\/s/)?.[1];
  const write = prodText.match(/(?:最大書き込み|書き込み最大|高速書き込み)[^\d]{0,12}([\d.]+)\s*MB\/s/)?.[1];
  // The page header is a card type followed by its series name ("SDXC/SDHC UHS-I メモリーカード SF-UZシリーズ 記録メディア").
  // Related-product lists and the ポータブルSSD header of SL-M do not match this pattern.
  const heading = prodText.match(/(CFexpress Type [AB]|SDXC(?:\/SDHC)?)(?: (UHS-I+))?\s*メモリーカード\s*(?:【[^】]*】\s*)?[A-Z]{2,4}-[A-Z0-9]{1,6}シリーズ(?: (?:タフ仕様|生産完了|販売終了))* 記録メディア/);
  return present({
    capacitiesGb: capacitiesGb.length ? capacitiesGb : undefined,
    cardType: heading?.[1],
    uhsBus: heading?.[2],
    uhsSpeedClass: numberOf(prodText.match(/UHSスピードクラス\s*(\d)/)?.[0]),
    speedClass: /Class\s?10\b/.test(prodText) ? 10 : undefined,
    readMBs: numberOf(read), writeMBs: numberOf(write),
  });
}

function cinemaSpecs(r: Row[]) {
  const cam = r.filter((x) => !x.section.startsWith("レンズ")); // bundled lens sections are not part of the body
  const v = (re: RegExp) => cam.find((x) => re.test(x.label))?.value;
  const sensor = v(/撮像素子|イメージセンサー/) ?? "";
  // Pixels: label カメラ有効画素数 or 画素数, value "静止画時: 約1210万画素、動画時: …" or "総画素数: …、有効画素数: 約1026万画素"
  const pixels = cam.find((x) => /有効画素数|^画素数/.test(x.label) && /万画素/.test(x.value))?.value ?? "";
  // Still-image figure first (value "動画: 約2010万画素、静止画: 約2600万画素" is 26 MP for stills); "最大約" is accepted
  const mp = pixels.match(/(?:静止画(?:時)?|有効画素数)[:：]\s*(?:最大)?約?\s*([\d,]+)\s*万画素/)?.[1] ?? (/動画/.test(pixels) ? undefined : pixels.match(/^(?:最大)?約?\s*([\d,]+)\s*万画素/)?.[1]);
  // Weight: sony.jp lists アクセサリー含む, バッテリーとメモリカードを含む and 本体のみ as rows under one 質量 heading; the body-only row is kept
  const mass = cam.filter((x) => /質量/.test(`${x.section} ${x.label}`));
  const body = mass.find((x) => /本体/.test(`${x.section} ${x.label}`)) ?? mass.find((x) => /質量/.test(x.label));
  // A value may list two figures: "646 g(電池、メモリーカード含む)、562 g(本体のみ)" -> the 本体のみ figure is used
  const bodyTagged = body?.value.match(/[\d.,]+\s*(?:kg|g)(?![a-z])\s*[（(]本体のみ[）)]/i)?.[0];
  // Dimensions: "129.7 mm x 77.8 mm x 84.5 mm" and "114x116x153mm" both occur
  const dims = v(/外形寸法/)?.match(/([\d.]+)[^\d.x×]{0,14}[x×]\s*([\d.]+)[^\d.x×]{0,14}[x×]\s*([\d.]+)/);
  return present({
    mount: coded(MOUNT, "mount")(v(/レンズマウント|マウント/)),
    sensorFormat: /フルサイズ/.test(sensor) ? "full-frame" : /Super\s?35|スーパー35/i.test(sensor) ? "super-35" : /APS-C/.test(sensor) ? "aps-c" : undefined,
    sensorType: sensor.match(/CMOS|CCD/)?.[0],
    megapixels: mp ? Math.round(num(mp)! / 10) / 10 : undefined,
    weightG: grams(bodyTagged ?? body?.value),
    dimensionsMm: dims ? dims.slice(1, 4).map(Number) : undefined,
  });
}

// Cinema pages with no spec table (ILME-FR7, PXW-FX9, VENICE_2): sensor and mount from the feature text.
// A page that names two mounts ("PLおよびEマウント" on VENICE 2) gets no mount, because the record holds one.
function cinemaText(text: string) {
  const mountText = text.match(/[^\s]{0,12}マウント/)?.[0];
  return present({
    sensorFormat: /フルサイズ|フルフレーム/.test(text) ? "full-frame" : undefined,
    sensorType: /CMOS/.test(text) ? "CMOS" : undefined,
    mount: mountText && !/PL/.test(mountText) ? coded(MOUNT, "mount")(mountText) : undefined,
  });
}

// Fields per accessory group. A label that is not in the page leaves the field out (no invented value).
const GROUP_FIELDS: Record<string, [string, RegExp, (v?: string) => unknown][]> = {
  mic: [["type", /形式/, coded(MIC_TYPE, "mic type")], ["pattern", /指向特性|指向性/, coded(MIC_PATTERN, "mic pattern")]],
  headphone: [
    ["type", /型式/, coded(HP_TYPE, "headphone type")], ["driverMm", /ドライバーユニット/, numberOf],
    ["impedanceOhm", /インピーダンス/, numberOf], ["sensitivityDb", /^感度/, numberOf],
  ],
  flash: [["guideNumber", /ガイドナンバー/, numberOf]],
  monitor: [["screenInch", /LCDサイズ|画面サイズ/, numberOf]],
  battery: [
    ["capacityMah", /容量/, (v?: string) => numberOf(v?.match(/[\d,]+\s*mAh/)?.[0]?.replace(/,/g, ""))],
    ["voltageV", /電圧/, numberOf],
  ],
  "memory-card": [["capacityGb", /容量/, capacityGb]],
  // Coupler sets name the battery in the 付属品 line: "接続プレート（NP-FZ100用）"
  "dc-coupler": [["battery", /付属品/, (v?: string) => v?.match(/(NP-[A-Z0-9]+)用/)?.[1]]],
};
// Accessory groups whose body is hardware: they get 大きさ / 外形寸法 (not case, straps or cards)
const DIMENSIONED = new Set(["mic", "headphone", "flash", "monitor", "battery", "charger", "dc-coupler", "card-reader", "remote", "grip", "viewfinder", "adapter", "tripod", "xlr", "wireless", "other"]);
// Fields read from the page text rather than a label line; "text" is the top page plus the spec page, cleaned.
function textFields(group: string, text: string): Record<string, unknown> {
  if (group === "charger") {
    const volt = text.match(/電圧\s*(\d+)\s*[-～~]\s*(\d+)\s*V/);
    return present({ chargeMin: chargeMin(text), inputV: volt ? `${volt[1]}-${volt[2]}V` : undefined });
  }
  // sony.jp headphone pages print the spec as one run of text ("形式 密閉ダイナミック型 ドライバーユニット 40mm … インピーダンス 24&Omega; … 質量 約215g")
  if (group === "headphone") return present({
    type: coded(HP_TYPE, "headphone type")(text.match(/形式\s*(\S+)/)?.[1]),
    driverMm: numberOf(text.match(/(?:ドライバーユニット|口径)\s*([\d.]+)\s*mm/)?.[1]),
    impedanceOhm: numberOf(text.match(/インピーダンス\s*([\d.]+)\s*(?:&Omega;|Ω)/)?.[1]),
    sensitivityDb: numberOf(text.match(/音圧感度\s*([\d.]+)\s*dB/)?.[1]),
    weightG: grams(text.match(/質量\s*(約?\s*[\d,.]+\s*(?:kg|g))/)?.[1]),
  });
  // The list ends at the next section ("主な仕様"); a Japanese note in brackets, such as "(α7CRに同梱されています)", is left out
  if (group === "grip") return present({
    compatibleBodies: text.match(/●対応機種[:：]?\s*(.+?)\s*(?=主な仕様|●|対応商品|$)/)?.[1]?.replace(/\s*\([^)]*\)/g, "").replace(/\s*\/\s*/g, " / ").trim(),
  });
  if (group === "card-reader") return present({
    slots: /ダブルスロット/.test(text) ? 2 : undefined,
    // "USB3.1(GEN1)対応", "USB3.1(Gen 1)対応" and "USB 10Gbps" all occur
    interface: text.match(/USB\s?\d+(?:\.\d+)?\s?Gbps|USB\s?3\.\d\s?\(?Gen\s?\d\)?/i)?.[0],
  });
  // Coupler text names its battery: "リチャージャブルバッテリーパックNP-SA100に対応" (two-battery pages such as NP-FZ100またはNP-FW50 leave it out)
  if (group === "dc-coupler") return present({ battery: text.match(/リチャージャブルバッテリーパック\s*(NP-[A-Z0-9]+)に対応/)?.[1] });
  return {};
}
function accessorySpecs(group: string, r: Row[], text = "") {
  const fields: [string, RegExp, (v?: string) => unknown][] = [
    ...(GROUP_FIELDS[group] ?? []),
    ["weightG", /質量|^重量$/, grams],
  ];
  const fromRows = present(Object.fromEntries(fields.map(([key, re, parse]) => [key, parse(first(r, re))])));
  // Weight can sit inside another value: "外形寸法(約): 19mm×66mm×30mm、質量(約):19g"
  // The unit can sit in the label instead: "質量 約 (g)" = 88 (LA-EA5)
  const weightRow = r.find((x) => /質量|^重量$/.test(x.label));
  const weight = fromRows.weightG ?? grams(r.map((x) => x.value).find((v) => /質量/.test(v))?.split("質量")[1]) ?? (weightRow && /\(g\)/.test(weightRow.label) ? numberOf(weightRow.value) : undefined);
  // Size from the 外形寸法 row (label too: "外形寸法 最大径x長さ (mm)" = "66.0 x 31.7"), else from the first 外形寸法 phrase of the page text (the top page has no label line for it)
  // "サイズ(高さ×幅×厚さ)" lists height first (PDT-FP1: 約 170 mm x 80 mm x 26.6 mm), so width and height swap to match dimensionsMm
  const sizeRow = r.find((x) => /大きさ|外形寸法|^サイズ\s*[（(]?高さ×幅/.test(x.label));
  const size: Record<string, unknown> = DIMENSIONED.has(group) ? hardwareSize(sizeRow ? `${sizeRow.label} ${sizeRow.value}` : text.match(/外形寸法[^●]{0,40}/)?.[0]) : {};
  const dims = size.dimensionsMm;
  const sized = sizeRow && /高さ×幅/.test(sizeRow.label) && Array.isArray(dims) ? { dimensionsMm: [dims[1], dims[0], dims[2]] } : size;
  return present({ ...fromRows, ...sized, weightG: weight, ...textFields(group, text) });
}

function groupOf(c: Cand): string {
  const byCode = CODE_GROUP.find(([re]) => re.test(c.code));
  if (byCode) return byCode[1];
  if (c.from === "headphone") return "headphone";
  if (c.from === "mic") return "mic";
  if (c.from === "rec-media") return "memory-card";
  return CATEGORY_GROUP.find(([re]) => c.cats.some((x) => re.test(x)))?.[1] ?? "other";
}

// Listing feeds and cards. Records of discontinued products carry retirementDateTime (not the sentinel), an /archive/ URL, or a 生産完了 icon.
function fromFeed(recs: Rec[], from: Cand["from"], keep: (r: Rec) => boolean = () => true): Cand[] {
  const out: Cand[] = [];
  for (const r of recs) {
    if (!keep(r)) continue;
    const url: string = r.learnMoreUrl ?? "";
    const code = url.match(/\/products\/(?:archive\/)?([^/?#]+)\/?/)?.[1];
    if (!code) continue;
    const retiredAt = typeof r.retirementDateTime === "number" ? r.retirementDateTime : ACTIVE;
    const retired = (retiredAt < ACTIVE && retiredAt < Date.now()) || /\/archive\//.test(url) || /生産完了/.test(r.salesstatusicon ?? "");
    out.push({ code, name: r.displayName || r.supermodelName || code, url, from, cats: (r.category ?? []).map((c: Rec) => c.categoryName ?? ""), retired });
  }
  return out;
}

// Top-page and listing cards link to /<dir>/products/<CODE>/; name is the card text if short, else its image alt, else the code.
function fromCards(html: string, dir: string, from: Cand["from"]): Cand[] {
  const out = new Map<string, Cand>();
  const re = new RegExp(`(<a\\s[^>]*href="https?://www\\.sony\\.jp/${dir}/products/([A-Za-z0-9_\\-]+)/?[^"]*"[^>]*>)([\\s\\S]*?)</a>`, "g");
  for (const [, open, code, inner] of html.matchAll(re)) {
    if (out.has(code)) continue;
    const alt = inner.match(/alt="([^"]+)"/)?.[1];
    const label = clean(inner);
    // News-list links (SonyNews) carry a headline, not the product name, so they keep the code as name.
    const name = /SonyNews/.test(open) ? code : (label && label.length <= 60 ? label : alt) || code;
    out.set(code, { code, name, url: `${SITE}/${dir}/products/${code}/`, from, cats: [], retired: false });
  }
  return [...out.values()];
}

const discover = (html: string, name: string) =>
  html.match(new RegExp(`${name}(?:&quot;|")\\s*:\\s*(?:&quot;|")([^"&]+?)(?:&quot;|")`))?.[1] ?? null;

// The listing page names its JSON endpoint in the AEM config; the known path is the fallback.
async function listJson(pageUrl: string, endpoint: string, fallback?: string): Promise<Rec[]> {
  const html = await textOf(pageUrl);
  const path = (html ? discover(html, endpoint) : null) ?? fallback;
  if (!path) return [];
  try {
    return JSON.parse((await textOf(SITE + path, "utf-8")) ?? "{}").products ?? [];
  } catch (e) {
    note(`not JSON ${SITE + path}: ${(e as Error).message.slice(0, 50)}`);
    return [];
  }
}

async function candidates(): Promise<Cand[]> {
  const out: Cand[] = [];
  // Cinema Line: the pro-cam gallery names each model's own URL (VENICE lives under /ls-camera/).
  out.push(...fromFeed(await listJson(`${SITE}/pro-cam/gallery/`, "getProductGalleryUrl", "/pro-cam/gallery.jpproductgallery.json"), "cinema"));
  const procam = await textOf(`${SITE}/pro-cam/`);
  if (procam) out.push(...fromCards(procam, "pro-cam", "cinema"));
  // Monitoring headphones only: category モニターヘッドホン (consumer headphones and earbuds are not in scope).
  out.push(...fromFeed(
    await listJson(`${SITE}/headphone/gallery/`, "getProductGalleryUrl", "/headphone/gallery.jpproductgallery.json"),
    "headphone", (r) => (r.category ?? []).some((c: Rec) => /モニターヘッドホン/.test(c.categoryName ?? "")),
  ));
  // The microphone gallery JSON is an HTML page, so the listing cards are the source.
  for (const p of ["/microphone/", "/microphone/gallery/"]) {
    const html = await textOf(SITE + p);
    if (html) out.push(...fromCards(html, "microphone", "mic"));
  }
  for (const s of ["gallery", "gallery_sd", "gallery_pocketbit", "gallery_cfexpress", "gallery_memorystick", "gallery_xqd", "gallery_ssd", "gallery_other"])
    out.push(...fromFeed(await listJson(`${SITE}/rec-media/${s}/`, "getProductGalleryUrl"), "rec-media"));
  const recTop = await textOf(`${SITE}/rec-media/`);
  if (recTop) out.push(...fromCards(recTop, "rec-media", "rec-media"));
  // The accessory feed lists every accessory with its categories; camera bodies in it are compatibility cards.
  out.push(...fromFeed(await listJson(`${SITE}/ichigan/accessories/`, "getProductInfoUrl", "/ichigan/accessories.jpaccessory.json"), "feed"));
  // Named explicitly and missing from the feed: NP-BX1, NP-BJ1 and NP-BN from the cyber-shot pages; AC-PW20 (ichigan) is 生産完了 and is skipped by the product-page check.
  out.push(
    { code: "NP-BX1", name: "NP-BX1", url: `${SITE}/cyber-shot/products/NP-BX1/`, from: "extra", cats: [], retired: false },
    { code: "NP-BJ1", name: "NP-BJ1", url: `${SITE}/cyber-shot/products/NP-BJ1/`, from: "extra", cats: [], retired: false },
    { code: "NP-BN", name: "NP-BN", url: `${SITE}/cyber-shot/products/NP-BN/`, from: "extra", cats: [], retired: false },
    { code: "AC-PW20", name: "AC-PW20", url: `${SITE}/ichigan/products/AC-PW20/`, from: "extra", cats: [], retired: false },
  );
  return out;
}

const out: Record<string, unknown>[] = [];
const failed: string[] = [];
const jobs: [string, string][] = [
  ...Object.entries(BODIES).flatMap(([site, codes]) => codes.split(" ").map((c) => [c, site] as [string, string])),
  ...[...LENSES, ...Object.keys(CONVERTERS)].map((c) => [c, "ichigan"] as [string, string]),
];
for (const [code, site] of jobs) {
  const source = `https://www.sony.jp/${site}/products/${code}/spec.html`;
  try {
    const html = await page(source);
    const r = rows(html);
    const title = clean(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    let p;
    if (CONVERTERS[code]) p = { name: CONVERTERS[code], kind: "accessory", group: "lens-converter", specs: { weightG: num(r.find((x) => /^質量/.test(x.label))?.value.match(/[\d,]+/)?.[0]) } };
    else {
      const isLens = LENSES.includes(code);
      const needTop = !isLens || /レンズ内/.test(r.find((x) => /^手ブレ補正$/.test(x.label))?.value ?? "");
      const want = isLens ? /(?:MODE|モード)\s?[23]/ : /BIONZ/;
      let top = "";
      if (needTop) {
        const base = source.replace("spec.html", "");
        const html = await page(base);
        top = clean(html);
        for (const [, href] of html.matchAll(/href="(?:[^"]*\/)?(feature_\d(?:\.html)?)"/g)) {
          if (want.test(top) || top.length > 2e6) break;
          top += " " + clean(await page(base + href));
        }
      }
      p = isLens ? lens(code, r, top) : camera(code, site, r, title, top);
    }
    // Official product photo: the spec page's og:image (www.sony.jp/products/picture/SEL2070G.jpg; newer pages use /content/dam/…/SEL814G.jpg)
    const og = html.match(/<meta[^>]+og:image[^>]*>/)?.[0];
    // og:image is sometimes a kit or side view (ZV-E1_terminal.jpg); prefer the photo named exactly after the code (checked 2026-11-09).
    const image = EXACT_IMAGE.has(code)
      ? `https://www.sony.jp/products/picture/${code}.jpg`
      : og?.match(/content="([^"]+)"/)?.[1]?.replace(/^\/\//, "https://").replace(/^\//, "https://www.sony.jp/") ?? null;
    if (!image?.startsWith("https://www.sony.jp/") || !image.includes(code.replace(/^DSC-/, ""))) failed.push(`${code}: unexpected image ${image}`);
    out.push({ code, slug: slugOf(p.name), ...p, image, source });
  } catch (e) {
    failed.push(`${code}: ${(e as Error).message}`);
  }
}

// New candidates: cinema, headphones, microphones, recording media and the accessory feed. The first source to name a code wins.
const curated = new Set((JSON.parse(readFileSync("data/accessories.json", "utf8")) as { code: string }[]).map((a) => a.code));
// Curated codes that also get a generated record; ECM-W2BT stays curated-only.
const CURATED_ADDED = new Set(["ECM-B10", "ECM-G1", "HVL-F28RM", "NP-FW50", "NP-FZ100", "GP-VPT2BT"]);
// Memory-card and SSD series pages: one record per series (name the series code, not a family page). CEA-M is 生産完了 on sony.jp.
const SERIES = new Set(["SF-M", "SF-MT", "SF-UZ", "CEB-G", "CEA-M", "SL-M"]);
const seen = new Set([...Object.values(BODIES).join(" ").split(" "), ...LENSES, ...Object.keys(CONVERTERS)]);
function skipReason(c: Cand): string | null {
  if (!CODE.test(c.code)) return "not a product code";
  if (SERIES.has(c.code)) return null;
  if (curated.has(c.code) && !CURATED_ADDED.has(c.code)) return "already in data/accessories.json";
  if (c.from === "feed" && CAMERA_CARD.test(c.code)) return "camera body listed as a compatibility card";
  if (c.from === "cinema" && c.code === "VENICE") return "family page: VENICE models are listed under their own codes (VENICE_2)";
  if (MEDIA_NOT_IN_SCOPE.test(c.code)) return "tape or optical disc";
  if (FAMILY.test(c.name)) return "family or multi-model page";
  if (CAMPAIGN.test(c.name)) return "campaign or news page";
  if (c.retired) return "discontinued (feed)";
  return null;
}
const todo: Cand[] = [];
for (const c of await candidates()) {
  if (seen.has(c.code)) continue;
  seen.add(c.code);
  const reason = skipReason(c);
  if (reason) skipped.push(`${c.code} (${c.from}): ${reason}`);
  else todo.push(c);
}

for (const c of todo) {
  try {
    const base = c.url.endsWith("/") ? c.url : `${c.url}/`;
    const prod = await textOf(base);
    // Requested items (CURATED_ADDED, SERIES) are kept even when discontinued; the discontinued status is reported.
    if (!CURATED_ADDED.has(c.code) && !SERIES.has(c.code) && prod !== null && /(?:salesStatus|DisplayReleaseDate)[^>]*>\s*生産完了/.test(prod)) {
      skipped.push(`${c.code} (${c.from}): discontinued (生産完了 on product page)`);
      continue;
    }
    let spec: string | null = null, source = base;
    for (const f of ["spec.html", "specification.html"]) {
      const h = await textOf(base + f);
      if (h !== null) { spec = h; source = base + f; break; }
    }
    const r = spec ? rows(spec) : [];
    const cinema = c.from === "cinema";
    if (cinema && !spec) { failed.push(`${c.code}: no spec page`); continue; }
    const group = cinema ? "cinema" : groupOf(c);
    // Accessory specs: the spec table first, then the label lines of the top page (text fields read the cleaned top and spec pages).
    const text = clean(`${prod ?? ""} ${spec ?? ""}`);
    const specs = cinema ? { ...cinemaText(text), ...cinemaSpecs(r) } : SERIES.has(c.code) ? seriesSpecs(text) : accessorySpecs(group, [...r, ...specLines(prod ?? "")], text);
    // Image: the first og:image (product page, then spec page) on www.sony.jp that names the code, else the picture named after the code.
    // Separators are ignored when comparing, because sony.jp files drop or swap them (RM_VPR1.jpg for RM-VPR1, VENICE2.jpg for VENICE_2).
    // Headphone pictures often carry a short model or id instead of the code, so the og:image of a headphone page is trusted (checked on www.sony.jp).
    const bare = (s: string) => s.replace(/[-_]/g, "");
    // Series pages name a variant in their picture (SF-M512T.jpg for SF-MT, SF-64UZ.jpg for SF-UZ), so their og:image is trusted too.
    const trustOg = c.from === "headphone" || SERIES.has(c.code);
    let image: string | null = null;
    for (const h of [prod, spec]) {
      const u = h?.match(/<meta[^>]+og:image[^>]*>/)?.[0]?.match(/content="([^"]+)"/)?.[1]?.replace(/^\/\//, "https://").replace(/^\//, `${SITE}/`);
      if (u?.startsWith(`${SITE}/`) && (bare(u).includes(bare(c.code)) || trustOg)) { image = u; break; }
    }
    if (!image) {
      const pic = `${SITE}/products/picture/${c.code}.jpg`;
      image = (await alive(pic)) ? pic : null;
    }
    if (!image) { failed.push(`${c.code}: no sony.jp image`); continue; }
    const name = cinema ? c.name.replace(/[（(].*$/, "").trim() : c.code;
    out.push({ code: c.code, slug: slugOf(name), name, kind: cinema ? "camera" : "accessory", group, specs, image, source });
  } catch (e) {
    failed.push(`${c.code}: ${(e as Error).message}`);
  }
}

const order = ["camera", "lens", "accessory"];
out.sort((a, b) => order.indexOf(a.kind as string) - order.indexOf(b.kind as string) || String(a.group).localeCompare(String(b.group)) || String(a.name).localeCompare(String(b.name)));
const slugs = new Set(out.map((p) => p.slug));
if (slugs.size !== out.length) throw new Error("duplicate slug");
writeFileSync("data/products.json", JSON.stringify(out, null, 2) + "\n");

const tally: Record<string, number> = {};
for (const p of out) tally[`${p.kind}/${p.group}`] = (tally[`${p.kind}/${p.group}`] ?? 0) + 1;
console.log(`${out.length} products, ${failed.length} failed, ${skipped.length} skipped`);
console.log("counts:", JSON.stringify(tally));
console.log("skipped:"); for (const s of skipped) console.log("  ", s);
console.log("failed:"); for (const f of failed) console.log("  ", f);
console.log("unmapped:", [...unmapped].join(" | ") || "(none)");
console.log(`notes: ${notes.length}`);
