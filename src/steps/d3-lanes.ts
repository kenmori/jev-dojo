/**
 * 三段 confidence
 * 担当部署の Choice の confidence を見て、投稿を3つのレーンに分ける。
 *   auto    … 自動で担当に振る
 *   confirm … 担当者が一度確認してから受ける
 *   human   … 本部の人が読んで決める
 *
 *   npm run d3
 */

import { exampleLabels, postsFor } from "../lib/board.js";
import type { Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { boardDojo, pct, predictAll } from "../lib/evaluate.js";
import { LANG, t } from "../lib/i18n.js";
import { DEFAULT_THRESHOLDS, route } from "../lib/lanes.js";
import { footer, q, runMain, title } from "../lib/print.js";

export {
  DEFAULT_THRESHOLDS,
  type Lane,
  type LaneThresholds,
  type Routing,
  route,
} from "../lib/lanes.js";

export async function run(dojo: Dojo) {
  const predictions = await predictAll(dojo, LANG);
  const gold = new Map(exampleLabels.items.map((l) => [l.id, l.department]));
  const text = new Map(postsFor(LANG).map((p) => [p.id, p.text]));
  const rows = predictions.map((p) => ({
    p,
    routing: route(p),
    correct: gold.get(p.id) === p.department,
    text: text.get(p.id) ?? "",
  }));
  return { rows, usage: sumUsage(...predictions.map((p) => p.usage)) };
}

async function main() {
  const dojo = boardDojo(LANG);
  const { rows, usage } = await run(dojo);

  title(t("三段 confidence", "3rd Dan: Confidence"));
  const th = DEFAULT_THRESHOLDS;
  console.log(
    t(
      `しきい値: auto ≥ ${th.auto} ／ confirm ≥ ${th.confirm} ／ それ未満は human\n`,
      `Thresholds: auto ≥ ${th.auto} / confirm ≥ ${th.confirm} / below that, human\n`,
    ),
  );
  for (const lane of ["auto", "confirm", "human"] as const) {
    const inLane = rows.filter((r) => r.routing.lane === lane);
    const acc = inLane.length ? inLane.filter((r) => r.correct).length / inLane.length : Number.NaN;
    console.log(
      t(
        `■ ${lane}: ${inLane.length} 件（作者ラベルとの一致 ${pct(acc)}）`,
        `■ ${lane}: ${inLane.length} posts (agreement with the author's labels ${pct(acc)})`,
      ),
    );
    for (const r of inLane.slice(0, 4)) {
      console.log(
        `    ${r.p.id} ${r.p.department.padEnd(10)} conf ${r.p.departmentConfidence.toFixed(2)} ${r.correct ? "○" : "×"} ${q(`${r.text.slice(0, 28)}…`)}`,
      );
    }
    if (inLane.length > 4)
      console.log(t(`    …ほか ${inLane.length - 4} 件`, `    ...and ${inLane.length - 4} more`));
    console.log("");
  }
  const notify = rows.filter((r) => r.routing.alsoNotifyKyugo);
  console.log(
    t(
      `救護にも念のため知らせる: ${notify.map((r) => r.p.id).join(", ") || "なし"}`,
      `Also notify first aid, just in case: ${notify.map((r) => r.p.id).join(", ") || "none"}`,
    ),
  );
  footer(dojo, usage);
}

runMain(import.meta.url, main);
