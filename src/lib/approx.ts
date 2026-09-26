/**
 * 確率は完全一致で比べない。
 * モデルが少し変わるだけで 0.91 が 0.93 になるのは普通のこと。
 */
import { t } from "./i18n.js";
export const DEFAULT_TOLERANCE = 0.05;

export function isClose(actual: number, expected: number, tolerance = DEFAULT_TOLERANCE): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

/** 確率の組が合計 1 になっているか（丸め誤差は許す） */
export function sumsToOne(probabilities: Record<string, number>, tolerance = 1e-6): boolean {
  const total = Object.values(probabilities).reduce((a, b) => a + b, 0);
  return Math.abs(total - 1) <= tolerance;
}

/** 一番確率が高いラベル */
export function argmax(probabilities: Record<string, number>): string {
  const entries = Object.entries(probabilities);
  const top = entries.reduce<[string, number] | undefined>(
    (best, cur) => (best === undefined || cur[1] > best[1] ? cur : best),
    undefined,
  );
  if (!top) throw new Error(t("probabilities が空です", "probabilities is empty"));
  return top[0];
}
