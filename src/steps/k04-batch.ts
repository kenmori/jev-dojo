/**
 * 4級 まとめて聞く
 * 7級・6級・5級の3つの質問を、1回のリクエストにまとめて送る。
 * 1問ずつ3回送った場合と、トークン数と時間を比べる。
 *
 *   npm run k04
 */

import { createDojo, type Dojo } from "../lib/client.js";
import { describeCost, sumUsage } from "../lib/cost.js";
import { t } from "../lib/i18n.js";
import { getPost } from "../lib/posts.js";
import { footer, q, runMain, title } from "../lib/print.js";
import { urgency } from "./k05-score.js";
import { department } from "./k06-choice.js";
import { isComplaint } from "./k07-noul.js";

export const STEP = "k04-batch";

export async function run(dojo: Dojo) {
  const post = getPost("p02");
  const state = post.text;

  // まとめて1回
  const t0 = performance.now();
  const batched = await dojo.client.systemOne({
    state,
    questions: { isComplaint, department, urgency },
  });
  const batchedMs = performance.now() - t0;

  // 1問ずつ3回
  const t1 = performance.now();
  const a = await dojo.client.systemOne({ state, questions: { isComplaint } });
  const b = await dojo.client.systemOne({ state, questions: { department } });
  const c = await dojo.client.systemOne({ state, questions: { urgency } });
  const separateMs = performance.now() - t1;

  return {
    post,
    batched,
    batchedMs,
    separateUsage: sumUsage(a.usage, b.usage, c.usage),
    separateMs,
  };
}

async function main() {
  const dojo = createDojo(STEP);
  const r = await run(dojo);
  const { isComplaint: q1, department: q2, urgency: q3 } = r.batched.answers;

  title(t("4級 まとめて聞く", "Kyu 4: Ask in one batch"));
  console.log(`${t("投稿", "Post")}: ${q(r.post.text)}\n`);
  console.log(`${t("苦情の確率  ", "P(complaint) ")}${q1.noul.toFixed(2)}`);
  console.log(
    `${t("担当        ", "Team         ")}${q2.choice} (confidence ${q2.confidence.toFixed(2)})`,
  );
  console.log(`${t("緊急度      ", "Urgency      ")}${q3.score.toFixed(2)}`);
  console.log(t("\n▼ くらべる", "\n▼ Compare"));
  console.log(
    `${t("まとめて1回 : ", "1 batched call : ")}${describeCost(r.batched.usage)} | ${r.batchedMs.toFixed(0)} ms`,
  );
  console.log(
    `${t("1問ずつ3回  : ", "3 separate calls: ")}${describeCost(r.separateUsage)} | ${r.separateMs.toFixed(0)} ms`,
  );
  if (dojo.mode === "replay") {
    console.log(
      t(
        "（replay では通信しないので、時間の比較には意味がありません。live で試してください）",
        "(Replay makes no network calls, so the timing comparison is meaningless. Try it live.)",
      ),
    );
  }
  footer(dojo, sumUsage(r.batched.usage, r.separateUsage));
}

runMain(import.meta.url, main);
