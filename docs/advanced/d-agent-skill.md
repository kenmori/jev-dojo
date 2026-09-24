# 応用D 公式エージェントスキルを使う

- 所要時間: 20分
- 先に読む公式ページ: [Agent skill](https://docs.typesafe.ai/agent-skill)
- この章でできるようになること: 公式のエージェントスキルを入れ、コーディングエージェントに Jev を使ったコードを書かせ、その出来をこの教材の観点でレビューできる

## 公式スキルはコマンド1行で入る

<!-- freshness: volatile -->

Claude Code などのコーディングエージェントに「Jev の使い方の手引き」を覚えさせる公式の部品があります。これをスキルと呼びます。

公式リポジトリ（typesafe-ai/skills）の README にある手順です。

```bash
# Claude Code
claude plugin marketplace add typesafe-ai/skills
claude plugin install typesafe@typesafe-ai

# ほかのエージェント（skills.sh 経由）
npx skills add typesafe-ai/skills --skill typesafe-ai
```

Claude Code では `/typesafe:typesafe-ai` で明示的に呼び出せます。

<details><summary>もっと深く（プロ向け）</summary>

- スキルの中身（SKILL.md）は「ライブのドキュメントが正典。タスクの一部として読め」と繰り返し指示しています。スキル自体は方向づけで、細かい仕様は docs.typesafe.ai を読みに行く設計です
- この教材の段・高段の説明のいくつか（質問IDはモデルに送られない、Noul には confidence がない、no-match の選択肢を入れる、など）は、この SKILL.md で確認したものです

</details>

> 一次情報: https://docs.typesafe.ai/agent-skill

## エージェントが書いたコードを、この教材の観点でレビューする

<!-- freshness: evergreen -->

エージェントに掲示板の仕分けを書かせてみて、この教材で学んだ観点でチェックします。書かせるだけでなく、**見抜けること**が目標です。

エージェントへの頼み方の例:

> TypeSafe を使って、地域のお祭り掲示板の投稿を担当部署に振り分けて。迷うものは人が確認するようにして。

出てきたコードを、次のチェックリストで見ます。

| 観点 | 章 |
|---|---|
| state に必要なものだけが、名前付きで入っているか | 初段 |
| 「どれにも当てはまらない」選択肢があるか | 二段 |
| confidence でレーンを分け、しきい値が定数になっているか | 三段 |
| 独立した質問を1回にまとめているか | 4級・四段 |
| ルールで書けることを Jev に聞いていないか | 五段 |
| しきい値を測るための仕組み（評価データ）があるか | 六段・七段 |
| モデルのバージョンを固定しているか | 九段 |
| APIキーがブラウザに出ていないか | 応用A |
| 利用者の文章を指示と分けているか | 十段 |

<details><summary>もっと深く（プロ向け）</summary>

- 公式スキルは、既存の技術スタックと範囲を保ち、意味の理解が必要なところにだけ TypeSafe を足すよう指示しています。関係のないところまで書き換えていたら、そこも指摘点です
- エージェントの出力に出てくるしきい値やクックブックの数字は「評価すべき例」です。そのまま本番の値にしないでください

</details>

> 一次情報: https://docs.typesafe.ai/agent-skill
