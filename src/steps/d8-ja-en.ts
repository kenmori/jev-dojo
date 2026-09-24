/**
 * 八段 日本語ラボ
 * 同じ内容の投稿を日本語と英語で判定し、精度・confidence・一致率を比べる。
 * docs/_generated/lab-ja-en.md は `npm run reports` で作られる。
 *
 *   npm run d8
 */

import { tagLabel } from "../lib/board.js";
import type { Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { boardDojo, num, pct, predictAll } from "../lib/evaluate.js";
import { t } from "../lib/i18n.js";
import { labelsForEval } from "../lib/labels.js";
import { mean } from "../lib/metrics.js";
import { footer, q, runMain, title } from "../lib/print.js";
import { compareLanguages } from "../lib/reports.js";

export async function run(ja: Dojo, en: Dojo) {
  const labels = labelsForEval();
  const [pja, pen] = [await predictAll(ja, "ja"), await predictAll(en, "en")];
  return { labels, pja, pen, comparison: compareLanguages(pja, pen, labels.items) };
}

async function main() {
  const ja = boardDojo("ja");
  const en = boardDojo("en");
  const { comparison: c, pja, pen } = await run(ja, en);

  title(t("八段 日本語ラボ", "8th Dan: Japanese lab"));
  const line = (name: string, a: string, b: string) =>
    console.log(`  ${name.padEnd(14)} ${a.padStart(7)} ${b.padStart(9)}`);
  line("", t("日本語", "Japanese"), t("英語", "English"));
  line(
    t("苦情の正解率", "complaint acc."),
    pct(c.ja.complaint.accuracy),
    pct(c.en.complaint.accuracy),
  );
  line(t("苦情の Brier", "complaint Brier"), num(c.ja.complaint.brier), num(c.en.complaint.brier));
  line(
    t("担当の正解率", "team acc."),
    pct(c.ja.department.accuracy),
    pct(c.en.department.accuracy),
  );
  line(t("緊急度の正解率", "urgency acc."), pct(c.ja.urgency.accuracy), pct(c.en.urgency.accuracy));
  line(
    t("confidence平均", "mean confidence"),
    num(mean(c.confidence.ja), 2),
    num(mean(c.confidence.en), 2),
  );
  line(
    t("入力トークン", "input tokens"),
    String(c.ja.usage.input_tokens),
    String(c.en.usage.input_tokens),
  );
  console.log(
    t(
      `\n担当が日英で一致: ${pct(c.departmentAgreement)} ／ 苦情の判定が一致: ${pct(c.complaintAgreement)}\n`,
      `\nSame team in Japanese and English: ${pct(c.departmentAgreement)} / same complaint decision: ${pct(c.complaintAgreement)}\n`,
    ),
  );
  console.log(
    t(
      "言い回し別の苦情の正解率（日本語 / 英語）",
      "Complaint accuracy by wording style (Japanese / English)",
    ),
  );
  for (const tag of c.byTag)
    console.log(
      t(
        `  ${tagLabel(tag.tag)}（${tag.n}件）: ${pct(tag.jaAcc)} / ${pct(tag.enAcc)}`,
        `  ${tagLabel(tag.tag)} (${tag.n} items): ${pct(tag.jaAcc)} / ${pct(tag.enAcc)}`,
      ),
    );
  console.log(
    t(
      "\n日英で担当が食い違った投稿",
      "\nPosts where the team differs between Japanese and English",
    ),
  );
  for (const d of c.disagreements) {
    console.log(
      t(
        `  ${d.id} ja=${d.ja} en=${d.en} ラベル=${d.gold} ${q(t(d.textJa, d.textEn).slice(0, 30))}`,
        `  ${d.id} ja=${d.ja} en=${d.en} label=${d.gold} ${q(t(d.textJa, d.textEn).slice(0, 30))}`,
      ),
    );
  }
  if (c.disagreements.length === 0) console.log(t("  なし", "  none"));
  const complaintSplits = pja.flatMap((j) => {
    const e = pen.find((x) => x.id === j.id);
    return e && j.complaint >= 0.5 !== e.complaint >= 0.5 ? [{ j, e }] : [];
  });
  console.log(
    t(
      "\n日英で苦情の判定（0.5 で切った場合）が分かれた投稿（くわしくは npm run show -- <ID> と --lang en）",
      "\nPosts where the complaint call (0.5 cut) differs between Japanese and English (details: npm run show -- <ID>, with --lang en)",
    ),
  );
  for (const { j, e } of complaintSplits) {
    console.log(
      t(
        `  ${j.id} ja=${j.complaint.toFixed(2)} en=${e.complaint.toFixed(2)}`,
        `  ${j.id} ja=${j.complaint.toFixed(2)} en=${e.complaint.toFixed(2)}`,
      ),
    );
  }
  if (complaintSplits.length === 0) console.log(t("  なし", "  none"));
  console.log(
    t(
      "\n詳しいレポート: docs/_generated/lab-ja-en.md（npm run reports で更新）",
      "\nFull report: docs/_generated/lab-ja-en.en.md (refresh with npm run reports)",
    ),
  );
  footer(ja, sumUsage(c.ja.usage, c.en.usage), en);
}

runMain(import.meta.url, main);
