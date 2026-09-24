import { describe, expect, it } from "vitest";
import { load } from "./load.js";

const { chooseThreshold } = await load<typeof import("../tasks/q07-threshold.js")>("q07-threshold");
const ps = [0.95, 0.85, 0.6, 0.4, 0.1, 0.05];
const ys = [true, false, true, false, false, false];

describe("第7問 しきい値", () => {
  it("目標を満たす最小のしきい値と、自動化できる割合", () => {
    expect(chooseThreshold(ps, ys, 1, [0.5, 0.8, 0.9])).toEqual({ threshold: 0.9, coverage: 0.5 });
  });

  it("候補の順番に左右されない", () => {
    expect(chooseThreshold(ps, ys, 0.8, [0.9, 0.8, 0.5])?.threshold).toBe(0.5);
  });

  it("満たすものがなければ undefined", () => {
    expect(chooseThreshold(ps, ys, 1, [0.5, 0.6])).toBeUndefined();
  });

  it("自動で決めたものが0件のしきい値は選ばない", () => {
    expect(chooseThreshold([0.5, 0.5], [true, false], 1, [0.9])).toBeUndefined();
  });
});
