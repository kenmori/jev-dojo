/**
 * data/facts.json のモデル情報を実APIと照合する（plan.md §7.3）。
 *
 * 1. GET /v1/models に固定モデル（pinned）があるか → 無ければ失敗
 * 2. jev-latest が今どのバージョンを指しているか → pinned と違えば「新バージョン」として報告
 *
 *   npm run facts:verify
 *
 * GitHub Actions では $GITHUB_OUTPUT に pinned_ok / latest / latest_changed を書き出す。
 */
import { appendFileSync } from "node:fs";
import { noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { loadDotEnv } from "../src/lib/env.js";
import { facts } from "../src/lib/facts.js";
import { runMain } from "../src/lib/print.js";

async function main() {
  loadDotEnv();
  const client = new TypeSafeClient();

  const models = await client.models.list();
  const names = models.map((m) => m.name);
  const pinnedOk = names.includes(facts.model.pinned);
  console.log(`利用できるモデル: ${names.join(", ")}`);
  console.log(`${pinnedOk ? "✅" : "❌"} 固定モデル ${facts.model.pinned}`);

  // エイリアスの行き先は、最小のリクエストを送って応答の model を見るのが確実
  const probe = await client.systemOne({
    model: "jev-latest",
    state: "ok",
    questions: { ok: noul("Is this text non-empty?") },
  });
  const latest = probe.model;
  const latestChanged = latest !== facts.model.pinned;
  console.log(`${latestChanged ? "🆕" : "✅"} jev-latest → ${latest}`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `pinned_ok=${pinnedOk}\nlatest=${latest}\nlatest_changed=${latestChanged}\n`,
    );
  }
  if (!pinnedOk) process.exitCode = 1;
}

runMain(import.meta.url, main);
