import { describe, expect, it } from "vitest";
import { load } from "./load.js";

const { isWellFormed } = await load<typeof import("../tasks/q09-mechanism.js")>("q09-mechanism");
const good = { score: 1, confidence: 0.4, probabilities: { "0": 0.18, "1": 0.64, "2": 0.18 } };

describe("第9問 答えの形", () => {
  it("正しい形なら true", () => {
    expect(isWellFormed(good)).toBe(true);
    expect(isWellFormed({ ...good, probabilities: { "0": 0.18, "1": 0.64, "2": 0.19 } })).toBe(
      true,
    );
  });

  it("合計が 1 から離れすぎていれば false", () => {
    expect(isWellFormed({ ...good, probabilities: { "0": 0.3, "1": 0.64, "2": 0.18 } })).toBe(
      false,
    );
  });

  it("score が期待値と合わなければ false", () => {
    expect(isWellFormed({ ...good, score: 1.5 })).toBe(false);
  });

  it("範囲外の値があれば false", () => {
    expect(isWellFormed({ ...good, confidence: 1.2 })).toBe(false);
    expect(isWellFormed({ ...good, probabilities: { "0": -0.1, "1": 0.92, "2": 0.18 } })).toBe(
      false,
    );
  });
});
