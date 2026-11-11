import { test } from "node:test";
import assert from "node:assert/strict";
import { easeInOut, glideMs, normalizeStops, settleStop, wheelStop } from "../lib/scrollStops.ts";

const vh = 900;
const stops = [0, 900, 1600, 2300, 4000]; // đồ thị, giới thiệu, 4 app, bắt đầu, (đoạn dài) cuối trang

test("settleStop: short segment goes to the next stop in the scroll direction", () => {
  assert.equal(settleStop(100, 1, stops, vh), 900);
  assert.equal(settleStop(800, -1, stops, vh), 0);
  assert.equal(settleStop(1200, 1, stops, vh), 1600);
});

test("settleStop: resting on a stop or past the last stop does nothing", () => {
  assert.equal(settleStop(900, 1, stops, vh), null);
  assert.equal(settleStop(901, -1, stops, vh), null);
  assert.equal(settleStop(5000, 1, stops, vh), null);
});

test("settleStop: tall segment scrolls freely, snaps only near an edge", () => {
  assert.equal(settleStop(3000, 1, stops, vh), null);
  assert.equal(settleStop(3700, 1, stops, vh), 4000);
  assert.equal(settleStop(2500, -1, stops, vh), 2300);
  assert.equal(settleStop(2500, 1, stops, vh), null);
});

test("wheelStop: from a stop, one wheel notch glides to the neighbour if it fits a screen", () => {
  assert.equal(wheelStop(0, 1, stops, vh), 900);
  assert.equal(wheelStop(900, -1, stops, vh), 0);
  assert.equal(wheelStop(2300, 1, stops, vh), null, "next segment is taller than a screen");
  assert.equal(wheelStop(0, -1, stops, vh), null);
  assert.equal(wheelStop(450, 1, stops, vh), null, "not on a stop");
});

test("normalizeStops sorts, clamps and drops near-duplicates", () => {
  assert.deepEqual(normalizeStops([900, 0, 903, 5000, -10], 4000), [0, 900, 4000]);
});

test("easing and duration", () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.ok(easeInOut(0.25) < 0.25 && easeInOut(0.75) > 0.75);
  assert.equal(glideMs(0), 550);
  assert.equal(glideMs(10000), 950);
});
