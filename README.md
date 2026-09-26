# jev-dojo

日本語 | [English](README.en.md)

**Jev（TypeSafe AI の System One モデル）を、級・段で学ぶハンズオン教材。**
クローンして、APIキーなしで、5分で最初の判定結果を見るところから始めます。

<!-- facts:start -->
```
最終検証: 2026-09-24 ｜ 対象モデル: jev-1.13.0 ｜ SDK: @typesafe-ai/sdk 0.6.0
公式ドキュメント差分チェック: 未実施
```

全サンプルのリクエストを1回ずつ live で送ったときの Jev の費用の目安: 約 $0.0051（入力 121,646 トークン、新規クレジット $5 の 0.10%）。※ 一部は見本データ（合成）のトークン数からの推定。応用B の Claude の費用は別にかかります
<!-- facts:end -->

## 5分で始める

```bash
git clone https://github.com/kenmori/jev-dojo
cd jev-dojo
npm install
npm run demo          # 記録済みの結果を再生。APIキー不要・費用ゼロ
cp .env.example .env  # ここで初めてキーを入れる
npm run k10           # 本物のAPIを叩く
```

ローカルに Node.js を入れたくない場合は「Code → Codespaces」で開けば、そのまま動く環境が立ち上がります。
詰まったら `npm run doctor` で環境を診断できます。

## 級位マップ

上から順に進みます。各段階の中も、左から順です。

| 段階 | 章（左から順に） | できるようになること |
|---|---|---|
| 入門（級） | [10級 Jevって何？](docs/kyu/10-what-is-jev.md) → [9級 環境をつくる](docs/kyu/09-setup.md) → [8級 最初の1回](docs/kyu/08-first-call.md) → [7級 Noul](docs/kyu/07-noul.md) → [6級 Choice](docs/kyu/06-choice.md) → [5級 Score](docs/kyu/05-score.md) → [4級 まとめて聞く](docs/kyu/04-batch.md) | 3 つの質問の形で、Jev に聞ける |
| 中級（段） | [初段 state](docs/dan/01-state.md) → [二段 instructions](docs/dan/02-instructions.md) → [三段 confidence](docs/dan/03-confidence.md) → [四段 パターン](docs/dan/04-patterns.md) → [五段 コードとの境界](docs/dan/05-boundary.md) | 判断の基準を書き、迷った答えを人に回せる |
| 上級（高段） | [六段 評価データ](docs/kodan/06-dataset.md) → [七段 キャリブレーション](docs/kodan/07-calibration.md) → [八段 日本語ラボ](docs/kodan/08-japanese-lab.md) → [九段 本番運用](docs/kodan/09-production.md) → [十段 限界と誤用](docs/kodan/10-limits.md) | 当たり具合を測り、本番に出せるか判断できる |
| 皆伝 | [奥義 仕組み](docs/kaiden/01-mechanism.md) → [最終試験](docs/kaiden/02-exam.md) | 記録から仕組みを確かめ、試験で腕試しをする |

全章の一覧は [docs/00-index.md](docs/00-index.md) にあります。

## この教材の特徴

- **段階設計** … どのセクションも、中学生でも読めるやさしい説明から始まり、コードと実行結果へ進み、最後にプロ向けの深掘りを折りたたんで置いています
- **実行コマンドとテストで裏付け** … 全23章のうち21章に実行コマンドがあり、19章に自動テストがあります（内訳は下の「章ごとの動かし方」）。`npm test` は APIキーなしで通ります
- **共通題材を育てる** … 「地域のお祭り掲示板」の投稿を、章ごとに機能を足しながら仕分けていきます
- **古くならない仕組み** … 料金・レート制限・モデルIDは [data/facts.json](data/facts.json) に集め、本文には直接書きません。公式ドキュメントの変化は週次のCIで検出します
- **英語でも進められる** … 英語の本文（[docs/en](docs/en/00-index.md)、[README.en.md](README.en.md)）があり、`.env` に `JEV_LANG=en` と書くとサンプルの質問・投稿・表示も英語になります
- **一次情報が正典** … 各セクションの最後に公式ドキュメントへのリンクがあります。この教材の役割は「順序」と「手を動かす場」で、公式ドキュメントの代わりではありません

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run demo` | 17章分のサンプルを続けて再生（APIキー不要） |
| `npm run doctor` | Node・キー・疎通を診断 |
| `npm run k10` 〜 `npm run k04` | 級のサンプルを実行 |
| `npm run d1` 〜 `npm run d10` | 段・高段のサンプルを実行 |
| `npm run ob` | 応用B（Jev ＋ Claude） |
| `npm run okugi` | 記録済みの応答から、答えの「形」の性質を検証する（奥義） |
| `npm run show -- p22` | 1 件の投稿について、記録済みの答えを全部表示する（三段〜八段） |
| `npm run lab:complaint` | 苦情の質問を直す前と後を、同じリクエストで比べる（APIキーが必要） |
| `npm run exam` | 免許皆伝の最終試験を採点する |
| `npm run label` | 評価データに自分でラベルを付ける（六段） |
| `npm run reports` | fixture から七段・八段のレポートと図を作り直す |
| `npm test` | unit ＋ contract テスト（APIキー不要） |
| `npm run test:eval` | 実APIを使うライブ評価（キーがある時だけ） |
| `npm run check` | 型・lint・生成物の鮮度・テストをまとめて確認 |
| `npm run record` | fixture を実APIで録り直す（APIキーが必要。**章を指定しないと、すべての記録を消して録り直す**ので、先に git で保存しておく） |
| `npm run facts` | `data/facts.json` から生成物を更新 |

## 章ごとの動かし方

| 区分 | 章 | 動かし方 | 自動テスト |
|---|---|---|---|
| `npm run demo` で再生される | 10〜4級（9級を除く6章）、初段〜十段（10章）、応用B | 各章の `npm run k10` などでも個別に実行できる | あり |
| 別のコマンドで動かす | 9級 | `npm run doctor`（環境の診断） | なし |
| | 奥義 | `npm run okugi` | あり |
| | 皆伝 | `npm run exam` | あり（解答例が全問正解になることを確認） |
| | 応用A | `cd app && npm run dev` | なし（CI でビルドと型チェックのみ） |
| コマンドなし（読み物） | 応用C、応用D | — | なし |

## ディレクトリ

```
docs/        本文（kyu=級, dan=段, kodan=高段, advanced=応用）。_generated/ は自動生成
src/lib/     SDK の薄いラッパ、費用計算、記録／再生、評価指標、図の生成
src/steps/   章ごとの実行可能サンプル
data/        掲示板の投稿、facts.json（揮発する事実の単一ソース）
fixtures/    記録済みAPIレスポンス
tests/       unit / contract / eval
exam/        最終試験（tasks=問題、solutions=解答例、tests=採点）
scripts/     事実の検証、公式ドキュメントの差分取得、fixture の録り直し、レポート生成
app/         応用A の Web アプリ（TanStack Start + Cloudflare Workers）
```

## 状態

入門（級）・中級（段）・上級（高段）・皆伝・発展（応用A〜D）の全23章の本文がそろっています。

日本語の fixture は、著者が本物の API で記録したものです（モデルのバージョンは [facts.md](docs/_generated/facts.md)）。
英語で動かすとき（`JEV_LANG=en`）の fixture と応用B は、まだ手で作った見本（合成データ）で、実APIの結果ではありません。再生時にはその旨が表示されます。

## ライセンス

- コード: MIT
- 教材本文（`docs/`）: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.ja)。非営利なら自由に読んで共有できます。販売・有料講座への組み込み・改変版の配布はできません
- 書籍『ハンズオン Jev 入門』（Kindle 版）は、この教材とは別の著作物です。書籍の本文はこのリポジトリに含まれません

詳しくは [LICENSE](LICENSE) を参照してください。

本教材は TypeSafe AI の公式教材ではなく、TypeSafe AI とは関係がありません。
