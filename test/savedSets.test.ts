import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSaved, toggleSaved, MAX_SAVED } from "../lib/savedSets.ts";

test("parseSaved: JSON hỏng, không phải mảng hoặc null thì ra danh sách rỗng", () => {
  assert.deepEqual(parseSaved(null), []);
  assert.deepEqual(parseSaved("{hỏng"), []);
  assert.deepEqual(parseSaved('{"a":1}'), []);
});

test("parseSaved: bỏ phần tử không phải id, id sai dạng và id trùng; giữ thứ tự", () => {
  const raw = JSON.stringify(["shoot-easy", 5, null, "Có Hoa", "shoot-easy", "", "night-1", "x".repeat(41)]);
  assert.deepEqual(parseSaved(raw), ["shoot-easy", "night-1"]);
});

test("parseSaved: cắt còn tối đa 50 bộ", () => {
  const ids = Array.from({ length: 70 }, (_, i) => `set-${i}`);
  const out = parseSaved(JSON.stringify(ids));
  assert.equal(out.length, MAX_SAVED);
  assert.equal(out[0], "set-0");
  assert.equal(out[MAX_SAVED - 1], `set-${MAX_SAVED - 1}`);
});

test("toggleSaved: chưa lưu thì thêm lên đầu, lưu rồi thì bỏ", () => {
  const once = toggleSaved(["a"], "b");
  assert.deepEqual(once, ["b", "a"]);
  assert.deepEqual(toggleSaved(once, "a"), ["b"]);
});

test("toggleSaved: id sai dạng thì không đổi", () => {
  const list = ["a"];
  assert.equal(toggleSaved(list, "Có Hoa"), list);
});

test("toggleSaved: đủ 50 bộ thì không thêm và không đẩy bộ cũ ra", () => {
  const full = Array.from({ length: MAX_SAVED }, (_, i) => `set-${i}`);
  assert.deepEqual(toggleSaved(full, "new-one"), full);
  // Bỏ một bộ rồi mới có chỗ
  assert.equal(toggleSaved(full, "set-3").length, MAX_SAVED - 1);
});
