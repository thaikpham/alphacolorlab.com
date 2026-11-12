import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanLocal, parsePlanRequest } from "../lib/game/planRequest.ts";

test("cleanLocal bỏ mục sai kiểu, sai máy, chuỗi rỗng hoặc quá 64 ký tự", () => {
  const out = cleanLocal({
    values: [
      { model: "zve10", settingId: "iso", valueId: "v1" },
      { model: "nope", settingId: "iso", valueId: "v1" },
      { model: "a6400", settingId: 5, valueId: "v1" },
      { model: "a6400", settingId: "iso", valueId: "x".repeat(65) },
      { model: "a6400", settingId: "", valueId: "v1" },
      null,
      "text",
    ],
    located: [{ model: "a7c2", settingId: "iso" }, { model: "a7c2", settingId: "" }, { model: "bad", settingId: "iso" }],
  });
  assert.deepEqual(out, {
    values: [{ model: "zve10", settingId: "iso", valueId: "v1" }],
    located: [{ model: "a7c2", settingId: "iso" }],
  });
});

test("cleanLocal với đầu vào không phải object trả rỗng", () => {
  for (const raw of [null, 3, "x", undefined]) {
    assert.deepEqual(cleanLocal(raw), { values: [], located: [] });
  }
});

test("parsePlanRequest từ chối máy lạ, thiếu seed, seed không phải số nguyên dương an toàn", () => {
  assert.equal(parsePlanRequest(null), null);
  assert.equal(parsePlanRequest({ model: "zv", seed: 1 }), null);
  assert.equal(parsePlanRequest({ model: "zve10" }), null);
  assert.equal(parsePlanRequest({ model: "zve10", seed: 0 }), null);
  assert.equal(parsePlanRequest({ model: "zve10", seed: 1.5 }), null);
  assert.equal(parsePlanRequest({ model: "zve10", seed: "7" }), null);
  assert.equal(parsePlanRequest({ model: "zve10", seed: Number.MAX_SAFE_INTEGER + 2 }), null);
});

test("parsePlanRequest mặc định focus và local rỗng", () => {
  assert.deepEqual(parsePlanRequest({ model: "a7c2", seed: 1 }), {
    model: "a7c2",
    seed: 1,
    focus: [],
    local: { values: [], located: [] },
  });
});

test("parsePlanRequest giữ focus hợp lệ (tối đa 16) và chỉ giữ phát hiện của máy được hỏi", () => {
  const focus = Array.from({ length: 20 }, (_, i) => `s${i}`);
  const req = parsePlanRequest({
    model: "a6400",
    seed: 3,
    focus: [...focus, 4, "x".repeat(65)],
    local: {
      values: [
        { model: "a6400", settingId: "iso", valueId: "v1" },
        { model: "zve10", settingId: "iso", valueId: "v1" },
      ],
      located: [{ model: "zve10", settingId: "iso" }],
    },
  });
  assert.ok(req);
  assert.equal(req.model, "a6400");
  assert.equal(req.seed, 3);
  assert.deepEqual(req.focus, focus.slice(0, 16));
  assert.deepEqual(req.local, { values: [{ model: "a6400", settingId: "iso", valueId: "v1" }], located: [] });
});
