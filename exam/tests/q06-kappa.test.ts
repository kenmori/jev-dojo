import { describe, expect, it } from "vitest";
import { load } from "./load.js";

const { kappa } = await load<typeof import("../tasks/q06-kappa.js")>("q06-kappa");

describe("第6問 Cohen の κ", () => {
  it("完全一致は 1", () => {
    expect(kappa(["a", "b", "a"], ["a", "b", "a"])).toBe(1);
  });

  it("偶然と同じなら 0", () => {
    expect(kappa(["a", "a", "b", "b"], ["a", "b", "a", "b"])).toBeCloseTo(0);
  });

  it("手計算の例", () => {
    // 一致 0.8、偶然 0.5 → κ = 0.6
    const a = [true, true, true, true, true, false, false, false, false, false];
    const b = [true, true, true, true, false, false, false, false, false, true];
    expect(kappa(a, b)).toBeCloseTo(0.6);
  });

  it("長さが違えば例外", () => {
    expect(() => kappa([1], [1, 2])).toThrow();
  });
});
