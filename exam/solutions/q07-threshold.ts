export function chooseThreshold(
  probabilities: number[],
  outcomes: boolean[],
  target: number,
  candidates: number[],
): { threshold: number; coverage: number } | undefined {
  const EPS = 1e-9;
  for (const t of [...candidates].sort((a, b) => a - b)) {
    const auto = probabilities
      .map((p, i) => ({ p, y: outcomes[i] }))
      .filter(({ p }) => p >= t || p <= 1 - t + EPS);
    if (auto.length === 0) continue;
    const accuracy = auto.filter(({ p, y }) => p >= t === y).length / auto.length;
    if (accuracy >= target) return { threshold: t, coverage: auto.length / probabilities.length };
  }
  return undefined;
}
