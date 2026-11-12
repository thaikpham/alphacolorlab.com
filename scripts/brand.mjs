// Sinh bộ logo alphacolorlab (SVG + PNG + ICO) vào brand/<hướng>/. Chạy: node scripts/brand.mjs
// sharp is not in package.json; it resolves only through next's dependencies.
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const C = { label: "#0b0d12", white: "#ffffff", bg: "#f3f4f6", accent: "#f05a14", colors: "#0789b0", wiki: "#0b9468", blog: "#5a55d6" };
const APPS = [C.colors, C.wiki, C.blog];
const APPS4 = [C.colors, C.wiki, C.blog, C.accent];
const f = (n) => +n.toFixed(2);
const dot = (x, y, r, fill, op = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ""}/>`;
const polar = (r, deg) => [128 + r * Math.cos((deg * Math.PI) / 180), 128 + r * Math.sin((deg * Math.PI) / 180)];

const marks = {
  // Chòm sao: 4 chấm gốc (cam lấy nét + 3 app) và 3 sao nhỏ màu mực làm bầu trời.
  "chom-sao": {
    full: (ink) => {
      const sky = [[192, 170, 3.6], [150, 70, 2.6], [58, 146, 2.4]].map(([x, y, r]) => dot(x, y, r, ink, 0.6)).join("");
      const four = dot(86, 92, 12, C.colors) + dot(181, 104, 12, C.wiki) + dot(107, 181, 12, C.blog) + dot(135, 131, 26, C.accent);
      return `<g transform="translate(128 128) scale(1.6) translate(-131 -133)">${sky + four}</g>`;
    },
    mini: () =>
      `<g transform="translate(128 128) scale(1.75) translate(-131 -133)">${dot(86, 92, 18, C.colors) + dot(181, 104, 18, C.wiki) + dot(107, 181, 18, C.blog) + dot(135, 131, 30, C.accent)}</g>`,
  },
  // Sao nhiễu xạ gọn: lõi cam, 4 tia mỗi tia 2 chấm.
  "tia-sao": {
    full: () =>
      [-90, 0, 90, 180].map((a, k) => dot(...polar(70, a), 14, APPS4[k]) + dot(...polar(104, a), 8, APPS4[k])).join("") + dot(128, 128, 36, C.accent),
  },
  // Thiên hà gọn: lõi cam, 3 nhánh xoắn mỗi nhánh 3 chấm.
  "thien-ha": {
    full: () =>
      APPS.map((c, k) => [0, 1, 2].map((j) => dot(...polar(58 + j * 26, -90 + k * 120 + j * 32), 15 - j * 4, c)).join("")).join("") +
      dot(128, 128, 32, C.accent),
  },
};

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${body}</svg>`;
// Icon ứng dụng: nền bg, nội dung thu vào vùng an toàn (maskable cần 80%).
const tile = (body, scale, rx) =>
  svg(`<rect width="256" height="256" rx="${rx}" fill="${C.bg}"/><g transform="translate(128 128) scale(${scale}) translate(-128 -128)">${body}</g>`);
const png = (s, size, file) => sharp(Buffer.from(s), { density: (72 * size) / 256 }).resize(size, size).png().toFile(file);
// ICO chứa thẳng các ảnh PNG: header 6 byte + mỗi ảnh một mục 16 byte.
const ico = (files, sizes) => {
  const imgs = files.map((f) => readFileSync(f));
  const head = Buffer.alloc(6 + 16 * imgs.length);
  head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let off = head.length;
  imgs.forEach((b, i) => {
    const e = 6 + 16 * i;
    head[e] = sizes[i]; head[e + 1] = sizes[i];
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(b.length, e + 8); head.writeUInt32LE(off, e + 12);
    off += b.length;
  });
  return Buffer.concat([head, ...imgs]);
};

for (const [id, m] of Object.entries(marks)) {
  const dir = `brand/${id}`;
  mkdirSync(dir, { recursive: true });
  const light = svg(m.full(C.label)), dark = svg(m.full(C.white)), fav = svg((m.mini ?? m.full)(C.label));
  writeFileSync(`${dir}/logo-light.svg`, light);
  writeFileSync(`${dir}/logo-dark.svg`, dark);
  writeFileSync(`${dir}/favicon.svg`, fav);
  await Promise.all([
    png(light, 1024, `${dir}/logo-light-1024.png`),
    png(dark, 1024, `${dir}/logo-dark-1024.png`),
    png(light, 4096, `${dir}/logo-light-big-4096.png`),
    png(dark, 4096, `${dir}/logo-dark-big-4096.png`),
    png(tile(m.full(C.label), 0.84, 56), 1024, `${dir}/icon-1024.png`),
    png(tile(m.full(C.label), 0.9, 0), 512, `${dir}/icon-512.png`),
    png(tile(m.full(C.label), 0.9, 0), 192, `${dir}/icon-192.png`),
    png(tile(m.full(C.label), 0.74, 0), 512, `${dir}/icon-512-maskable.png`),
    png(tile(m.full(C.label), 0.9, 0), 180, `${dir}/apple-icon.png`),
    ...[16, 32, 48].map((s) => png(fav, s, `${dir}/favicon-${s}.png`)),
  ]);
  writeFileSync(`${dir}/favicon.ico`, ico([16, 32, 48].map((s) => `${dir}/favicon-${s}.png`), [16, 32, 48]));
}
console.log("ok");
