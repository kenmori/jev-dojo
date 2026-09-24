/**
 * APIキーなしで全章のサンプルを再生する。クローン直後に最初に打つコマンド。
 *
 *   npm run demo
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT } from "./lib/fixtures.js";
import { STEPS } from "./steps/index.js";

console.log("jev-dojo demo — 記録済みのレスポンスを再生します（APIキー不要・費用ゼロ）");

for (const { file } of STEPS) {
  const result = spawnSync("npx", ["tsx", join(ROOT, "src", "steps", file)], {
    stdio: "inherit",
    env: { ...process.env, JEV_MODE: "replay" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(
  "\n次の一歩: cp .env.example .env でキーを入れて、npm run k10 で本物のAPIを叩いてみよう。",
);
