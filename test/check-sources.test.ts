import { test } from "node:test";
import assert from "node:assert";
import { checkAll, checkUrl, classify, classifyError, collectSources, type Fetcher } from "../scripts/check-sources.ts";

/** A DNS failure as undici reports it: TypeError "fetch failed" with cause.code. */
const dnsError = () => Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } });

test("check-sources", async (t) => {
  await t.test("collectSources gathers article and product sources once each, with where", () => {
    const articles = [
      { id: "a1", meta: { sources: [{ url: "https://x.test/1" }, { url: "https://x.test/2" }] } },
      { id: "a2", meta: { sources: [{ url: "https://x.test/1" }] } },
      { id: "a3" },
    ];
    const products = [
      { code: "ZV-E10", source: "https://www.sony.jp/zv-e10", image: "https://www.sony.jp/zv-e10.png" },
      { code: "NOSRC", image: "https://www.sony.jp/nosrc.png" },
    ];
    assert.deepStrictEqual(collectSources(articles, products), [
      { url: "https://x.test/1", where: ["articles/a1 sources[0]", "articles/a2 sources[0]"] },
      { url: "https://x.test/2", where: ["articles/a1 sources[1]"] },
      { url: "https://www.sony.jp/zv-e10", where: ["products/ZV-E10"] },
    ]);
  });

  await t.test("classify: 2xx and 3xx ok, 404 and 410 dead, everything else unverified", () => {
    assert.strictEqual(classify(200), "ok");
    assert.strictEqual(classify(301), "ok");
    assert.strictEqual(classify(404), "dead");
    assert.strictEqual(classify(410), "dead");
    assert.strictEqual(classify(403), "unverified");
    assert.strictEqual(classify(429), "unverified");
    assert.strictEqual(classify(503), "unverified");
  });

  await t.test("classifyError: DNS failure is dead, timeouts and refusals are unverified", () => {
    assert.strictEqual(classifyError(dnsError()), "dead");
    assert.strictEqual(classifyError(Object.assign(new Error("timed out"), { name: "TimeoutError" })), "unverified");
    assert.strictEqual(classifyError(Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } })), "unverified");
  });

  await t.test("checkUrl tries HEAD, then GET when HEAD is not ok", async () => {
    const calls: string[] = [];
    const fetcher: Fetcher = async (_url, method) => {
      calls.push(method);
      return { status: method === "HEAD" ? 405 : 200 };
    };
    const r = await checkUrl("https://x.test/a", fetcher);
    assert.deepStrictEqual(calls, ["HEAD", "GET"]);
    assert.deepStrictEqual(r, { url: "https://x.test/a", verdict: "ok", status: 200 });
  });

  await t.test("checkUrl stops after HEAD when HEAD is ok", async () => {
    const calls: string[] = [];
    const fetcher: Fetcher = async (_url, method) => {
      calls.push(method);
      return { status: 200 };
    };
    await checkUrl("https://x.test/a", fetcher);
    assert.deepStrictEqual(calls, ["HEAD"]);
  });

  await t.test("checkUrl reports dead when both HEAD and GET say 404 or the domain is gone", async () => {
    const http404: Fetcher = async () => ({ status: 404 });
    assert.deepStrictEqual(await checkUrl("https://x.test/gone", http404), { url: "https://x.test/gone", verdict: "dead", status: 404 });

    const noDomain: Fetcher = async () => {
      throw dnsError();
    };
    assert.deepStrictEqual(await checkUrl("https://nope.test/", noDomain), { url: "https://nope.test/", verdict: "dead", error: "ENOTFOUND" });
  });

  await t.test("checkAll keeps input order and never exceeds the concurrency limit", async () => {
    const sources = Array.from({ length: 10 }, (_, i) => ({ url: `https://x.test/${i}`, where: [] as string[] }));
    let inFlight = 0;
    let peak = 0;
    const fetcher: Fetcher = async (url) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return { status: url.endsWith("/3") ? 404 : 200 };
    };
    const results = await checkAll(sources, 3, fetcher);
    assert.deepStrictEqual(results.map((r) => r.url), sources.map((s) => s.url));
    assert.ok(peak <= 3, `peak in-flight ${peak} exceeds 3`);
    assert.deepStrictEqual(results.filter((r) => r.verdict === "dead").map((r) => r.url), ["https://x.test/3"]);
  });
});
