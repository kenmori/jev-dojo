export function kappa<T>(a: T[], b: T[]): number {
  if (a.length !== b.length) throw new Error("長さが違います");
  const n = a.length;
  if (n === 0) return Number.NaN;
  const observed = a.filter((x, i) => x === b[i]).length / n;
  let expected = 0;
  for (const c of new Set([...a, ...b])) {
    expected += (a.filter((x) => x === c).length / n) * (b.filter((x) => x === c).length / n);
  }
  return expected === 1 ? 1 : (observed - expected) / (1 - expected);
}
