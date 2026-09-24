export async function runWithBudget<T, R extends { costUSD: number }>(
  items: T[],
  call: (item: T) => Promise<R>,
  options: { concurrency: number; limitUSD: number },
): Promise<{ results: (R | undefined)[]; spentUSD: number }> {
  const results: (R | undefined)[] = new Array(items.length).fill(undefined);
  let spentUSD = 0;
  let next = 0;
  const worker = async () => {
    while (next < items.length && spentUSD < options.limitUSD) {
      const i = next++;
      const r = await call(items[i] as T);
      results[i] = r;
      spentUSD += r.costUSD;
    }
  };
  await Promise.all(Array.from({ length: options.concurrency }, worker));
  return { results, spentUSD };
}
