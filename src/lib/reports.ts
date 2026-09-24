import { exampleLabels, type Label, type Lang, postsFor } from "./board.js";
import { costUSD, formatUSD } from "./cost.js";
import { num, type Prediction, pct, type Summary, summarize } from "./evaluate.js";
import { mean, median, minThresholdFor } from "./metrics.js";
import { barChart, groupedBarChart, reliabilityDiagram } from "./svg.js";

/**
 * 七段・八段のレポート（Markdown と SVG）を作る。
 * 入力は fixture の再生結果なので、fixture を録り直せばレポートも作り直される。
 */

export interface Report {
  markdown: string;
  charts: Record<string, string>;
}

const HEADER = "> 自動生成（`npm run reports`）。手で編集しない。fixture を録り直したら作り直す。";

function syntheticNotice(synthetic: boolean): string {
  return synthetic
    ? [
        "> ⚠️ **このレポートは見本データ（合成）から作られています。実APIの測定結果ではありません。**",
        "> ここの数字から Jev の性能について何も結論しないでください。",
        "> APIキーを設定して `npm run record` → `npm run reports` を実行すると、本物の測定結果に置き換わります。",
      ].join("\n")
    : "> 実APIの応答（`npm run record` で記録したもの）から作成。";
}

function sweepTable(s: Summary): string {
  const rows = s.complaint.sweep.map(
    (r) =>
      `| ${r.threshold.toFixed(2)} | ${pct(r.coverage)} | ${pct(r.accuracy)} | ${r.autoCount} |`,
  );
  return [
    "| しきい値 t | 自動で決めた割合 | そのうち正解 | 件数 |",
    "|---|---|---|---|",
    ...rows,
  ].join("\n");
}

export function calibrationReport(
  s: Summary,
  lang: Lang,
  labeler: string,
  synthetic: boolean,
): Report {
  const target = 0.95;
  const pick = minThresholdFor(s.complaint.sweep, target);
  const md = `# キャリブレーション測定（七段）

${HEADER}

${syntheticNotice(synthetic)}

- データ: \`data/posts.${lang}.json\`（${s.n} 件）
- ラベル: ${labeler === "example" ? "作者の例（`data/labels.json`）" : "あなたのラベル（`data/labels.mine.json`）"}
- 費用: ${formatUSD(costUSD(s.usage))}（入力 ${s.usage.input_tokens} トークン）

## 苦情（Noul）

| 指標 | 値 | 読み方 |
|---|---|---|
| 正解率（0.5 で切った場合） | ${pct(s.complaint.accuracy)} | 高いほどよい |
| Brier score | ${num(s.complaint.brier)} | 0 が最良。いつも 0.5 と答えると 0.25 |
| ECE | ${num(s.complaint.ece)} | 0 が最良。「言った確率」と「実際の割合」のずれ |

![信頼度曲線](charts/calibration-reliability-${lang}.svg)

### しきい値を動かすと

p ≥ t なら「苦情」、p ≤ 1 − t なら「苦情ではない」と自動で決め、その間は人に回す場合:

${sweepTable(s)}

正解率 ${pct(target)} 以上を保てる最小のしきい値: **${pick ? pick.threshold.toFixed(2) : "該当なし"}**${pick ? `（自動で決められるのは ${pct(pick.coverage)}）` : ""}

## 担当部署（Choice）

| 指標 | 値 |
|---|---|
| 正解率 | ${pct(s.department.accuracy)} |
| Brier score（多クラス） | ${num(s.department.brier)} |
| confidence の平均（全体） | ${num(s.department.meanConfidence, 2)} |
| confidence の平均（正解したもの） | ${num(s.department.meanConfidenceCorrect, 2)} |
| confidence の平均（外したもの） | ${num(s.department.meanConfidenceWrong, 2)} |

外したものの confidence が、正解したものより低ければ、三段の3レーンが機能する見込みがあります。

## 緊急度（Score）

| 指標 | 値 |
|---|---|
| 段階の正解率（期待値を丸めた場合） | ${pct(s.urgency.accuracy)} |
| 平均絶対誤差（期待値 − ラベル） | ${num(s.urgency.meanAbsError, 2)} |

## 限界

- 件数は ${s.n} 件です。この規模では、小さな差は偶然の範囲に収まります。傾向を見る程度にとどめてください
- ラベルは1人が付けたものです。「正解」そのものに揺れがあります（六段）
`;
  const charts = {
    [`calibration-reliability-${lang}.svg`]: reliabilityDiagram("苦情の信頼度曲線", [
      { name: lang === "ja" ? "日本語" : "English", points: s.complaint.bins },
    ]),
  };
  return { markdown: md, charts };
}

export interface LangComparison {
  ja: Summary;
  en: Summary;
  departmentAgreement: number;
  complaintAgreement: number;
  disagreements: {
    id: string;
    ja: string;
    en: string;
    gold: string;
    textJa: string;
    tags: string[];
  }[];
  byTag: { tag: string; n: number; jaAcc: number; enAcc: number }[];
  confidence: { ja: number[]; en: number[] };
}

export function compareLanguages(
  ja: Prediction[],
  en: Prediction[],
  labels: Label[],
): LangComparison {
  const enById = new Map(en.map((p) => [p.id, p]));
  const gold = new Map(labels.map((l) => [l.id, l]));
  const exampleTags = new Map(exampleLabels.items.map((l) => [l.id, l.tags]));
  const text = new Map(postsFor("ja").map((p) => [p.id, p.text]));
  const pairs = ja.flatMap((j) => {
    const e = enById.get(j.id);
    return e ? [[j, e] as const] : [];
  });
  const disagreements = pairs
    .filter(([j, e]) => j.department !== e.department)
    .map(([j, e]) => ({
      id: j.id,
      ja: j.department,
      en: e.department,
      gold: gold.get(j.id)?.department ?? "?",
      textJa: text.get(j.id) ?? "",
      tags: exampleTags.get(j.id) ?? [],
    }));
  const tags = [...new Set(exampleLabels.items.flatMap((l) => l.tags))];
  const byTag = tags.map((tag) => {
    const ids = pairs.filter(([j]) => exampleTags.get(j.id)?.includes(tag));
    const acc = (side: 0 | 1) =>
      ids.length
        ? ids.filter((pair) => {
            const p = pair[side];
            return p.complaint >= 0.5 === gold.get(p.id)?.isComplaint;
          }).length / ids.length
        : Number.NaN;
    return { tag, n: ids.length, jaAcc: acc(0), enAcc: acc(1) };
  });
  return {
    ja: summarize(ja, labels),
    en: summarize(en, labels),
    departmentAgreement:
      pairs.filter(([j, e]) => j.department === e.department).length / pairs.length,
    complaintAgreement:
      pairs.filter(([j, e]) => j.complaint >= 0.5 === e.complaint >= 0.5).length / pairs.length,
    disagreements,
    byTag,
    confidence: {
      ja: pairs.map(([j]) => j.departmentConfidence),
      en: pairs.map(([, e]) => e.departmentConfidence),
    },
  };
}

export function languageReport(c: LangComparison, labeler: string, synthetic: boolean): Report {
  const row = (name: string, f: (s: Summary) => string) => `| ${name} | ${f(c.ja)} | ${f(c.en)} |`;
  const md = `# 日本語ラボ（八段）

${HEADER}

${syntheticNotice(synthetic)}

同じ内容の投稿 ${c.ja.n} 件を、日本語と英語で同じ質問にかけた結果です。
ラベル: ${labeler === "example" ? "作者の例（`data/labels.json`）" : "あなたのラベル（`data/labels.mine.json`）"}

## 精度

| 指標 | 日本語 | 英語 |
|---|---|---|
${row("苦情の正解率", (s) => pct(s.complaint.accuracy))}
${row("苦情の Brier score", (s) => num(s.complaint.brier))}
${row("苦情の ECE", (s) => num(s.complaint.ece))}
${row("担当の正解率", (s) => pct(s.department.accuracy))}
${row("担当の Brier score", (s) => num(s.department.brier))}
${row("緊急度の正解率", (s) => pct(s.urgency.accuracy))}
${row("入力トークン", (s) => String(s.usage.input_tokens))}

![日英の比較](charts/lab-accuracy.svg)

## 日英の一致率

- 担当部署が日英で同じだった割合: **${pct(c.departmentAgreement)}**
- 苦情かどうか（0.5 で切った場合）が日英で同じだった割合: **${pct(c.complaintAgreement)}**

## confidence の分布（担当部署）

| | 日本語 | 英語 |
|---|---|---|
| 平均 | ${num(mean(c.confidence.ja), 2)} | ${num(mean(c.confidence.en), 2)} |
| 中央値 | ${num(median(c.confidence.ja), 2)} | ${num(median(c.confidence.en), 2)} |

![信頼度曲線（日英）](charts/lab-reliability.svg)

## 言い回し別の苦情の正解率

| タグ | 件数 | 日本語 | 英語 |
|---|---|---|---|
${c.byTag.map((t) => `| ${t.tag} | ${t.n} | ${pct(t.jaAcc)} | ${pct(t.enAcc)} |`).join("\n")}

件数が数件しかないタグは、1件の違いで割合が大きく動きます。

## 日英で担当が食い違った投稿

| ID | 日本語 | 英語 | ラベル | タグ | 投稿（日本語） |
|---|---|---|---|---|---|
${c.disagreements.map((d) => `| ${d.id} | ${d.ja} | ${d.en} | ${d.gold} | ${d.tags.join("・")} | ${d.textJa.replace(/\|/g, "\\|")} |`).join("\n") || "| — | — | — | — | — | 食い違いなし |"}

## 限界

- 件数は ${c.ja.n} 件です。統計的に強いことは言えません。「傾向」までにとどめてください
- 英語は日本語から訳したものです。訳し方そのものが結果に影響している可能性があります
- 悪い数字が出たときは、まず質問の設計（二段）を疑い、直して測り直してください
`;
  const charts = {
    "lab-accuracy.svg": groupedBarChart(
      "日英の正解率",
      ["苦情", "担当", "緊急度"],
      [
        {
          name: "日本語",
          values: [c.ja.complaint.accuracy, c.ja.department.accuracy, c.ja.urgency.accuracy],
        },
        {
          name: "English",
          values: [c.en.complaint.accuracy, c.en.department.accuracy, c.en.urgency.accuracy],
        },
      ],
    ),
    "lab-reliability.svg": reliabilityDiagram("苦情の信頼度曲線（日英）", [
      { name: "日本語", points: c.ja.complaint.bins },
      { name: "English", points: c.en.complaint.bins },
    ]),
  };
  return { markdown: md, charts };
}

/** 6級の各投稿の確率分布を棒グラフにする（fixture から） */
export function choiceChart(title: string, probabilities: Record<string, number>): string {
  return barChart(
    title,
    Object.entries(probabilities).map(([label, value]) => ({ label, value })),
  );
}
