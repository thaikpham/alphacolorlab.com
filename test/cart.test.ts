import { test, describe } from "node:test";
import assert from "node:assert";
import { parseCart, toggle, placeOf, cartToSlots, EMPTY_CART, PP_PER_SLOT, type Cart } from "../lib/cart.ts";

describe("cart", () => {
  describe("parseCart", () => {
    test("parses valid cart JSON", () => {
      const raw = JSON.stringify({
        target: 2,
        slots: { 1: ["a"], 2: ["b", "c"], 3: [], 4: [] },
      });
      const cart = parseCart(raw);
      assert.equal(cart.target, 2);
      assert.deepEqual(cart.slots[1], ["a"]);
      assert.deepEqual(cart.slots[2], ["b", "c"]);
    });

    test("rejects invalid JSON and returns empty cart", () => {
      const cart = parseCart("not json");
      assert.deepEqual(cart, EMPTY_CART);
    });

    test("rejects null and returns empty cart", () => {
      const cart = parseCart(null);
      assert.deepEqual(cart, EMPTY_CART);
    });

    test("rejects invalid target", () => {
      const raw = JSON.stringify({
        target: 5, // invalid, max is 4
        slots: { 1: [], 2: [], 3: [], 4: [] },
      });
      const cart = parseCart(raw);
      assert.equal(cart.target, 1); // defaults to 1
    });

    test("filters out non-string IDs", () => {
      const raw = JSON.stringify({
        target: 1,
        slots: { 1: ["a", 123, "b"], 2: [], 3: [], 4: [] },
      });
      const cart = parseCart(raw);
      assert.deepEqual(cart.slots[1], ["a", "b"]);
    });

    test("removes duplicate IDs", () => {
      const raw = JSON.stringify({
        target: 1,
        slots: { 1: ["a", "b", "a", "c"], 2: [], 3: [], 4: [] },
      });
      const cart = parseCart(raw);
      assert.deepEqual(cart.slots[1], ["a", "b", "c"]);
    });

    test("truncates slots to PP_PER_SLOT (10)", () => {
      const raw = JSON.stringify({
        target: 1,
        slots: {
          1: Array.from({ length: 15 }, (_, i) => `id${i}`),
          2: [],
          3: [],
          4: [],
        },
      });
      const cart = parseCart(raw);
      assert.equal(cart.slots[1].length, PP_PER_SLOT);
      assert.deepEqual(cart.slots[1], [
        "id0", "id1", "id2", "id3", "id4",
        "id5", "id6", "id7", "id8", "id9",
      ]);
    });

    test("handles missing slots object gracefully", () => {
      const raw = JSON.stringify({ target: 1 });
      const cart = parseCart(raw);
      assert.equal(cart.slots[1].length, 0);
    });
  });

  describe("toggle", () => {
    test("adds ID to target slot", () => {
      const cart: Cart = { target: 1, slots: { 1: [], 2: [], 3: [], 4: [] } };
      const updated = toggle(cart, "recipe-a");
      assert.deepEqual(updated.slots[1], ["recipe-a"]);
    });

    test("removes ID if already in cart", () => {
      const cart: Cart = { target: 1, slots: { 1: ["recipe-a", "recipe-b"], 2: [], 3: [], 4: [] } };
      const updated = toggle(cart, "recipe-a");
      assert.deepEqual(updated.slots[1], ["recipe-b"]);
    });

    test("removes from any slot, not just target", () => {
      const cart: Cart = { target: 1, slots: { 1: [], 2: ["recipe-a"], 3: [], 4: [] } };
      const updated = toggle(cart, "recipe-a");
      assert.deepEqual(updated.slots[2], []);
    });

    test("ignores add when target slot is full", () => {
      const fullSlot = Array.from({ length: PP_PER_SLOT }, (_, i) => `id${i}`);
      const cart: Cart = { target: 1, slots: { 1: fullSlot, 2: [], 3: [], 4: [] } };
      const updated = toggle(cart, "recipe-new");
      assert.deepEqual(updated.slots[1], fullSlot);
    });

    test("does not mutate original cart", () => {
      const cart: Cart = { target: 1, slots: { 1: ["recipe-a"], 2: [], 3: [], 4: [] } };
      const original = JSON.stringify(cart);
      toggle(cart, "recipe-b");
      assert.equal(JSON.stringify(cart), original);
    });
  });

  describe("placeOf", () => {
    test("returns slot and pp for existing recipe", () => {
      const cart: Cart = { target: 1, slots: { 1: [], 2: ["recipe-a", "recipe-b"], 3: [], 4: [] } };
      const place = placeOf(cart, "recipe-b");
      assert.deepEqual(place, { slot: 2, pp: 2 });
    });

    test("returns null for non-existent recipe", () => {
      const cart: Cart = { target: 1, slots: { 1: [], 2: ["recipe-a"], 3: [], 4: [] } };
      const place = placeOf(cart, "recipe-b");
      assert.equal(place, null);
    });

    test("pp is 1-indexed", () => {
      const cart: Cart = { target: 1, slots: { 1: ["recipe-a"], 2: [], 3: [], 4: [] } };
      const place = placeOf(cart, "recipe-a");
      assert.deepEqual(place, { slot: 1, pp: 1 });
    });

    test("searches across all slots", () => {
      const cart: Cart = { target: 1, slots: { 1: [], 2: [], 3: ["recipe-c"], 4: [] } };
      const place = placeOf(cart, "recipe-c");
      assert.deepEqual(place, { slot: 3, pp: 1 });
    });
  });

  describe("cartToSlots", () => {
    test("converts cart to slot drafts: PP1 = first valid, ppBanks = rest", () => {
      const cart: Cart = { target: 1, slots: { 1: ["a", "b", "c"], 2: [], 3: [], 4: [] } };
      const recipes = {
        a: { pp: { gamma: "Still" }, wb: { mode: "ctemp", kelvin: 5500 } },
        b: { pp: { gamma: "Cine1" }, wb: { mode: "awb" } },
        c: { pp: { gamma: "Movie" }, wb: { mode: "ctemp", kelvin: 6500 } },
      };
      const getRecipe = (id: string) => recipes[id as keyof typeof recipes] || null;
      const result = cartToSlots(cart, getRecipe);

      assert(result[1], "slot 1 should have settings");
      assert.equal(result[1]!.recipeId, "a");
      assert.deepEqual(result[1]!.pp, { gamma: "Still" });
      assert.deepEqual(result[1]!.ppBanks, {
        2: { gamma: "Cine1" },
        3: { gamma: "Movie" },
      });
    });

    test("drops invalid recipe ids", () => {
      const cart: Cart = { target: 1, slots: { 1: ["a", "invalid", "b"], 2: [], 3: [], 4: [] } };
      const recipes = {
        a: { pp: { gamma: "Still" }, wb: { mode: "ctemp", kelvin: 5500 } },
        b: { pp: { gamma: "Movie" }, wb: { mode: "awb" } },
      };
      const getRecipe = (id: string) => recipes[id as keyof typeof recipes] || null;
      const result = cartToSlots(cart, getRecipe);

      assert.equal(result[1]!.recipeId, "a");
      assert.deepEqual(result[1]!.ppBanks, { 2: { gamma: "Movie" } });
    });

    test("skips empty slots", () => {
      const cart: Cart = { target: 1, slots: { 1: [], 2: ["a"], 3: [], 4: [] } };
      const recipes = { a: { pp: { gamma: "Still" }, wb: { mode: "awb" } } };
      const getRecipe = (id: string) => recipes[id as keyof typeof recipes] || null;
      const result = cartToSlots(cart, getRecipe);

      assert(!result[1], "slot 1 should not be in result");
      assert(result[2], "slot 2 should have settings");
      assert.equal(result[2]!.recipeId, "a");
      assert(!result[2]!.ppBanks, "no ppBanks for single recipe");
    });

    test("handles single recipe per slot (no banks)", () => {
      const cart: Cart = { target: 1, slots: { 1: ["a"], 2: [], 3: [], 4: [] } };
      const recipes = { a: { pp: { gamma: "Still" }, wb: { mode: "awb" } } };
      const getRecipe = (id: string) => recipes[id as keyof typeof recipes] || null;
      const result = cartToSlots(cart, getRecipe);

      assert.equal(result[1]!.recipeId, "a");
      assert(!result[1]!.ppBanks, "no ppBanks for single recipe");
    });
  });
});
