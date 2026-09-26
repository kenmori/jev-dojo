/**
 * 苦情の質問を直すと、見逃しは減るか（書籍『ハンズオン Jev 入門』第15章の実験）。
 *
 *   npm run lab:complaint                 # 本物の API で 60 件 × 2 回（API キーが必要）
 *   npm run lab:complaint -- --repeat 3   # 回数を変える
 *   npm run lab:complaint -- --dry-run    # API を呼ばずに流れだけ確かめる
 *
 * - 1 件ごとに、直す前（v1: 本番用の質問）と直した後（v2）の 2 つの質問を、同じリクエストで送る。
 *   同じ回・同じ投稿で比べるので、実行ごとのぶれの影響を受けにくい
 * - 同じことを --repeat 回くり返し、実行ごとのぶれの大きさも見る
 * - 結果は logs/ に保存する（Git の管理外）
 * - 費用の目安: 1 回あたり 60 リクエスト、約 $0.002（教材の単価表で計算）
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as sdk from "@typesafe-ai/sdk";
import { boardQuestions, exampleLabels, postsFor } from "../src/lib/board.js";
import { costUSD, formatUSD, sumUsage } from "../src/lib/cost.js";
import { loadDotEnv } from "../src/lib/env.js";
import { boardDojo, predictAll } from "../src/lib/evaluate.js";
import { facts } from "../src/lib/facts.js";
import { ROOT } from "../src/lib/fixtures.js";
import { LANG } from "../src/lib/i18n.js";
import * as metrics from "../src/lib/metrics.js";
import { mapWithLimits } from "../src/lib/production.js";

if (LANG !== "ja") {
  console.error("この実験は日本語で行います。JEV_LANG を外して実行してください");
  process.exit(1);
}

// ---- 直した質問（第15章の案） ----

/** v1: 本番用の質問（jev-dojo の src/lib/board.ts） */
const v1 = boardQuestions.isComplaint;

/** v2: ラベルの基準に合わせた質問。危険や困りごとの報告は「はい」、落とし物の報告は「いいえ」 */
const v2 = sdk.noul("この投稿は、運営に対する苦情や不満ですか？", {
  true: "困っていること・不満・改善の要望が書かれている。遠回しな言い方、皮肉、丁寧な要請、危険や困りごとの報告も含む",
  false: "質問・お礼・感想・落とし物の報告・宣伝など、改善を求めていない",
});

// ---- 引数 ----

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const repeatIdx = args.indexOf("--repeat");
const repeat = repeatIdx >= 0 ? Number(args[repeatIdx + 1]) : 2;
if (!Number.isInteger(repeat) || repeat < 1 || repeat > 5) {
  console.error("--repeat は 1〜5 で指定してください");
  process.exit(1);
}

// ---- データ ----

type Post = { id: string; text: string };
type Label = { id: string; isComplaint: boolean };
const posts: Post[] = postsFor("ja");
const labels: Label[] = exampleLabels.items;
const gold = posts.map((p) => {
  const l = labels.find((x) => x.id === p.id);
  if (!l) throw new Error(`ラベルがありません: ${p.id}`);
  return l.isComplaint;
});

// 記録済みの v1（第15章の本文の数字）。再生なので API は呼ばない
const recorded: { id: string; complaint: number }[] = await predictAll(
  boardDojo("ja", { mode: "replay" }),
  "ja",
);
const recordedV1 = posts.map((p) => {
  const r = recorded.find((x) => x.id === p.id);
  if (!r) throw new Error(`記録がありません: ${p.id}`);
  return r.complaint;
});

// ---- 送る ----

type Usage = { input_tokens: number; output_tokens: number };
type Row = { id: string; v1: number; v2: number; usage: Usage };

async function runOnce(): Promise<Row[]> {
  if (dryRun) {
    // API を呼ばずに流れを確かめる。v1 も v2 も、記録済みの v1 をそのまま使う
    return posts.map((p, i) => ({
      id: p.id,
      v1: recordedV1[i] as number,
      v2: recordedV1[i] as number,
      usage: { input_tokens: 0, output_tokens: 0 },
    }));
  }
  const client = new sdk.TypeSafeClient({ defaultModel: facts.model.pinned });
  return mapWithLimits(
    posts,
    async (p: Post) => {
      const r = await client.systemOne({ state: p.text, questions: { v1, v2 } });
      if (r.model !== facts.model.pinned) {
        console.warn(`[!] ${p.id}: 指定 ${facts.model.pinned} ／ 応答 ${r.model}`);
      }
      return { id: p.id, v1: r.answers.v1.noul, v2: r.answers.v2.noul, usage: r.usage };
    },
    { concurrency: 4, perMinute: Math.floor(facts.rateLimits.requestsPerMinute / 2) },
  );
}

loadDotEnv();
if (!dryRun && !process.env.TYPESAFE_API_KEY?.trim()) {
  console.error("TYPESAFE_API_KEY が必要です（jev-dojo の .env に設定してください）");
  process.exit(1);
}

console.log(
  dryRun
    ? "▶ dry-run: API を呼ばずに流れだけ確かめます（数字は記録済みの v1 のコピー）\n"
    : `▶ 60 件 × ${repeat} 回を送ります（モデル ${facts.model.pinned}）\n`,
);

const runs: Row[][] = [];
for (let i = 0; i < repeat; i++) {
  const rows = await runOnce();
  runs.push(rows);
  console.log(`  ${i + 1} 回目: ${rows.length} 件`);
}

// ---- 集計 ----

function summarize(probs: number[]) {
  const bins = metrics.reliabilityBins(probs, gold);
  const misses = posts.filter((_, i) => gold[i] && (probs[i] as number) < 0.5).map((p) => p.id);
  const falseAlarms = posts
    .filter((_, i) => !gold[i] && (probs[i] as number) >= 0.5)
    .map((p) => p.id);
  return {
    accuracy: metrics.accuracy(
      probs.map((p) => p >= 0.5),
      gold,
    ),
    brier: metrics.brierBinary(probs, gold),
    ece: metrics.expectedCalibrationError(bins),
    bins,
    sweep: metrics.thresholdSweep(probs, gold),
    misses,
    falseAlarms,
  };
}

const series: { name: string; probs: number[] }[] = [{ name: "v1（記録済み）", probs: recordedV1 }];
runs.forEach((rows, i) => {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const pick = (k: "v1" | "v2") => posts.map((p) => byId.get(p.id)?.[k] as number);
  series.push({ name: `v1（${i + 1} 回目）`, probs: pick("v1") });
  series.push({ name: `v2（${i + 1} 回目）`, probs: pick("v2") });
});
const results = series.map((s) => ({ ...s, ...summarize(s.probs) }));

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const f3 = (x: number) => x.toFixed(3);

const lines: string[] = [];
const out = (s = "") => {
  lines.push(s);
  console.log(s);
};

out("\n## 苦情の判定: 直す前（v1）と直した後（v2）\n");
out(
  "| | 正解率 | Brier | ECE | 見逃し（苦情なのに 0.5 未満） | 誤検知（苦情でないのに 0.5 以上） |",
);
out("|---|---|---|---|---|---|");
for (const r of results) {
  out(
    `| ${r.name} | ${pct(r.accuracy)} | ${f3(r.brier)} | ${f3(r.ece)} | ${r.misses.length} 件 ${r.misses.join(" ")} | ${r.falseAlarms.length} 件 ${r.falseAlarms.join(" ")} |`,
  );
}

const watch = ["p56", "p23", "p39", "p51", "p06", "p53", "p45", "p11", "p57"];
out("\n## 第15章で取り上げた投稿の確率\n");
out(`| ID | ラベル | ${results.map((r) => r.name).join(" | ")} |`);
out(`|---|---|${results.map(() => "---").join("|")}|`);
for (const id of watch) {
  const i = posts.findIndex((p) => p.id === id);
  out(
    `| ${id} | ${gold[i] ? "苦情" : "苦情ではない"} | ${results.map((r) => (r.probs[i] as number).toFixed(2)).join(" | ")} |`,
  );
}

if (runs.length >= 2) {
  out("\n## 実行ごとのぶれ（同じ質問・同じ投稿で、回によって確率がどれだけ違ったか）\n");
  for (const k of ["v1", "v2"] as const) {
    const spreads = posts.map((p) => {
      const vals = runs.map((rows) => rows.find((r) => r.id === p.id)?.[k] as number);
      return { id: p.id, spread: Math.max(...vals) - Math.min(...vals) };
    });
    const max = spreads.reduce((a, b) => (b.spread > a.spread ? b : a));
    const flips = posts.filter((p) => {
      const sides = new Set(
        runs.map((rows) => (rows.find((r) => r.id === p.id)?.[k] as number) >= 0.5),
      );
      return sides.size > 1;
    });
    out(
      `- ${k}: 平均 ${metrics.mean(spreads.map((s) => s.spread)).toFixed(3)} ／ 最大 ${max.spread.toFixed(2)}（${max.id}） ／ 0.5 をまたいで判定が入れ替わった投稿 ${flips.length} 件 ${flips.map((p) => p.id).join(" ")}`,
    );
  }
}

const v2first = results.find((r) => r.name === "v2（1 回目）");
if (v2first) {
  out("\n## v2（1 回目）のしきい値の表\n");
  out("| しきい値 t | 自動で決めた割合 | そのうち当たった割合 | 自動で決めた件数 |");
  out("|---|---|---|---|");
  for (const s of v2first.sweep) {
    out(`| ${s.threshold.toFixed(2)} | ${pct(s.coverage)} | ${pct(s.accuracy)} | ${s.autoCount} |`);
  }
  out("\n## v2（1 回目）の信頼度曲線\n");
  out("| 区間 | 件数 | 言った確率の平均 | 実際に苦情だった割合 |");
  out("|---|---|---|---|");
  for (const b of v2first.bins) {
    out(
      `| ${b.lo.toFixed(1)}〜${b.hi.toFixed(1)} | ${b.count} | ${b.count ? b.meanPredicted.toFixed(2) : "—"} | ${b.count ? b.observed.toFixed(2) : "—"} |`,
    );
  }
}

const usage = sumUsage(...runs.flat().map((r) => r.usage));
out(
  `\n費用（教材の単価表で計算）: 入力 ${usage.input_tokens} tok ／ 出力 ${usage.output_tokens} tok → ${formatUSD(costUSD(usage))}`,
);

// ---- 保存（logs/。Git の管理外） ----

if (dryRun) {
  console.log("\n（dry-run なので保存しません）");
} else {
  const dir = join(ROOT, "logs");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const base = join(dir, `lab-complaint-${stamp}`);
  writeFileSync(
    `${base}.json`,
    `${JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        model: facts.model.pinned,
        repeat,
        questions: { v1, v2 },
        runs,
        recordedV1: posts.map((p, i) => ({ id: p.id, complaint: recordedV1[i] })),
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    `${base}.md`,
    `# 苦情の質問を直した実験（${stamp}）\n\n- モデル: ${facts.model.pinned}\n- 60 件 × ${repeat} 回。v1 と v2 は同じリクエストで送った\n- 生データ: lab-complaint-${stamp}.json\n${lines.join("\n")}\n`,
  );
  console.log(`\n保存: logs/lab-complaint-${stamp}.md と .json`);
}
