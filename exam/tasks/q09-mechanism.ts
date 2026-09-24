/**
 * 第9問（奥義）答えの「形」を検査せよ。
 *
 * Score の答えについて、次をすべて満たすときだけ true を返す。
 * - probabilities の値はすべて 0〜1
 * - probabilities の合計と 1 の差が 0.02 以内（小数2桁に丸められているため）
 * - score と期待値（Σ 段階 × 確率）の差が 0.02 × (段階の数 − 1) 以内
 * - confidence は 0〜1
 */
export interface ScoreAnswer {
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export function isWellFormed(_a: ScoreAnswer): boolean {
  throw new Error("未実装: 第9問");
}
