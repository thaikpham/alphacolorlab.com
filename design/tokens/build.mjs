// Sinh từ tokens.json: khối tokens trong app/globals.css (giữa /* tokens:start */ và /* tokens:end */),
// out/AlphaTokens.swift, out/tokens.ts, out/contrast-report.md.
// Không phụ thuộc npm. Node 18+. Chạy: npm run tokens (hoặc node design/tokens/build.mjs).
// --check: không ghi gì. Thoát mã 1 nếu khối trong globals.css lệch tokens.json hoặc có cặp tương phản không đạt.
// Có cặp không đạt WCAG thì chỉ ghi out/contrast-report.md và thoát mã 1.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'tokens.json');
const OUT = path.join(HERE, 'out');
const GLOBALS = path.join(HERE, '..', '..', 'app', 'globals.css');
const START = '/* tokens:start */';
const END = '/* tokens:end */';
const CHECK = process.argv.includes('--check');

const TEXT_MIN = 4.5;
const NON_TEXT_MIN = 3;
const MODES = ['light', 'dark'];
const MODE_VI = { light: 'Sáng', dark: 'Tối' };
const SURFACES = ['bg', 'card', 'card-elevated'];
const TEXT_ON_SURFACE = ['label', 'secondary', 'accent-text', 'success', 'warning', 'danger'];
const NON_TEXT_ON_SURFACE = ['accent', 'app-colors', 'app-wiki', 'app-blog'];
// Dark: accent chỉ là nền nút chính (chữ trắng). Viền chọn, focus, icon nhấn trên nền tối dùng accent-text (đã kiểm ≥4.5:1 ở TEXT_ON_SURFACE).
const NON_TEXT_SKIP = { dark: ['accent'] };
const IOS_FONT = {
  footnote: 'footnote',
  subhead: 'subheadline',
  callout: 'callout',
  body: 'body',
  title3: 'title3',
  title2: 'title2',
  title: 'title',
  display: 'largeTitle',
};
const GENERIC_FAMILY = new Set(['system-ui', '-apple-system', 'sans-serif', 'serif', 'monospace']);
const ALIAS = /^\{color\.([a-z0-9-]+)\}$/;

const camel = (s) => s.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase());
const pascal = (s) => {
  const c = camel(s);
  return c[0].toUpperCase() + c.slice(1);
};
const hex2 = (n) => n.toString(16).padStart(2, '0');

// Trả về [{name, light, dark, web}]. Tham chiếu {color.x} lấy giá trị của token gốc.
function colorTokens(tokens) {
  return Object.entries(tokens.color).map(([name, tok]) => {
    let v = tok.$value;
    const ref = typeof v === 'string' ? ALIAS.exec(v) : null;
    if (ref) v = tokens.color[ref[1]]?.$value;
    if (v === undefined) throw new Error(`color.${name}: tham chiếu không tồn tại`);
    if (typeof v === 'string') v = { light: v, dark: v };
    return {
      name,
      light: v.light,
      dark: v.dark ?? v.light,
      web: tok.$extensions?.alphacolorlab?.scope === 'web',
    };
  });
}

function parseColor(input) {
  const s = String(input).trim();
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[\/,]\s*([\d.]+))?\s*\)$/i.exec(s);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  throw new Error(`Không đọc được màu: ${s}`);
}

function luminance({ r, g, b }) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function checkContrast(colors) {
  const byName = new Map(colors.map((c) => [c.name, c]));
  const need = (name) => {
    const c = byName.get(name);
    if (!c) throw new Error(`Thiếu token color.${name}`);
    return c;
  };
  const rows = [];
  for (const mode of MODES) {
    for (const surface of SURFACES) {
      for (const name of TEXT_ON_SURFACE) {
        rows.push({ mode, fg: name, bg: surface, min: TEXT_MIN, kind: 'Chữ' });
      }
      for (const name of NON_TEXT_ON_SURFACE) {
        if (NON_TEXT_SKIP[mode]?.includes(name)) continue;
        rows.push({ mode, fg: name, bg: surface, min: NON_TEXT_MIN, kind: 'Không phải chữ' });
      }
    }
    rows.push({ mode, fg: 'on-accent', bg: 'accent', min: TEXT_MIN, kind: 'Chữ' });
  }
  return rows.map((row) => {
    const fg = parseColor(need(row.fg)[row.mode]);
    const bg = parseColor(need(row.bg)[row.mode]);
    if (fg.a < 1 || bg.a < 1) throw new Error(`${row.fg} trên ${row.bg} (${row.mode}): phải là màu đặc`);
    const ratio = contrast(fg, bg);
    return { ...row, ratio, pass: ratio >= row.min };
  });
}

function contrastReport(rows) {
  const failed = rows.filter((r) => !r.pass);
  const lowest = rows.reduce((a, b) => (b.ratio < a.ratio ? b : a));
  return [
    '# Báo cáo tương phản',
    '',
    '<!-- Tạo bởi design/tokens/build.mjs. Không sửa tay. -->',
    '',
    `Chuẩn: WCAG 2.x AA. Chữ ≥ ${TEXT_MIN}:1, không phải chữ ≥ ${NON_TEXT_MIN}:1.`,
    '',
    `Tổng: ${rows.length} cặp, không đạt: ${failed.length}. Thấp nhất: ${lowest.ratio.toFixed(2)}:1 (${MODE_VI[lowest.mode]}, ${lowest.fg} trên ${lowest.bg}).`,
    '',
    '| Chế độ | Loại | Màu | Nền | Tỉ lệ | Yêu cầu | Kết quả |',
    '|---|---|---|---|---|---|---|',
    ...rows.map(
      (r) =>
        `| ${MODE_VI[r.mode]} | ${r.kind} | ${r.fg} | ${r.bg} | ${r.ratio.toFixed(2)}:1 | ≥ ${r.min}:1 | ${r.pass ? 'Đạt' : 'Không đạt'} |`,
    ),
    '',
    '## Không kiểm tra',
    '',
    '- `tertiary`: chỉ trang trí, không dùng cho chữ.',
    '- `fill`, `fill-strong`, `success-fill`, `warning-fill`, `danger-fill`: bán trong suốt, tỉ lệ phụ thuộc nền.',
    '- `google-*`: chỉ web (logo Google), không đưa vào bộ kiểm tra.',
    '- `app-console`: alias của `accent`, đã kiểm tra qua `accent`.',
    '',
  ].join('\n');
}

// Đổi về px. fontSize dùng cho line-height và letter-spacing tính theo em hoặc số không đơn vị.
function toPx(v, fontSize = 1) {
  const s = String(v).trim();
  const clamp = /^clamp\(\s*([\d.]+)px/.exec(s);
  if (clamp) return Number(clamp[1]);
  if (s.endsWith('px')) return Number(s.slice(0, -2));
  return Math.round(parseFloat(s) * fontSize * 100) / 100;
}

function cssFamily(list) {
  return list.map((f) => (!GENERIC_FAMILY.has(f) && /\s/.test(f) ? `"${f}"` : f)).join(', ');
}

// Chú thích cuối dòng lấy từ $description. Khối CSS luôn là giá trị chế độ sáng.
const note = (tok) => (tok?.$description ? ` /* ${tok.$description} */` : '');

// Nội dung giữa hai marker trong @theme. google-* và --font-sans viết tay ngoài khối (xem handWrittenMismatch).
function themeBlock(tokens, colors) {
  const color = colors
    .filter((c) => !c.web)
    .map((c) => `--color-${c.name}: ${c.light};${note(tokens.color[c.name])}`);
  const text = Object.entries(tokens.text).flatMap(([n, t]) => {
    const v = t.$value;
    const lines = [`--text-${n}: ${v.fontSize};${note(t)}`];
    if (v.lineHeight) lines.push(`--text-${n}--line-height: ${v.lineHeight};`);
    if (v.letterSpacing) lines.push(`--text-${n}--letter-spacing: ${v.letterSpacing};`);
    return lines;
  });
  const groups = [
    ['/* Màu */', ...color],
    ['/* Chữ */', ...text],
    ['/* Bo góc */', ...Object.entries(tokens.radius).map(([n, t]) => `--radius-${n}: ${t.$value};${note(t)}`)],
    ['/* Bóng */', ...Object.entries(tokens.shadow).map(([n, t]) => `--shadow-${n}: ${t.$value};${note(t)}`)],
    [
      '/* Chuyển động */',
      ...Object.entries(tokens.ease).map(([n, t]) => `--ease-${n}: cubic-bezier(${t.$value.join(', ')});${note(t)}`),
    ],
  ];
  return [
    '/* Sinh từ design/tokens/tokens.json bởi npm run tokens. Không sửa tay. */',
    ...groups.map((g) => g.join('\n')),
  ]
    .join('\n\n')
    .split('\n')
    .map((line) => (line ? `  ${line}` : ''))
    .join('\n');
}

// Thay phần giữa hai marker. Marker giữ nguyên, chạy lại vẫn ra cùng nội dung.
function spliceTheme(css, block) {
  const a = css.indexOf(START);
  const b = css.indexOf(END);
  if (a < 0 || b < a) throw new Error(`app/globals.css thiếu ${START} hoặc ${END} (đúng thứ tự)`);
  return `${css.slice(0, a + START.length)}\n${block}\n  ${css.slice(b)}`;
}

// google-* và --font-sans là khai báo viết tay trong @theme. Chỉ kiểm tra chúng khớp tokens.json.
function handWrittenMismatch(css, tokens, colors) {
  const want = [
    ...colors.filter((c) => c.web).map((c) => `--color-${c.name}: ${c.light};`),
    `--font-sans: ${cssFamily(tokens.font.sans.$value)};`,
  ];
  return want
    .filter((decl) => !css.includes(decl))
    .map((decl) => `app/globals.css thiếu hoặc lệch tokens.json: ${decl}`);
}

function swiftColor(value) {
  const c = parseColor(value);
  const hex = `0x${[c.r, c.g, c.b].map((n) => hex2(n)).join('').toUpperCase()}`;
  return c.a === 1 ? `.hex(${hex})` : `.hex(${hex}, alpha: ${c.a})`;
}

function swiftFile(tokens, colors) {
  const native = colors.filter((c) => !c.web);
  return [
    '// Generated by design/tokens/build.mjs. Không sửa tay: sửa tokens.json rồi chạy build.',
    '// Yêu cầu iOS 17+. Màu tự đổi theo chế độ sáng/tối của hệ thống.',
    '',
    'import SwiftUI',
    'import UIKit',
    '',
    'private extension UIColor {',
    '    static func hex(_ value: UInt32, alpha: CGFloat = 1) -> UIColor {',
    '        UIColor(',
    '            red: CGFloat((value >> 16) & 0xFF) / 255,',
    '            green: CGFloat((value >> 8) & 0xFF) / 255,',
    '            blue: CGFloat(value & 0xFF) / 255,',
    '            alpha: alpha',
    '        )',
    '    }',
    '}',
    '',
    'private extension Color {',
    '    init(light: UIColor, dark: UIColor) {',
    '        self.init(UIColor { traits in',
    '            traits.userInterfaceStyle == .dark ? dark : light',
    '        })',
    '    }',
    '}',
    '',
    'extension Color {',
    ...native.map(
      (c) =>
        `    static let alpha${pascal(c.name)} = Color(light: ${swiftColor(c.light)}, dark: ${swiftColor(c.dark)})`,
    ),
    '}',
    '',
    'enum AlphaRadius {',
    ...Object.entries(tokens.radius).map(
      ([n, t]) => `    static let ${camel(n)}: CGFloat = ${toPx(t.$value)}`,
    ),
    '}',
    '',
    '// Cỡ chữ map sang Dynamic Type của iOS, tự co giãn theo cài đặt trợ năng.',
    'enum AlphaFont {',
    ...Object.entries(tokens.text).map(([n, t]) => {
      const style = IOS_FONT[n];
      if (!style) throw new Error(`Chưa map text.${n} sang Dynamic Type`);
      return `    static var ${camel(n)}: Font { .${style} }`;
    }),
    '}',
    '',
  ].join('\n');
}

function tsColor(value) {
  const c = parseColor(value);
  if (c.a === 1) return `#${[c.r, c.g, c.b].map((n) => hex2(n)).join('')}`;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

function tsFile(tokens, colors) {
  const native = colors.filter((c) => !c.web);
  const side = (key) => native.map((c) => `    ${camel(c.name)}: "${tsColor(c[key])}",`);
  const type = Object.entries(tokens.text).map(([n, t]) => {
    const v = t.$value;
    const fontSize = toPx(v.fontSize);
    const lineHeight = toPx(v.lineHeight, fontSize);
    const letterSpacing = v.letterSpacing ? toPx(v.letterSpacing, fontSize) : 0;
    return `  ${camel(n)}: { fontSize: ${fontSize}, lineHeight: ${lineHeight}, letterSpacing: ${letterSpacing} },`;
  });
  const radius = Object.entries(tokens.radius).map(([n, t]) => `  ${camel(n)}: ${toPx(t.$value)},`);
  const ease = Object.entries(tokens.ease).map(([n, t]) => `  ${camel(n)}: [${t.$value.join(', ')}],`);
  const primaryFont = tokens.font.sans.$value[0];
  return [
    '// Generated by design/tokens/build.mjs. Không sửa tay: sửa tokens.json rồi chạy build.',
    '// Số là dp/pt. Màu là hex hoặc rgba(). Dùng cho React Native / Expo.',
    '',
    'export const colors = {',
    '  light: {',
    ...side('light'),
    '  },',
    '  dark: {',
    ...side('dark'),
    '  },',
    '} as const;',
    '',
    'export const type = {',
    ...type,
    '} as const;',
    '',
    'export const radius = {',
    ...radius,
    '} as const;',
    '',
    'export const ease = {',
    ...ease,
    '} as const;',
    '',
    '// iOS dùng font hệ thống (SF Pro), không đặt fontFamily.',
    'export const fontFamily = {',
    `  android: "${primaryFont}",`,
    '} as const;',
    '',
  ].join('\n');
}

async function main() {
  const tokens = JSON.parse(await readFile(SRC, 'utf8'));
  const colors = colorTokens(tokens);
  const rows = checkContrast(colors);
  const failed = rows.filter((r) => !r.pass);
  const css = await readFile(GLOBALS, 'utf8');
  const next = spliceTheme(css, themeBlock(tokens, colors));

  if (!CHECK) {
    await mkdir(OUT, { recursive: true });
    await writeFile(path.join(OUT, 'contrast-report.md'), contrastReport(rows));
  }

  const problems = [
    ...(failed.length > 0
      ? [
          `Tương phản không đạt: ${failed.length}/${rows.length} cặp.`,
          ...failed.map(
            (r) => `  - ${MODE_VI[r.mode]}: ${r.fg} trên ${r.bg} = ${r.ratio.toFixed(2)}:1 (cần ${r.min}:1)`,
          ),
        ]
      : []),
    ...handWrittenMismatch(css, tokens, colors),
  ];
  if (CHECK && next !== css) {
    problems.push('Khối tokens trong app/globals.css lệch tokens.json. Chạy: npm run tokens');
  }
  if (problems.length > 0) {
    process.stderr.write(`${problems.join('\n')}\n`);
    if (!CHECK) {
      process.stderr.write(
        'Chi tiết: out/contrast-report.md. Không ghi app/globals.css và out/ (trừ contrast-report.md).\n',
      );
    }
    process.exitCode = 1;
    return;
  }

  if (CHECK) {
    process.stdout.write(`OK: khối tokens khớp tokens.json, ${rows.length} cặp tương phản đạt.\n`);
    return;
  }

  await writeFile(GLOBALS, next);
  await Promise.all([
    writeFile(path.join(OUT, 'AlphaTokens.swift'), swiftFile(tokens, colors)),
    writeFile(path.join(OUT, 'tokens.ts'), tsFile(tokens, colors)),
  ]);
  process.stdout.write(
    `OK: ${rows.length} cặp tương phản đạt. Đã ghi app/globals.css (khối tokens), out/AlphaTokens.swift, out/tokens.ts, out/contrast-report.md\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exitCode = 1;
});
