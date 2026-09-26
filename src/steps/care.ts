/**
 * 「救護が要るか」を、担当の Choice ではなく、別の Noul で聞く（書籍 第 12 章「もう一歩」）。
 *
 * 公式は、Choice は「どれが一番近いか」を決める相対的な答えで、
 * 「ある条件が当てはまるか」には Noul を 1 つずつ使うよう勧めている（Jev 1.13 jaggedness、SKILL.md）。
 * 60 件の投稿に Noul を 1 つだけ聞き、担当の Choice で決めた「先頭に出す投稿」と比べる。
 *
 *   npm run care                      # 記録済みの答えで表示
 *   JEV_MODE=record npm run care      # 本物の API で記録し直す（API キーが必要。60 回、約 $0.001）
 */
import { noul } from "@typesafe-ai/sdk";
import { exampleLabels, postsFor } from "../lib/board.js";
import { createDojo, type Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { boardDojo, type Prediction, predictAll } from "../lib/evaluate.js";
import { footer, runMain, title } from "../lib/print.js";

export const STEP = "d4-care";

/** 担当とは別に、「人の安全や体調にかかわるか」を 1 つの Noul で聞く */
export const needsCare = noul("この投稿は、人の安全や体調にかかわる内容ですか？", {
  true: "けが、体調不良、迷子、倒れている人、事故やその恐れがある",
  false: "安全や体調にはかかわらない",
});

/** 先頭に出すかどうか。急ぎ度が高く、かつ救護が要るもの */
export const URGENT = 1.5;
export const CARE_MIN = 0.5;

export interface CareRow {
  id: string;
  text: string;
  needsCare: number;
  department: string;
  kyugo: number;
  urgency: number;
  /** 第 12 章の書き方: 担当が救護で、急ぎ度が高い */
  byChoice: boolean;
  /** 公式の勧め: 救護が要るかを Noul で聞き、急ぎ度が高い */
  byNoul: boolean;
  labelUrgency: number | undefined;
}

export async function run(careDojo: Dojo, board: Dojo) {
  const predictions: Prediction[] = await predictAll(board, "ja");
  const posts = postsFor("ja");
  const rows: CareRow[] = [];
  const usages = [];
  for (const p of predictions) {
    const post = posts.find((x) => x.id === p.id);
    if (!post) continue;
    const r = await careDojo.client.systemOne({ state: post.text, questions: { needsCare } });
    usages.push(r.usage);
    const care = r.answers.needsCare.noul;
    rows.push({
      id: p.id,
      text: post.text,
      needsCare: care,
      department: p.department,
      kyugo: p.departmentProbabilities.kyugo ?? 0,
      urgency: p.urgency,
      byChoice: p.department === "kyugo" && p.urgency >= URGENT,
      byNoul: care >= CARE_MIN && p.urgency >= URGENT,
      labelUrgency: exampleLabels.items.find((l) => l.id === p.id)?.urgency,
    });
  }
  return { rows, usage: sumUsage(...usages) };
}

const fmt = (n: number) => n.toFixed(2);
const short = (s: string) => (s.length > 28 ? `${s.slice(0, 28)}…` : s);

async function main() {
  // 60 件の担当・急ぎ度は、第 10 章の記録を再生して使う（ここでは録り直さない）
  const board = boardDojo("ja", { mode: "replay" });
  const careDojo = createDojo(STEP);
  title("救護が要るかを Noul で聞く");
  const { rows, usage } = await run(careDojo, board);

  const choiceIds = rows.filter((r) => r.byChoice).map((r) => r.id);
  const noulIds = rows.filter((r) => r.byNoul).map((r) => r.id);
  console.log(
    `担当の Choice で先頭に出す（担当が救護 かつ 急ぎ度 ≥ ${URGENT}）: ${choiceIds.length} 件`,
  );
  console.log(`  ${choiceIds.join(" ")}`);
  console.log(
    `Noul で先頭に出す（救護が要る ≥ ${CARE_MIN} かつ 急ぎ度 ≥ ${URGENT}）: ${noulIds.length} 件`,
  );
  console.log(`  ${noulIds.join(" ")}`);

  const diff = rows.filter((r) => r.byChoice !== r.byNoul);
  console.log(`\n▼ 2 つの決め方で結果が分かれた投稿: ${diff.length} 件`);
  for (const r of diff) {
    console.log(
      `${r.id} ${r.byNoul ? "Noul だけ先頭" : "Choice だけ先頭"}  救護が要る ${fmt(r.needsCare)}  担当 ${r.department}（救護の確率 ${fmt(r.kyugo)}）  急ぎ度 ${fmt(r.urgency)}  「${short(r.text)}」`,
    );
  }

  console.log("\n▼ 救護が要る確率が 0.5 以上の投稿");
  for (const r of rows
    .filter((x) => x.needsCare >= CARE_MIN)
    .sort((a, b) => b.needsCare - a.needsCare)) {
    console.log(
      `${r.id} ${fmt(r.needsCare)}  担当 ${r.department}（救護の確率 ${fmt(r.kyugo)}）  急ぎ度 ${fmt(r.urgency)}  作者ラベルの急ぎ度 ${r.labelUrgency ?? "-"}  「${short(r.text)}」`,
    );
  }
  footer(careDojo, usage, board);
}

runMain(import.meta.url, main);
