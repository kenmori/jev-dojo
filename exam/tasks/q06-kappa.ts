/**
 * 第6問（六段）2人のラベルの一致度 Cohen の κ を計算せよ。
 *
 * κ = (観測された一致率 − 偶然の一致率) ÷ (1 − 偶然の一致率)
 * 偶然の一致率 = Σ_カテゴリ (Aがそのカテゴリを付けた割合 × Bがそのカテゴリを付けた割合)
 * 偶然の一致率が 1 のときは 1 を返す。長さが違えば例外を投げる。
 *
 * ----
 * Q6 (6th Dan) Compute Cohen's κ between two labelers.
 *
 * κ = (observed agreement − chance agreement) ÷ (1 − chance agreement)
 * chance agreement = Σ over categories (share A gave that category × share B gave it)
 * Return 1 when chance agreement is 1. Throw if the lengths differ.
 */
export function kappa<T>(_a: T[], _b: T[]): number {
  throw new Error("未実装 / not implemented: 第6問 / Q6");
}
