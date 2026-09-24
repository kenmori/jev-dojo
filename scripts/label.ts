/**
 * 自分でラベルを付ける（六段）。途中でやめても続きから再開できる。
 *
 *   npm run label
 */
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { DEPARTMENTS, type Department, type Label, postsFor } from "../src/lib/board.js";
import { loadMyLabels, MY_LABELS_FILE } from "../src/lib/labels.js";
import { runMain } from "../src/lib/print.js";

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const existing = loadMyLabels();
  const items: Label[] = existing?.items ?? [];
  const done = new Set(items.map((l) => l.id));
  const save = () =>
    writeFileSync(
      MY_LABELS_FILE,
      `${JSON.stringify({ labeler: "me", guide: "docs/kodan/06-dataset.md", items }, null, 2)}\n`,
    );

  console.log("ラベル付けを始めます。ガイド: docs/kodan/06-dataset.md");
  console.log("q で中断（それまでの分は保存されます）\n");
  const deptMenu = DEPARTMENTS.map((d, i) => `${i + 1}:${d}`).join(" ");

  for (const post of postsFor("ja")) {
    if (done.has(post.id)) continue;
    console.log(`\n${post.id}（残り ${postsFor("ja").length - items.length}）「${post.text}」`);

    const c = (await rl.question("苦情ですか？ y/n > ")).trim();
    if (c === "q") break;
    const d = (await rl.question(`担当は？ ${deptMenu} > `)).trim();
    if (d === "q") break;
    const u = (await rl.question("緊急度は？ 0:急がない 1:今日中 2:今すぐ > ")).trim();
    if (u === "q") break;

    const department = DEPARTMENTS[Number(d) - 1] as Department | undefined;
    const urgency = Number(u);
    if (!["y", "n"].includes(c) || !department || ![0, 1, 2].includes(urgency)) {
      console.log("入力が読めませんでした。この投稿はとばします（あとでもう一度出ます）");
      continue;
    }
    items.push({
      id: post.id,
      isComplaint: c === "y",
      department,
      urgency: urgency as 0 | 1 | 2,
      tags: [],
    });
    save();
  }
  rl.close();
  save();
  console.log(
    `\n${items.length} 件を ${MY_LABELS_FILE} に保存しました。npm run d6 で作者の例と比べられます。`,
  );
}

runMain(import.meta.url, main);
