import { choice, noul, score } from "@typesafe-ai/sdk";
import labelsJson from "../../data/labels.json" with { type: "json" };
import postsEn from "../../data/posts.en.json" with { type: "json" };
import { type Post, posts } from "./posts.js";

/**
 * 掲示板の仕分けに使う「本番用」の質問セット。
 * 6級の department に、どれにも当てはまらないときの逃げ道（sonota）を足したもの（二段）。
 * 三段以降と、六〜八段の評価はすべてこの定義を使う。
 */
export const boardQuestions = {
  isComplaint: noul("この投稿は、運営に対する苦情や不満ですか？", {
    true: "困っていること・不満・改善の要望が書かれている。遠回しな言い方や皮肉も含む",
    false: "質問・お礼・報告・宣伝など、不満ではない",
  }),
  department: choice("この投稿は、どの担当が対応するべきですか？", {
    honbu: "運営本部。全体の予定、ボランティア、ごみ、トイレ、お礼や意見など",
    yatai: "屋台・出店。出店の有無、料金、食べ物",
    kotsu: "交通・駐車場。車、自転車、道路、バス",
    otoshimono: "落とし物。なくした物、拾った物、逃げたペット",
    kyugo: "救護・安全。けが、体調不良、迷子、危険な状況",
    sonota: "どれにも当てはまらない。お祭りと関係のない宣伝など",
  }),
  urgency: score("この投稿に、運営はどのくらい急いで対応するべきですか？", [
    "急がない。後日の対応や、手の空いたときの返信でよい",
    "今日中に対応したい。いま困っている人がいる、または放っておくと悪化する",
    "今すぐ対応が必要。人の安全や体調にかかわる",
  ]),
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

export type Lang = "ja" | "en";

export function postsFor(lang: Lang): Post[] {
  return lang === "ja" ? posts : (postsEn as Post[]);
}

/** 評価用の fixture の置き場所。三段・四段・九段もここを共有する */
export const boardStep = (lang: Lang) => `board-${lang}`;
