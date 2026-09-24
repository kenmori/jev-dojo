/**
 * 第10問（総合）投稿を仕分けよ。
 *
 * createDojo(boardStep(LANG)) で記録済みの応答を使い（テストでは replay で動く）、
 * 教材の本番用の質問（src/lib/board.ts の boardQuestions）で投稿を判定し、次を返す。
 *
 * - department: Jev が選んだ担当
 * - lane: 第3問と同じ規則（auto 0.7 / confirm 0.4 / safetyFloor 0.2）
 * - callNow: 担当が kyugo、または緊急度（score）が 1.5 以上なら true
 */
import type { Dojo } from "../../src/lib/client.js";
import type { Lane } from "./types.js";

export async function triage(
  _dojo: Dojo,
  _text: string,
): Promise<{ department: string; lane: Lane; callNow: boolean }> {
  throw new Error("未実装 / not implemented: 第10問 / Q10");
}
