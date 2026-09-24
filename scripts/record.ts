/**
 * fixture を本物の API で録り直す。モデル更新時の差分が git diff で見える（plan.md §8）。
 *
 *   npm run record            # 登録済みの全サンプル
 *   npm run record k07        # 1章だけ（package.json の script 名）
 */

import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { loadDotEnv } from "../src/lib/env.js";
import { FIXTURES_DIR, ROOT, stepDir } from "../src/lib/fixtures.js";
import { t } from "../src/lib/i18n.js";
import { STEPS } from "../src/steps/index.js";

loadDotEnv();
if (!process.env.TYPESAFE_API_KEY?.trim()) {
  console.error(
    t(
      "録り直しには TYPESAFE_API_KEY が必要です（.env に設定してください）",
      "Recording requires TYPESAFE_API_KEY (set it in .env)",
    ),
  );
  process.exit(1);
}

const only = process.argv[2];
const targets = STEPS.filter((s) => !only || s.script === only);
if (targets.length === 0) {
  console.error(
    t(
      `不明な章: ${only}（候補: ${STEPS.map((s) => s.script).join(", ")}）`,
      `Unknown chapter: ${only} (choose from: ${STEPS.map((s) => s.script).join(", ")})`,
    ),
  );
  process.exit(1);
}
const hasClaude = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

for (const { script, file, dirs, needsClaude } of targets) {
  if (needsClaude && !hasClaude) {
    console.log(
      t(
        `○ ${script} は ANTHROPIC_API_KEY がないのでとばします`,
        `○ skipping ${script}: no ANTHROPIC_API_KEY`,
      ),
    );
    continue;
  }
  // dirs が空の章は、ほかの章（八段）が録った共有の fixture を使う。
  // ここで録り直すと共有の fixture が上書きされ、先に表示した章の結果と再生の結果がずれるので、再生で表示だけする
  const shared = dirs.length === 0;
  // 古い fixture が残らないよう、章ごとに消してから録る
  for (const dir of dirs)
    rmSync(join(FIXTURES_DIR, stepDir(dir)), { recursive: true, force: true });
  console.log(
    shared
      ? t(
          `● ${script} は共有の記録を再生します（録り直さない）`,
          `● ${script} replays the shared recordings (not re-recorded)`,
        )
      : t(`● ${script} を録音中…`, `● recording ${script}...`),
  );
  const result = spawnSync("npx", ["tsx", join(ROOT, "src", "steps", file)], {
    stdio: "inherit",
    env: { ...process.env, JEV_MODE: shared ? "replay" : "record" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(
  t(
    "\n完了。git diff fixtures/ で前回との違いを確認し、npm run reports でレポートを作り直してください。",
    "\nDone. Check the changes with git diff fixtures/, then rebuild the reports with npm run reports.",
  ),
);
