/**
 * ライブ評価。実APIを叩く。キーがある時だけ動き、ないときはスキップする。
 * 結果は「合否」ではなく「記録」（plan.md §8）。
 * EVAL_WRITE_HISTORY=1 のとき docs/_generated/eval-history.md に1行追記する。
 *
 * P0 では型と確率の形だけを確かめる。精度とキャリブレーションの測定は六段・七段で足す。
 */
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { sumsToOne } from "../../src/lib/approx.js";
import { createDojo } from "../../src/lib/client.js";
import { costUSD, formatUSD, sumUsage } from "../../src/lib/cost.js";
import { loadDotEnv } from "../../src/lib/env.js";
import { facts } from "../../src/lib/facts.js";
import { ROOT } from "../../src/lib/fixtures.js";
import * as k05 from "../../src/steps/k05-score.js";
import * as k06 from "../../src/steps/k06-choice.js";
import * as k07 from "../../src/steps/k07-noul.js";

loadDotEnv();
const hasKey = Boolean(process.env.TYPESAFE_API_KEY?.trim());
const usages: { input_tokens: number; output_tokens: number }[] = [];
const confidences: number[] = [];

describe.skipIf(!hasKey)(`live eval (${facts.model.pinned})`, () => {
  it("7級 Noul", async () => {
    const rows = await k07.run(createDojo(k07.STEP, { mode: "live" }));
    for (const r of rows) {
      expect(r.probability).toBeGreaterThanOrEqual(0);
      expect(r.probability).toBeLessThanOrEqual(1);
      usages.push(r.usage);
    }
  });

  it("6級 Choice", async () => {
    const rows = await k06.run(createDojo(k06.STEP, { mode: "live" }));
    for (const r of rows) {
      expect(sumsToOne(r.answer.probabilities, 0.02)).toBe(true);
      confidences.push(r.answer.confidence);
      usages.push(r.usage);
    }
  });

  it("5級 Score", async () => {
    const rows = await k05.run(createDojo(k05.STEP, { mode: "live" }));
    for (const r of rows) {
      expect(r.answer.score).toBeGreaterThanOrEqual(0);
      expect(r.answer.score).toBeLessThanOrEqual(2);
      confidences.push(r.answer.confidence);
      usages.push(r.usage);
    }
  });

  afterAll(() => {
    if (process.env.EVAL_WRITE_HISTORY !== "1" || usages.length === 0) return;
    const file = join(ROOT, "docs", "_generated", "eval-history.md");
    if (!existsSync(file)) {
      writeFileSync(
        file,
        [
          "# eval 履歴",
          "",
          "> 自動生成（.github/workflows/eval.yml）。手で編集しない。",
          "",
          "| 日付 | モデル | リクエスト数 | 入力トークン | 費用 | confidence 平均 |",
          "|---|---|---|---|---|---|",
          "",
        ].join("\n"),
      );
    }
    const total = sumUsage(...usages);
    const avg = confidences.reduce((a, b) => a + b, 0) / Math.max(1, confidences.length);
    const date = new Date().toISOString().slice(0, 10);
    appendFileSync(
      file,
      `| ${date} | ${facts.model.pinned} | ${usages.length} | ${total.input_tokens} | ${formatUSD(costUSD(total))} | ${avg.toFixed(3)} |\n`,
    );
  });
});

describe.skipIf(hasKey)("live eval", () => {
  it.skip("TYPESAFE_API_KEY がないのでスキップ", () => {});
});
