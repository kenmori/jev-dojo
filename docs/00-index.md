# 目次

各章は同じ3層で書かれています。

- **ひとことで** … たとえ話と図。専門用語なし。誰でも読める
- **ちゃんと言うと** … 用語の定義 → コード → 実行 → 出力。手を動かす
- **もっと深く（プロ向け）** … 折りたたみの中。設計上のトレードオフ、失敗例、一次情報

はじめての人は折りたたみを閉じたまま進んで大丈夫です。

各セクションの冒頭には賞味期限ラベルがあります。

| ラベル | 意味 |
|---|---|
| 🟢 恒久 | モデルが変わっても有効 |
| 🟡 半恒久 | 大きな変更があれば見直す |
| 🔴 揮発 | 変わりやすい。数値は [_generated/facts.md](_generated/facts.md) を見る |

## 入門（級）

| 章 | タイトル | 到達点 | コマンド |
|---|---|---|---|
| 10級 | [Jevって何？](kyu/10-what-is-jev.md) | LLMとの違いを絵で説明できる | `npm run k10` |
| 9級 | [環境をつくる](kyu/09-setup.md) | `npm run check` が通る | `npm run doctor` |
| 8級 | [最初の1回](kyu/08-first-call.md) | curl で POST し、JSON を読める | `npm run k08` |
| 7級 | [Noul（はい/いいえ）](kyu/07-noul.md) | 「これは苦情か？」を判定 | `npm run k07` |
| 6級 | [Choice（選ぶ）](kyu/06-choice.md) | 投稿を担当部署に振り分ける | `npm run k06` |
| 5級 | [Score（点をつける）](kyu/05-score.md) | 緊急度を3段階で評価 | `npm run k05` |
| 4級 | [まとめて聞く](kyu/04-batch.md) | 3種を1リクエストに。速度とコストを実測 | `npm run k04` |

## 中級（段）

| 章 | タイトル | 到達点 | コマンド |
|---|---|---|---|
| 初段 | [state の設計](dan/01-state.md) | 何を渡し何を渡さないかを決められる | `npm run d1` |
| 二段 | [instructions と criteria](dan/02-instructions.md) | 書き方で答えが変わることを確かめる | `npm run d2` |
| 三段 | [confidence](dan/03-confidence.md) | 3レーン（自動 / 確認 / 人間）を実装 | `npm run d3` |
| 四段 | [パターン4種](dan/04-patterns.md) | fan-out・intent routing・composite scoring | `npm run d4` |
| 五段 | [コードとJevの境界](dan/05-boundary.md) | コードに残す部分と Jev に渡す部分を分ける | `npm run d5` |

## 上級（高段）

| 章 | タイトル | 到達点 | コマンド |
|---|---|---|---|
| 六段 | [評価データセットを作る](kodan/06-dataset.md) | 正解を自分で定義し、ラベルを付ける | `npm run label` / `npm run d6` |
| 七段 | [キャリブレーションを測る](kodan/07-calibration.md) | しきい値を測定で決める | `npm run d7` |
| 八段 | [日本語ラボ](kodan/08-japanese-lab.md) | 日英の精度差を自分の手で測る | `npm run d8` |
| 九段 | [本番運用](kodan/09-production.md) | 流量・リトライ・固定・予算・ログ | `npm run d9` |
| 十段 | [限界と誤用](kodan/10-limits.md) | 型安全 ≠ 事実、インジェクション | `npm run d10` |

## 皆伝

| 章 | タイトル | 到達点 | コマンド |
|---|---|---|---|
| 奥義 | [仕組みを理解する](kaiden/01-mechanism.md) | わかっていることとわかっていないことの境目を言える | `npm run okugi` |
| 皆伝 | [最終試験](kaiden/02-exam.md) | 10問を自分で解いて証明する | `npm run exam` |

## 発展（任意）

| 章 | タイトル | コマンド |
|---|---|---|
| 応用A | [TanStack Start + Cloudflare Workers に組み込む](advanced/a-tanstack-cloudflare.md) | `cd app && npm run dev` |
| 応用B | [LLMとの二層構成](advanced/b-two-layer.md) | `npm run ob` |
| 応用C | [フレームワーク統合の現在地](advanced/c-frameworks.md) | — |
| 応用D | [公式エージェントスキル](advanced/d-agent-skill.md) | — |

## 資料

- [用語集](glossary.md)
- [変わりうる事実（料金・レート制限・モデルID）](_generated/facts.md)
- [公式ドキュメント対応表](_generated/doc-map.md)
- [最終確認日](_generated/last-verified.md)
- [キャリブレーション測定レポート（七段）](_generated/calibration.md)
- [日本語ラボのレポート（八段）](_generated/lab-ja-en.md)
