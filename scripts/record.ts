/**
 * fixture を本物の API で録り直す。モデル更新時の差分が git diff で見える（plan.md §8）。
 *
 *   npm run record            # 全章
 *   npm run record k07        # 1章だけ（package.json の script 名）
 */
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { loadDotEnv } from "../src/lib/env.js";
import { FIXTURES_DIR, ROOT } from "../src/lib/fixtures.js";
import { STEPS } from "../src/steps/index.js";

loadDotEnv();
if (!process.env.TYPESAFE_API_KEY?.trim()) {
  console.error("録り直しには TYPESAFE_API_KEY が必要です（.env に設定してください）");
  process.exit(1);
}

const only = process.argv[2];
const targets = STEPS.filter((s) => !only || s.script === only);
if (targets.length === 0) {
  console.error(`不明な章: ${only}（候補: ${STEPS.map((s) => s.script).join(", ")}）`);
  process.exit(1);
}
const hasClaude = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

for (const { script, file, dirs, needsClaude } of targets) {
  if (needsClaude && !hasClaude) {
    console.log(`○ ${script} は ANTHROPIC_API_KEY がないのでとばします`);
    continue;
  }
  // 古い fixture が残らないよう、章ごとに消してから録る
  for (const dir of dirs) rmSync(join(FIXTURES_DIR, dir), { recursive: true, force: true });
  console.log(`● ${script} を録音中…`);
  const result = spawnSync("npx", ["tsx", join(ROOT, "src", "steps", file)], {
    stdio: "inherit",
    env: { ...process.env, JEV_MODE: "record" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(
  "\n完了。git diff fixtures/ で前回との違いを確認し、npm run reports でレポートを作り直してください。",
);
