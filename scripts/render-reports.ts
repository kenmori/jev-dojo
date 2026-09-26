/**
 * fixture を再生して、七段・八段のレポートと図を作る。
 * 図に数値を焼き込まず、fixture を録り直したらここで作り直す。
 *
 *   npm run reports            # 生成
 *   npm run reports -- --check # 最新か確認するだけ（CI 用）
 *
 * ラベルは常に作者の例（data/labels.json）を使う。自分のラベルでの結果は npm run d7 / d8 で見る。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { exampleLabels } from "../src/lib/board.js";
import { createDojo } from "../src/lib/client.js";
import { boardDojo, predictAll, summarize } from "../src/lib/evaluate.js";
import { ROOT } from "../src/lib/fixtures.js";
import { LANG, t } from "../src/lib/i18n.js";
import { runMain } from "../src/lib/print.js";
import {
  calibrationReport,
  choiceChart,
  compareLanguages,
  languageReport,
} from "../src/lib/reports.js";
import * as k06 from "../src/steps/k06-choice.js";

const OUT = join(ROOT, "docs", "_generated");

async function build(): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const ja = boardDojo("ja", { mode: "replay" });
  const en = boardDojo("en", { mode: "replay" });
  const pja = await predictAll(ja, "ja");
  const pen = await predictAll(en, "en");
  const synthetic = [...ja.replayed, ...en.replayed].some((m) => m.source === "synthetic");

  // 英語モードでは、英語の投稿で測ったレポートを .en.md として書き出す
  const ext = LANG === "ja" ? ".md" : ".en.md";
  const own = LANG === "ja" ? pja : pen;
  const cal = calibrationReport(summarize(own, exampleLabels.items), LANG, "example", synthetic);
  files.set(`calibration${ext}`, cal.markdown);
  for (const [name, svg] of Object.entries(cal.charts)) files.set(`charts/${name}`, svg);

  const lab = languageReport(compareLanguages(pja, pen, exampleLabels.items), "example", synthetic);
  files.set(`lab-ja-en${ext}`, lab.markdown);
  for (const [name, svg] of Object.entries(lab.charts)) files.set(`charts/${name}`, svg);

  const k06Dojo = createDojo(k06.STEP, { mode: "replay" });
  for (const row of await k06.run(k06Dojo)) {
    files.set(
      `charts/k06-${row.post.id}${LANG === "ja" ? "" : "-en"}.svg`,
      choiceChart(
        t(`${row.post.id} の担当の確率`, `${row.post.id}: probability per team`),
        row.answer.probabilities,
      ),
    );
  }
  return files;
}

async function main() {
  const check = process.argv.includes("--check");
  const files = await build();
  const stale = [...files].filter(([name, content]) => {
    const file = join(OUT, name);
    return !existsSync(file) || readFileSync(file, "utf8") !== content;
  });
  if (check) {
    if (stale.length > 0) {
      console.error(
        `レポートが古くなっています。npm run reports を実行してください:\n${stale.map(([n]) => `  - docs/_generated/${n}`).join("\n")}`,
      );
      process.exitCode = 1;
    }
    return;
  }
  mkdirSync(join(OUT, "charts"), { recursive: true });
  for (const [name, content] of stale) writeFileSync(join(OUT, name), content);
  console.log(
    stale.length === 0
      ? "変更なし"
      : `更新: ${stale.map(([n]) => relative(ROOT, join(OUT, n))).join(", ")}`,
  );
}

runMain(import.meta.url, main);
