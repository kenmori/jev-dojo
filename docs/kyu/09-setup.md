# 9級 環境をつくる

- 所要時間: 15分
- 先に読む公式ページ: [Quick start](https://docs.typesafe.ai/introduction/quickstart) / [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- この章でできるようになること: `git clone` → `npm install` → `npm run check` が通る

## キーなしで動かす

🔴 揮発

### ひとことで

APIキーを取る前に、まず手元で動くところまで進めます。
録画を再生するように、前に記録しておいた答えを見せてくれるモード（replay）があります。

### ちゃんと言うと

必要なもの: Node.js（バージョンは [.nvmrc](../../.nvmrc) と `package.json` の `engines` を参照）と Git。

```bash
git clone https://github.com/kenmori/jev-dojo
cd jev-dojo
npm install
npm run demo     # 全章のサンプルを再生。APIキー不要・費用ゼロ
npm run check    # 型チェック・lint・テスト。全部緑になれば準備完了
```

ローカルに Node.js を入れたくない場合は、GitHub の「Code → Codespaces」から開けば、同じ環境がブラウザ上で立ち上がります（[.devcontainer](../../.devcontainer/devcontainer.json)）。

<details><summary>もっと深く（プロ向け）</summary>

実行モードは環境変数 `JEV_MODE` で切り替わります（[src/lib/fixtures.ts](../../src/lib/fixtures.ts)）。

| モード | 動き | APIキー | 費用 |
|---|---|---|---|
| `replay` | `fixtures/` に保存した応答を返す | 不要 | なし |
| `live` | 本物の API を叩く | 必要 | あり |
| `record` | 本物の API を叩き、応答を `fixtures/` に保存 | 必要 | あり |

未設定のときは「キーがあれば live、なければ replay」です。
仕組みは SDK の `fetch` オプションに、ファイルから応答を返す関数を渡しているだけです。
fixture のファイル名はリクエスト内容のハッシュなので、質問文を1文字でも変えると「fixture がない」と教えてくれます。

最初に入っている fixture は**手で作った見本（合成データ）**です。実APIの結果ではありません。
`npm run record` で本物に置き換えられます。どちらなのかは各 fixture の `meta.source` と、実行時の表示でわかります。

</details>

> 一次情報: https://docs.typesafe.ai/sdk/javascript

## APIキーを入れる

🔴 揮発

### ひとことで

本物の Jev と話すための「合い言葉」を設定します。

### ちゃんと言うと

1. 公式の Quick start にしたがってアカウントを作り、APIキーを発行する
2. `.env` を作ってキーを貼る

```bash
cp .env.example .env
# .env を開いて TYPESAFE_API_KEY= のあとにキーを貼る
npm run doctor   # Node・キー・疎通をまとめて確認
npm run k10      # 本物の API で10級のサンプル
```

新規登録時のクレジットや料金は [facts.md](../_generated/facts.md#料金) を見てください。
全サンプルは実行のたびに「今回の実行: 入力 ○ tok → $0.00000…」と費用を表示します。

<details><summary>もっと深く（プロ向け）</summary>

- `.env` は `.gitignore` 済みです。キーをコミットしないでください
- SDK は `TYPESAFE_API_KEY` を環境変数から自動で読みます。この教材は Node の `process.loadEnvFile` で `.env` を読み込んでいます（[src/lib/env.ts](../../src/lib/env.ts)）
- ブラウザから直接 API を叩くと、キーがページの利用者に見えてしまいます。SDK は既定でブラウザ実行を拒否します（`dangerouslyAllowBrowser`）。Web アプリへの組み込みは応用Aで扱います

</details>

> 一次情報: https://docs.typesafe.ai/introduction/quickstart
