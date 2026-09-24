/** 章ごとのサンプルの一覧。demo と record がこの順番で回す */
export const STEPS = [
  { step: "k10-hello", file: "k10-hello.ts", label: "10級 Jevって何？", model: "jev-latest" },
  { step: "k08-raw", file: "k08-raw.ts", label: "8級 最初の1回" },
  { step: "k07-noul", file: "k07-noul.ts", label: "7級 Noul（はい/いいえ）" },
  { step: "k06-choice", file: "k06-choice.ts", label: "6級 Choice（選ぶ）" },
  { step: "k05-score", file: "k05-score.ts", label: "5級 Score（点をつける）" },
  { step: "k04-batch", file: "k04-batch.ts", label: "4級 まとめて聞く" },
] as const;
