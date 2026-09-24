import { describe, expect, it } from "vitest";
import {
  checkAnswer,
  concentration,
  correlation,
  decimals,
  entropy,
  expectedScore,
} from "../../src/lib/mechanics.js";
import { analyze } from "../../src/steps/okugi-mechanism.js";

describe("奥義 mechanics", () => {
  it("エントロピーと集中度", () => {
    expect(entropy([1, 0])).toBe(0);
    expect(concentration([1, 0, 0])).toBe(1);
    expect(concentration([0.5, 0.5])).toBeCloseTo(0);
  });

  it("Score の期待値", () => {
    expect(expectedScore({ "0": 0.18, "1": 0.64, "2": 0.18 })).toBeCloseTo(1);
  });

  it("小数の桁数と相関", () => {
    expect(decimals(0.83)).toBe(2);
    expect(decimals(1)).toBe(0);
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });

  it("形の性質を検査する", () => {
    const ok = checkAnswer({
      type: "choice",
      choice: "a",
      confidence: 0.5,
      probabilities: { a: 0.7, b: 0.3 },
    });
    expect(ok.every((i) => i.ok)).toBe(true);
    const bad = checkAnswer({
      type: "choice",
      choice: "b",
      confidence: 0.5,
      probabilities: { a: 0.7, b: 0.3 },
    });
    expect(bad.find((i) => i.name.startsWith("choice"))?.ok).toBe(false);
  });

  it("npm run okugi の集計が、記録済みの応答全体で動く", () => {
    const r = analyze();
    expect(r.total).toBeGreaterThan(0);
    expect(r.failures).toEqual([]);
  });
});
