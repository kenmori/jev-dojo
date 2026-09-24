/**
 * 6級 Choice（選ぶ）
 * 投稿をどの担当に回すかを選ぶ。選ばれたラベルだけでなく、全ラベルの確率が返る。
 *
 *   npm run k06
 */
import { choice } from "@typesafe-ai/sdk";
import { createDojo, type Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { getPost } from "../lib/posts.js";
import { footer, printProbabilities, runMain, title } from "../lib/print.js";

export const STEP = "k06-choice";

export const department = choice("この投稿は、どの担当が対応するべきですか？", {
  honbu: "運営本部。全体の予定、ボランティア、ごみ、お礼や意見など",
  yatai: "屋台・出店。出店の有無、料金、食べ物",
  kotsu: "交通・駐車場。車、道路、バス",
  otoshimono: "落とし物。なくした物、拾った物",
  kyugo: "救護・安全。けが、体調不良、危険な状況",
});

export const POST_IDS = ["p03", "p04", "p05", "p09", "p11"] as const;

export async function run(dojo: Dojo) {
  const rows = [];
  for (const id of POST_IDS) {
    const post = getPost(id);
    const result = await dojo.client.systemOne({
      state: post.text,
      questions: { department },
    });
    rows.push({ post, answer: result.answers.department, usage: result.usage });
  }
  return rows;
}

async function main() {
  const dojo = createDojo(STEP);
  const rows = await run(dojo);

  title("6級 Choice（選ぶ）");
  for (const { post, answer } of rows) {
    console.log(`${post.id} 「${post.text}」`);
    console.log(`    → ${answer.choice}（confidence ${answer.confidence.toFixed(2)}）`);
    printProbabilities(answer.probabilities, "      ");
    console.log("");
  }
  footer(dojo, sumUsage(...rows.map((r) => r.usage)));
}

runMain(import.meta.url, main);
