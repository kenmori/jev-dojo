/**
 * APIキーなしで、src/steps/index.ts に登録した17章分のサンプルを続けて再生する。
 * クローン直後に最初に打つコマンド。9級・奥義・皆伝・応用A は別のコマンド、応用C・D は読み物。
 *
 *   npm run demo
 */

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT } from "./lib/fixtures.js";
import { t } from "./lib/i18n.js";
import { stepsForLang } from "./steps/index.js";

console.log(
  t(
    "jev-dojo demo — 記録済みのレスポンスを再生します（APIキー不要・費用ゼロ）",
    "jev-dojo demo — replaying recorded responses (no API key needed, zero cost)",
  ),
);

for (const { file } of stepsForLang()) {
  const result = spawnSync("npx", ["tsx", join(ROOT, "src", "steps", file)], {
    stdio: "inherit",
    env: { ...process.env, JEV_MODE: "replay" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(
  t(
    "\n次の一歩: cp .env.example .env でキーを入れて、npm run k10 で本物のAPIを叩いてみよう。",
    "\nNext step: cp .env.example .env, add your key, then call the real API with npm run k10.",
  ),
);
