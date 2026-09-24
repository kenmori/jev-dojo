import { describe, expect, it } from "vitest";
import { toLevel } from "../../src/steps/k05-score.js";
import { AUTO_THRESHOLD, decide } from "../../src/steps/k07-noul.js";

describe("7級 decide", () => {
  it("しきい値以上は自動で担当へ", () => {
    expect(decide(AUTO_THRESHOLD)).toBe("苦情として担当へ回す");
    expect(decide(0.99)).toBe("苦情として担当へ回す");
  });

  it("迷う範囲は人が読む", () => {
    expect(decide(0.5)).toBe("人が読んで判断する");
    expect(decide(1 - AUTO_THRESHOLD)).toBe("人が読んで判断する");
  });

  it("十分低ければ苦情ではない", () => {
    expect(decide(0.01)).toBe("苦情ではない");
  });

  it("しきい値を変えると結果が変わる", () => {
    expect(decide(0.7, 0.6)).toBe("苦情として担当へ回す");
  });
});

describe("5級 toLevel", () => {
  it("期待値を一番近い段階に丸める", () => {
    expect(toLevel(0.2)).toBe(0);
    expect(toLevel(0.5)).toBe(1);
    expect(toLevel(1.49)).toBe(1);
    expect(toLevel(1.94)).toBe(2);
  });
});
