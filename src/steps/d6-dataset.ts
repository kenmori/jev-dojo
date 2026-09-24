/**
 * 六段 評価データセットを作る
 * データセットの中身を眺め、自分のラベル（npm run label）と作者の例がどれだけ一致するかを測る。
 * API は呼ばない。
 *
 *   npm run d6
 */

import { DEPARTMENTS, exampleLabels, type Label, tagLabel } from "../lib/board.js";
import { t } from "../lib/i18n.js";
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
  title(t("六段 評価データセットを作る", "6th Dan: Build an evaluation dataset"));
  console.log(
    t(
      `件数: ${items.length}（data/posts.ja.json と data/posts.en.json は同じ内容の日英ペア）\n`,
      `Items: ${items.length} (data/posts.ja.json and data/posts.en.json are the same posts in Japanese and English)\n`,
    ),
  );

  const complaint = countBy(items.map((l) => l.isComplaint));
  console.log(
    t(
      `苦情: はい ${complaint.get(true) ?? 0} / いいえ ${complaint.get(false) ?? 0}`,
      `Complaint: yes ${complaint.get(true) ?? 0} / no ${complaint.get(false) ?? 0}`,
    ),
  );
  const dept = countBy(items.map((l) => l.department));
  const deptList = DEPARTMENTS.map((d) => `${d} ${dept.get(d) ?? 0}`).join(" / ");
  console.log(`${t("担当", "Team")}: ${deptList}`);
  const urg = countBy(items.map((l) => l.urgency));
  console.log(
    t(
      `緊急度: 0 → ${urg.get(0) ?? 0} / 1 → ${urg.get(1) ?? 0} / 2 → ${urg.get(2) ?? 0}`,
      `Urgency: 0 → ${urg.get(0) ?? 0} / 1 → ${urg.get(1) ?? 0} / 2 → ${urg.get(2) ?? 0}`,
    ),
  );
  const tags = countBy(items.flatMap((l) => l.tags));
  const tagList = [...tags].map(([tag, n]) => `${tagLabel(tag)} ${n}`).join(" / ");
  console.log(`${t("タグ（八段で使う）", "Tags (used in the 8th Dan)")}: ${tagList}\n`);

  const mine = loadMyLabels();
  if (!mine) {
    console.log(
      t(
        "自分のラベルはまだありません。npm run label で付けてみましょう。",
        "You have no labels yet. Try npm run label.",
      ),
    );
    console.log(
      t(
        "作者の例（data/labels.json）は正解ではありません。あなたの判断と比べるための一つの例です。",
        "The author's example (data/labels.json) is not the ground truth. It is one example to compare your judgment against.",
      ),
    );
    return;
  }
  const a = agreement(mine.items, items);
  console.log(
    t(
      `あなたのラベル ${mine.items.length} 件と、作者の例との一致度（Cohen の κ）`,
      `Agreement between your ${mine.items.length} labels and the author's example (Cohen's κ)`,
    ),
  );
  console.log(
    t(
      `  苦情 ${a.isComplaint.toFixed(2)} ／ 担当 ${a.department.toFixed(2)} ／ 緊急度 ${a.urgency.toFixed(2)}`,
      `  complaint ${a.isComplaint.toFixed(2)} / team ${a.department.toFixed(2)} / urgency ${a.urgency.toFixed(2)}`,
    ),
  );
  console.log(
    t(
      `  （目安: 0.8 以上でかなり一致、0.4 未満だと「何が正解か」の定義がずれている）\n`,
      `  (Rule of thumb: 0.8+ is strong agreement; below 0.4 means your definitions of "correct" differ)\n`,
    ),
  );
  console.log(
    t(
      `食い違い ${a.disagreements.length} 件（先頭10件）`,
      `${a.disagreements.length} disagreements (first 10)`,
    ),
  );
  for (const d of a.disagreements.slice(0, 10)) {
    console.log(
      t(
        `  ${d.id} ${d.field}: あなた=${String(d.mine)} ／ 作者=${String(d.example)}`,
        `  ${d.id} ${d.field}: you=${String(d.mine)} / author=${String(d.example)}`,
      ),
    );
  }
}

runMain(import.meta.url, main);
