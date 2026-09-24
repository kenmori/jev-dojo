# 4級 まとめて聞く

- 所要時間: 20分
- 先に読む公式ページ: [Fan-out](https://docs.typesafe.ai/patterns/fan-out) / [Parallel questions](https://docs.typesafe.ai/cookbooks/parallel_questions)
- この章でできるようになること: Noul・Choice・Score を1リクエストにまとめられる。速度とコストを実測できる

## 1通の手紙に3つの質問を書く

🟢 恒久

### ひとことで

「苦情？」「どの係？」「どのくらい急ぐ？」を、3回に分けて聞く必要はありません。
1通の手紙に3つの質問を書けば、1回の返事で全部答えてもらえます。

### ちゃんと言うと

`questions` に、7級・6級・5級で作った質問をそのまま並べます（[src/steps/k04-batch.ts](../../src/steps/k04-batch.ts)）。

```ts
import { department } from "./k06-choice.js";
import { urgency } from "./k05-score.js";
import { isComplaint } from "./k07-noul.js";

const result = await client.systemOne({
  state: post.text,
  questions: { isComplaint, department, urgency },
});

result.answers.isComplaint.noul;     // number
result.answers.department.choice;    // "honbu" | "yatai" | ...
result.answers.urgency.score;        // number
```

種類のちがう質問を混ぜても、答えの型はそれぞれ正しく推論されます。

```bash
npm run k04
```

<details><summary>もっと深く（プロ向け）</summary>

- 質問は互いに独立に答えられます。「苦情なら緊急度を聞く」のような依存関係がある場合は、コードで2段階に分けるか、全部まとめて聞いて後でコードで捨てるかを選びます。後者が fan-out（投機的ファンアウト）の考え方で、四段で扱います
- コンテキスト長の上限は「全体」と「state ＋ 最長の質問」の2種類があります（[facts.md](../_generated/facts.md#コンテキスト長)）。質問を増やしすぎると上限に当たることがあります

</details>

> 一次情報: https://docs.typesafe.ai/cookbooks/parallel_questions

## まとめると速く安くなる「はず」を、実測で確かめる

🟡 半恒久

### ひとことで

まとめて1回と、1問ずつ3回で、どれくらいちがうかを実際に測ります。
予想するより、測るほうが確実です。

### ちゃんと言うと

`npm run k04` は両方のやり方で実行し、入力トークン数と時間を並べて表示します。

```
▼ くらべる
まとめて1回 : 入力 ○ tok / 出力 ○ tok → $… ｜ ○ ms
1問ずつ3回  : 入力 ○ tok / 出力 ○ tok → $… ｜ ○ ms
```

- **トークン数**: state（投稿の文章）は1回分しか送らないので、まとめたほうが少なくなるはずです
- **時間**: 通信の往復が1回で済むぶん、まとめたほうが短くなるはずです

「はず」を確かめるのがこの章の目的です。replay（見本の再生）では通信しないので時間は比べられません。キーを入れて live で試してください。

<details><summary>もっと深く（プロ向け）</summary>

- 1回の計測はばらつきます。本気で比べるなら、同じ条件で何回か流して中央値を取ります
- 料金は入力トークンと出力トークンの単価で決まります（[facts.md](../_generated/facts.md#料金)）。この教材の全サンプルは [src/lib/cost.ts](../../src/lib/cost.ts) で費用を計算して表示しています
- 大量に投げるときはレート制限にも注意します（[facts.md](../_generated/facts.md#レート制限)）。SDK は 429 を受けると `retry-after` を尊重して自動でリトライします。自前でリトライを書く前に、その挙動を [tests/contract/errors.test.ts](../../tests/contract/errors.test.ts) で確認してください。本番運用は九段で扱います

</details>

> 一次情報: https://docs.typesafe.ai/patterns/fan-out
