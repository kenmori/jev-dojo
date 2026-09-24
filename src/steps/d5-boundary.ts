/**
 * 五段 コードとJevの境界
 * 落とし物の照合を例に、「コードがやること」と「Jev に聞くこと」を分ける。
 *
 *   コード: 電話番号を隠す／日時を比べる／リストを照合する（決まったルール・計算・完全一致）
 *   Jev   : なくしたのか拾ったのか／何の物か（言葉の意味の理解が必要な判断）
 *
 *   npm run d5
 */

import { choice } from "@typesafe-ai/sdk";
import { createDojo, type Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { t } from "../lib/i18n.js";
import { footer, q, runMain, title } from "../lib/print.js";

export const STEP = "d5-boundary";

/** 落とし物コーナーに届いた投稿。受付時刻はシステムが付けた値なので信用できる */
export const reports = [
  {
    id: "r1",
    receivedAt: "2026-08-15T18:05:00+09:00",
    text: t(
      "子ども用の青い水筒を落としました。本部テントの近くだと思います。",
      "I lost a blue children's water bottle. I think it was near the main tent.",
    ),
  },
  {
    id: "r2",
    receivedAt: "2026-08-15T18:40:00+09:00",
    text: t(
      "本部テントの横に青い水筒が置いてありました。預かっています。",
      "A blue water bottle was left next to the main tent. We are holding it.",
    ),
  },
  {
    id: "r3",
    receivedAt: "2026-08-15T19:10:00+09:00",
    text: t(
      "スマホを落としました。黒いケースです。連絡は090-1234-5678まで。",
      "I dropped my phone. It has a black case. Call me at 090-1234-5678.",
    ),
  },
  {
    id: "r4",
    receivedAt: "2026-08-15T19:30:00+09:00",
    text: t("クマのキーホルダーがついた鍵を拾いました。", "I found a key with a bear keychain."),
  },
  {
    id: "r5",
    receivedAt: "2026-08-15T20:15:00+09:00",
    text: t(
      "黒いケースのスマホ、やぐらの下にありました！",
      "Found a phone with a black case under the tower stage!",
    ),
  },
  {
    id: "r6",
    receivedAt: "2026-08-14T12:00:00+09:00",
    text: t("青い水筒を見つけました。", "I found a blue water bottle."),
  },
] as const;

export type Report = (typeof reports)[number];

/** コード: 電話番号は Jev に送る前に隠す。決まった形の文字列はルールで扱える */
export function maskPhoneNumbers(text: string): string {
  return text.replace(/0\d{1,4}-?\d{1,4}-?\d{3,4}/g, t("［電話番号］", "[phone]"));
}

/** Jev: 言葉の意味がわからないと決められないことだけを聞く */
export const reportQuestions = {
  direction: choice(
    t(
      "この投稿の書き手は、物をなくした人ですか、拾った人ですか？",
      "Did the writer of this post lose something or find something?",
    ),
    {
      lost: t("なくした、落とした、探している", "Lost it, dropped it, or is looking for it"),
      found: t("拾った、見つけた、預かっている", "Picked it up, found it, or is holding it"),
      neither: t("落とし物の話ではない", "Not about a lost item"),
    },
  ),
  item: choice(t("この投稿で話題になっている物は何ですか？", "What item is this post about?"), {
    bottle: t("水筒、ペットボトル", "Water bottle or plastic bottle"),
    phone: t("スマートフォン、携帯電話", "Smartphone or mobile phone"),
    key: t("鍵", "Key"),
    wallet: t("財布", "Wallet"),
    other: t("上のどれでもない物", "Something not listed above"),
  }),
} as const;

export interface Classified {
  report: Report;
  direction: string;
  item: string;
  masked: string;
}

/** コード: 照合はルール。同じ品目で、拾った時刻がなくした時刻以降のものだけを候補にする */
export function matchLostAndFound(items: Classified[], windowHours = 24) {
  const lost = items.filter((c) => c.direction === "lost");
  const found = items.filter((c) => c.direction === "found");
  return lost.map((l) => {
    const t0 = Date.parse(l.report.receivedAt);
    const candidates = found.filter((f) => {
      const t = Date.parse(f.report.receivedAt);
      return f.item === l.item && t >= t0 && t - t0 <= windowHours * 3_600_000;
    });
    return { lost: l, candidates };
  });
}

export async function run(dojo: Dojo) {
  const classified: Classified[] = [];
  const usages = [];
  for (const report of reports) {
    const masked = maskPhoneNumbers(report.text);
    const r = await dojo.client.systemOne({ state: masked, questions: reportQuestions });
    classified.push({
      report,
      masked,
      direction: r.answers.direction.choice,
      item: r.answers.item.choice,
    });
    usages.push(r.usage);
  }
  return { classified, matches: matchLostAndFound(classified), usage: sumUsage(...usages) };
}

async function main() {
  const dojo = createDojo(STEP);
  const { classified, matches, usage } = await run(dojo);

  title(t("五段 コードとJevの境界", "5th Dan: Where code ends and Jev begins"));
  console.log(
    t("▼ Jev に聞いたこと（なくした/拾った・品目）\n", "▼ What we asked Jev (lost/found, item)\n"),
  );
  for (const c of classified) {
    console.log(`${c.report.id} ${c.direction.padEnd(7)} ${c.item.padEnd(7)} ${q(c.masked)}`);
  }
  console.log(
    t(
      "\n▼ コードで照合（同じ品目、なくした後24時間以内に拾われたもの）\n",
      "\n▼ Matched in code (same item, found within 24 hours after it was lost)\n",
    ),
  );
  for (const m of matches) {
    const ids = m.candidates.map((c) => c.report.id).join(", ") || t("候補なし", "no candidates");
    console.log(
      t(
        `${m.lost.report.id}（${m.lost.item}）→ ${ids}`,
        `${m.lost.report.id} (${m.lost.item}) → ${ids}`,
      ),
    );
  }
  console.log(
    t(
      "\n※ r6 は青い水筒ですが、なくすより前の日付なので候補から外れます。これはコードの仕事です。",
      "\nNote: r6 is also a blue water bottle, but it was found before the loss, so it is excluded. That is code's job.",
    ),
  );
  footer(dojo, usage);
}

runMain(import.meta.url, main);
