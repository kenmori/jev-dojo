import { choice, noul, score } from "@typesafe-ai/sdk";
import labelsJson from "../../data/labels.json" with { type: "json" };
import type { Lang } from "./i18n.js";
import { t } from "./i18n.js";
import { type Post, postsByLang } from "./posts.js";

/**
 * 掲示板の仕分けに使う「本番用」の質問セット。
 * 6級の department に、どれにも当てはまらないときの逃げ道（sonota）を足したもの（二段）。
 * 三段以降と、六〜八段の評価はすべてこの定義を使う。
 */
export const boardQuestions = {
  isComplaint: noul(
    t(
      "この投稿は、運営に対する苦情や不満ですか？",
      "Is this post a complaint about the organizers?",
    ),
    {
      true: t(
        "困っていること・不満・改善の要望が書かれている。遠回しな言い方や皮肉も含む",
        "The writer describes a problem, dissatisfaction, or a request for improvement. Includes indirect wording and sarcasm",
      ),
      false: t(
        "質問・お礼・報告・宣伝など、不満ではない",
        "A question, thanks, a report, an ad, or anything else that is not a complaint",
      ),
    },
  ),
  department: choice(
    t("この投稿は、どの担当が対応するべきですか？", "Which team should handle this post?"),
    {
      honbu: t(
        "運営本部。全体の予定、ボランティア、ごみ、トイレ、お礼や意見など",
        "Main office. Overall schedule, volunteers, trash, toilets, thanks and general feedback",
      ),
      yatai: t(
        "屋台・出店。出店の有無、料金、食べ物",
        "Food stalls. Which stalls are open, prices, food",
      ),
      kotsu: t(
        "交通・駐車場。車、自転車、道路、バス",
        "Traffic and parking. Cars, bicycles, roads, buses",
      ),
      otoshimono: t(
        "落とし物。なくした物、拾った物、逃げたペット",
        "Lost and found. Things lost or found, runaway pets",
      ),
      kyugo: t(
        "救護・安全。けが、体調不良、迷子、危険な状況",
        "First aid and safety. Injuries, feeling unwell, lost children, danger",
      ),
      sonota: t(
        "どれにも当てはまらない。お祭りと関係のない宣伝など",
        "None of the above. Ads or anything unrelated to the festival",
      ),
    },
  ),
  urgency: score(
    t(
      "この投稿に、運営はどのくらい急いで対応するべきですか？",
      "How urgently should the organizers respond to this post?",
    ),
    [
      t(
        "急がない。後日の対応や、手の空いたときの返信でよい",
        "Not urgent. A later follow-up or a reply when someone is free is fine",
      ),
      t(
        "今日中に対応したい。いま困っている人がいる、または放っておくと悪化する",
        "Should be handled today. Someone is stuck right now, or it will get worse if left alone",
      ),
      t(
        "今すぐ対応が必要。人の安全や体調にかかわる",
        "Needs action right now. Someone's safety or health is involved",
      ),
    ],
  ),
} as const;

export type Department = keyof typeof boardQuestions.department.criteria;
export const DEPARTMENTS = Object.keys(boardQuestions.department.criteria) as Department[];

export interface Label {
  id: string;
  isComplaint: boolean;
  department: Department;
  urgency: 0 | 1 | 2;
  tags: string[];
}

export interface LabelSet {
  labeler: string;
  note?: string;
  items: Label[];
}

export const exampleLabels = labelsJson as LabelSet;

export type { Lang };

export function postsFor(lang: Lang): Post[] {
  return postsByLang[lang];
}

/** 評価用の fixture の置き場所。三段・四段・九段もここを共有する */
export const boardStep = (lang: Lang) => `board-${lang}`;

const TAG_EN: Record<string, string> = {
  婉曲: "indirect",
  敬語: "honorific",
  皮肉: "sarcasm",
  主語省略: "omitted subject",
};

/** 言い回しのタグ（data/labels.json では日本語）を、今の言語で表示する */
export function tagLabel(tag: string): string {
  return t(tag, TAG_EN[tag] ?? tag);
}
