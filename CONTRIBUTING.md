# コントリビュートガイド

誤りの指摘、わかりにくい箇所の報告、章の追加を歓迎します。

## 貢献の条件

- コードへの貢献は MIT License で提供されたものとして扱います
- 教材本文（`docs/`）への貢献は、著作権者（kenmori）が本文を CC BY-NC-ND 4.0 で公開すること、および **PDF 版などとして有償で頒布すること** に同意したうえで提供されたものとして扱います
- 同意できない場合は、Pull Request ではなく Issue で指摘してください

## 開発の流れ

```bash
npm install
npm run check   # 型・lint・生成物の鮮度・テスト。PR の前に必ず緑にする
```

## 本文を書くときのルール

### 1. やさしい説明から始め、詳しい説明へ地の文でつなぐ

```markdown
## セクション名（結論が伝わる見出し）

<!-- freshness: evergreen -->

たとえ話と図で、専門用語を使わずに説明する（3〜5行）。

そのまま地の文で、用語の定義 → コード → 実行 → 出力 → 何が起きたか、へ進む。
「ひとことで」「ちゃんと言うと」のような小見出しは付けない。

<details><summary>もっと深く（プロ向け）</summary>
設計上のトレードオフ、失敗例、計測結果、一次情報リンク。
</details>

> 一次情報: https://docs.typesafe.ai/...
```

### 2. 賞味期限の目印を付ける

h2 ごとに1つ、見出しの直後に `<!-- freshness: evergreen -->`（恒久）/ `semi-stable`（半恒久）/ `volatile`（揮発）のどれかを書きます。
本文には表示されず、PDF 版では見出しの縁の色（緑・黄・赤）になります。
目標の配分は 恒久60% / 半恒久30% / 揮発10% です。

### 3. 変わりうる事実を直接書かない

料金・レート制限・コンテキスト長・モデルのバージョンID・SDK のバージョンは、本文に書かずに
[docs/_generated/facts.md](docs/_generated/facts.md) へリンクします。値を変えるときは
[data/facts.json](data/facts.json) を直して `npm run facts` を実行します。

### 4. 一次情報より詳しく書かない

リンク先は原則 `docs.typesafe.ai` です。ブログや二次記事は「参考」として区別し、一次情報の代わりにしません。
この教材の役割は「順序」と「手を動かす場」で、公式ドキュメントの代替ではありません。

### 5. 数値は再現コードとセットで

結論を書くときは、それを再現するコマンドと、データの件数・限界を併記します。

ルール 1〜3 は `npm run lint` で自動チェックされます（[scripts/lint-docs.ts](scripts/lint-docs.ts)）。

## サンプルコードを足すとき

1. `src/steps/` にファイルを作り、`run(dojo)` を export する（テストから呼べるように）
2. `src/steps/index.ts` と `package.json` の scripts に追加する
3. APIキーを設定して `npm run record <step名>` で fixture を録る
4. `tests/contract/` に再生テストを書く。確率は `isClose` などで許容幅つきで比べる

fixture の `meta.source` が `synthetic` のものは手で作った見本です。実APIで録れる人は置き換えてください。
