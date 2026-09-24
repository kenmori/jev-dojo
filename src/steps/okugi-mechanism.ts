/**
 * 奥義 仕組みを理解する
 * 記録済みの応答（fixtures/）を全部読み、Jev の答えの「形」について成り立つはずの性質を確かめる。
 * API は呼ばない。npm run record で実APIの応答に置き換えてから実行すると、本物の検証になる。
 *
 *   npm run okugi
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { FIXTURES_DIR, readFixture } from "../lib/fixtures.js";
import { checkAnswer, concentration, correlation, decimals } from "../lib/mechanics.js";
import { runMain, title } from "../lib/print.js";

type Answer = Parameters<typeof checkAnswer>[0];

export function collect() {
  const answers: { file: string; name: string; answer: Answer; synthetic: boolean }[] = [];
  const usages: { inputTokens: number; outputTokens: number; stateChars: number }[] = [];
  for (const dir of readdirSync(FIXTURES_DIR)) {
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
        });
      }
    }
  }
  return { answers, usages };
}

export function analyze() {
  const { answers, usages } = collect();
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
      for (const p of Object.values(a.answer.probabilities))
        maxDecimals = Math.max(maxDecimals, decimals(p));
    } else {
      maxDecimals = Math.max(maxDecimals, decimals(a.answer.noul));
    }
  }
  return {
    total: answers.length,
    synthetic: answers.filter((a) => a.synthetic).length,
    counts,
    failures,
    confidenceVsConcentration: correlation(conf, conc),
    maxDecimals,
    outputTokensAlwaysZero: usages.every((u) => u.outputTokens === 0),
    tokensVsStateChars: correlation(
      usages.map((u) => u.inputTokens),
      usages.map((u) => u.stateChars),
    ),
  };
}

async function main() {
  const r = analyze();
  title("奥義 仕組みを理解する");
  console.log(`調べた答え: ${r.total} 件（うち見本データ ${r.synthetic} 件）\n`);
  console.log("▼ 答えの「形」の性質");
  for (const [name, c] of r.counts) {
    console.log(`  ${c.ok === c.total ? "✅" : "❌"} ${name}: ${c.ok}/${c.total}`);
  }
  for (const f of r.failures.slice(0, 5)) {
    console.log(`     × ${f.file} ${f.name}: ${f.invariant}（${f.detail}）`);
  }
  console.log("\n▼ 観察（成り立つと決まっているわけではないもの）");
  console.log(`  確率の小数の桁数（最大）: ${r.maxDecimals}`);
  console.log(
    `  confidence と「1 − 正規化エントロピー」の相関: ${r.confidenceVsConcentration.toFixed(2)}`,
  );
  console.log(`  出力トークンはいつも 0 か: ${r.outputTokensAlwaysZero ? "はい" : "いいえ"}`);
  console.log(`  入力トークンと state の文字数の相関: ${r.tokensVsStateChars.toFixed(2)}`);
  if (r.synthetic > 0) {
    console.log("\n※ 見本データ（合成）が含まれています。合成データは教材側の式で作っているので、");
    console.log("  「観察」の数字は Jev の性質ではなく、見本の作り方を映しているだけです。");
    console.log("  npm run record で実APIの応答に置き換えてから、もう一度実行してください。");
  }
}

runMain(import.meta.url, main);
