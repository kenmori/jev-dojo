import { describe, expect, it } from "vitest";
import { load } from "./load.js";

const { runWithBudget } = await load<typeof import("../tasks/q08-budget.js")>("q08-budget");
const tick = () => new Promise((r) => setTimeout(r, 2));

describe("第8問 予算と同時実行数", () => {
  it("同時実行数を守り、結果は入力の順番", async () => {
    let active = 0;
    let peak = 0;
    const { results } = await runWithBudget(
      [1, 2, 3, 4, 5],
      async (n) => {
        active += 1;
        peak = Math.max(peak, active);
        await tick();
        active -= 1;
        return { n, costUSD: 0 };
      },
      { concurrency: 2, limitUSD: 1 },
    );
    expect(peak).toBe(2);
    expect(results.map((r) => r?.n)).toEqual([1, 2, 3, 4, 5]);
  });

  it("予算に達したら、それ以降は呼ばない", async () => {
    const called: number[] = [];
    const { results, spentUSD } = await runWithBudget(
      [1, 2, 3, 4, 5],
      async (n) => {
        called.push(n);
        await tick();
        return { n, costUSD: 0.4 };
      },
      { concurrency: 1, limitUSD: 1 },
    );
    expect(called).toEqual([1, 2, 3]);
    expect(spentUSD).toBeCloseTo(1.2);
    expect(results.slice(3)).toEqual([undefined, undefined]);
  });
});
