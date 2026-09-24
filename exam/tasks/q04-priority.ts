/**
 * 第4問（四段）対応の順番を決めよ。
 *
 * 条件:
 * - 優先度 = (w.urgency × urgency/2 + w.complaint × complaint) ÷ (w.urgency + w.complaint)
 * - ただし「重大な条件」（urgency >= 1.5、または救護の確率 >= 0.2）に当てはまるものは、
 *   重みにかかわらず、当てはまらないものより必ず前に並べる
 * - 同じグループの中では優先度の高い順。返すのは id の配列
 *
 * ----
 * Q4 (4th Dan) Decide the order of handling.
 *
 * Requirements:
 * - priority = (w.urgency × urgency/2 + w.complaint × complaint) ÷ (w.urgency + w.complaint)
 * - items that meet a "serious condition" (urgency >= 1.5, or kyugo probability >= 0.2)
 *   must always come before items that do not, whatever the weights
 * - within the same group, sort by priority, highest first. Return the ids
 */
import type { Answer } from "./types.js";

export interface Weights {
  urgency: number;
  complaint: number;
}

export function order(_items: (Answer & { id: string })[], _w: Weights): string[] {
  throw new Error("未実装 / not implemented: 第4問 / Q4");
}
