<!-- このファイルは書籍の原稿から自動で作っています。直接編集しないでください -->
# 『ハンズオン Jev 入門』のコマンド一覧

書籍『ハンズオン Jev 入門』の「▶ やってみよう」などのコマンドを、章ごとに並べたページです（コマンド 36 か所、自分で作るファイル 2 個）。
電子書籍のアプリによっては、本からコピーすると引用符（“ ”）や書名が付け足されます。コマンドは、このページからコピーしてください。
GitHub では、コマンドの枠の右上にあるボタンでコピーできます。

最初の `git clone` のあとは、どのコマンドも教材のフォルダ（`jev-dojo`）で実行します。
API キーを設定していると、サンプルは本物の Jev と通信し、費用がかかります。費用をかけずに本と同じ画面で進めるときは、先に `export JEV_MODE=replay` を実行してください。

## 第3章 準備をする

### サンプルコードを手元に置く

リポジトリ: [github.com/kenmori/jev-dojo](https://github.com/kenmori/jev-dojo)

```bash
git clone https://github.com/kenmori/jev-dojo
cd jev-dojo
npm install
```

### 2 つの動き方を先に知っておく

```bash
export JEV_MODE=replay
```

### API キーなしで動かしてみる

コード: [`src/steps/k10-hello.ts`](../../src/steps/k10-hello.ts)

```bash
npm run k10
```

### 全部のサンプルをまとめて見る

コード: [`src/demo.ts`](../../src/demo.ts)

```bash
npm run demo
```

### 環境を診断する

コード: [`src/doctor.ts`](../../src/doctor.ts)

```bash
npm run doctor
```

### キーを .env ファイルに書く

コード: [`.env.example`](../../.env.example)

```bash
cp .env.example .env
```

コード: [`src/doctor.ts`](../../src/doctor.ts)

```bash
npm run doctor
```

### 本物の Jev に質問する

コード: [`src/steps/k10-hello.ts`](../../src/steps/k10-hello.ts)

```bash
npm run k10
```

### キーを入れたまま再生モードで動かす

コード: [`src/steps/k10-hello.ts`](../../src/steps/k10-hello.ts)

```bash
JEV_MODE=replay npm run k10
```

### 解答

```bash
   JEV_MODE=replay npm run k10
```

## 第4章 最初の 1 回

### 注文票を 1 枚書いて送る

（API キーが必要です。教材のコードは使わず、curl で直接送ります）

```bash
curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "jev-1.13.0",
    "state": "ボランティアの集合時間は何時ですか？",
    "questions": {
      "isQuestion": {
        "type": "noul",
        "instructions": "この投稿は、運営への質問ですか？"
      }
    }
  }'
```

### 同じことを TypeScript で書く

コード: [`src/steps/k08-raw.ts`](../../src/steps/k08-raw.ts)

```bash
npm run k08
```

## 第5章 はい・いいえで聞く ― Noul

### 実行する前に、予想してみる

コード: [`src/steps/k07-noul.ts`](../../src/steps/k07-noul.ts)

```bash
npm run k07
```

## 第6章 選ばせる ― Choice

### 実行して、確率の分かれ方を見る

コード: [`src/steps/k06-choice.ts`](../../src/steps/k06-choice.ts)

```bash
npm run k06
```

## 第7章 点をつけさせる ― Score

### 実行する前に、予想してみる

コード: [`src/steps/k05-score.ts`](../../src/steps/k05-score.ts)

```bash
npm run k05
```

## 第8章 まとめて聞く

### まとめると、何が得なのか

コード: [`src/steps/k04-batch.ts`](../../src/steps/k04-batch.ts)

```bash
npm run k04
```

### 3 つの答えをつなげる

参考にするサンプル: [`src/steps/k04-batch.ts`](../../src/steps/k04-batch.ts)

① `src/steps/my-triage.ts` を新しく作り、次のコードを貼り付けて保存する

```ts
import { createDojo } from "../lib/client.js";
import { getPost } from "../lib/posts.js";
import { toLevel, urgency } from "./k05-score.js";
import { department } from "./k06-choice.js";
import { decide, isComplaint } from "./k07-noul.js";

const dojo = createDojo("k04-batch");
const post = getPost("p02");
const { answers } = await dojo.client.systemOne({
  state: post.text,
  questions: { isComplaint, department, urgency },
});

console.log({
  complaint: decide(answers.isComplaint.noul),
  department: answers.department.choice,
  departmentConfidence: answers.department.confidence,
  urgency: toLevel(answers.urgency.score),
});
```

② 実行する

```bash
npx tsx src/steps/my-triage.ts
```

## 第9章 state ― 何を渡すか

### 同じ投稿を、3 通りの材料で聞く

コード: [`src/steps/d1-state.ts`](../../src/steps/d1-state.ts)

```bash
npm run d1
```

## 第10章 質問文と基準 ― どう判断させるか

### 同じ投稿に、3 通りの書き方で聞く

コード: [`src/steps/d2-instructions.ts`](../../src/steps/d2-instructions.ts)

```bash
npm run d2
```

### 仕分けボットの本番用の質問

コード: [`scripts/show.ts`](../../scripts/show.ts)

```bash
npm run show -- p06 p14 p51
```

## 第11章 confidence ― どれくらい信じるか

### 60 件を振り分けてみる

コード: [`src/steps/d3-lanes.ts`](../../src/steps/d3-lanes.ts)、[`src/lib/lanes.ts`](../../src/lib/lanes.ts)

```bash
npm run d3
```

### 迷った 8 件を見る

コード: [`scripts/show.ts`](../../scripts/show.ts)

```bash
npm run show -- p22 p42 p49
```

## 第12章 よく使う 4 つの型

### 実行して、振り分けを見る

コード: [`src/steps/d4-patterns.ts`](../../src/steps/d4-patterns.ts)

```bash
npm run d4
```

### 安全の条件は、足し算に混ぜない

参考にするサンプル: [`src/steps/d4-patterns.ts`](../../src/steps/d4-patterns.ts)

① `src/steps/my-sort.ts` を新しく作り、次のコードを貼り付けて保存する

```ts
import { boardDojo, type Prediction, predictAll } from "../lib/evaluate.js";
import { rank } from "./d4-patterns.js";

function sortForStaff(predictions: Prediction[]) {
  const urgentSafety = predictions.filter((p) => p.department === "kyugo" && p.urgency >= 1.5);
  const rest = predictions.filter((p) => !urgentSafety.includes(p));
  return [...urgentSafety, ...rank(rest).map((r) => r.p)];
}

const predictions = await predictAll(boardDojo("ja"), "ja");
console.log(sortForStaff(predictions).slice(0, 12).map((p) => p.id).join(" "));
```

② 実行する

```bash
JEV_MODE=replay npx tsx src/steps/my-sort.ts
```

## 第13章 コードに任せる所、Jev に任せる所

### 実行する

コード: [`src/steps/d5-boundary.ts`](../../src/steps/d5-boundary.ts)

```bash
npm run d5
```

## 第14章 評価用のデータを作る

### 教材の 60 件

コード: [`src/steps/d6-dataset.ts`](../../src/steps/d6-dataset.ts)

```bash
npm run d6
```

### ラベルは Jev の答えを見る前に付ける

コード: [`scripts/label.ts`](../../scripts/label.ts)

```bash
npm run label
```

## 第15章 実測: 自信の数値はどれくらい当たるか

### 測る

コード: [`src/steps/d7-calibration.ts`](../../src/steps/d7-calibration.ts)、[`src/lib/metrics.ts`](../../src/lib/metrics.ts)

```bash
npm run d7
```

### 直して、測り直した結果

コード: [`scripts/lab-complaint.ts`](../../scripts/lab-complaint.ts)

```bash
npm run lab:complaint
```

## 第16章 実測: 日本語で使うときの注意

### 同じ 60 件を、日本語と英語で判定する

コード: [`src/steps/d8-ja-en.ts`](../../src/steps/d8-ja-en.ts)

```bash
npm run d8
```

### 日英で答えが分かれた 2 件

コード: [`scripts/show.ts`](../../scripts/show.ts)

```bash
npm run show -- p53 p06 --lang en
```

## 第17章 本番運用と、使ってはいけない場面

### 流す量と予算を、送る側で守る

コード: [`src/steps/d9-production.ts`](../../src/steps/d9-production.ts)、[`src/lib/production.ts`](../../src/lib/production.ts)

```bash
npm run d9
```

### 判定を操作しようとする投稿

コード: [`src/steps/d10-limits.ts`](../../src/steps/d10-limits.ts)

```bash
npm run d10
```

## 第18章 奥義 ― 記録した答えで仕組みを確かめる

### 調べ方

コード: [`src/steps/okugi-mechanism.ts`](../../src/steps/okugi-mechanism.ts)

```bash
npm run okugi
npm run okugi -- --live-only   # 見本を除いて、実APIの記録だけを調べる
```

## 第19章 最終試験と解説

### 試験の受け方

コード: [`exam/tasks`](../../exam/tasks)

```bash
npm run exam
```

テスト: [`exam/tests`](../../exam/tests)

```bash
npx vitest run --project exam
```
