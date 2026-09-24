/**
 * 自分でラベルを付ける（六段）。途中でやめても続きから再開できる。
 *
 *   npm run label
 */
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { DEPARTMENTS, type Department, type Label, postsFor } from "../src/lib/board.js";
import { LANG, t } from "../src/lib/i18n.js";
import { loadMyLabels, MY_LABELS_FILE } from "../src/lib/labels.js";
import { q, runMain } from "../src/lib/print.js";

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

  console.log(
    t(
      "ラベル付けを始めます。ガイド: docs/kodan/06-dataset.md",
      "Starting labeling. Guide: docs/en/kodan/06-dataset.md",
    ),
  );
  console.log(
    t("q で中断（それまでの分は保存されます）\n", "Press q to stop (everything so far is saved)\n"),
  );
  const deptMenu = DEPARTMENTS.map((d, i) => `${i + 1}:${d}`).join(" ");

  for (const post of postsFor(LANG)) {
    if (done.has(post.id)) continue;
    const remaining = postsFor(LANG).length - items.length;
    console.log(
      t(
        `\n${post.id}（残り ${remaining}）${q(post.text)}`,
        `\n${post.id} (${remaining} left) ${q(post.text)}`,
      ),
    );

    const c = (await rl.question(t("苦情ですか？ y/n > ", "Is it a complaint? y/n > "))).trim();
    if (c === "q") break;
    const d = (
      await rl.question(t(`担当は？ ${deptMenu} > `, `Which team? ${deptMenu} > `))
    ).trim();
    if (d === "q") break;
    const u = (
      await rl.question(
        t(
          "緊急度は？ 0:急がない 1:今日中 2:今すぐ > ",
          "Urgency? 0:not urgent 1:today 2:right now > ",
        ),
      )
    ).trim();
    if (u === "q") break;

    const department = DEPARTMENTS[Number(d) - 1] as Department | undefined;
    const urgency = Number(u);
    if (!["y", "n"].includes(c) || !department || ![0, 1, 2].includes(urgency)) {
      console.log(
        t(
          "入力が読めませんでした。この投稿はとばします（あとでもう一度出ます）",
          "Could not read that input. Skipping this post (it will come up again later)",
        ),
      );
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
    t(
      `\n${items.length} 件を ${MY_LABELS_FILE} に保存しました。npm run d6 で作者の例と比べられます。`,
      `\nSaved ${items.length} labels to ${MY_LABELS_FILE}. Compare them with the author's example using npm run d6.`,
    ),
  );
}

runMain(import.meta.url, main);
