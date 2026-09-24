/**
 * 10級 Jevって何？
 * 投稿を1つ渡して「これは質問ですか？」と聞く。はい/いいえの確率が返ってくる。
 *
 *   npm run k10
 */

import { noul } from "@typesafe-ai/sdk";
import { createDojo, type Dojo } from "../lib/client.js";
import { t } from "../lib/i18n.js";
import { getPost } from "../lib/posts.js";
import { bar, footer, runMain, title } from "../lib/print.js";

export const STEP = "k10-hello";

export const QUESTION = t(
  "この投稿は、運営への質問ですか？",
  "Is this post a question for the organizers?",
);

export async function run(dojo: Dojo) {
  const post = getPost("p01");
  const result = await dojo.client.systemOne({
    state: post.text,
    questions: {
      isQuestion: noul(QUESTION),
    },
  });
  return { post, result };
}

async function main() {
  // 10級だけは最新モデルを使う。初回は最新で動くほうが親切なため（plan.md §7.4）
  const dojo = createDojo(STEP, { model: "jev-latest" });
  const { post, result } = await run(dojo);

  title(t("10級 Jevって何？", "Kyu 10: What is Jev?"));
  console.log(t(`投稿: 「${post.text}」`, `Post: "${post.text}"`));
  console.log(`${t("質問", "Question")}: ${QUESTION}\n`);
  console.log(`${t("「はい」の確率", "P(yes)")}  ${bar(result.answers.isQuestion.noul)}`);
  console.log(`\n${t("実際に答えたモデル", "Model that answered")}: ${result.model}`);
  footer(dojo, result.usage);
}

runMain(import.meta.url, main);
