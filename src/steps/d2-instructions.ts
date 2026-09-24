/**
 * 二段 instructions と criteria
 * 同じ投稿に、質問の書き方だけを変えて聞く。
 * 後半は、選択肢に「どれにも当てはまらない」を入れるかどうかで答えがどう変わるかを見る。
 *
 *   npm run d2
 */

import { choice, noul } from "@typesafe-ai/sdk";
import { boardQuestions } from "../lib/board.js";
import { createDojo, type Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { t } from "../lib/i18n.js";
import { getPost } from "../lib/posts.js";
import { bar, footer, printProbabilities, q, runMain, title } from "../lib/print.js";
import { department as departmentWithoutOther } from "./k06-choice.js";

export const STEP = "d2-instructions";

/** v1: 一言だけ */
export const bare = noul(t("苦情？", "Complaint?"));

/** v2: 文章の質問＋はい/いいえの意味（7級と同じ） */
export const withCriteria = noul(
  t("この投稿は、運営に対する苦情や不満ですか？", "Is this post a complaint about the organizers?"),
  {
    true: t(
      "困っていること・不満・改善の要望が書かれている",
      "The writer describes a problem, dissatisfaction, or a request for improvement",
    ),
    false: t(
      "質問・お礼・報告など、不満ではない",
      "A question, thanks, a report, or anything else that is not a complaint",
    ),
  },
);

/** v3: 定義・含むもの・含まないものを JSON で構造化する */
export const structured = noul(
  {
    task: t(
      "この投稿が、運営に対する苦情や不満かどうかを判断する",
      "Decide whether this post is a complaint about the organizers",
    ),
    definition: t(
      "書き手が困っている、不満がある、または改善を求めている",
      "The writer is having a problem, is dissatisfied, or is asking for improvement",
    ),
    include: [
      t("遠回しな要望（〜だとうれしいのですが）", 'Indirect requests ("it would be nice if...")'),
      t("皮肉（さすが運営ですね）", 'Sarcasm ("great job, organizers")'),
      t("丁寧な言葉づかいの要請", "Requests phrased very politely"),
    ],
    exclude: [
      t("純粋な質問", "Plain questions"),
      t("お礼や感想", "Thanks or impressions"),
      t("落とし物などの報告", "Reports such as lost items"),
    ],
  },
  {
    true: t("苦情や不満、改善の要望", "A complaint, dissatisfaction, or a request for improvement"),
    false: t("それ以外", "Anything else"),
  },
);

export const WORDING_POSTS = ["p08", "p14", "p51", "p13"] as const;
export const OTHER_POSTS = ["p25", "p59"] as const;

export async function run(dojo: Dojo) {
  const wording = [];
  for (const id of WORDING_POSTS) {
    const post = getPost(id);
    const r = await dojo.client.systemOne({
      state: post.text,
      questions: { bare, withCriteria, structured },
    });
    wording.push({
      post,
      bare: r.answers.bare.noul,
      withCriteria: r.answers.withCriteria.noul,
      structured: r.answers.structured.noul,
      usage: r.usage,
    });
  }

  const noMatch = [];
  for (const id of OTHER_POSTS) {
    const post = getPost(id);
    const r = await dojo.client.systemOne({
      state: post.text,
      questions: {
        without: departmentWithoutOther,
        withOther: boardQuestions.department,
      },
    });
    noMatch.push({
      post,
      without: r.answers.without,
      withOther: r.answers.withOther,
      usage: r.usage,
    });
  }
  return { wording, noMatch };
}

async function main() {
  const dojo = createDojo(STEP);
  const { wording, noMatch } = await run(dojo);

  title(t("二段 instructions と criteria", "2nd Dan: Instructions and criteria"));
  console.log(
    t("▼ 書き方で「苦情の確率」はどう変わるか\n", "▼ How does the wording change P(complaint)?\n"),
  );
  for (const r of wording) {
    console.log(`${r.post.id} ${q(r.post.text)}`);
    console.log(
      t(`    v1 一言だけ          ${bar(r.bare)}`, `    v1 one word           ${bar(r.bare)}`),
    );
    console.log(
      t(
        `    v2 質問＋criteria    ${bar(r.withCriteria)}`,
        `    v2 question+criteria  ${bar(r.withCriteria)}`,
      ),
    );
    console.log(
      t(
        `    v3 JSONで構造化      ${bar(r.structured)}\n`,
        `    v3 structured JSON    ${bar(r.structured)}\n`,
      ),
    );
  }

  console.log(
    t(
      "▼ 「どれにも当てはまらない」を用意しないと、無理やりどこかに振られる\n",
      '▼ Without a "none of the above" option, posts get forced into some team\n',
    ),
  );
  for (const r of noMatch) {
    console.log(`${r.post.id} ${q(r.post.text)}`);
    console.log(
      t(
        `  sonota なし → ${r.without.choice}（confidence ${r.without.confidence.toFixed(2)}）`,
        `  without sonota → ${r.without.choice} (confidence ${r.without.confidence.toFixed(2)})`,
      ),
    );
    printProbabilities(r.without.probabilities, "      ");
    console.log(
      t(
        `  sonota あり → ${r.withOther.choice}（confidence ${r.withOther.confidence.toFixed(2)}）`,
        `  with sonota    → ${r.withOther.choice} (confidence ${r.withOther.confidence.toFixed(2)})`,
      ),
    );
    printProbabilities(r.withOther.probabilities, "      ");
    console.log("");
  }
  footer(dojo, sumUsage(...wording.map((r) => r.usage), ...noMatch.map((r) => r.usage)));
}

runMain(import.meta.url, main);
