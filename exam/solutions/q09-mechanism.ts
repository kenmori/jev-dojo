export interface ScoreAnswer {
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export function isWellFormed(a: ScoreAnswer): boolean {
  const entries = Object.entries(a.probabilities);
  const ps = entries.map(([, p]) => p);
  const inRange = (x: number) => x >= 0 && x <= 1;
  const sum = ps.reduce((x, y) => x + y, 0);
  const ev = entries.reduce((acc, [level, p]) => acc + Number(level) * p, 0);
  return (
    ps.every(inRange) &&
    Math.abs(sum - 1) <= 0.02 &&
    Math.abs(a.score - ev) <= 0.02 * (ps.length - 1) &&
    inRange(a.confidence)
  );
}
