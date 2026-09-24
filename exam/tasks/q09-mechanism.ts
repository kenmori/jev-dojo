/**
 * 第9問（奥義）答えの「形」を検査せよ。
 *
 * Score の答えについて、次をすべて満たすときだけ true を返す。
 * - probabilities の値はすべて 0〜1
 * - probabilities の合計と 1 の差が 0.02 以内（小数2桁に丸められているため）
 * - score と期待値（Σ 段階 × 確率）の差が 0.02 × (段階の数 − 1) 以内
 * - confidence は 0〜1
 *
 * ----
 * Q9 (Okugi) Check the shape of an answer.
 *
 * For a Score answer, return true only if all of these hold:
 * - every value in probabilities is between 0 and 1
 * - the probabilities sum to within 0.02 of 1 (values are rounded to 2 decimals)
 * - score is within 0.02 × (number of levels − 1) of the expected value (Σ level × probability)
 * - confidence is between 0 and 1
 */
export interface ScoreAnswer {
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export function isWellFormed(_a: ScoreAnswer): boolean {
  throw new Error("未実装 / not implemented: 第9問 / Q9");
}
