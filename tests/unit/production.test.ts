import { describe, expect, it } from "vitest";
import {
  BudgetExceededError,
  BudgetGuard,
  type Clock,
  createLimiter,
  createRateGate,
  mapWithLimits,
} from "../../src/lib/production.js";

const tick = () => new Promise((r) => setTimeout(r, 1));

describe("createLimiter", () => {
  it("同時に走る数を上限までに抑える", async () => {
    const run = createLimiter(2);
    let active = 0;
    let peak = 0;
    const task = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await tick();
      active -= 1;
    };
    await Promise.all(Array.from({ length: 6 }, () => run(task)));
    expect(peak).toBe(2);
  });

  it("失敗しても次のタスクは流れる", async () => {
    const run = createLimiter(1);
    const failed = run(async () => {
      throw new Error("x");
    });
    await expect(failed).rejects.toThrow("x");
    await expect(run(async () => 1)).resolves.toBe(1);
  });
});

describe("createRateGate", () => {
  it("1分あたりの上限を超えると、枠が空くまで待つ", async () => {
    let now = 0;
    const slept: number[] = [];
    const clock: Clock = {
      now: () => now,
      sleep: async (ms) => {
        slept.push(ms);
        now += ms;
      },
    };
    const acquire = createRateGate(2, clock);
    await acquire();
    await acquire();
    await acquire();
    expect(slept).toEqual([60_000]);
  });
});

describe("BudgetGuard", () => {
  it("上限に達したら止める", () => {
    const guard = new BudgetGuard(0.001, { inputPerMtok: 1, outputPerMtok: 0 });
    guard.check();
    guard.record({ input_tokens: 1000, output_tokens: 0 });
    expect(guard.spentUSD).toBeCloseTo(0.001);
    expect(() => guard.check()).toThrow(BudgetExceededError);
  });
});

describe("mapWithLimits", () => {
  it("結果は入力と同じ順番", async () => {
    const out = await mapWithLimits(
      [30, 10, 20],
      async (ms) => {
        await new Promise((r) => setTimeout(r, ms));
        return ms;
      },
      { concurrency: 3 },
    );
    expect(out).toEqual([30, 10, 20]);
  });
});
