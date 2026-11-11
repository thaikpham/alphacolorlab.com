#!/usr/bin/env node
// Kiểm tra design system (DESIGN.md). Chạy: npm run check:design (tự chạy trước npm run build).
// Mọi màu, cỡ chữ, bo góc, bóng phải đi qua token trong app/globals.css. Thêm token mới ở đó + DESIGN.md, không thêm ngoại lệ ở đây.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TOKENS_FILE = "app/globals.css";
// Giá trị tùy ý duy nhất được phép: template lưới và tỉ lệ khung ảnh.
const ARBITRARY_OK = /^(grid-cols|grid-rows|aspect)-\[/;
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const RULES = [
  { id: "arbitrary-value", re: /(?<![\w-])!?(?:[a-z0-9]+:)*-?[a-z][\w-]*-(?:\[[^\]\s]+\]|\(--[\w-]+\))/g, msg: "Giá trị tùy ý trong className. Dùng token (text-footnote, rounded-card, shadow-card, max-w-page…)." },
  { id: "palette-color", re: new RegExp(`\\b(?:bg|text|border|ring|ring-offset|divide|outline|fill|stroke|from|via|to|decoration|caret|accent|placeholder|shadow)-(?:${PALETTE})(?:-\\d{2,3})?\\b`, "g"), msg: "Màu palette Tailwind. Dùng token màu: accent, label, secondary, fill, warning, success, danger…" },
  { id: "raw-black-white", re: /\b(?:bg-white|bg-black|text-white|text-black|border-white|border-black)\b/g, msg: "Dùng bg-card / text-label / border-separator thay cho trắng/đen thô. Chữ trên nền accent dùng text-on-accent." },
  { id: "default-type-scale", re: /(?<![\w-])(?:[a-z0-9]+:)*text-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g, msg: "Thang chữ mặc định của Tailwind. Dùng thang iOS: text-footnote, subhead, callout, body, title3, title, display." },
  { id: "default-radius", re: /(?<![\w-])(?:[a-z0-9]+:)*rounded(?:-[trblse]{1,2})?(?:-(?:xs|sm|md|lg|xl|2xl|3xl|4xl))?(?![\w-])/g, msg: "Bo góc mặc định. Dùng rounded-card, rounded-control, rounded-badge hoặc rounded-full." },
  { id: "default-shadow", re: /(?<![\w-])(?:[a-z0-9]+:)*shadow(?:-(?:2xs|xs|sm|md|lg|xl|2xl|inner))?(?![\w-])/g, msg: "Bóng mặc định. Chỉ có shadow-card (thẻ) và shadow-thumb (núm segmented)." },
  { id: "hex-or-rgb", re: /(?<![\w&/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?|oklch)\(/g, msg: `Màu viết cứng ngoài ${TOKENS_FILE}. Thêm token rồi dùng utility hoặc var(--color-…).` },
  { id: "glyph-icon", re: /[›»✓✔✗✕→←↗★•]/g, msg: "Ký tự dùng làm icon. Vẽ SVG (xem ChevronIcon, InfoIcon)." },
  { id: "uppercase-label", re: /(?<![\w-])uppercase(?![\w-])/g, msg: "Nhãn viết hoa toàn bộ. Dùng sentence case: text-footnote font-medium text-secondary." },
];

// .tsx: mọi luật. .ts (dữ liệu chữ như content.ts): chỉ màu thô.
const RULES_FOR = (file) => (file.endsWith(".tsx") ? RULES : RULES.filter((r) => r.id === "hex-or-rgb"));
// Màu trong metadata/manifest phải là hex; giữ trùng token.
const LINE_OK = /\b(?:themeColor|theme_color|background_color)\b/;

export function lint(text, file = "x.tsx") {
  const out = [];
  const lines = text.split("\n");
  for (const rule of RULES_FOR(file)) {
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line) || LINE_OK.test(line)) return; // bỏ qua chú thích
      for (const m of line.matchAll(rule.re)) {
        const hit = m[0].replace(/^!?(?:[a-z0-9]+:)*/, "");
        if (rule.id === "arbitrary-value" && ARBITRARY_OK.test(hit)) continue;
        out.push({ file, line: i + 1, rule: rule.id, hit: m[0], msg: rule.msg });
      }
    });
  }
  return out;
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(fileURLToPath(import.meta.url), "..", "..");
  const files = walk(join(root, "app")).filter((f) => /\.(tsx?|css)$/.test(f));
  const problems = [];
  for (const abs of files) {
    const file = relative(root, abs).split(sep).join("/");
    if (file === TOKENS_FILE) continue;
    if (file.endsWith(".css")) problems.push({ file, line: 1, rule: "extra-css", hit: file, msg: `CSS chỉ nằm trong ${TOKENS_FILE}.` });
    problems.push(...lint(readFileSync(abs, "utf8"), file));
  }
  for (const p of problems) console.log(`${p.file}:${p.line}  ${p.rule}  ${p.hit}\n    ${p.msg}`);
  console.log(problems.length ? `\n✗ ${problems.length} lỗi design system. Xem DESIGN.md.` : "Design system: không có lỗi.");
  process.exit(problems.length ? 1 : 0);
}
