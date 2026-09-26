/**
 * 章ごとのサンプルの一覧。demo と record がこの順番で回す。
 * dirs はその章が使う fixture のディレクトリ（record のとき、ここを消してから録り直す）。
 * dirs が空の章は、八段が録った共有の fixture（board-ja / board-en）を使うので、record でも再生で表示だけする。
 */
import { LANG, t } from "../lib/i18n.js";
export interface StepEntry {
  script: string;
  file: string;
  label: string;
  dirs: string[];
  /** 録り直しに ANTHROPIC_API_KEY も要る章 */
  needsClaude?: boolean;
  /** 日本語の書籍だけのサンプル。英語モード（JEV_LANG=en）では demo と record がとばす */
  jaOnly?: boolean;
}

export const STEPS: StepEntry[] = [
  {
    script: "k10",
    file: "k10-hello.ts",
    label: t("10級 Jevって何？", "Kyu 10: What is Jev?"),
    dirs: ["k10-hello"],
  },
  {
    script: "k08",
    file: "k08-raw.ts",
    label: t("8級 最初の1回", "Kyu 8: Your first call"),
    dirs: ["k08-raw"],
  },
  { script: "k07", file: "k07-noul.ts", label: t("7級 Noul", "Kyu 7: Noul"), dirs: ["k07-noul"] },
  {
    script: "k06",
    file: "k06-choice.ts",
    label: t("6級 Choice", "Kyu 6: Choice"),
    dirs: ["k06-choice"],
  },
  {
    script: "k05",
    file: "k05-score.ts",
    label: t("5級 Score", "Kyu 5: Score"),
    dirs: ["k05-score"],
  },
  {
    script: "k04",
    file: "k04-batch.ts",
    label: t("4級 まとめて聞く", "Kyu 4: Ask in one batch"),
    dirs: ["k04-batch"],
  },
  {
    script: "d1",
    file: "d1-state.ts",
    label: t("初段 state の設計", "1st Dan: designing the state"),
    dirs: ["d1-state"],
  },
  {
    script: "d2",
    file: "d2-instructions.ts",
    label: t("二段 instructions と criteria", "2nd Dan: Instructions and criteria"),
    dirs: ["d2-instructions"],
  },
  // 八段が日英60件ずつを判定する。三段・四段・七段・九段・応用B はこの fixture を共有する
  {
    script: "d8",
    file: "d8-ja-en.ts",
    label: t("八段 日本語ラボ", "8th Dan: Japanese lab"),
    dirs: ["board-ja", "board-en"],
  },
  {
    script: "d3",
    file: "d3-lanes.ts",
    label: t("三段 confidence", "3rd Dan: Confidence"),
    dirs: [],
  },
  {
    script: "d4",
    file: "d4-patterns.ts",
    label: t("四段 パターン4種", "4th Dan: Four patterns"),
    dirs: ["d4-intent"],
  },
  {
    script: "care",
    file: "care.ts",
    label: t("四段 もう一歩 救護が要るか", "4th Dan extra: Needs first aid?"),
    dirs: ["d4-care"],
    jaOnly: true,
  },
  {
    script: "d5",
    file: "d5-boundary.ts",
    label: t("五段 コードとJevの境界", "5th Dan: Where code ends and Jev begins"),
    dirs: ["d5-boundary"],
  },
  {
    script: "d6",
    file: "d6-dataset.ts",
    label: t("六段 評価データセット", "6th Dan: Evaluation dataset"),
    dirs: [],
  },
  {
    script: "d7",
    file: "d7-calibration.ts",
    label: t("七段 キャリブレーション", "7th Dan: Calibration"),
    dirs: [],
  },
  {
    script: "d9",
    file: "d9-production.ts",
    label: t("九段 本番運用", "9th Dan: Running in production"),
    dirs: [],
  },
  {
    script: "d10",
    file: "d10-limits.ts",
    label: t("十段 限界と誤用", "10th Dan: Limits and misuse"),
    dirs: ["d10-limits"],
  },
  {
    script: "ob",
    file: "ob-two-layer.ts",
    label: t("応用B LLMとの二層構成", "Advanced B: Two layers with an LLM"),
    dirs: ["ob-two-layer", "ob-two-layer-claude"],
    needsClaude: true,
  },
];

/** 今の言語で回す章 */
export const stepsForLang = (lang = LANG) => STEPS.filter((s) => !(s.jaOnly && lang !== "ja"));
