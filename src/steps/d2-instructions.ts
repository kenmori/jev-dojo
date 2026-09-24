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
import { getPost } from "../lib/posts.js";
import { bar, footer, printProbabilities, runMain, title } from "../lib/print.js";
import { department as departmentWithoutOther } from "./k06-choice.js";

export const STEP = "d2-instructions";

/** v1: 一言だけ */
export const bare = noul("苦情？");

/** v2: 文章の質問＋はい/いいえの意味（7級と同じ） */
export const withCriteria = noul("この投稿は、運営に対する苦情や不満ですか？", {
  true: "困っていること・不満・改善の要望が書かれている",
  false: "質問・お礼・報告など、不満ではない",
});

/** v3: 定義・含むもの・含まないものを JSON で構造化する */
export const structured = noul(
  {
    task: "この投稿が、運営に対する苦情や不満かどうかを判断する",
    definition: "書き手が困っている、不満がある、または改善を求めている",
    include: [
      "遠回しな要望（〜だとうれしいのですが）",
      "皮肉（さすが運営ですね）",
      "丁寧な言葉づかいの要請",
    ],
    exclude: ["純粋な質問", "お礼や感想", "落とし物などの報告"],
  },
  {
    true: "苦情や不満、改善の要望",
    false: "それ以外",
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

  title("二段 instructions と criteria");
  console.log("▼ 書き方で「苦情の確率」はどう変わるか\n");
  for (const r of wording) {
    console.log(`${r.post.id} 「${r.post.text}」`);
    console.log(`    v1 一言だけ          ${bar(r.bare)}`);
    console.log(`    v2 質問＋criteria    ${bar(r.withCriteria)}`);
    console.log(`    v3 JSONで構造化      ${bar(r.structured)}\n`);
  }

  console.log("▼ 「どれにも当てはまらない」を用意しないと、無理やりどこかに振られる\n");
  for (const r of noMatch) {
    console.log(`${r.post.id} 「${r.post.text}」`);
    console.log(
      `  sonota なし → ${r.without.choice}（confidence ${r.without.confidence.toFixed(2)}）`,
    );
    printProbabilities(r.without.probabilities, "      ");
    console.log(
      `  sonota あり → ${r.withOther.choice}（confidence ${r.withOther.confidence.toFixed(2)}）`,
    );
    printProbabilities(r.withOther.probabilities, "      ");
    console.log("");
  }
  footer(dojo, sumUsage(...wording.map((r) => r.usage), ...noMatch.map((r) => r.usage)));
}

runMain(import.meta.url, main);
