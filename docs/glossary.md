# 用語集

各項目は、やさしい一文、正確な説明、一次情報の順に並んでいます。本文の初出箇所からここへリンクします。

特に区別を徹底する2組:

- **probability と confidence** … 前者は各選択肢に割り当てられた確率、後者は分布の尖り具合
- **型安全 と 事実の正しさ** … Jev はスキーマ外の値を返さないが、意味的に誤った判断は返しうる

## System One モデル

<!-- freshness: evergreen -->

速く「判断」だけをするタイプのAI。文章は書かない。

入力（state）と質問（questions）を受け取り、スキーマで決められた形の答えを確率つきで返すモデル。TypeSafe AI の用語。

> 一次情報: https://docs.typesafe.ai/concepts/system-one

## Jev

<!-- freshness: semi-stable -->

TypeSafe AI が作った System One モデルの名前。

TypeSafe AI が提供する System One モデルのシリーズ名。バージョンごとに ID を持ち、エイリアス経由でも指定できる（→ alias）。

> 一次情報: https://docs.typesafe.ai/models

## state

<!-- freshness: evergreen -->

判断の材料。この教材では掲示板の投稿の文章。

Jev に評価させる対象。文字列のほか JSON オブジェクトや配列も渡せる。何を入れて何を入れないかは初段で扱う。

> 一次情報: https://docs.typesafe.ai/concepts/state

## questions

<!-- freshness: evergreen -->

Jev への質問のリスト。名前をつけて並べる。

名前 → 質問定義 のマップ。名前がそのまま応答の `answers` のキーになる。1リクエストに複数入れられる（4級）。

> 一次情報: https://docs.typesafe.ai/primitives

## instructions

<!-- freshness: evergreen -->

質問の文章そのもの。

各質問の問いかけ部分。文字列のほか JSON オブジェクトや配列も使える。書き方で答えが変わることは二段で実験する。

> 一次情報: https://docs.typesafe.ai/primitives/advanced

## criteria

<!-- freshness: evergreen -->

答えの選択肢と、それぞれが何を意味するかの説明。

Noul では true/false の説明、Choice ではラベル → 説明のマップ、Score では 0 から順に並べた説明の配列。

> 一次情報: https://docs.typesafe.ai/primitives/advanced

## Choice

<!-- freshness: evergreen -->

いくつかの選択肢から1つ選ぶ質問。

ラベルの集合から1つを選ぶプリミティブ。応答は選ばれたラベル（`choice`）、全ラベルの確率（`probabilities`）、`confidence`。

> 一次情報: https://docs.typesafe.ai/primitives/choice

## Score

<!-- freshness: evergreen -->

順番のある段階で点をつける質問。

0 から始まる順序つきルーブリックで評価するプリミティブ。応答の `score` は各段階の確率による期待値なので小数になりうる。

> 一次情報: https://docs.typesafe.ai/primitives/score

## Noul

<!-- freshness: evergreen -->

はい/いいえで答える質問。

真偽を問うプリミティブ。応答の `noul` は「はい（true）」の確率（0〜1）。

> 一次情報: https://docs.typesafe.ai/primitives/noul

## probability

<!-- freshness: evergreen -->

それぞれの答えである見込み。

各選択肢（または各段階）に割り当てられた確率。Choice と Score では合計が 1 になる。

> 一次情報: https://docs.typesafe.ai/primitives

## confidence

<!-- freshness: evergreen -->

迷わずに答えられたかどうか。

確率分布の尖り具合。フラットな分布は「どれも決め手に欠ける」を意味する。probability とは別物（6級）。

> 一次情報: https://docs.typesafe.ai/confidence

## calibration（キャリブレーション）

<!-- freshness: evergreen -->

「80% と言ったものが、本当に 80% くらい当たるか」。

予測確率と実際の正解率が一致している度合い。Brier score や信頼度曲線で測る（七段）。

> 一次情報: https://docs.typesafe.ai/introduction/machine-learning-primer

## RLCD

<!-- freshness: semi-stable -->


Reinforcement Learning for Calibrated Decisions（較正された判断のための強化学習）。Jev の学習の方法です。
文章を書く AI が人の好む返事（RLHF）を学ぶのに対し、RLCD は、文章を書かずに「決まった形の判断」と「較正された確率」を返すように学習します。較正されているとは、たくさんの答えをまとめたとき、確率 0.8 と言った答えがおよそ 80% 当たる、という意味です（1 つの答えが正しい保証ではありません）。

> 一次情報: https://docs.typesafe.ai/introduction/machine-learning-primer

## fan-out（投機的ファンアウト）

<!-- freshness: semi-stable -->

あとで要るかもしれない質問も、先にまとめて聞いておくこと。

依存関係のある質問を順番に聞く代わりに、1リクエストで並列に聞き、不要な答えはコードで捨てるパターン（四段）。

> 一次情報: https://docs.typesafe.ai/patterns/fan-out

## confidence-gated routing

<!-- freshness: semi-stable -->

自信があるときは自動で、自信がないときは人に回す仕組み。

confidence のしきい値で処理の経路（自動 / 確認 / 人間 など）を分けるパターン（三段）。

> 一次情報: https://docs.typesafe.ai/patterns/confidence-routing

## composite scoring

<!-- freshness: semi-stable -->

いくつかの点数を組み合わせて1つの点数にすること。

複数の Score / Noul の結果を重みづけなどで合成して、並べ替えや判定に使うパターン（四段）。

> 一次情報: https://docs.typesafe.ai/patterns/composite-scoring

## intent routing

<!-- freshness: semi-stable -->

「何をしたいのか」で行き先を振り分けること。

入力の意図を Choice で分類し、処理の経路を決めるパターン（四段）。

> 一次情報: https://docs.typesafe.ai/patterns/intent-routing

## jaggedness

<!-- freshness: semi-stable -->

得意なことと苦手なことの差がでこぼこしていること。

モデルの能力が課題によって不均一であること。公式はバージョンごとに既知の弱点をまとめている（十段）。

> 一次情報: https://docs.typesafe.ai/model-jaggedness/jev-1.13

## alias（jev-latest, jev-preview）

<!-- freshness: volatile -->

「いちばん新しいの」のように、中身が入れ替わる呼び名。

特定のバージョンを指す別名。新しいリリースで指す先が変わるため、しきい値を調整済みの本番ではバージョンIDで固定する（九段）。現在の対応は facts.md を参照。

> 一次情報: https://docs.typesafe.ai/models

## Btok・Mtok

<!-- freshness: evergreen -->

トークンの数え方の単位。

Mtok は100万トークン、Btok は10億トークン。料金表の単位として使われる。

> 一次情報: https://docs.typesafe.ai/models

## context rot

<!-- freshness: semi-stable -->

材料を詰め込みすぎると、かえって判断が鈍ること。

入力が長くなるほどモデルの性能が落ちる現象の一般的な呼び名。state に何でも入れない理由の1つ（初段）。

> 一次情報: https://docs.typesafe.ai/concepts/state

## ZDR

<!-- freshness: volatile -->

送ったデータを保存しない約束。

Zero Data Retention。リクエストの内容を保持しない取り扱い。対象や条件は公式の規約で確認する。

> 一次情報: https://docs.typesafe.ai/legal

## System 1・System 2（カーネマン）

<!-- freshness: evergreen -->

速い直感（1）と、ゆっくり考えること（2）。

心理学者ダニエル・カーネマンによる思考の二分法。System One モデルという名前の由来。

> 一次情報: https://docs.typesafe.ai/concepts/system-one
