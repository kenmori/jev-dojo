import type { Answer, Lane } from "./types.js";

export interface Thresholds {
  auto: number;
  confirm: number;
  safetyFloor: number;
}

export function laneFor(a: Answer, t: Thresholds): { lane: Lane; notifyKyugo: boolean } {
  const notifyKyugo = a.department !== "kyugo" && (a.probabilities.kyugo ?? 0) >= t.safetyFloor;
  const lane: Lane =
    a.confidence >= t.auto ? "auto" : a.confidence >= t.confirm ? "confirm" : "human";
  return { lane, notifyKyugo };
}
