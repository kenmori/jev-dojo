# 6級 Choice（選ぶ）

- 所要時間: 20分
- 先に読む公式ページ: [Primitives](https://docs.typesafe.ai/primitives) / [Choice](https://docs.typesafe.ai/primitives/choice)
- この章でできるようになること: 投稿を担当部署に振り分けられる。confidence の読み方がわかる

## 選択肢から1つ選ぶ

🟢 恒久

### ひとことで

「この投稿はどの係の担当？」と聞いて、5つの係から1つ選んでもらいます。
Jev は選んだ係だけでなく、**全部の係についての確率**も教えてくれます。

### ちゃんと言うと

```ts
import { choice } from "@typesafe-ai/sdk";

export const department = choice("この投稿は、どの担当が対応するべきですか？", {
  honbu: "運営本部。全体の予定、ボランティア、ごみ、お礼や意見など",
  yatai: "屋台・出店。出店の有無、料金、食べ物",
  kotsu: "交通・駐車場。車、道路、バス",
  otoshimono: "落とし物。なくした物、拾った物",
  kyugo: "救護・安全。けが、体調不良、危険な状況",
});
```

返ってくる答え:

| フィールド | 意味 |
|---|---|
| `choice` | 選ばれたラベル（例: `"kyugo"`） |
| `probabilities` | 全ラベルの確率。合計は 1 |
| `confidence` | 答えにどれだけ自信があるか |

```bash
npm run k06
```

<details><summary>もっと深く（プロ向け）</summary>

- ラベル（`honbu` など）はコードで扱う識別子、説明文は Jev に判断基準を伝えるための文章です。ラベルは短く安定させ、説明文で意味を調整します
- `choice` の型はラベルのユニオン型（`"honbu" | "yatai" | ...`）として推論されます。`switch` で網羅性チェックができます
- 「どれにも当てはまらない」投稿が来ることを考えると、`other` のような逃げ道のラベルを用意するかどうかは設計判断です。用意しないと、無理やりどれかに振られます

</details>

> 一次情報: https://docs.typesafe.ai/primitives/choice

## probability と confidence はちがう

🟢 恒久

### ひとことで

- **probability（確率）** … 「それぞれの係である見込み」
- **confidence（自信）** … 「迷わずに選べたか」

一番人気の係がはっきりしていれば自信は高く、票が割れていれば自信は低くなります。

### ちゃんと言うと

見本の結果（replay）を2つ並べます。

```
p05 「やぐらの横でおじいさんが倒れています！…」
    → kyugo（confidence 0.92）
      kyugo       ███████████████████░ 0.97

p11 「ごみ箱があふれて、道にごみが散らかっています。」
    → honbu（confidence 0.44）
      honbu       ██████████████░░░░░░ 0.71
      yatai       ███░░░░░░░░░░░░░░░░░ 0.17
      kotsu       ██░░░░░░░░░░░░░░░░░░ 0.08
```

p11 は「本部」が一番ですが、「屋台の近くのごみかも」「道路の話かも」と確率が分かれています。
こういう投稿こそ、人が確認する価値があります。

<details><summary>もっと深く（プロ向け）</summary>

- confidence は確率分布の尖り具合を表します。フラットな分布は「どれも決め手に欠ける」を意味します
- 選ばれたラベルの確率（上の例なら 0.71）と confidence は同じではありません。ラベル数が多いと、1位の確率がそこそこでも分布全体は平らになりえます
- 見本データ（合成）の confidence は教材側で計算した値です。実APIの confidence の定義は公式の Confidence のページを参照してください。三段でくわしく扱います

</details>

> 一次情報: https://docs.typesafe.ai/confidence
