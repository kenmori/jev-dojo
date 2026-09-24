import { describe, expect, it } from "vitest";
import { argmax, isClose, sumsToOne } from "../../src/lib/approx.js";

describe("isClose", () => {
  it("許容幅の中なら true", () => {
    expect(isClose(0.93, 0.9)).toBe(true);
    expect(isClose(0.84, 0.9)).toBe(false);
    expect(isClose(0.84, 0.9, 0.1)).toBe(true);
  });
});

describe("sumsToOne", () => {
  it("合計がほぼ1なら true", () => {
    expect(sumsToOne({ a: 0.2, b: 0.7, c: 0.1 })).toBe(true);
    expect(sumsToOne({ a: 0.2, b: 0.7 })).toBe(false);
  });
});

describe("argmax", () => {
  it("一番確率が高いラベルを返す", () => {
    expect(argmax({ a: 0.2, b: 0.7, c: 0.1 })).toBe("b");
  });

  it("空なら例外", () => {
    expect(() => argmax({})).toThrow();
  });
});
