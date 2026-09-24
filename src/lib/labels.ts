import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { exampleLabels, type LabelSet } from "./board.js";
import { ROOT } from "./fixtures.js";

export const MY_LABELS_FILE = join(ROOT, "data", "labels.mine.json");

/** 自分のラベル（npm run label で作る）。なければ undefined */
export function loadMyLabels(): LabelSet | undefined {
  if (!existsSync(MY_LABELS_FILE)) return undefined;
  return JSON.parse(readFileSync(MY_LABELS_FILE, "utf8")) as LabelSet;
}

/** 評価に使うラベル。自分のラベルが全件そろっていればそれを、なければ作者の例を使う */
export function labelsForEval(): LabelSet {
  const mine = loadMyLabels();
  if (mine && mine.items.length >= exampleLabels.items.length) return mine;
  return exampleLabels;
}
