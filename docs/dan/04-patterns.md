# 四段 パターン4種

- 所要時間: 40分
- 先に読む公式ページ: [Patterns](https://docs.typesafe.ai/patterns) / [Fan-out](https://docs.typesafe.ai/patterns/fan-out) / [Composite scoring](https://docs.typesafe.ai/patterns/composite-scoring) / [Intent routing](https://docs.typesafe.ai/patterns/intent-routing)
- この章でできるようになること: fan-out、confidence-gated routing、composite scoring、intent routing を使い分けられる

## 目的で振り分け、要りそうな質問は先に聞いておく

🟢 恒久

### ひとことで

「この人は何をしてほしいのか」（質問に答えてほしい？ 直してほしい？ お礼を言いたいだけ？）で、処理の行き先を変えます。
そのとき、行き先ごとに必要になりそうな質問も、**最初の1回でまとめて聞いておく**と速く済みます。

### ちゃんと言うと

[src/steps/d4-patterns.ts](../../src/steps/d4-patterns.ts) は、1回のリクエストで4問を聞きます。

| 質問 | 使うのは |
|---|---|
| `intent`（目的） | いつも |
| `lostItemFound`「落とし物の投稿だとしたら、なくした人？拾った人？」 | intent が lostItem のときだけ |
| `fixNeedsStaffNow`「困りごとの報告だとしたら、現地に行く必要がある？」 | intent が fix のときだけ |
| `answerFromFaq`「質問だとしたら、FAQ で答えられる？」 | intent が answer のときだけ |

後ろの3問は**投機的な質問**です。前提（「〜だとしたら」）を質問の中に書いておき、使うかどうかはコードが決めます。

```ts
export const handlers: Record<string, Handler> = {
  answer: (a) => (a.answerFromFaq >= 1.5 ? "FAQ のリンクを返す" : "本部が個別に返信する"),
  fix: (a) => (a.fixNeedsStaffNow >= 0.5 ? "スタッフを現地に向かわせる" : "改善メモに記録して返信する"),
  lostItem: (a) => (a.lostItemFound === "found" ? "拾得物リストに登録する" : "落とし物の照合リストに登録する"),
  thanks: () => "「いいね」を付けて終わり",
  none: () => "非表示候補にする",
};
```

```bash
npm run d4
```

<details><summary>もっと深く（プロ向け）</summary>

- 同じ state への独立した質問は、まとめて送ると並列に答えられ、互いの答えは見えません（公式スキル）。だから前提を各質問に書く必要があります
- 2回目のリクエストが必要になるのは、1回目の答えで「新しい証拠を取りに行く」「新しい state を作る」「次の選択肢が決まる」ときです
- 投機的な質問もトークンは使います。まとめるほど得かどうかは、4級と同じく実測で確かめます

</details>

> 一次情報: https://docs.typesafe.ai/patterns/fan-out

## 点数は重みで組み合わせ、安全の条件は別に持つ

🟢 恒久

### ひとことで

「緊急度」「苦情っぽさ」「救護の可能性」をそれぞれ点数にしておき、重みをつけて足し合わせると、対応する順番が決められます。
重みを変えても、Jev にもう一度聞く必要はありません。

### ちゃんと言うと

```ts
export const DEFAULT_WEIGHTS: Weights = { urgency: 0.6, complaint: 0.25, kyugo: 0.15 };

export function priority(p: Prediction, w: Weights = DEFAULT_WEIGHTS): number {
  const kyugo = p.departmentProbabilities.kyugo ?? 0;
  const total = w.urgency + w.complaint + w.kyugo;
  return (w.urgency * (p.urgency / 2) + w.complaint * p.complaint + w.kyugo * kyugo) / total;
}
```

`npm run d4` は、60件を優先度順に並べたあと、重みを「苦情重視」に変えた順位も表示します。Jev の呼び出しは増えていません。

4つ目の confidence-gated routing は、三段の3レーンそのものです。

<details><summary>もっと深く（プロ向け）</summary>

- 重みづけの合計は「埋め合わせのきく好み」に向いています。**「1つでも重大な条件があればアウト」というルールには向きません**。緊急度が低めでも迷子（p16）のような投稿は、重みの合計では順位が下がりえます。安全にかかわる条件は、三段の `safetyFloor` のように別の条件として持ちます
- 判断そのものを保存しておけば、重み・しきい値・表示の切り替えは、推論をやり直さずにコードだけで変えられます（公式スキル）
- ラベルつきの結果がたまれば、これらの点数を古典的な機械学習の特徴量として使うこともできます

</details>

> 一次情報: https://docs.typesafe.ai/patterns/composite-scoring
