# 8級 最初の1回

- 所要時間: 20分
- 先に読む公式ページ: [Quick start](https://docs.typesafe.ai/introduction/quickstart) / [API](https://docs.typesafe.ai/api)
- この章でできるようになること: curl で POST し、返ってきた JSON を読める

## 送るのも返ってくるのも、JSON が1つだけ

🟡 半恒久

### ひとことで

Jev に質問するのは、決まった書式の手紙を出して、決まった書式の返事をもらうのと同じです。
SDK はその手紙を代わりに書いてくれる道具ですが、まずは自分の手で1通書いてみます。

### ちゃんと言うと

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

返ってくる JSON は、だいたい次の形です。

```json
{
  "model": "（実際に答えたモデルのバージョン）",
  "answers": {
    "isQuestion": { "type": "noul", "noul": 0.98 }
  },
  "usage": { "input_tokens": 64, "output_tokens": 0 }
}
```

- `answers.isQuestion.noul` … 「はい」の確率
- `usage.input_tokens` … 料金計算のもとになるトークン数

同じことを TypeScript で、SDK を使わずに書いたのが [src/steps/k08-raw.ts](../../src/steps/k08-raw.ts) です。

```bash
npm run k08
```

<details><summary>もっと深く（プロ向け）</summary>

- `questions` の名前がそのまま `answers` のキーになります。SDK を使うと、この対応が TypeScript の型として推論されます（7級以降）
- `model` にエイリアス（`jev-latest` など）を渡した場合、応答の `model` には実際に使われたバージョンが入ります。これを使って「エイリアスが今どこを指しているか」を調べられます（[scripts/verify-facts.ts](../../scripts/verify-facts.ts)）
- `state` と `instructions` には文字列だけでなく JSON オブジェクトや配列も渡せます（二段で扱います）
- 上の JSON の数字はこの教材の見本です。実際の値は実行して確かめてください

</details>

> 一次情報: https://docs.typesafe.ai/api
