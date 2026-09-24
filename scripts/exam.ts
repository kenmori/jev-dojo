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
import { runMain } from "../src/lib/print.js";

const TITLES: Record<string, string> = {
  q01: "二段 担当部署の Choice",
  q02: "初段 state の設計",
  q03: "三段 3レーン",
  q04: "四段 優先度と重大な条件",
  q05: "五段 個人情報を隠す",
  q06: "六段 Cohen の κ",
  q07: "七段 しきい値を測定で決める",
  q08: "九段 予算と同時実行数",
  q09: "奥義 答えの形を検査する",
  q10: "総合 投稿を仕分ける",
};

export function rank(score: number, total: number): string {
  if (score === total) return "免許皆伝";
  if (score >= total - 2) return "師範代";
  if (score >= total / 2) return "有段者";
  return "修行中";
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

  console.log(`\n=== 免許皆伝 最終試験${solutions ? "（解答例）" : ""} ===\n`);
  let score = 0;
  const keys = Object.keys(TITLES);
  for (const key of keys) {
    const file = report.testResults.find((r) => basename(r.name).startsWith(key));
    const passed = file?.assertionResults.filter((a) => a.status === "passed").length ?? 0;
    const total = file?.assertionResults.length ?? 0;
    const ok = total > 0 && passed === total;
    if (ok) score += 1;
    console.log(
      `${ok ? "✅" : "❌"} 第${Number(key.slice(1))}問 ${TITLES[key]}（${passed}/${total}）`,
    );
  }
  console.log(`\n得点: ${score} / ${keys.length} → ${rank(score, keys.length)}`);
  if (score < keys.length) {
    console.log("\nくわしい失敗の理由: npx vitest run --project exam");
  }
  process.exitCode = score === keys.length || !solutions ? 0 : 1;
}

runMain(import.meta.url, main);
