/**
 * 第3問（三段）3レーンに振り分けよ。
 *
 * 条件:
 * - confidence >= auto なら "auto"、>= confirm なら "confirm"、それ未満は "human"
 * - ただし、救護（kyugo）の確率が safetyFloor 以上なら、1位でなくても notifyKyugo を true にする
 *   （department が kyugo のときは false）
 */
import type { Answer, Lane } from "./types.js";

export interface Thresholds {
  auto: number;
  confirm: number;
  safetyFloor: number;
}

export function laneFor(_a: Answer, _t: Thresholds): { lane: Lane; notifyKyugo: boolean } {
  throw new Error("未実装: 第3問");
}
