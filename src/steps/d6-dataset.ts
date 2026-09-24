/**
 * 六段 評価データセットを作る
 * データセットの中身を眺め、自分のラベル（npm run label）と作者の例がどれだけ一致するかを測る。
 * API は呼ばない。
 *
 *   npm run d6
 */
import { DEPARTMENTS, exampleLabels, type Label } from "../lib/board.js";
import { loadMyLabels } from "../lib/labels.js";
import { cohenKappa } from "../lib/metrics.js";
import { runMain, title } from "../lib/print.js";

export function countBy<T extends string | number | boolean>(items: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const x of items) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

export interface Agreement {
  n: number;
  isComplaint: number;
  department: number;
  urgency: number;
  disagreements: { id: string; field: string; mine: unknown; example: unknown }[];
}

/** 2つのラベルの一致度（Cohen の κ）と、食い違った項目 */
export function agreement(mine: Label[], example: Label[]): Agreement {
  const ex = new Map(example.map((l) => [l.id, l]));
  const pairs = mine.flatMap((m) => {
    const e = ex.get(m.id);
    return e ? [[m, e] as const] : [];
  });
  const disagreements: Agreement["disagreements"] = [];
  for (const [m, e] of pairs) {
    for (const field of ["isComplaint", "department", "urgency"] as const) {
      if (m[field] !== e[field])
        disagreements.push({ id: m.id, field, mine: m[field], example: e[field] });
    }
  }
  return {
    n: pairs.length,
    isComplaint: cohenKappa(
      pairs.map(([m]) => m.isComplaint),
      pairs.map(([, e]) => e.isComplaint),
    ),
    department: cohenKappa(
      pairs.map(([m]) => m.department),
      pairs.map(([, e]) => e.department),
    ),
    urgency: cohenKappa(
      pairs.map(([m]) => m.urgency),
      pairs.map(([, e]) => e.urgency),
    ),
    disagreements,
  };
}

async function main() {
  const items = exampleLabels.items;
  title("六段 評価データセットを作る");
  console.log(
    `件数: ${items.length}（data/posts.ja.json と data/posts.en.json は同じ内容の日英ペア）\n`,
  );

  const complaint = countBy(items.map((l) => l.isComplaint));
  console.log(`苦情: はい ${complaint.get(true) ?? 0} / いいえ ${complaint.get(false) ?? 0}`);
  const dept = countBy(items.map((l) => l.department));
  console.log(`担当: ${DEPARTMENTS.map((d) => `${d} ${dept.get(d) ?? 0}`).join(" / ")}`);
  const urg = countBy(items.map((l) => l.urgency));
  console.log(`緊急度: 0 → ${urg.get(0) ?? 0} / 1 → ${urg.get(1) ?? 0} / 2 → ${urg.get(2) ?? 0}`);
  const tags = countBy(items.flatMap((l) => l.tags));
  console.log(`タグ（八段で使う）: ${[...tags].map(([t, n]) => `${t} ${n}`).join(" / ")}\n`);

  const mine = loadMyLabels();
  if (!mine) {
    console.log("自分のラベルはまだありません。npm run label で付けてみましょう。");
    console.log(
      "作者の例（data/labels.json）は正解ではありません。あなたの判断と比べるための一つの例です。",
    );
    return;
  }
  const a = agreement(mine.items, items);
  console.log(`あなたのラベル ${mine.items.length} 件と、作者の例との一致度（Cohen の κ）`);
  console.log(
    `  苦情 ${a.isComplaint.toFixed(2)} ／ 担当 ${a.department.toFixed(2)} ／ 緊急度 ${a.urgency.toFixed(2)}`,
  );
  console.log(`  （目安: 0.8 以上でかなり一致、0.4 未満だと「何が正解か」の定義がずれている）\n`);
  console.log(`食い違い ${a.disagreements.length} 件（先頭10件）`);
  for (const d of a.disagreements.slice(0, 10)) {
    console.log(`  ${d.id} ${d.field}: あなた=${String(d.mine)} ／ 作者=${String(d.example)}`);
  }
}

runMain(import.meta.url, main);
