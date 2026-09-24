/**
 * 第7問（七段）しきい値を測定で決めよ。
 *
 * p >= t なら「はい」、p <= 1 − t なら「いいえ」と自動で決め、その間は人に回す。
 * candidates の中から、自動で決めたものの正解率が target 以上になる「最小の t」を返す。
 * 自動で決めたものが0件の t は選ばない。どれも満たさなければ undefined。
 * coverage は、自動で決めた件数 ÷ 全件数。
 *
 * ----
 * Q7 (7th Dan) Choose a threshold by measurement.
 *
 * Decide "yes" automatically when p >= t, "no" when p <= 1 − t, and send the rest to a person.
 * From candidates, return the smallest t whose automatic decisions reach accuracy >= target.
 * Skip any t that decides nothing automatically. Return undefined if none qualifies.
 * coverage = number decided automatically ÷ total.
 */
export function chooseThreshold(
  _probabilities: number[],
  _outcomes: boolean[],
  _target: number,
  _candidates: number[],
): { threshold: number; coverage: number } | undefined {
  throw new Error("未実装 / not implemented: 第7問 / Q7");
}
