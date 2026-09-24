/**
 * 奥義（仕組み）で使う計算。Jev の答えの「形」について、記録した応答から確かめられることを関数にする。
 * どれも純粋関数なので、APIキーなしでテストできる。
 */

/** シャノンエントロピー（自然対数）。分布が平らなほど大きい */
export function entropy(probabilities: number[]): number {
  return -probabilities.filter((p) => p > 0).reduce((acc, p) => acc + p * Math.log(p), 0);
}

/**
 * 分布の集中度の一例: 1 − 正規化エントロピー。一か所に集まっていれば 1、完全に平らなら 0。
 * 注意: Jev の confidence がこの式で計算されているとは公式に書かれていない。比較のための物差し。
 */
export function concentration(probabilities: number[]): number {
  if (probabilities.length < 2) return 1;
  return 1 - entropy(probabilities) / Math.log(probabilities.length);
}

/** Score の期待値: Σ 段階 × その段階の確率 */
export function expectedScore(probabilities: Record<string, number>): number {
  return Object.entries(probabilities).reduce((acc, [level, p]) => acc + Number(level) * p, 0);
}

/** 小数何桁に丸められているか（0.83 → 2、0.5 → 1） */
export function decimals(x: number): number {
  const s = String(x);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
}

export interface Invariant {
  name: string;
  ok: boolean;
  detail: string;
}

type AnyAnswer =
  | { type: "noul"; noul: number }
  | { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> }
  | {
      type: "score";
      score: number;
      confidence: number;
      probabilities: Record<string, number>;
      legend?: Record<string, unknown>;
    };

const SUM_TOLERANCE = 0.02; // 各値が小数2桁に丸められているため、合計は 1 から少しずれうる

/** 1つの答えについて、「形」として成り立っているはずの性質を調べる */
export function checkAnswer(answer: AnyAnswer): Invariant[] {
  const out: Invariant[] = [];
  const inRange = (x: number) => x >= 0 && x <= 1;
  if (answer.type === "noul") {
    out.push({ name: "noul は 0〜1", ok: inRange(answer.noul), detail: String(answer.noul) });
    return out;
  }
  const ps = Object.values(answer.probabilities);
  const sum = ps.reduce((a, b) => a + b, 0);
  out.push({ name: "確率はすべて 0〜1", ok: ps.every(inRange), detail: ps.join(", ") });
  out.push({
    name: "確率の合計はほぼ 1",
    ok: Math.abs(sum - 1) <= SUM_TOLERANCE,
    detail: sum.toFixed(3),
  });
  out.push({
    name: "confidence は 0〜1",
    ok: inRange(answer.confidence),
    detail: String(answer.confidence),
  });
  if (answer.type === "choice") {
    const max = Math.max(...ps);
    out.push({
      name: "choice は確率が最大のラベル",
      ok: answer.probabilities[answer.choice] === max,
      detail: `${answer.choice}=${answer.probabilities[answer.choice]} / 最大 ${max}`,
    });
  } else {
    const ev = expectedScore(answer.probabilities);
    out.push({
      name: "score は確率の期待値",
      ok: Math.abs(answer.score - ev) <= SUM_TOLERANCE * (ps.length - 1),
      detail: `score=${answer.score} / 期待値 ${ev.toFixed(3)}`,
    });
  }
  return out;
}

/** 2つの数列の相関係数（ピアソン）。confidence と集中度の関係を見るのに使う */
export function correlation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n !== ys.length || n < 2) return Number.NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] as number) - mx;
    const dy = (ys[i] as number) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy);
}
