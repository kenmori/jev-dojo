# 5級 Score（点をつける）

- 所要時間: 20分
- 先に読む公式ページ: [Primitives](https://docs.typesafe.ai/primitives) / [Score](https://docs.typesafe.ai/primitives/score)
- この章でできるようになること: 緊急度を3段階で評価できる。score が小数になる理由を説明できる

## 段階をつける

🟢 恒久

### ひとことで

「どのくらい急ぐ？」を 0・1・2 の3段階で評価してもらいます。
Choice とのちがいは、**段階に順番がある**ことです。0 より 1、1 より 2 のほうが急ぎです。

### ちゃんと言うと

```ts
import { score } from "@typesafe-ai/sdk";

export const urgency = score("この投稿に、運営はどのくらい急いで対応するべきですか？", [
  "急がない。お祭りが終わってからの対応でよい", // 0
  "今日中に対応したい",                         // 1
  "今すぐ対応が必要。人の安全や体調にかかわる",   // 2
]);
```

- 第2引数は**配列**です。0番目が0点、1番目が1点…という意味になります（2つ以上必要）
- 返ってくる答えには `score`（期待値）、`probabilities`（段階ごとの確率）、`legend`（段階の説明）、`confidence` があります

```bash
npm run k05
```

<details><summary>もっと深く（プロ向け）</summary>

- 段階に順序がない分類（係の振り分けなど）には Choice、順序がある評価（緊急度、品質、満足度）には Score を使います。Score に順序のない選択肢を入れると、期待値が意味を持たなくなります
- 段階の説明（ルーブリック）を具体的に書くほど、評価はぶれにくくなります。「高い」「低い」だけのルーブリックは避けます

</details>

> 一次情報: https://docs.typesafe.ai/primitives/score

## score は「期待値」なので小数になる

🟢 恒久

### ひとことで

「0点の見込み 18%、1点 64%、2点 18%」なら、平均すると 1.00 点。
score はこの**平均（期待値）**です。だから 1.4 のような小数にもなります。

### ちゃんと言うと

期待値 = Σ（点数 × その点数の確率）

```
0 × 0.18 + 1 × 0.64 + 2 × 0.18 = 1.00
```

小数のままでは画面に出しにくいので、コードで段階に丸めます（[src/steps/k05-score.ts](../../src/steps/k05-score.ts)）。

```ts
export function toLevel(expected: number): 0 | 1 | 2 {
  if (expected < 0.5) return 0;
  if (expected < 1.5) return 1;
  return 2;
}
```

<details><summary>もっと深く（プロ向け）</summary>

- 同じ期待値 1.0 でも、「1点が 100%」と「0点 50%・2点 50%」ではまったく意味がちがいます。後者は「すごく急ぐか、全然急がないか、どちらか」です。**期待値だけを見ずに、分布と confidence も見る**習慣をつけましょう
- 丸めるか、期待値のまま並べ替えに使うかも設計判断です。複数の Score を組み合わせる composite scoring は四段で扱います

</details>

> 一次情報: https://docs.typesafe.ai/primitives/score
