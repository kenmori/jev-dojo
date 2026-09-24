import type { Answer } from "./types.js";

export interface Weights {
  urgency: number;
  complaint: number;
}

const serious = (a: Answer) => a.urgency >= 1.5 || (a.probabilities.kyugo ?? 0) >= 0.2;

export function order(items: (Answer & { id: string })[], w: Weights): string[] {
  const score = (a: Answer) =>
    (w.urgency * (a.urgency / 2) + w.complaint * a.complaint) / (w.urgency + w.complaint);
  return [...items]
    .sort((x, y) => Number(serious(y)) - Number(serious(x)) || score(y) - score(x))
    .map((x) => x.id);
}
