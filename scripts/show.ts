/**
 * 1 件の投稿について、本番用の質問（src/lib/board.ts）への記録済みの答えを全部表示する。
 * 三段〜八段で「この投稿はどう判定されたのか」をくわしく見たいときに使う。API は呼ばない。
 *
 *   npm run show -- p22
 *   npm run show -- p22 p42 p49      # 何件でも
 *   npm run show -- p53 --lang en    # 英語版の記録
 */

import { boardQuestions, exampleLabels } from "../src/lib/board.js";
import { boardDojo } from "../src/lib/evaluate.js";
import { LANG, type Lang, t } from "../src/lib/i18n.js";
import { route } from "../src/lib/lanes.js";
import { getPost } from "../src/lib/posts.js";
import { bar, q, runMain, title } from "../src/lib/print.js";

export async function show(id: string, lang: Lang) {
  const post = getPost(id, lang);
  const dojo = boardDojo(lang, { mode: "replay" });
  const r = await dojo.client.systemOne({ state: post.text, questions: boardQuestions });
  return { post, answers: r.answers, model: r.model };
}

async function main() {
  const args = process.argv.slice(2);
  const langIdx = args.indexOf("--lang");
  const lang = (langIdx >= 0 ? args[langIdx + 1] : LANG) as Lang;
  const ids = args.filter((a, i) => !a.startsWith("--") && !(langIdx >= 0 && i === langIdx + 1));
  if (ids.length === 0) {
    console.error(
      t(
        "使い方: npm run show -- p22 [p42 ...] [--lang en]",
        "Usage: npm run show -- p22 [p42 ...] [--lang en]",
      ),
    );
    process.exit(1);
  }

  title(t("記録済みの答え（本番用の質問）", "Recorded answers (production questions)"));
  for (const id of ids) {
    const { post, answers, model } = await show(id, lang);
    const label = exampleLabels.items.find((l) => l.id === id);
    const { isComplaint, department, urgency } = answers;
    const lane = route({
      id,
      complaint: isComplaint.noul,
      department: department.choice,
      departmentConfidence: department.confidence,
      departmentProbabilities: { ...department.probabilities },
      urgency: urgency.score,
      urgencyConfidence: urgency.confidence,
      usage: { input_tokens: 0, output_tokens: 0 },
    });

    console.log(`${id} ${q(post.text)}  (${model})`);
    console.log(
      t(`  苦情の確率      ${bar(isComplaint.noul)}`, `  P(complaint)    ${bar(isComplaint.noul)}`),
    );
    console.log(
      t(
        `  担当            ${department.choice}（confidence ${department.confidence.toFixed(2)} → ${lane.lane}${lane.alsoNotifyKyugo ? "、救護にも知らせる" : ""}）`,
        `  Team            ${department.choice} (confidence ${department.confidence.toFixed(2)} → ${lane.lane}${lane.alsoNotifyKyugo ? ", also notify first aid" : ""})`,
      ),
    );
    for (const [k, p] of Object.entries(department.probabilities).sort((a, b) => b[1] - a[1])) {
      console.log(`      ${k.padEnd(11)} ${bar(p)}`);
    }
    console.log(
      t(
        `  急ぎ度          score ${urgency.score.toFixed(2)}（confidence ${urgency.confidence.toFixed(2)}）`,
        `  Urgency         score ${urgency.score.toFixed(2)} (confidence ${urgency.confidence.toFixed(2)})`,
      ),
    );
    for (const [k, p] of Object.entries(urgency.probabilities)) {
      console.log(`      ${k.padEnd(11)} ${bar(p)}`);
    }
    if (label) {
      console.log(
        t(
          `  著者のラベル    苦情 ${label.isComplaint ? "はい" : "いいえ"} ／ 担当 ${label.department} ／ 急ぎ度 ${label.urgency}`,
          `  Author's label  complaint ${label.isComplaint ? "yes" : "no"} / team ${label.department} / urgency ${label.urgency}`,
        ),
      );
    }
    console.log("");
  }
}

runMain(import.meta.url, main);
