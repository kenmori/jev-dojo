/**
 * 七段 キャリブレーションを測る
 * 60件の投稿を判定し、ラベルと比べて Brier score・信頼度曲線・しきい値ごとの精度を出す。
 * docs/_generated/calibration.md は `npm run reports` で作られる。
 *
 *   npm run d7
 */
import type { Dojo } from "../lib/client.js";
import { boardDojo, num, pct, predictAll, summarize } from "../lib/evaluate.js";
import { labelsForEval } from "../lib/labels.js";
import { minThresholdFor } from "../lib/metrics.js";
import { footer, runMain, title } from "../lib/print.js";

export async function run(dojo: Dojo) {
  const labels = labelsForEval();
  const predictions = await predictAll(dojo, "ja");
  return { labels, predictions, summary: summarize(predictions, labels.items) };
}

async function main() {
  const dojo = boardDojo("ja");
  const { labels, summary: s } = await run(dojo);

  title("七段 キャリブレーションを測る");
  console.log(
    `ラベル: ${labels.labeler === "example" ? "作者の例" : "あなたのラベル"}（${s.n} 件）\n`,
  );
  console.log("▼ 苦情（Noul）");
  console.log(
    `  正解率 ${pct(s.complaint.accuracy)} ／ Brier ${num(s.complaint.brier)} ／ ECE ${num(s.complaint.ece)}`,
  );
  console.log("  信頼度曲線（予測した確率 → 実際に苦情だった割合）");
  for (const b of s.complaint.bins) {
    console.log(
      `    ${b.lo.toFixed(1)}〜${b.hi.toFixed(1)}: ${String(b.count).padStart(2)} 件  予測 ${num(b.meanPredicted, 2)} → 実際 ${num(b.observed, 2)}`,
    );
  }
  console.log("\n  しきい値ごとの、自動で決めた割合と正解率");
  for (const r of s.complaint.sweep) {
    console.log(
      `    t=${r.threshold.toFixed(2)}  自動 ${pct(r.coverage).padStart(6)}  正解 ${pct(r.accuracy)}`,
    );
  }
  const pick = minThresholdFor(s.complaint.sweep, 0.95);
  console.log(
    `\n  正解率95%以上を保てる最小のしきい値: ${pick ? pick.threshold.toFixed(2) : "該当なし"}`,
  );

  console.log("\n▼ 担当部署（Choice）");
  console.log(`  正解率 ${pct(s.department.accuracy)} ／ Brier ${num(s.department.brier)}`);
  console.log(
    `  confidence 平均: 正解 ${num(s.department.meanConfidenceCorrect, 2)} ／ 不正解 ${num(s.department.meanConfidenceWrong, 2)}`,
  );
  console.log("\n▼ 緊急度（Score）");
  console.log(
    `  段階の正解率 ${pct(s.urgency.accuracy)} ／ 平均絶対誤差 ${num(s.urgency.meanAbsError, 2)}`,
  );
  console.log("\n詳しいレポート: docs/_generated/calibration.md（npm run reports で更新）");
  footer(dojo, s.usage);
}

runMain(import.meta.url, main);
