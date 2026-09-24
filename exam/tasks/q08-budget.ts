/**
 * 第8問（九段）予算と同時実行数を守って、全件を処理せよ。
 *
 * 条件:
 * - 同時に実行する call は最大 concurrency 個
 * - call の結果の costUSD を足していき、合計が limitUSD 以上になったら、それ以降の item は呼ばない
 *   （すでに走っているものは待ってよい）
 * - 返り値: 処理した item の結果（入力と同じ順番。呼ばなかったものは undefined）と、使った金額の合計
 */
export async function runWithBudget<T, R extends { costUSD: number }>(
  _items: T[],
  _call: (item: T) => Promise<R>,
  _options: { concurrency: number; limitUSD: number },
): Promise<{ results: (R | undefined)[]; spentUSD: number }> {
  throw new Error("未実装: 第8問");
}
