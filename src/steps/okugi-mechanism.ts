/**
 * 奥義 仕組みを理解する
 * 記録済みの応答（fixtures/）を全部読み、Jev の答えの「形」について成り立つはずの性質を確かめる。
 * API は呼ばない。npm run record で実APIの応答に置き換えてから実行すると、本物の検証になる。
 *
 *   npm run okugi
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { FIXTURES_DIR, listFixtureDirs, readFixture } from "../lib/fixtures.js";
import { t } from "../lib/i18n.js";
import { checkAnswer, concentration, correlation, decimals } from "../lib/mechanics.js";
import { runMain, title } from "../lib/print.js";

type Answer = Parameters<typeof checkAnswer>[0];

export function collect() {
  const answers: { file: string; name: string; answer: Answer; synthetic: boolean }[] = [];
  const usages: {
    inputTokens: number;
    outputTokens: number;
    stateChars: number;
    synthetic: boolean;
  }[] = [];
  for (const dir of listFixtureDirs()) {
    if (dir === "errors" || dir.endsWith("-claude")) continue;
    for (const f of readdirSync(join(FIXTURES_DIR, dir))) {
      const fx = readFixture(join(FIXTURES_DIR, dir, f));
      const body = fx.response.body as {
        answers?: Record<string, Answer>;
        usage?: { input_tokens: number; output_tokens: number };
      };
      if (!body?.answers) continue;
      for (const [name, answer] of Object.entries(body.answers)) {
        answers.push({
          file: `${dir}/${f}`,
          name,
          answer,
          synthetic: fx.meta.source === "synthetic",
        });
      }
      if (body.usage) {
        const state = (fx.request.body as { state?: unknown }).state;
        usages.push({
          inputTokens: body.usage.input_tokens,
          outputTokens: body.usage.output_tokens,
          stateChars: JSON.stringify(state ?? "").length,
          synthetic: fx.meta.source === "synthetic",
        });
      }
    }
  }
  return { answers, usages };
}

/**
 * 記録から推測した Choice の confidence の式（公式の式ではない。第18章の観察）:
 * （1 位の確率 − 1 ÷ 選択肢の数）÷（1 − 1 ÷ 選択肢の数）
 */
export function normalizedTop(probabilities: number[]): number {
  const k = probabilities.length;
  if (k < 2) return 1;
  return (Math.max(...probabilities) - 1 / k) / (1 - 1 / k);
}

/** 実際の confidence と、上の式で計算した値のずれ */
function fitStats(pairs: { actual: number; predicted: number }[]) {
  const diffs = pairs.map((p) => Math.abs(p.actual - p.predicted));
  return {
    n: diffs.length,
    maxDiff: diffs.length ? Math.max(...diffs) : Number.NaN,
    meanDiff: diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : Number.NaN,
    within002: diffs.filter((d) => d <= 0.02).length,
  };
}

export function analyze(options: { liveOnly?: boolean } = {}) {
  const collected = collect();
  const answers = options.liveOnly
    ? collected.answers.filter((a) => !a.synthetic)
    : collected.answers;
  const usages = options.liveOnly ? collected.usages.filter((u) => !u.synthetic) : collected.usages;
  const decimalCounts = new Map<number, number>();
  const choiceFit: { actual: number; predicted: number }[] = [];
  const scoreFit: { actual: number; predicted: number }[] = [];
  const failures: { file: string; name: string; invariant: string; detail: string }[] = [];
  const counts = new Map<string, { ok: number; total: number }>();
  const conf: number[] = [];
  const conc: number[] = [];
  let maxDecimals = 0;
  for (const a of answers) {
    for (const inv of checkAnswer(a.answer)) {
      const c = counts.get(inv.name) ?? { ok: 0, total: 0 };
      c.total += 1;
      if (inv.ok) c.ok += 1;
      else failures.push({ file: a.file, name: a.name, invariant: inv.name, detail: inv.detail });
      counts.set(inv.name, c);
    }
    if (a.answer.type !== "noul") {
      conf.push(a.answer.confidence);
      conc.push(concentration(Object.values(a.answer.probabilities)));
      const ps = Object.values(a.answer.probabilities);
      for (const p of ps) {
        maxDecimals = Math.max(maxDecimals, decimals(p));
        decimalCounts.set(decimals(p), (decimalCounts.get(decimals(p)) ?? 0) + 1);
      }
      (a.answer.type === "choice" ? choiceFit : scoreFit).push({
        actual: a.answer.confidence,
        predicted: normalizedTop(ps),
      });
    } else {
      maxDecimals = Math.max(maxDecimals, decimals(a.answer.noul));
      decimalCounts.set(
        decimals(a.answer.noul),
        (decimalCounts.get(decimals(a.answer.noul)) ?? 0) + 1,
      );
    }
  }
  return {
    total: answers.length,
    synthetic: answers.filter((a) => a.synthetic).length,
    counts,
    failures,
    confidenceVsConcentration: correlation(conf, conc),
    maxDecimals,
    decimalCounts: [...decimalCounts].sort((a, b) => a[0] - b[0]),
    choiceConfidenceFit: fitStats(choiceFit),
    scoreConfidenceFit: fitStats(scoreFit),
    outputTokensAlwaysZero: usages.every((u) => u.outputTokens === 0),
    tokensVsStateChars: correlation(
      usages.map((u) => u.inputTokens),
      usages.map((u) => u.stateChars),
    ),
  };
}

async function main() {
  const liveOnly = process.argv.includes("--live-only");
  const r = analyze({ liveOnly });
  title(t("奥義 仕組みを理解する", "Okugi: Understanding the mechanism"));
  console.log(
    t(
      `調べた答え: ${r.total} 件（うち見本データ ${r.synthetic} 件）${liveOnly ? "　※ --live-only: 実APIの記録だけ" : ""}\n`,
      `Answers checked: ${r.total} (of which sample data: ${r.synthetic})${liveOnly ? "  * --live-only: real API recordings only" : ""}\n`,
    ),
  );
  console.log(t("▼ 答えの「形」の性質", '▼ Properties of the answer\'s "shape"'));
  for (const [name, c] of r.counts) {
    console.log(`  ${c.ok === c.total ? "✅" : "❌"} ${name}: ${c.ok}/${c.total}`);
  }
  for (const f of r.failures.slice(0, 5)) {
    console.log(`     × ${f.file} ${f.name}: ${f.invariant}（${f.detail}）`);
  }
  console.log(
    t(
      "\n▼ 観察（成り立つと決まっているわけではないもの）",
      "\n▼ Observations (not guaranteed to hold)",
    ),
  );
  console.log(
    t(
      `  確率の小数の桁数（最大）: ${r.maxDecimals}`,
      `  decimal places in probabilities (max): ${r.maxDecimals}`,
    ),
  );
  console.log(
    t(
      `  小数の桁数ごとの値の数: ${r.decimalCounts.map(([d, n]) => `${d} 桁 ${n}`).join(" ／ ")}`,
      `  values per number of decimal places: ${r.decimalCounts.map(([d, n]) => `${d}: ${n}`).join(" / ")}`,
    ),
  );
  for (const [label, fit] of [
    ["Choice", r.choiceConfidenceFit],
    ["Score", r.scoreConfidenceFit],
  ] as const) {
    if (fit.n === 0) continue;
    console.log(
      t(
        `  ${label} の confidence と「（1位 − 1/K）÷（1 − 1/K）」のずれ: 最大 ${fit.maxDiff.toFixed(3)} ／ 平均 ${fit.meanDiff.toFixed(3)} ／ 0.02 以内 ${fit.within002}/${fit.n}`,
        `  ${label} confidence vs "(top − 1/K) ÷ (1 − 1/K)": max diff ${fit.maxDiff.toFixed(3)} / mean ${fit.meanDiff.toFixed(3)} / within 0.02: ${fit.within002}/${fit.n}`,
      ),
    );
  }
  console.log(
    t(
      `  confidence と「1 − 正規化エントロピー」の相関: ${r.confidenceVsConcentration.toFixed(2)}`,
      `  correlation between confidence and "1 − normalized entropy": ${r.confidenceVsConcentration.toFixed(2)}`,
    ),
  );
  console.log(
    t(
      `  出力トークンはいつも 0 か: ${r.outputTokensAlwaysZero ? "はい" : "いいえ"}`,
      `  output tokens always 0: ${r.outputTokensAlwaysZero ? "yes" : "no"}`,
    ),
  );
  console.log(
    t(
      `  入力トークンと state の文字数の相関: ${r.tokensVsStateChars.toFixed(2)}`,
      `  correlation between input tokens and state length: ${r.tokensVsStateChars.toFixed(2)}`,
    ),
  );
  if (r.synthetic > 0 && !liveOnly) {
    console.log(
      t(
        "\n※ 見本データ（合成）が含まれています。合成データは教材側の式で作っているので、",
        "\nNote: sample data (synthetic) is included. The synthetic data is generated by our own formulas, so",
      ),
    );
    console.log(
      t(
        "  「観察」の数字は Jev の性質ではなく、見本の作り方を映しているだけです。",
        '  the "observations" reflect how the samples were made, not how Jev behaves.',
      ),
    );
    console.log(
      t(
        "  npm run record で実APIの応答に置き換えてから、もう一度実行してください。",
        "  Replace them with real API responses via npm run record, then run this again.",
      ),
    );
  }
}

runMain(import.meta.url, main);
