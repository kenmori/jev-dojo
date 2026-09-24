/**
 * 章ごとのサンプルの一覧。demo と record がこの順番で回す。
 * dirs はその章が使う fixture のディレクトリ（record のとき、ここを消してから録り直す）。
 */
export interface StepEntry {
  script: string;
  file: string;
  label: string;
  dirs: string[];
  /** 録り直しに ANTHROPIC_API_KEY も要る章 */
  needsClaude?: boolean;
}

export const STEPS: StepEntry[] = [
  { script: "k10", file: "k10-hello.ts", label: "10級 Jevって何？", dirs: ["k10-hello"] },
  { script: "k08", file: "k08-raw.ts", label: "8級 最初の1回", dirs: ["k08-raw"] },
  { script: "k07", file: "k07-noul.ts", label: "7級 Noul", dirs: ["k07-noul"] },
  { script: "k06", file: "k06-choice.ts", label: "6級 Choice", dirs: ["k06-choice"] },
  { script: "k05", file: "k05-score.ts", label: "5級 Score", dirs: ["k05-score"] },
  { script: "k04", file: "k04-batch.ts", label: "4級 まとめて聞く", dirs: ["k04-batch"] },
  { script: "d1", file: "d1-state.ts", label: "初段 state の設計", dirs: ["d1-state"] },
  {
    script: "d2",
    file: "d2-instructions.ts",
    label: "二段 instructions と criteria",
    dirs: ["d2-instructions"],
  },
  // 八段が日英60件ずつを判定する。三段・四段・七段・九段・応用B はこの fixture を共有する
  { script: "d8", file: "d8-ja-en.ts", label: "八段 日本語ラボ", dirs: ["board-ja", "board-en"] },
  { script: "d3", file: "d3-lanes.ts", label: "三段 confidence", dirs: [] },
  { script: "d4", file: "d4-patterns.ts", label: "四段 パターン4種", dirs: ["d4-intent"] },
  { script: "d5", file: "d5-boundary.ts", label: "五段 コードとJevの境界", dirs: ["d5-boundary"] },
  { script: "d6", file: "d6-dataset.ts", label: "六段 評価データセット", dirs: [] },
  { script: "d7", file: "d7-calibration.ts", label: "七段 キャリブレーション", dirs: [] },
  { script: "d9", file: "d9-production.ts", label: "九段 本番運用", dirs: [] },
  { script: "d10", file: "d10-limits.ts", label: "十段 限界と誤用", dirs: ["d10-limits"] },
  {
    script: "ob",
    file: "ob-two-layer.ts",
    label: "応用B LLMとの二層構成",
    dirs: ["ob-two-layer", "ob-two-layer-claude"],
    needsClaude: true,
  },
];
