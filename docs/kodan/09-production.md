# 九段 本番運用

- 所要時間: 45分
- 先に読む公式ページ: [Models](https://docs.typesafe.ai/models) / [API](https://docs.typesafe.ai/api) / [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- この章でできるようになること: レート制限・リトライ・バージョン固定・コスト監視・ログを、本番を想定して設計できる

## バージョンを固定する

🟢 恒久

### ひとことで

`jev-latest` は「いちばん新しいもの」を指す呼び名なので、新しいモデルが出ると中身が入れ替わります。
七段でしきい値を測って決めたなら、そのしきい値は**測ったときのモデル専用**です。だから本番ではバージョンを固定します。

### ちゃんと言うと

- この教材は、9級以降すべてのサンプルでモデルを固定しています（[src/lib/client.ts](../../src/lib/client.ts)。値は [facts.md](../_generated/facts.md#モデル)）
- 応答の `model` には実際に答えたモデルが入ります。`npm run d9` は、指定したモデルと応答のモデルが違えば警告します
- 新しいバージョンが出たことは、週次の CI（`freshness.yml`）が `jev-latest` の行き先を調べて Issue にします

新しいバージョンに上げるときの手順:

1. `data/facts.json` の固定モデルを変える
2. `npm run record` で録り直し、`git diff fixtures/` で答えの変化を見る
3. 七段・八段を測り直し、しきい値を決め直す

<details><summary>もっと深く（プロ向け）</summary>

- エイリアスは新しいリリースで指す先が変わるため、しきい値を調整済みなら固定する、というのが公式の考え方です
- バージョンを上げるのは「コードの変更」と同じ重さで扱います。レビューと測定なしに上げません

</details>

> 一次情報: https://docs.typesafe.ai/models

## 流量・リトライ・予算・ログ

🟡 半恒久

### ひとことで

60件を一度に送るときは、「同時にいくつまで」「1分にいくつまで」「いくらまで」を決めてから流します。
何が起きたかを後から追えるように、1件ごとに記録を残します。

### ちゃんと言うと

[src/steps/d9-production.ts](../../src/steps/d9-production.ts) と [src/lib/production.ts](../../src/lib/production.ts):

| 仕組み | どこで持つか |
|---|---|
| リトライとバックオフ（429、5xx、接続エラー） | **SDK**。`retry-after` も尊重する。自前で書かない |
| タイムアウト | **SDK** の `timeout`（1回の試行ごと） |
| 同時実行数 | コード（`createLimiter`） |
| 1分あたりの上限 | コード（`createRateGate`）。公式の上限ぎりぎりでなく余裕を持たせる |
| 予算の上限 | コード（`BudgetGuard`）。超えたら止める |
| ログ | コード。1リクエスト1行の JSON。本文は書かない |

```bash
npm run d9   # ログは logs/d9-production.jsonl
```

SDK のリトライの挙動は [tests/contract/errors.test.ts](../../tests/contract/errors.test.ts) で確かめられます。

<details><summary>もっと深く（プロ向け）</summary>

- レート制限は公式が「予告なく変わりうる」としています。値は [facts.md](../_generated/facts.md#レート制限) を見て、コードでは facts.json から読みます
- SDK のタイムアウトは試行ごとで、リトライ全体の上限はありません。全体の締め切りが必要なら `AbortSignal` を渡します
- ログに `requestId`（応答ヘッダの `x-typesafe-request-id`）を残すと、問い合わせのときに追跡できます。`withResponse()` で取れます
- 投稿本文は個人情報を含みうるので、ログには既定で書きません。書くなら保存期間と閲覧者を決めてから
- 失敗の切り分けは「証拠が足りない／モデルの誤り／コードの誤り／サービスの障害」の4つに分けて考えます（公式スキル）

</details>

> 一次情報: https://docs.typesafe.ai/sdk/javascript
