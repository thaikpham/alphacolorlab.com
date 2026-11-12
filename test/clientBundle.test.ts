// Chốt ranh giới client/server: đồ thị import từ mọi file "use client" dưới app/ không được tới dữ liệu quan sát
// hay bộ lập lượt phía server. Bỏ qua import chỉ có kiểu (import type, export type, { type X }) vì bị xóa khi build.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Đường dẫn tương đối từ gốc repo; không được có trong bundle client
const FORBIDDEN = [
  "data/decode-observed.json",
  "lib/decode/status.ts",
  "lib/game/plan.ts",
  "lib/decode/matrix.ts",
  "lib/decode/table.ts",
  "lib/decode/scanFs.ts",
];

const USE_CLIENT = /^(\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*["']use client["']/;
const STATIC = /^\s*(import|export)\s+([\w$\s*,{}]*?)\s*from\s*["']([^"']+)["']/gm;
const SIDE_EFFECT = /^\s*import\s*["']([^"']+)["']/gm;
const DYNAMIC = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const EXTENSIONS = ["", ".ts", ".tsx", ".json", "/index.ts", "/index.tsx"];

const rel = (abs: string) => relative(ROOT, abs).split(sep).join("/");

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");
}

// Mệnh đề chỉ toàn kiểu: "type X", "type { X }", "{ type A, type B }"
function typeOnly(clause: string): boolean {
  const c = clause.trim();
  if (/^type\s+[\w$*{]/.test(c)) return true;
  const braces = /^\{([^}]*)\}$/.exec(c);
  if (!braces) return false;
  const items = braces[1].split(",").map((s) => s.trim()).filter(Boolean);
  return items.length > 0 && items.every((s) => /^type\s/.test(s));
}

function resolveSpec(from: string, spec: string): string | null {
  if (!spec.startsWith("@/") && !spec.startsWith(".")) return null; // gói npm: không thuộc phạm vi kiểm tra
  const base = spec.startsWith("@/") ? join(ROOT, spec.slice(2)) : resolve(dirname(from), spec);
  for (const ext of EXTENSIONS) {
    const p = base + ext;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  throw new Error(`Không tìm thấy "${spec}" (từ ${rel(from)})`);
}

function importsOf(file: string): string[] {
  const src = stripComments(readFileSync(file, "utf8"));
  const specs: string[] = [];
  for (const m of src.matchAll(STATIC)) {
    if (!typeOnly(m[2])) specs.push(m[3]);
  }
  for (const m of src.matchAll(SIDE_EFFECT)) specs.push(m[1]);
  for (const m of src.matchAll(DYNAMIC)) specs.push(m[1]);
  return specs.map((s) => resolveSpec(file, s)).filter((p): p is string => p !== null);
}

function clientRoots(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name) && USE_CLIENT.test(readFileSync(p, "utf8"))) out.push(p);
    }
  };
  walk(join(ROOT, "app"));
  return out;
}

// BFS từ các gốc; trả về bản đồ file -> file cha (gốc có cha null)
function reachable(roots: string[]): Map<string, string | null> {
  const parent = new Map<string, string | null>();
  const queue: string[] = [];
  for (const r of roots) {
    parent.set(r, null);
    queue.push(r);
  }
  for (let i = 0; i < queue.length; i++) {
    for (const dep of importsOf(queue[i])) {
      if (parent.has(dep)) continue;
      parent.set(dep, queue[i]);
      queue.push(dep);
    }
  }
  return parent;
}

function chainTo(parent: Map<string, string | null>, target: string): string {
  const parts: string[] = [];
  for (let f: string | null | undefined = target; f; f = parent.get(f)) parts.unshift(rel(f));
  return parts.join("\n  -> ");
}

test("bundle client không kéo tới data/decode-observed.json hay bộ lập lượt phía server", () => {
  const roots = clientRoots();
  assert.ok(roots.length > 0, "không có file \"use client\" nào dưới app/");
  const parent = reachable(roots);
  for (const bad of FORBIDDEN) {
    const abs = join(ROOT, bad);
    if (parent.has(abs)) assert.fail(`${bad} nằm trong bundle client:\n  ${chainTo(parent, abs)}`);
  }
});

test("lib/game/analyze.ts (client-safe) vẫn đi tới được từ file client", () => {
  const parent = reachable(clientRoots());
  assert.ok(parent.has(join(ROOT, "lib/game/analyze.ts")), "lib/game/analyze.ts không đi tới được: kiểm tra lại đồ thị");
});
