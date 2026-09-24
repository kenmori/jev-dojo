import { describe, expect, it } from "vitest";
import {
  accuracy,
  brierBinary,
  brierMulti,
  cohenKappa,
  confusionMatrix,
  expectedCalibrationError,
  median,
  minThresholdFor,
  reliabilityBins,
  thresholdSweep,
} from "../../src/lib/metrics.js";

describe("accuracy", () => {
  it("一致した割合", () => {
    expect(accuracy(["a", "b", "c", "a"], ["a", "b", "a", "a"])).toBe(0.75);
  });

  it("長さが違えば例外", () => {
    expect(() => accuracy(["a"], ["a", "b"])).toThrow();
  });
});

describe("brierBinary", () => {
  it("完璧な予測は 0、いつも 0.5 なら 0.25", () => {
    expect(brierBinary([1, 0], [true, false])).toBe(0);
    expect(brierBinary([0.5, 0.5], [true, false])).toBe(0.25);
  });

  it("自信満々で外すと 1", () => {
    expect(brierBinary([1], [false])).toBe(1);
  });
});

describe("brierMulti", () => {
  it("正解に確率1なら 0、完全に外すと 2", () => {
    expect(brierMulti([{ a: 1, b: 0 }], ["a"])).toBe(0);
    expect(brierMulti([{ a: 0, b: 1 }], ["a"])).toBe(2);
  });

  it("分布に無いラベルが正解でも計算できる", () => {
    expect(brierMulti([{ a: 1 }], ["b"])).toBe(2);
  });
});

describe("reliabilityBins / ECE", () => {
  it("確率をビンに分けて、実際の割合と比べる", () => {
    const bins = reliabilityBins([0.1, 0.1, 0.9, 0.9, 1], [false, true, true, true, true], 2);
    expect(bins[0]).toMatchObject({ count: 2, observed: 0.5 });
    expect(bins[1]).toMatchObject({ count: 3, observed: 1 });
  });

  it("予測と実際がそろっていれば ECE は 0", () => {
    const bins = reliabilityBins([0, 0, 1, 1], [false, false, true, true], 2);
    expect(expectedCalibrationError(bins)).toBe(0);
  });
});

describe("thresholdSweep", () => {
  const ps = [0.95, 0.85, 0.6, 0.4, 0.1, 0.05];
  const ys = [true, false, true, false, false, false];

  it("しきい値を上げると自動判定の割合が下がる", () => {
    const rows = thresholdSweep(ps, ys, [0.5, 0.9]);
    expect(rows[0]?.coverage).toBe(1);
    expect(rows[1]?.coverage).toBe(0.5);
  });

  it("自動判定したものの正解率を出す", () => {
    const rows = thresholdSweep(ps, ys, [0.8]);
    // 0.95(○) 0.85(×) 0.1(○) 0.05(○)
    expect(rows[0]?.accuracy).toBe(0.75);
  });

  it("目標の正解率を満たす最小のしきい値を探す", () => {
    const rows = thresholdSweep(ps, ys, [0.5, 0.8, 0.9]);
    expect(minThresholdFor(rows, 1)?.threshold).toBe(0.9);
    expect(minThresholdFor(rows, 1.1)).toBeUndefined();
  });
});

describe("cohenKappa", () => {
  it("完全一致は 1", () => {
    expect(cohenKappa(["a", "b", "a"], ["a", "b", "a"])).toBe(1);
  });

  it("偶然と同じくらいなら 0 付近", () => {
    expect(cohenKappa(["a", "a", "b", "b"], ["a", "b", "a", "b"])).toBe(0);
  });
});

describe("confusionMatrix", () => {
  it("正解×予測の件数", () => {
    const m = confusionMatrix(["a", "b", "b"], ["a", "a", "b"], ["a", "b"] as const);
    expect(m).toEqual({ a: { a: 1, b: 1 }, b: { a: 0, b: 1 } });
  });
});

describe("median", () => {
  it("偶数個なら真ん中2つの平均", () => {
    expect(median([3, 1, 2, 4])).toBe(2.5);
  });
});
