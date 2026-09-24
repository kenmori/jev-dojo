# 応用C フレームワーク統合の現在地

- 所要時間: 20分
- 先に読む公式ページ: [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript) / [API](https://docs.typesafe.ai/api)
- この章でできるようになること: フレームワーク経由で Jev を使うか、公式 SDK を直接使うかを、根拠を持って選べる

## 迷ったら、公式 SDK を直接使うのがいちばん単純

🟢 恒久

### ひとことで

すでに使っている AI フレームワークがあるなら、その「Jev 用の部品」を使うと書き方がそろいます。
なければ、公式 SDK を直接使うのがいちばん単純です。どちらでも、送る中身（state と questions）は同じです。

### ちゃんと言うと

| 見るところ | 理由 |
|---|---|
| 誰が作っているか（公式／フレームワーク側／個人） | 更新が止まる可能性 |
| バージョンが 1.0 未満か、experimental か | 書き方が変わる可能性 |
| confidence・probabilities・usage が取れるか | 三段・七段・九段で必要 |
| モデルIDを固定できるか | 九段で必要 |
| `fetch` を差し替えられるか | テスト（記録／再生）で必要 |
| 環境変数の名前 | 公式 SDK と違うことがある |

この教材が公式 SDK を直接使っているのは、上の条件を全部満たし、依存が最も少ないからです。

<details><summary>もっと深く（プロ向け）</summary>

- フレームワークの抽象は、Jev 固有の情報（confidence など）を別の場所に移したり、名前を変えたりすることがあります。移行するときは、七段の測定をフレームワーク経由でもう一度通して、同じ数字が出ることを確かめます
- どの方法でも、実体は `POST /v1/systemone` への1回のリクエストです。困ったら HTTP の中身（8級）を見ます

</details>

> 一次情報: https://docs.typesafe.ai/api

## 2026-09-24 時点では、公式 SDK のほかに3つの統合がある

🔴 揮発

### ひとことで

この日に npm で確認できた統合パッケージです。数週間で変わりうるので、使う前に必ず最新を確認してください。

### ちゃんと言うと

| パッケージ | 提供元 | 確認したバージョン | 呼び方 |
|---|---|---|---|
| `@typesafe-ai/sdk` | TypeSafe AI（公式） | 0.6 系 | `client.systemOne({ state, questions })` |
| `@ai-sdk/typesafe-ai` | Vercel AI SDK | 3.0 系 | `experimental_evaluate({ model, state, questions })` |
| `@tanstack/ai-typesafe` | TanStack AI | 0.1 系 | `decide({ adapter, state, questions })` |
| `@effect-agent/ai-typesafe` | 個人（Effect 向け） | 0.1 beta | README を確認できず |

LangChain については、この日の npm 検索では専用の統合パッケージは見つかりませんでした。LangChain の中で使う場合は、公式 SDK の呼び出しを関数（ツール）として包むのが手堅い方法です。

README から読み取れた、公式 SDK とのちがい:

- **Vercel AI SDK**: はい/いいえは `type: "boolean"`（Jev の Noul に対応）。APIキーの環境変数は `TYPESAFE_AI_API_KEY`（公式 SDK の `TYPESAFE_API_KEY` と名前が違う）。confidence は `result.providerMetadata.typesafe.confidence[質問ID]` にある。評価機能は experimental
- **TanStack AI**: `boolean` / `choice({ instructions, options })` / `score({ instructions, levels })` という独自の書き方。公式 SDK に依存せず、`fetch` で直接 HTTP を呼ぶ

<details><summary>もっと深く（プロ向け）</summary>

- Vercel AI SDK の README には「TypeSafe は丸めた値（小数2桁）を返す」とあります。確率を完全一致で比べてはいけない理由の1つです（7級のテストは許容幅で比べています）
- この表は手で書いた揮発情報です。facts.json のような自動検出の対象にはしていません。表の日付より古い情報として読んでください

</details>

> 一次情報: https://docs.typesafe.ai/sdk/javascript
