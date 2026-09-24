import { describe, expect, it } from "vitest";
import { requestKey, resolveMode, stableStringify } from "../../src/lib/fixtures.js";

describe("stableStringify", () => {
  it("キーの順番が違っても同じ文字列になる", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });

  it("配列の順番は保つ", () => {
    expect(stableStringify([2, 1])).not.toBe(stableStringify([1, 2]));
  });
});

describe("requestKey", () => {
  const base = { method: "POST", path: "/v1/systemone", body: { state: "a" } };

  it("同じリクエストなら同じキー", () => {
    expect(requestKey(base)).toBe(requestKey({ ...base }));
  });

  it("中身が1文字でも違えば別のキー", () => {
    expect(requestKey(base)).not.toBe(requestKey({ ...base, body: { state: "b" } }));
  });
});

describe("resolveMode", () => {
  it("キーがあれば live、なければ replay", () => {
    expect(resolveMode({ TYPESAFE_API_KEY: "x" })).toBe("live");
    expect(resolveMode({})).toBe("replay");
    expect(resolveMode({ TYPESAFE_API_KEY: "  " })).toBe("replay");
  });

  it("JEV_MODE が最優先", () => {
    expect(resolveMode({ TYPESAFE_API_KEY: "x", JEV_MODE: "replay" })).toBe("replay");
    expect(resolveMode({ JEV_MODE: "record" })).toBe("record");
  });

  it("知らない値は例外", () => {
    expect(() => resolveMode({ JEV_MODE: "fast" })).toThrow();
  });
});
