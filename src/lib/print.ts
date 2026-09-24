import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Usage } from "@typesafe-ai/sdk";
import type { Dojo } from "./client.js";
import { describeCost } from "./cost.js";
import { t } from "./i18n.js";

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
export function footer(dojo: Dojo, usage: Usage, ...others: Dojo[]): void {
  console.log("");
  console.log(
    t(`モード: ${dojo.mode} ｜ モデル: ${dojo.model}`, `Mode: ${dojo.mode} | Model: ${dojo.model}`),
  );
  console.log(`${t("今回の実行", "This run")}: ${describeCost(usage)}`);
  if (dojo.mode === "replay") {
    const synthetic = [dojo, ...others].some((d) =>
      d.replayed.some((m) => m.source === "synthetic"),
    );
    console.log(
      synthetic
        ? t(
            "※ 記録済みの見本データ（合成）を再生しました。実APIの結果ではありません。費用は実際にはかかっていません。",
            "Note: replayed hand-made sample data (synthetic). These are NOT real API results. No cost was incurred.",
          )
        : t(
            "※ 記録済みの実APIレスポンスを再生しました。費用は実際にはかかっていません。",
            "Note: replayed recorded real API responses. No cost was incurred.",
          ),
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

/** 投稿などの引用。日本語は「」、英語は "" で囲む */
export function q(text: string): string {
  return t(`「${text}」`, `"${text}"`);
}
