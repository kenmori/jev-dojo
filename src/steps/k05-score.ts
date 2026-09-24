/**
 * 5級 Score（点をつける）
 * 緊急度を 0〜2 の3段階で評価する。返る score は「期待値」なので 1.4 のような小数になりうる。
 *
 *   npm run k05
 */
import { score } from "@typesafe-ai/sdk";
import { createDojo, type Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { getPost } from "../lib/posts.js";
import { footer, printProbabilities, runMain, title } from "../lib/print.js";

export const STEP = "k05-score";

export const urgency = score("この投稿に、運営はどのくらい急いで対応するべきですか？", [
  "急がない。お祭りが終わってからの対応でよい",
  "今日中に対応したい",
  "今すぐ対応が必要。人の安全や体調にかかわる",
]);

/** 期待値を一番近い段階に丸める。丸め方もコードの仕事 */
export function toLevel(expected: number): 0 | 1 | 2 {
  if (expected < 0.5) return 0;
  if (expected < 1.5) return 1;
  return 2;
}

export const POST_IDS = ["p05", "p02", "p11", "p03"] as const;

export async function run(dojo: Dojo) {
  const rows = [];
  for (const id of POST_IDS) {
    const post = getPost(id);
    const result = await dojo.client.systemOne({
      state: post.text,
      questions: { urgency },
    });
    rows.push({ post, answer: result.answers.urgency, usage: result.usage });
  }
  return rows;
}

async function main() {
  const dojo = createDojo(STEP);
  const rows = await run(dojo);

  title("5級 Score（点をつける）");
  for (const { post, answer } of rows) {
    const level = toLevel(answer.score);
    console.log(`${post.id} 「${post.text}」`);
    console.log(
      `    期待値 ${answer.score.toFixed(2)} → 段階 ${level}「${answer.legend[level]}」（confidence ${answer.confidence.toFixed(2)}）`,
    );
    printProbabilities(answer.probabilities, "      ");
    console.log("");
  }
  footer(dojo, sumUsage(...rows.map((r) => r.usage)));
}

runMain(import.meta.url, main);
