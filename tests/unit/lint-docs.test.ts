import { describe, expect, it } from "vitest";
import { lintSections, lintVolatile, volatileValues } from "../../scripts/lint-docs.js";
import type { Facts } from "../../src/lib/facts.js";

const facts: Facts = {
  lastVerified: "2026-01-01",
  model: { pinned: "jev-9.9.9", aliases: ["jev-latest"] },
  pricing: { inputPerMtok: 0.123, outputPerMtok: 0 },
  rateLimits: { tokensPerSecond: 100000, requestsPerMinute: 600 },
  context: { totalTokens: 4096, statePlusLongestQuestion: 2048 },
  endpoint: "https://example.test/v1/systemone",
  sdk: { js: "@typesafe-ai/sdk", jsVersion: "9.9.9", python: "typesafe-sdk" },
  signup: { waitlist: false, startingCredit: "$7" },
};

describe("lintSections", () => {
  it("ラベルと一次情報がそろっていれば OK", () => {
    const text =
      "## A\n\n<!-- freshness: evergreen -->\n\n本文\n\n> 一次情報: https://docs.typesafe.ai/x\n";
    expect(lintSections("a.md", text)).toEqual([]);
  });

  it("一次情報がない h2 はエラー", () => {
    const errors = lintSections("a.md", "## A\n\n<!-- freshness: evergreen -->\n本文\n");
    expect(errors.map((e) => e.message).join()).toMatch(/一次情報/);
  });

  it("ラベルがない h2 はエラー", () => {
    const errors = lintSections("a.md", "## A\n\n> 一次情報: x\n");
    expect(errors.map((e) => e.message).join()).toMatch(/目印/);
  });

  it("コードブロックの中の ## は見出しとして扱わない", () => {
    const text = "## A\n<!-- freshness: volatile -->\n```\n## not heading\n```\n> 一次情報: x\n";
    expect(lintSections("a.md", text)).toEqual([]);
  });
});

describe("lintVolatile", () => {
  it("価格やレート制限を直書きするとエラー", () => {
    expect(lintVolatile("a.md", "料金は $0.123 です", facts)).toHaveLength(1);
    expect(lintVolatile("a.md", "毎分 600 リクエスト", facts)).toHaveLength(1);
    expect(lintVolatile("a.md", "毎秒 100,000 トークン", facts)).toHaveLength(1);
  });

  it("モデルのバージョンIDを直書きするとエラー", () => {
    expect(lintVolatile("a.md", "jev-9.9.9 を使う", facts).length).toBeGreaterThan(0);
    expect(lintVolatile("a.md", "jev-1.2 を使う", facts)).toHaveLength(1);
  });

  it("URL の中は対象外", () => {
    expect(
      lintVolatile("a.md", "[弱点](https://docs.typesafe.ai/model-jaggedness/jev-1.13)", facts),
    ).toEqual([]);
  });

  it("似ているが違う数字は対象外", () => {
    expect(lintVolatile("a.md", "6000 件、0.1234", facts)).toEqual([]);
  });

  it("エイリアスは書いてよい", () => {
    expect(lintVolatile("a.md", "jev-latest を使う", facts)).toEqual([]);
  });
});

describe("volatileValues", () => {
  it("0 のような小さな整数は対象にしない", () => {
    expect(volatileValues(facts)).not.toContain("0");
  });
});
