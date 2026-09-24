import type { Prediction } from "./evaluate.js";
import { t } from "./i18n.js";

/**
 * 3レーンの振り分け（三段）。Node の API を使わない純粋関数なので、
 * Cloudflare Workers で動く応用A のアプリからも同じものを使う。
 */
export type Lane = "auto" | "confirm" | "human";

export interface LaneThresholds {
  /** confidence がこれ以上なら自動 */
  auto: number;
  /** これ以上なら確認つき。未満は人間 */
  confirm: number;
  /** 救護の確率がこれ以上なら、1位でなくても救護にも知らせる（安全側に倒す方針） */
  safetyFloor: number;
}

/** 仮の値。七段で自分のデータから決め直す */
export const DEFAULT_THRESHOLDS: LaneThresholds = { auto: 0.7, confirm: 0.4, safetyFloor: 0.2 };

export interface Routing {
  lane: Lane;
  department: string;
  alsoNotifyKyugo: boolean;
  reason: string;
}

/** レーン分けはコードの仕事。Jev の答えは材料にすぎない */
export function route(p: Prediction, th: LaneThresholds = DEFAULT_THRESHOLDS): Routing {
  const kyugo = p.departmentProbabilities.kyugo ?? 0;
  const alsoNotifyKyugo = p.department !== "kyugo" && kyugo >= th.safetyFloor;
  if (p.departmentConfidence >= th.auto) {
    return {
      lane: "auto",
      department: p.department,
      alsoNotifyKyugo,
      reason: t("confidence が高い", "high confidence"),
    };
  }
  if (p.departmentConfidence >= th.confirm) {
    return {
      lane: "confirm",
      department: p.department,
      alsoNotifyKyugo,
      reason: t("候補はあるが迷いがある", "has a candidate but is unsure"),
    };
  }
  return {
    lane: "human",
    department: p.department,
    alsoNotifyKyugo,
    reason: t("決め手に欠ける", "no clear winner"),
  };
}
