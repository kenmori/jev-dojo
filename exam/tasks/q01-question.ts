/**
 * 第1問（二段）担当部署の Choice を定義せよ。
 *
 * 条件:
 * - instructions は空でない文字列
 * - 選択肢（criteria）は honbu / yatai / kotsu / otoshimono / kyugo と、
 *   どれにも当てはまらないときの逃げ道 sonota の6つ
 * - すべての選択肢に、空でない説明を付ける
 */
import { type ChoiceQuestion, choice } from "@typesafe-ai/sdk";

export function departmentQuestion(): ChoiceQuestion {
  void choice;
  throw new Error("未実装: 第1問");
}
