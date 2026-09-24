/**
 * 第1問（二段）担当部署の Choice を定義せよ。
 *
 * 条件:
 * - instructions は空でない文字列
 * - 選択肢（criteria）は honbu / yatai / kotsu / otoshimono / kyugo と、
 *   どれにも当てはまらないときの逃げ道 sonota の6つ
 * - すべての選択肢に、空でない説明を付ける
 *
 * ----
 * Q1 (2nd Dan) Define the team Choice.
 *
 * Requirements:
 * - instructions is a non-empty string
 * - the options (criteria) are honbu / yatai / kotsu / otoshimono / kyugo, plus
 *   sonota as the "none of the above" option: six in total
 * - every option has a non-empty description
 */
import { type ChoiceQuestion, choice } from "@typesafe-ai/sdk";

export function departmentQuestion(): ChoiceQuestion {
  void choice;
  throw new Error("未実装 / not implemented: 第1問 / Q1");
}
