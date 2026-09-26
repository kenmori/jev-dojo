/**
 * 免許皆伝の最終試験を採点する。exam/tasks の関数を書き換えてから実行する。
 *
 *   npm run exam
 *   npm run exam -- --solutions   # 解答例で採点（全問正解になることの確認用）
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { ROOT } from "../src/lib/fixtures.js";
import { t } from "../src/lib/i18n.js";
import { runMain } from "../src/lib/print.js";

const TITLES: Record<string, string> = {
  q01: t("二段 担当部署の Choice", "2nd Dan: the team Choice"),
  q02: t("初段 state の設計", "1st Dan: designing the state"),
  q03: t("三段 3レーン", "3rd Dan: three lanes"),
  q04: t("四段 優先度と重大な条件", "4th Dan: priority and serious conditions"),
  q05: t("五段 個人情報を隠す", "5th Dan: masking personal data"),
  q06: t("六段 Cohen の κ", "6th Dan: Cohen's κ"),
  q07: t("七段 しきい値を測定で決める", "7th Dan: choosing a threshold by measurement"),
  q08: t("九段 予算と同時実行数", "9th Dan: budget and concurrency"),
  q09: t("奥義 答えの形を検査する", "Okugi: checking an answer's shape"),
  q10: t("総合 投稿を仕分ける", "Final: triaging posts"),
};

export function rank(score: number, total: number): string {
  if (score === total) return t("免許皆伝", "Kaiden (full mastery)");
  if (score >= total - 2) return t("師範代", "Shihandai (assistant master)");
  if (score >= total / 2) return t("有段者", "Yudansha (black belt)");
  return t("修行中", "Shugyo-chu (in training)");
}

async function main() {
  const solutions = process.argv.includes("--solutions");
  const out = join(mkdtempSync(join(tmpdir(), "jev-exam-")), "result.json");
  spawnSync(
    "npx",
    ["vitest", "run", "--project", "exam", "--reporter=json", `--outputFile=${out}`],
    {
      cwd: ROOT,
      stdio: "ignore",
      env: { ...process.env, EXAM_SOLUTIONS: solutions ? "1" : "" },
    },
  );
  const report = JSON.parse(readFileSync(out, "utf8")) as {
    testResults: { name: string; assertionResults: { status: string }[] }[];
  };

  console.log(
    t(
      `\n=== 免許皆伝 最終試験${solutions ? "（解答例）" : ""} ===\n`,
      `\n=== Kaiden: Final exam${solutions ? " (reference solutions)" : ""} ===\n`,
    ),
  );
  let score = 0;
  const keys = Object.keys(TITLES);
  for (const key of keys) {
    const file = report.testResults.find((r) => basename(r.name).startsWith(key));
    const passed = file?.assertionResults.filter((a) => a.status === "passed").length ?? 0;
    const total = file?.assertionResults.length ?? 0;
    const ok = total > 0 && passed === total;
    if (ok) score += 1;
    console.log(
      t(
        `${ok ? "[OK]" : "[NG]"} 第${Number(key.slice(1))}問 ${TITLES[key]}（${passed}/${total}）`,
        `${ok ? "[OK]" : "[NG]"} Q${Number(key.slice(1))} ${TITLES[key]} (${passed}/${total})`,
      ),
    );
  }
  console.log(
    t(
      `\n得点: ${score} / ${keys.length} → ${rank(score, keys.length)}`,
      `\nScore: ${score} / ${keys.length} → ${rank(score, keys.length)}`,
    ),
  );
  if (score < keys.length) {
    console.log(
      t(
        "\nくわしい失敗の理由: npx vitest run --project exam",
        "\nFor details on failures: npx vitest run --project exam",
      ),
    );
  }
  process.exitCode = score === keys.length || !solutions ? 0 : 1;
}

runMain(import.meta.url, main);
