# 初段 state の設計

- 所要時間: 30分
- 先に読む公式ページ: [State](https://docs.typesafe.ai/concepts/state) / [How to build with System One](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
- この章でできるようになること: state に何を入れ、何を入れないかを、精度とコストの両面から決められる

## 判断の材料は「多ければよい」ではない

<!-- freshness: evergreen -->

先生に「この作文は苦情ですか？」と聞くとき、作文だけを渡すか、掲示板の説明もつけるか、過去の作文を全部どさっと渡すか。
多すぎる材料は、判断をかえって鈍らせます。しかも材料が増えるほど、お金（トークン）もかかります。

[src/steps/d1-state.ts](../../src/steps/d1-state.ts) は、同じ投稿（p08、遠回しな要望）について、state の渡し方だけを変えた3通りで「苦情ですか？」と聞きます。

| | state の中身 | ねらい |
|---|---|---|
| A | `{ post: { text } }` | 最小限 |
| B | `{ board: { name, purpose }, post: { text, author } }` | 判断に効く文脈を、名前付きのフィールドで足す |
| C | `{ post: { text }, history: [残り59件] }` | 関係のない材料を詰め込む |

```bash
npm run d1
```

出力には、確率と一緒に**入力トークン数**が並びます。詰め込んだ C は、B よりはるかに多くのトークンを使います（見本データのトークン数は推定値なので、正確な倍率は live で確かめてください）。確率がどう動くかは、live で実行して自分の目で確かめてください。

> replay で表示される確率は手で置いた見本です。「C で確率が下がる」ように見えても、それは実APIの結果ではありません。

<details><summary>もっと深く（プロ向け）</summary>

- 公式スキルは「答えるのに十分な関連 state（本文、誰が、関係、ポリシー、現在の事実）を渡す」「文脈が複数の部分からなるなら、名前付きの JSON フィールドを使う」ことを勧めています
- 入力が長くなるほど性能が落ちる現象は一般に context rot と呼ばれます。Jev のコンテキスト長には「全体」と「state ＋ 最長の質問」の2つの上限があります（[facts.md](../_generated/facts.md#コンテキスト長)）
- 「念のため全部入れる」は、精度を下げうるうえに費用が確実に増える選択です。何を足すかは、足す前と後で測って決めます（六段・七段）

</details>

> 一次情報: https://docs.typesafe.ai/concepts/state

## 質問から state の場所を指す

<!-- freshness: evergreen -->

材料に名前をつけておけば、質問の中で「`post.text` は苦情ですか？」のように、どこを見てほしいかをはっきり言えます。

初段の質問は、state の中の場所をバッククォートで囲んだパスで指しています。

```ts
export const isComplaint = noul("`post.text` は、運営に対する苦情や不満ですか？", {
  true: "困っていること・不満・改善の要望が書かれている。遠回しな言い方も含む",
  false: "質問・お礼・報告など、不満ではない",
});
```

B のように掲示板の説明（`board`）と投稿（`post`）が並んでいても、判断の対象が投稿の本文だとわかります。

<details><summary>もっと深く（プロ向け）</summary>

- 入れ子の state を `ticket.messages[0].text` のようにバッククォートつきのパスで参照するのは、公式スキルが勧めている書き方です
- 質問の ID（`isComplaint` などのキー名）は**モデルには送られません**。コードのための名前です。質問の意味は instructions と criteria に全部書きます
- 利用者が書いた文章を名前付きのフィールドに入れておくことは、十段で扱うプロンプトインジェクション対策の土台にもなります

</details>

> 一次情報: https://docs.typesafe.ai/concepts/how-to-build-with-system-one
