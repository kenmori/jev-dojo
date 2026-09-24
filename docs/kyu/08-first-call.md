# 8級 最初の1回

- 所要時間: 20分
- 先に読む公式ページ: [Quick start](https://docs.typesafe.ai/introduction/quickstart) / [API](https://docs.typesafe.ai/api)
- この章でできるようになること: curl で POST し、返ってきた JSON を読める

## 送るのも返ってくるのも、JSON が1つだけ

<!-- freshness: semi-stable -->

Jev に質問するのは、決まった書式の手紙を出して、決まった書式の返事をもらうのと同じです。
SDK はその手紙を代わりに書いてくれる道具ですが、まずは自分の手で1通書いてみます。

送るのは JSON が1つだけです。

```bash
curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "jev-latest",
    "state": "ボランティアの集合時間は何時ですか？",
    "questions": {
      "isQuestion": {
        "type": "noul",
        "instructions": "この投稿は、運営への質問ですか？"
      }
    }
  }'
```

| キー | 意味 |
|---|---|
| `model` | どのモデルに聞くか |
| `state` | 判断の材料。ここでは投稿の文章 |
| `questions` | 質問の一覧。名前（ここでは `isQuestion`）は自分で決める |
| `type` | 答えの形。`noul`（はい/いいえ）・`choice`（選ぶ）・`score`（点をつける） |
| `instructions` | 質問そのもの |

返ってくる JSON は、次の形です（作者が記録したときの値）。

```json
{
  "model": "（実際に答えたモデルのバージョン）",
  "answers": {
    "isQuestion": { "type": "noul", "noul": 0.91 }
  },
  "usage": { "input_tokens": 300, "output_tokens": 23 }
}
```

- `answers.isQuestion.noul` … 「はい」の確率
- `usage.input_tokens` / `usage.output_tokens` … 料金計算のもとになるトークン数。Jev は文章を返しませんが、出力も 0 ではありません

同じことを TypeScript で、SDK を使わずに書いたのが [src/steps/k08-raw.ts](../../src/steps/k08-raw.ts) です。

```bash
npm run k08
```

<details><summary>もっと深く（プロ向け）</summary>

- `questions` の名前がそのまま `answers` のキーになります。SDK を使うと、この対応が TypeScript の型として推論されます（7級以降）
- `model` にエイリアス（`jev-latest` など）を渡した場合、応答の `model` には実際に使われたバージョンが入ります。これを使って「エイリアスが今どこを指しているか」を調べられます（[scripts/verify-facts.ts](../../scripts/verify-facts.ts)）
- `state` と `instructions` には文字列だけでなく JSON オブジェクトや配列も渡せます（二段で扱います）
- 上の JSON の数字は、作者が1回記録したときの値です。実行するたびに少し変わることがあります。短い投稿でも `input_tokens` が大きいのは、質問の形式などの決まった分が毎回送られているためと考えられます

</details>

> 一次情報: https://docs.typesafe.ai/api
