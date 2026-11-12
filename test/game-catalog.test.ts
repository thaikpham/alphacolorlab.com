import { test } from "node:test";
import assert from "node:assert";
import catalogJson from "../data/game-tasks.json" with { type: "json" };
import { getCatalog } from "../lib/game/catalog.ts";
import { adaptersFor } from "../lib/decode/adapters.ts";
import type { GameModel } from "../lib/game/types.ts";

const MODELS: GameModel[] = ["zve10", "a6400", "a7c2"];

test("data/game-tasks.json: cờ decoded khớp giá trị suy ra từ adapter lúc nạp", () => {
  const cat = getCatalog();
  const json = catalogJson as unknown as Record<GameModel, { settings: { id: string; decoded: boolean }[] }>;
  for (const m of MODELS) {
    assert.deepStrictEqual(
      json[m].settings.map((s) => [s.id, s.decoded]),
      cat[m].settings.map((s) => [s.id, s.decoded]),
      m
    );
  }
});

test("decoded chỉ đặt khi cài đặt định vị được và mọi giá trị có mã", () => {
  for (const m of MODELS) {
    const adapters = new Map(adaptersFor(m).map((a) => [a.settingId, a] as const));
    for (const s of getCatalog()[m].settings) {
      if (!s.decoded) continue;
      const a = adapters.get(s.id);
      assert.ok(a && a.located, `${m}.${s.id}`);
      for (const v of s.values) assert.notStrictEqual(a.codeOf(v.id), null, `${m}.${s.id}=${v.id}`);
    }
  }
});
