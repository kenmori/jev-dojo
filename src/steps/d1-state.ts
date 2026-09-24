/**
 * 初段 state の設計
 * 同じ質問に、state の渡し方だけを変えた3通りで聞き、確率とトークン数を比べる。
 *
 *   npm run d1
 */

import { noul } from "@typesafe-ai/sdk";
import { createDojo, type Dojo } from "../lib/client.js";
import { describeCost, sumUsage } from "../lib/cost.js";
import { t } from "../lib/i18n.js";
import { getPost, posts } from "../lib/posts.js";
import { bar, footer, q, runMain, title } from "../lib/print.js";

export const STEP = "d1-state";

/** state の中の場所を、バッククォートで囲んだパスで指す（公式スキルの推奨） */
export const isComplaint = noul(
  t(
    "`post.text` は、運営に対する苦情や不満ですか？",
    "Is `post.text` a complaint about the organizers?",
  ),
  {
    true: t(
      "困っていること・不満・改善の要望が書かれている。遠回しな言い方も含む",
      "The writer describes a problem, dissatisfaction, or a request for improvement. Includes indirect wording",
    ),
    false: t(
      "質問・お礼・報告など、不満ではない",
      "A question, thanks, a report, or anything else that is not a complaint",
    ),
  },
);

export const TARGET_ID = "p08";

/** 3通りの state。どれも同じ投稿を判断させる */
export function buildStates(targetId = TARGET_ID) {
  const target = getPost(targetId);
  return {
    /** A: 投稿の文章だけ（文字列） */
    textOnly: { post: { text: target.text } },
    /** B: 判断に必要な文脈を、名前付きのフィールドで足す */
    structured: {
      board: {
        name: t("地域のお祭り掲示板", "Local festival message board"),
        purpose: t(
          "住民が運営に質問・要望・報告を書き込む場所",
          "Where residents post questions, requests and reports for the organizers",
        ),
      },
      post: { text: target.text, author: target.author },
    },
    /** C: 関係のない過去の投稿を全部詰め込む */
    overloaded: {
      post: { text: target.text },
      history: posts.filter((p) => p.id !== targetId).map((p) => `${p.author}: ${p.text}`),
    },
  } as const;
}

export type Variant = keyof ReturnType<typeof buildStates>;

export async function run(dojo: Dojo) {
  const states = buildStates();
  const rows = [];
  for (const [variant, state] of Object.entries(states) as [Variant, (typeof states)[Variant]][]) {
    const r = await dojo.client.systemOne({ state, questions: { isComplaint } });
    rows.push({ variant, probability: r.answers.isComplaint.noul, usage: r.usage });
  }
  return rows;
}

const LABELS: Record<Variant, string> = {
  textOnly: t("A 文章だけ        ", "A text only          "),
  structured: t("B 文脈を名前付きで", "B named context      "),
  overloaded: t("C 全部詰め込む    ", "C everything stuffed "),
};

async function main() {
  const dojo = createDojo(STEP);
  const rows = await run(dojo);

  title(t("初段 state の設計", "1st Dan: Designing the state"));
  console.log(`${t("投稿", "Post")}: ${q(getPost(TARGET_ID).text)}\n`);
  for (const r of rows) {
    console.log(
      `${LABELS[r.variant]}  ${t("苦情の確率", "P(complaint)")} ${bar(r.probability)}  ${describeCost(r.usage)}`,
    );
  }
  footer(dojo, sumUsage(...rows.map((r) => r.usage)));
}

runMain(import.meta.url, main);
