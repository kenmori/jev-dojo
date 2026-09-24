import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Usage } from "@typesafe-ai/sdk";
import type { Dojo } from "./client.js";
import { describeCost } from "./cost.js";

export function title(text: string): void {
  console.log(`\n=== ${text} ===\n`);
}

/** 確率をターミナル上の棒グラフにする。例: ███████░░░ 0.72 */
export function bar(probability: number, width = 20): string {
  const clamped = Math.min(1, Math.max(0, probability));
  const filled = Math.round(clamped * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)} ${clamped.toFixed(2)}`;
}

export function printProbabilities(probabilities: Record<string, number>, indent = "  "): void {
  const width = Math.max(...Object.keys(probabilities).map((k) => k.length));
  for (const [label, p] of Object.entries(probabilities)) {
    console.log(`${indent}${label.padEnd(width)}  ${bar(p)}`);
  }
}

/** 実行モードと費用を表示する。全サンプル共通のフッター */
export function footer(dojo: Dojo, usage: Usage): void {
  console.log("");
  console.log(`モード: ${dojo.mode} ｜ モデル: ${dojo.model}`);
  console.log(`今回の実行: ${describeCost(usage)}`);
  if (dojo.mode === "replay") {
    const synthetic = dojo.replayed.some((m) => m.source === "synthetic");
    console.log(
      synthetic
        ? "※ 記録済みの見本データ（合成）を再生しました。実APIの結果ではありません。費用は実際にはかかっていません。"
        : "※ 記録済みの実APIレスポンスを再生しました。費用は実際にはかかっていません。",
    );
  }
}

/** `tsx src/steps/xxx.ts` で直接実行されたときだけ main を動かす */
export function isMain(importMetaUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return importMetaUrl === pathToFileURL(resolve(entry)).href;
}

export function runMain(importMetaUrl: string, main: () => Promise<void>): void {
  if (!isMain(importMetaUrl)) return;
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
