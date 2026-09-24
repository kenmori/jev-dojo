/**
 * 10級 Jevって何？
 * 投稿を1つ渡して「これは質問ですか？」と聞く。はい/いいえの確率が返ってくる。
 *
 *   npm run k10
 */
import { noul } from "@typesafe-ai/sdk";
import { createDojo, type Dojo } from "../lib/client.js";
import { getPost } from "../lib/posts.js";
import { bar, footer, runMain, title } from "../lib/print.js";

export const STEP = "k10-hello";

export async function run(dojo: Dojo) {
  const post = getPost("p01");
  const result = await dojo.client.systemOne({
    state: post.text,
    questions: {
      isQuestion: noul("この投稿は、運営への質問ですか？"),
    },
  });
  return { post, result };
}

async function main() {
  // 10級だけは最新モデルを使う。初回は最新で動くほうが親切なため（plan.md §7.4）
  const dojo = createDojo(STEP, { model: "jev-latest" });
  const { post, result } = await run(dojo);

  title("10級 Jevって何？");
  console.log(`投稿: 「${post.text}」`);
  console.log("質問: この投稿は、運営への質問ですか？\n");
  console.log(`「はい」の確率  ${bar(result.answers.isQuestion.noul)}`);
  console.log(`\n実際に答えたモデル: ${result.model}`);
  footer(dojo, result.usage);
}

runMain(import.meta.url, main);
