// Bản latin-ext của Noto Sans được khai báo sau bản tiếng Việt, nên trình duyệt thử nó trước cho mã nằm trong cả hai.
// unicode-range chồng nhau thì mọi trang tiếng Việt (ă đ ơ ư…) tải thêm latin-ext 168 KB trên đường tới LCP.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../app/globals.css"), "utf8");

function rangesOf(file: string): [number, number][] {
  const block = css.split("@font-face").find((b) => b.includes(`/fonts/${file}`));
  assert.ok(block, `không thấy @font-face cho ${file}`);
  const m = /unicode-range:\s*([^;]+);/.exec(block);
  assert.ok(m, `${file} không có unicode-range`);
  return m[1].split(",").map((p) => {
    const [a, b] = p.trim().replace(/^U\+/i, "").split("-").map((h) => parseInt(h, 16));
    return [a, b ?? a];
  });
}

const has = (ranges: [number, number][], c: number) => ranges.some(([a, b]) => c >= a && c <= b);

test("latin-ext không chồng lên bản tiếng Việt (trừ dấu kết hợp mà bản latin cũng có)", () => {
  const vi = rangesOf("noto-sans-vietnamese.woff2");
  const ext = rangesOf("noto-sans-latin-ext.woff2");
  const latin = rangesOf("noto-sans-latin.woff2");
  const clash: string[] = [];
  for (const [a, b] of vi) for (let c = a; c <= b; c++) if (has(ext, c) && !has(latin, c)) clash.push(`U+${c.toString(16).toUpperCase()}`);
  assert.deepEqual(clash, []);
});

test("chữ Việt thường gặp nằm trong bản tiếng Việt hoặc latin", () => {
  const vi = rangesOf("noto-sans-vietnamese.woff2");
  const latin = rangesOf("noto-sans-latin.woff2");
  for (const ch of "ăâđêôơưĂÂĐÊÔƠƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹĩũ₫") {
    const c = ch.codePointAt(0)!;
    assert.ok(has(vi, c) || has(latin, c), `${ch} không thuộc bản tiếng Việt hay latin`);
  }
});
