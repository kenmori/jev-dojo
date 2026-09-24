/**
 * 7級 Noul（はい/いいえ）
 * 「これは苦情か？」を判定する。返ってくるのは「はい」の確率。
 * 確率をどう使うか（しきい値でどう分けるか）はコードが決める。
 *
 *   npm run k07
 */
import { noul } from "@typesafe-ai/sdk";
import { createDojo, type Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { getPost } from "../lib/posts.js";
import { bar, footer, runMain, title } from "../lib/print.js";

export const STEP = "k07-noul";

export const isComplaint = noul("この投稿は、運営に対する苦情や不満ですか？", {
  true: "困っていること・不満・改善の要望が書かれている",
  false: "質問・お礼・報告など、不満ではない",
});

/** 仮のしきい値。三段で「自分のデータで測って決める」方法を学ぶ */
export const AUTO_THRESHOLD = 0.8;

export type Action = "苦情として担当へ回す" | "人が読んで判断する" | "苦情ではない";

/** 確率から行動を決めるのはJevではなくコードの仕事 */
export function decide(probability: number, threshold = AUTO_THRESHOLD): Action {
  if (probability >= threshold) return "苦情として担当へ回す";
  if (probability >= 1 - threshold) return "人が読んで判断する";
  return "苦情ではない";
}

export const POST_IDS = ["p02", "p06", "p08", "p03", "p12"] as const;

export async function run(dojo: Dojo) {
  const rows = [];
  for (const id of POST_IDS) {
    const post = getPost(id);
    const result = await dojo.client.systemOne({
      state: post.text,
      questions: { isComplaint },
    });
    const p = result.answers.isComplaint.noul;
    rows.push({ post, probability: p, action: decide(p), usage: result.usage });
  }
  return rows;
}

async function main() {
  const dojo = createDojo(STEP);
  const rows = await run(dojo);

  title("7級 Noul（はい/いいえ）");
  console.log(`しきい値: ${AUTO_THRESHOLD}（この値以上なら自動で担当へ）\n`);
  for (const row of rows) {
    console.log(`${row.post.id} 「${row.post.text}」`);
    console.log(`    苦情の確率 ${bar(row.probability)} → ${row.action}\n`);
  }
  footer(dojo, sumUsage(...rows.map((r) => r.usage)));
}

runMain(import.meta.url, main);
