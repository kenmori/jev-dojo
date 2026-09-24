/**
 * 初段 state の設計
 * 同じ質問に、state の渡し方だけを変えた3通りで聞き、確率とトークン数を比べる。
 *
 *   npm run d1
 */
import { noul } from "@typesafe-ai/sdk";
import { createDojo, type Dojo } from "../lib/client.js";
import { describeCost, sumUsage } from "../lib/cost.js";
import { getPost, posts } from "../lib/posts.js";
import { bar, footer, runMain, title } from "../lib/print.js";

export const STEP = "d1-state";

/** state の中の場所を、バッククォートで囲んだパスで指す（公式スキルの推奨） */
export const isComplaint = noul("`post.text` は、運営に対する苦情や不満ですか？", {
  true: "困っていること・不満・改善の要望が書かれている。遠回しな言い方も含む",
  false: "質問・お礼・報告など、不満ではない",
});

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
        name: "地域のお祭り掲示板",
        purpose: "住民が運営に質問・要望・報告を書き込む場所",
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
  textOnly: "A 文章だけ        ",
  structured: "B 文脈を名前付きで",
  overloaded: "C 全部詰め込む    ",
};

async function main() {
  const dojo = createDojo(STEP);
  const rows = await run(dojo);

  title("初段 state の設計");
  console.log(`投稿: 「${getPost(TARGET_ID).text}」\n`);
  for (const r of rows) {
    console.log(`${LABELS[r.variant]}  苦情の確率 ${bar(r.probability)}  ${describeCost(r.usage)}`);
  }
  footer(dojo, sumUsage(...rows.map((r) => r.usage)));
}

runMain(import.meta.url, main);
