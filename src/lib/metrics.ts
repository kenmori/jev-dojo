/**
 * 評価指標（六段・七段・八段）。どれも純粋関数なので APIキーなしでテストできる。
 */

export function accuracy<T>(predicted: T[], gold: T[]): number {
  assertSameLength(predicted, gold);
  if (gold.length === 0) return Number.NaN;
  return predicted.filter((p, i) => p === gold[i]).length / gold.length;
}

/** 二値の Brier score。0 が最良、確率 0.5 で当てずっぽうなら 0.25 */
export function brierBinary(probabilities: number[], outcomes: boolean[]): number {
  assertSameLength(probabilities, outcomes);
  if (outcomes.length === 0) return Number.NaN;
  const total = probabilities.reduce((acc, p, i) => acc + (p - (outcomes[i] ? 1 : 0)) ** 2, 0);
  return total / outcomes.length;
}

/** 多クラスの Brier score。全ラベルについて (確率 − 正解なら1) の2乗を足す。0 が最良、最悪 2 */
export function brierMulti(distributions: Record<string, number>[], gold: string[]): number {
  assertSameLength(distributions, gold);
  if (gold.length === 0) return Number.NaN;
  const total = distributions.reduce((acc, dist, i) => {
    const labels = new Set([...Object.keys(dist), gold[i] as string]);
    let s = 0;
    for (const label of labels) s += ((dist[label] ?? 0) - (label === gold[i] ? 1 : 0)) ** 2;
    return acc + s;
  }, 0);
  return total / gold.length;
}

export interface Bin {
  lo: number;
  hi: number;
  count: number;
  /** ビンの中の予測確率の平均 */
  meanPredicted: number;
  /** ビンの中で実際に「はい」だった割合 */
  observed: number;
}

/** 信頼度曲線の元データ。予測確率を等幅のビンに分け、実際の割合と比べる */
export function reliabilityBins(probabilities: number[], outcomes: boolean[], bins = 5): Bin[] {
  assertSameLength(probabilities, outcomes);
  const result: Bin[] = [];
  for (let b = 0; b < bins; b++) {
    const lo = b / bins;
    const hi = (b + 1) / bins;
    const idx = probabilities
      .map((p, i) => [p, i] as const)
      .filter(([p]) => (b === bins - 1 ? p >= lo && p <= hi : p >= lo && p < hi))
      .map(([, i]) => i);
    const count = idx.length;
    result.push({
      lo,
      hi,
      count,
      meanPredicted: count ? mean(idx.map((i) => probabilities[i] as number)) : Number.NaN,
      observed: count ? idx.filter((i) => outcomes[i]).length / count : Number.NaN,
    });
  }
  return result;
}

/** Expected Calibration Error。ビンごとの |予測 − 実際| を件数で重みづけ平均 */
export function expectedCalibrationError(bins: Bin[]): number {
  const total = bins.reduce((a, b) => a + b.count, 0);
  if (total === 0) return Number.NaN;
  return bins.reduce(
    (acc, b) => (b.count ? acc + (b.count / total) * Math.abs(b.meanPredicted - b.observed) : acc),
    0,
  );
}

export interface ThresholdRow {
  threshold: number;
  /** 自動で決めた割合（残りは人に回す） */
  coverage: number;
  /** 自動で決めたものの正解率 */
  accuracy: number;
  autoCount: number;
}

/**
 * Noul のしきい値を動かしたとき、自動判定の割合と正解率がどう変わるか。
 * p >= t なら「はい」、p <= 1 - t なら「いいえ」と自動で決め、その間は人に回す。
 */
export function thresholdSweep(
  probabilities: number[],
  outcomes: boolean[],
  thresholds = [0.5, 0.6, 0.7, 0.8, 0.9, 0.95],
): ThresholdRow[] {
  assertSameLength(probabilities, outcomes);
  // 1 - 0.9 は浮動小数点で 0.0999… になるので、少しだけ余裕を持たせる
  const EPS = 1e-9;
  return thresholds.map((t) => {
    const auto = probabilities
      .map((p, i) => ({ p, y: outcomes[i] as boolean }))
      .filter(({ p }) => p >= t || p <= 1 - t + EPS);
    const correct = auto.filter(({ p, y }) => p >= t === y).length;
    return {
      threshold: t,
      coverage: probabilities.length ? auto.length / probabilities.length : Number.NaN,
      accuracy: auto.length ? correct / auto.length : Number.NaN,
      autoCount: auto.length,
    };
  });
}

/** 正解率が target 以上になる最小のしきい値。なければ undefined */
export function minThresholdFor(rows: ThresholdRow[], target: number): ThresholdRow | undefined {
  return [...rows]
    .sort((a, b) => a.threshold - b.threshold)
    .find((r) => r.autoCount > 0 && r.accuracy >= target);
}

/** Cohen の κ。2人のラベルが「偶然を超えて」どれだけ一致しているか。1 で完全一致、0 で偶然と同程度 */
export function cohenKappa<T>(a: T[], b: T[]): number {
  assertSameLength(a, b);
  const n = a.length;
  if (n === 0) return Number.NaN;
  const observed = a.filter((x, i) => x === b[i]).length / n;
  const categories = new Set([...a, ...b]);
  let expected = 0;
  for (const c of categories) {
    expected += (a.filter((x) => x === c).length / n) * (b.filter((x) => x === c).length / n);
  }
  return expected === 1 ? 1 : (observed - expected) / (1 - expected);
}

/** 混同行列。confusion[正解][予測] = 件数 */
export function confusionMatrix<T extends string>(
  predicted: T[],
  gold: T[],
  labels: readonly T[],
): Record<T, Record<T, number>> {
  assertSameLength(predicted, gold);
  const m = Object.fromEntries(
    labels.map((g) => [g, Object.fromEntries(labels.map((p) => [p, 0]))]),
  ) as Record<T, Record<T, number>>;
  gold.forEach((g, i) => {
    const p = predicted[i] as T;
    if (m[g] && m[g][p] !== undefined) m[g][p] += 1;
  });
  return m;
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : Number.NaN;
}

export function median(xs: number[]): number {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

function assertSameLength(a: unknown[], b: unknown[]): void {
  if (a.length !== b.length) throw new Error(`長さが違います: ${a.length} と ${b.length}`);
}
