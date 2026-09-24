import { describe, expect, it } from "vitest";
import { costUSD, formatUSD, sumUsage } from "../../src/lib/cost.js";

const pricing = { inputPerMtok: 0.5, outputPerMtok: 2 };

describe("costUSD", () => {
  it("100万トークンあたりの単価で計算する", () => {
    expect(costUSD({ input_tokens: 1_000_000, output_tokens: 0 }, pricing)).toBe(0.5);
    expect(costUSD({ input_tokens: 0, output_tokens: 500_000 }, pricing)).toBe(1);
  });

  it("トークン0なら費用0", () => {
    expect(costUSD({ input_tokens: 0, output_tokens: 0 }, pricing)).toBe(0);
  });
});

describe("formatUSD", () => {
  it("小さな金額を0に丸めない", () => {
    expect(formatUSD(0.0000042)).toBe("$0.0000042");
    expect(formatUSD(0.000027)).toBe("$0.000027");
  });

  it("大きめの金額は小数2桁", () => {
    expect(formatUSD(1.5)).toBe("$1.50");
    expect(formatUSD(12)).toBe("$12.00");
  });

  it("0 は $0", () => {
    expect(formatUSD(0)).toBe("$0");
  });
});

describe("sumUsage", () => {
  it("入力と出力をそれぞれ足す", () => {
    expect(
      sumUsage({ input_tokens: 10, output_tokens: 1 }, { input_tokens: 5, output_tokens: 2 }),
    ).toEqual({ input_tokens: 15, output_tokens: 3 });
  });
});
