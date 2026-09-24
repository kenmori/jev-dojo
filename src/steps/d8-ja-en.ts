/**
 * 八段 日本語ラボ
 * 同じ内容の投稿を日本語と英語で判定し、精度・confidence・一致率を比べる。
 * docs/_generated/lab-ja-en.md は `npm run reports` で作られる。
 *
 *   npm run d8
 */
import type { Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { boardDojo, num, pct, predictAll } from "../lib/evaluate.js";
import { labelsForEval } from "../lib/labels.js";
import { mean } from "../lib/metrics.js";
import { footer, runMain, title } from "../lib/print.js";
import { compareLanguages } from "../lib/reports.js";

export async function run(ja: Dojo, en: Dojo) {
  const labels = labelsForEval();
  const [pja, pen] = [await predictAll(ja, "ja"), await predictAll(en, "en")];
  return { labels, comparison: compareLanguages(pja, pen, labels.items) };
}

async function main() {
  const ja = boardDojo("ja");
  const en = boardDojo("en");
  const { comparison: c } = await run(ja, en);

  title("八段 日本語ラボ");
  const line = (name: string, a: string, b: string) =>
    console.log(`  ${name.padEnd(14)} ${a.padStart(7)} ${b.padStart(9)}`);
  line("", "日本語", "英語");
  line("苦情の正解率", pct(c.ja.complaint.accuracy), pct(c.en.complaint.accuracy));
  line("苦情の Brier", num(c.ja.complaint.brier), num(c.en.complaint.brier));
  line("担当の正解率", pct(c.ja.department.accuracy), pct(c.en.department.accuracy));
  line("緊急度の正解率", pct(c.ja.urgency.accuracy), pct(c.en.urgency.accuracy));
  line("confidence平均", num(mean(c.confidence.ja), 2), num(mean(c.confidence.en), 2));
  line("入力トークン", String(c.ja.usage.input_tokens), String(c.en.usage.input_tokens));
  console.log(
    `\n担当が日英で一致: ${pct(c.departmentAgreement)} ／ 苦情の判定が一致: ${pct(c.complaintAgreement)}\n`,
  );
  console.log("言い回し別の苦情の正解率（日本語 / 英語）");
  for (const t of c.byTag) console.log(`  ${t.tag}（${t.n}件）: ${pct(t.jaAcc)} / ${pct(t.enAcc)}`);
  console.log("\n日英で担当が食い違った投稿");
  for (const d of c.disagreements) {
    console.log(`  ${d.id} ja=${d.ja} en=${d.en} ラベル=${d.gold} 「${d.textJa.slice(0, 30)}」`);
  }
  if (c.disagreements.length === 0) console.log("  なし");
  console.log("\n詳しいレポート: docs/_generated/lab-ja-en.md（npm run reports で更新）");
  footer(ja, sumUsage(c.ja.usage, c.en.usage), en);
}

runMain(import.meta.url, main);
