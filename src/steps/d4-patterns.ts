/**
 * 四段 パターン4種
 *   1. intent routing          … 投稿の「目的」で処理を振り分ける
 *   2. fan-out（投機的ファンアウト）… 後で要るかもしれない質問も、前提を書いて同時に聞く
 *   3. composite scoring       … 複数の判断を重みづけして1つの優先度にする
 *   4. confidence-gated routing … 三段の3レーン（ここでは再掲のみ）
 *
 *   npm run d4
 */

import { choice, noul, score } from "@typesafe-ai/sdk";
import { exampleLabels } from "../lib/board.js";
import { createDojo, type Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { boardDojo, type Prediction, predictAll } from "../lib/evaluate.js";
import { LANG, t } from "../lib/i18n.js";
import { getPost } from "../lib/posts.js";
import { footer, q, runMain, title } from "../lib/print.js";

export const STEP = "d4-intent";

/** intent と、その intent だったときにだけ使う質問を、1回でまとめて聞く */
export const intentQuestions = {
  intent: choice(
    t(
      "この投稿の書き手は、運営に何をしてほしいのですか？",
      "What does the writer of this post want the organizers to do?",
    ),
    {
      answer: t("質問に答えてほしい", "Answer a question"),
      fix: t("困りごとを直してほしい、改善してほしい", "Fix a problem or improve something"),
      lostItem: t(
        "なくした物を探してほしい、または拾った物を届けたい",
        "Help find a lost item, or hand in a found item",
      ),
      thanks: t(
        "お礼や感想を伝えたい。対応は不要",
        "Share thanks or impressions. No action needed",
      ),
      none: t("運営への依頼ではない（宣伝など）", "Not a request to the organizers (ads, etc.)"),
    },
  ),
  // ↓ 投機的な質問。前提（「〜だとしたら」）を質問の中に書く。使うかどうかはコードが決める
  lostItemFound: choice(
    t(
      "この投稿が落とし物についての投稿だとしたら、書き手は物をなくした人ですか、拾った人ですか？",
      "If this post is about a lost item, did the writer lose it or find it?",
    ),
    {
      lost: t("なくした人", "Lost it"),
      found: t("拾った人、見かけた人", "Found it or saw it"),
      notApplicable: t("落とし物の投稿ではない", "Not about a lost item"),
    },
  ),
  fixNeedsStaffNow: noul(
    t(
      "この投稿が困りごとの報告だとしたら、スタッフが現地に行く必要がありますか？",
      "If this post reports a problem, does staff need to go to the spot?",
    ),
    {
      true: t(
        "その場で片付け・誘導・修理などが必要",
        "Cleanup, guidance, or repair is needed on site",
      ),
      false: t("説明や、次回以降の改善で足りる", "An explanation or a fix next time is enough"),
    },
  ),
  answerFromFaq: score(
    t(
      "この投稿が質問だとしたら、よくある質問（FAQ）で答えられる程度の内容ですか？",
      "If this post is a question, can the FAQ answer it?",
    ),
    [
      t(
        "FAQ では答えられない。個別の確認が必要",
        "The FAQ cannot answer it. Needs an individual check",
      ),
      t("FAQ で一部は答えられる", "The FAQ answers part of it"),
      t("FAQ でそのまま答えられる", "The FAQ answers it as is"),
    ],
  ),
} as const;

export const INTENT_POSTS = ["p01", "p11", "p18", "p24", "p12", "p25", "p20", "p42"] as const;

export type Handler = (a: IntentAnswers) => string;
type IntentAnswers = {
  lostItemFound: string;
  fixNeedsStaffNow: number;
  answerFromFaq: number;
};

/** intent ごとの処理。使うのは、その intent に関係する答えだけ */
export const handlers: Record<string, Handler> = {
  answer: (a) =>
    a.answerFromFaq >= 1.5
      ? t("FAQ のリンクを返す", "Reply with a link to the FAQ")
      : t("本部が個別に返信する", "The main office replies individually"),
  fix: (a) =>
    a.fixNeedsStaffNow >= 0.5
      ? t("スタッフを現地に向かわせる", "Send staff to the spot")
      : t("改善メモに記録して返信する", "Log it as an improvement note and reply"),
  lostItem: (a) =>
    a.lostItemFound === "found"
      ? t("拾得物リストに登録する", "Add to the found-items list")
      : t("落とし物の照合リストに登録する", "Add to the lost-items matching list"),
  thanks: () => t("「いいね」を付けて終わり", "Give it a like and close it"),
  none: () => t("非表示候補にする", "Mark as a candidate to hide"),
};

/** 重みはコードの設定値。変えても Jev を呼び直す必要はない */
export interface Weights {
  urgency: number;
  complaint: number;
  kyugo: number;
}

export const DEFAULT_WEIGHTS: Weights = { urgency: 0.6, complaint: 0.25, kyugo: 0.15 };

/** 0〜1 の優先度。urgency は 0〜2 なので 2 で割って揃える */
export function priority(p: Prediction, w: Weights = DEFAULT_WEIGHTS): number {
  const kyugo = p.departmentProbabilities.kyugo ?? 0;
  const total = w.urgency + w.complaint + w.kyugo;
  return (w.urgency * (p.urgency / 2) + w.complaint * p.complaint + w.kyugo * kyugo) / total;
}

export function rank(predictions: Prediction[], w: Weights = DEFAULT_WEIGHTS) {
  return [...predictions]
    .map((p) => ({ p, priority: priority(p, w) }))
    .sort((a, b) => b.priority - a.priority);
}

export async function run(intentDojo: Dojo, board: Dojo) {
  const intents = [];
  for (const id of INTENT_POSTS) {
    const post = getPost(id);
    const r = await intentDojo.client.systemOne({ state: post.text, questions: intentQuestions });
    const a = r.answers;
    const intent = a.intent.choice;
    const handler = handlers[intent] ?? (() => t("本部が読む", "The main office reads it"));
    intents.push({
      post,
      intent,
      confidence: a.intent.confidence,
      action: handler({
        lostItemFound: a.lostItemFound.choice,
        fixNeedsStaffNow: a.fixNeedsStaffNow.noul,
        answerFromFaq: a.answerFromFaq.score,
      }),
      usage: r.usage,
    });
  }
  const predictions = await predictAll(board, LANG);
  return { intents, predictions };
}

async function main() {
  const intentDojo = createDojo(STEP);
  const board = boardDojo(LANG);
  const { intents, predictions } = await run(intentDojo, board);

  title(t("四段 パターン4種", "4th Dan: Four patterns"));
  console.log(
    t(
      "▼ 1+2. intent routing ＋ fan-out（1回のリクエストで4問。使うのは intent に関係する答えだけ）\n",
      "▼ 1+2. intent routing + fan-out (4 questions in one request; only the answers relevant to the intent are used)\n",
    ),
  );
  for (const r of intents) {
    console.log(
      `${r.post.id} ${r.intent.padEnd(9)} → ${r.action}  ${q(`${r.post.text.slice(0, 26)}…`)}`,
    );
  }

  console.log(
    t(
      "\n▼ 3. composite scoring（優先度の高い順 上位10件）\n",
      "\n▼ 3. composite scoring (top 10 by priority)\n",
    ),
  );
  const gold = new Map(exampleLabels.items.map((l) => [l.id, l]));
  for (const { p, priority: s } of rank(predictions).slice(0, 10)) {
    console.log(
      t(
        `${p.id} 優先度 ${s.toFixed(2)}  緊急度 ${p.urgency.toFixed(2)} 苦情 ${p.complaint.toFixed(2)}（作者ラベル: 緊急度 ${gold.get(p.id)?.urgency}）`,
        `${p.id} priority ${s.toFixed(2)}  urgency ${p.urgency.toFixed(2)} complaint ${p.complaint.toFixed(2)} (author's label: urgency ${gold.get(p.id)?.urgency})`,
      ),
    );
  }

  console.log(
    t(
      "\n▼ 重みを変えると順位が変わる（Jev は呼び直していない）\n",
      "\n▼ Changing the weights changes the order (Jev is not called again)\n",
    ),
  );
  const complaintHeavy = { urgency: 0.2, complaint: 0.7, kyugo: 0.1 };
  console.log(
    t(
      `苦情重視 ${JSON.stringify(complaintHeavy)} の上位5件:`,
      `Top 5 when complaints weigh more ${JSON.stringify(complaintHeavy)}:`,
    ),
  );
  console.log(
    `  ${rank(predictions, complaintHeavy)
      .slice(0, 5)
      .map((r) => r.p.id)
      .join(" > ")}`,
  );

  console.log(
    t(
      "\n▼ 4. confidence-gated routing は三段（npm run d3）を参照\n",
      "\n▼ 4. For confidence-gated routing, see the 3rd Dan (npm run d3)\n",
    ),
  );
  footer(
    intentDojo,
    sumUsage(...intents.map((r) => r.usage), ...predictions.map((p) => p.usage)),
    board,
  );
}

runMain(import.meta.url, main);
