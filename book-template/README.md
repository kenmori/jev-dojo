# 書籍版の原稿のひな形

`npm run epub -- --book <原稿のディレクトリ>` で、Kindle Direct Publishing に入稿できる EPUB を作ります。

## 原稿はこのリポジトリに置かない

書籍版には、公開していない内容（実測の分析、書き下ろしの章）を入れます。
原稿は **非公開のリポジトリ** など、このリポジトリの外に置いてください。
このディレクトリをコピーして使います。

```bash
cp -r book-template ../jev-dojo-book       # 非公開の場所にコピー
npm run epub -- --book ../jev-dojo-book    # dist/jev-dojo-book.epub ができる
```

誤ってリポジトリの中に置いた場合に備えて、`book/` は `.gitignore` に入れてあります。

## book.json

| キー | 内容 |
|---|---|
| `title` / `subtitle` / `author` | 書誌情報 |
| `language` | `ja` または `en` |
| `identifier` | 版をまたいで変えない ID（省略するとタイトルと著者から決まる） |
| `description` | 商品説明 |
| `cover` | 表紙の画像（任意）。KDP では表紙を別にアップロードすることもできる |
| `output` | `dist/` に書き出すファイル名 |
| `chapters` | 章の並び。`repo:docs/...` は公開教材の章、それ以外は book.json からの相対パス |

## 変換のされ方

- 図（Mermaid とグラフ）は PNG 画像にして埋め込む
- 「もっと深く（プロ向け）」の折りたたみは、囲みの節として展開する
- 賞味期限の目印は消す
- 章どうしのリンクは本の中のリンクに、リポジトリのコードへのリンクは GitHub の URL になる
- `{{facts.lastVerified}}` や `{{facts.model.pinned}}` と書くと、`data/facts.json` の値（検証日・モデルのバージョンなど）が入る。改訂のときに本文を直し忘れない
- 本文中で `repo:` から始まるパスを使うと、リポジトリのファイル（生成されたグラフなど）を指せる

## 入稿の前に

- 公開教材の章をそのまま並べるだけにしない。書籍だけの内容で「別の本」にする
- 見本データ（合成）の数値を載せない。`npm run record` で実測値にしてから `npm run reports` を実行する
- EPUBCheck（https://github.com/w3c/epubcheck）で検証し、Kindle Previewer で見た目を確認する
