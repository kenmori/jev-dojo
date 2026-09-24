/**
 * 九段 本番運用
 * 60件を「本番のつもりで」流す。
 *   - バージョン固定（エイリアスを使わない）と、応答の model の確認
 *   - 同時実行数と1分あたりの上限を、送る側で守る
 *   - 予算の上限で止める
 *   - 1リクエスト1行の JSON ログ（本文は書かない）
 *   - リトライとタイムアウトは SDK の設定で持つ（自前で書かない）
 *
 *   npm run d9
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { boardQuestions, postsFor } from "../lib/board.js";
import type { Dojo } from "../lib/client.js";
import { costUSD, formatUSD } from "../lib/cost.js";
import { boardDojo } from "../lib/evaluate.js";
import { facts } from "../lib/facts.js";
import { ROOT } from "../lib/fixtures.js";
import { median } from "../lib/metrics.js";
import { footer, runMain, title } from "../lib/print.js";
import {
  BudgetExceededError,
  BudgetGuard,
  logLine,
  mapWithLimits,
  type RequestLog,
} from "../lib/production.js";

export const STEP = "d9-production";

export interface ProductionOptions {
  concurrency: number;
  /** 公式の上限ぎりぎりではなく、余裕を持たせる */
  perMinute: number;
  budgetUSD: number;
}

export const DEFAULT_OPTIONS: ProductionOptions = {
  concurrency: 4,
  perMinute: Math.floor(facts.rateLimits.requestsPerMinute / 2),
  budgetUSD: 0.01,
};

export async function run(dojo: Dojo, options: ProductionOptions = DEFAULT_OPTIONS) {
  const budget = new BudgetGuard(options.budgetUSD);
  const logs: RequestLog[] = [];
  const modelsSeen = new Set<string>();

  const results = await mapWithLimits(
    postsFor("ja"),
    async (post) => {
      budget.check();
      const started = performance.now();
      try {
        const { data, requestId } = await dojo.client
          .systemOne({ state: post.text, questions: boardQuestions })
          .withResponse();
        budget.record(data.usage);
        modelsSeen.add(data.model);
        logs.push({
          at: new Date().toISOString(),
          step: STEP,
          itemId: post.id,
          model: data.model,
          requestId,
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          costUSD: costUSD(data.usage),
          latencyMs: Math.round(performance.now() - started),
        });
        return { id: post.id, ok: true as const };
      } catch (err) {
        if (err instanceof BudgetExceededError) throw err;
        logs.push({
          at: new Date().toISOString(),
          step: STEP,
          itemId: post.id,
          model: dojo.model,
          requestId: undefined,
          inputTokens: 0,
          outputTokens: 0,
          costUSD: 0,
          latencyMs: Math.round(performance.now() - started),
          error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
        });
        return { id: post.id, ok: false as const };
      }
    },
    { concurrency: options.concurrency, perMinute: options.perMinute },
  );

  return { results, logs, spentUSD: budget.spentUSD, modelsSeen: [...modelsSeen] };
}

async function main() {
  // SDK のリトライ・タイムアウトは設定で持つ。既定値でも 429 と 5xx はバックオフ付きで再試行される
  const dojo = boardDojo("ja");
  const { results, logs, spentUSD, modelsSeen } = await run(dojo);

  const dir = join(ROOT, "logs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${STEP}.jsonl`), `${logs.map(logLine).join("\n")}\n`);

  title("九段 本番運用");
  const o = DEFAULT_OPTIONS;
  console.log(
    `同時実行 ${o.concurrency} ／ 1分あたり上限 ${o.perMinute} ／ 予算 ${formatUSD(o.budgetUSD)}\n`,
  );
  const ok = results.filter((r) => r.ok).length;
  console.log(`成功 ${ok} ／ 失敗 ${results.length - ok}`);
  console.log(`使った金額 ${formatUSD(spentUSD)}`);
  console.log(`レイテンシ中央値 ${median(logs.map((l) => l.latencyMs))} ms`);
  console.log(`指定したモデル ${dojo.model} ／ 応答のモデル ${modelsSeen.join(", ")}`);
  if (modelsSeen.some((m) => m !== dojo.model)) {
    console.log("⚠️ 指定と違うモデルが答えています。エイリアスを使っていないか確認してください");
  }
  console.log(`\nログ: logs/${STEP}.jsonl（先頭1行）`);
  console.log(`  ${logLine(logs[0] as RequestLog)}`);
  footer(dojo, {
    input_tokens: logs.reduce((a, l) => a + l.inputTokens, 0),
    output_tokens: logs.reduce((a, l) => a + l.outputTokens, 0),
  });
}

runMain(import.meta.url, main);
