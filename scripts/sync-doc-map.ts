/**
 * 公式ドキュメントの llms.txt を取得し、前回との差分を出して doc-map.md を作り直す。
 *
 *   npm run docmap                       # 取得して更新
 *   npm run docmap -- --offline          # 取得せず、data/doc-map.json から doc-map.md だけ作り直す
 *   npm run docmap -- --diff-out d.md    # 差分を Markdown で書き出す（Issue 本文用）
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chapterDocs from "../data/chapter-docs.json" with { type: "json" };
import { ROOT } from "../src/lib/fixtures.js";
import { runMain } from "../src/lib/print.js";

export interface DocPage {
  title: string;
  url: string;
  description: string;
}

export interface DocMap {
  checkedAt: string | null;
  source: string;
  pages: DocPage[];
}

const LLMS_TXT = `${chapterDocs.baseUrl}/llms.txt`;
const SNAPSHOT = join(ROOT, "data", "doc-map.json");
const OUTPUT = join(ROOT, "docs", "_generated", "doc-map.md");

/** `- [タイトル](URL): 説明` の行を拾う */
export function parseLlmsTxt(text: string): DocPage[] {
  const pages: DocPage[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*[-*]\s*\[([^\]]+)\]\(([^)]+)\)(?::\s*(.*))?$/);
    if (!m) continue;
    pages.push({
      title: m[1]?.trim() ?? "",
      url: m[2]?.trim() ?? "",
      description: m[3]?.trim() ?? "",
    });
  }
  return pages;
}

export interface DocDiff {
  added: DocPage[];
  removed: DocPage[];
  changed: { before: DocPage; after: DocPage }[];
}

export function diffPages(before: DocPage[], after: DocPage[]): DocDiff {
  const prev = new Map(before.map((p) => [p.url, p]));
  const next = new Map(after.map((p) => [p.url, p]));
  return {
    added: after.filter((p) => !prev.has(p.url)),
    removed: before.filter((p) => !next.has(p.url)),
    changed: after.flatMap((p) => {
      const old = prev.get(p.url);
      return old && (old.title !== p.title || old.description !== p.description)
        ? [{ before: old, after: p }]
        : [];
    }),
  };
}

export function diffToMarkdown(diff: DocDiff): string {
  const lines: string[] = [];
  if (diff.added.length > 0) {
    lines.push("## 新規ページ（新しい概念が追加された可能性）", "");
    for (const p of diff.added) lines.push(`- [${p.title}](${p.url}) — ${p.description}`);
    lines.push("");
  }
  if (diff.removed.length > 0) {
    lines.push("## 削除ページ（該当章のリンク切れ）", "");
    for (const p of diff.removed) lines.push(`- ${p.title} — ${p.url}`);
    lines.push("");
  }
  if (diff.changed.length > 0) {
    lines.push("## 説明文の変更", "");
    for (const { before, after } of diff.changed) {
      lines.push(`- ${after.url}`, `  - 前: ${before.title} — ${before.description}`);
      lines.push(`  - 後: ${after.title} — ${after.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

const normalize = (url: string) =>
  url.replace(chapterDocs.baseUrl, "").replace(/\.md$/, "").replace(/\/$/, "");

export function renderDocMap(map: DocMap): string {
  const known = new Set(map.pages.map((p) => normalize(p.url)));
  const lines = [
    "# 公式ドキュメント対応表",
    "",
    "> 自動生成（`npm run docmap`）。手で編集しない。",
    `> 取得元: ${map.source}`,
    `> 最終取得: ${map.checkedAt ?? "未取得（`npm run docmap` を実行すると埋まります）"}`,
    "",
    "## 章 → 公式ページ",
    "",
    "| 章 | 教材 | 公式ページ |",
    "|---|---|---|",
  ];
  for (const c of chapterDocs.chapters) {
    const links = c.paths
      .map((p) => {
        const mark = map.pages.length === 0 ? "" : known.has(p) ? "" : " ⚠️llms.txtに無し";
        return `[${p}](${chapterDocs.baseUrl}${p})${mark}`;
      })
      .join("<br>");
    const file = c.file
      ? `[${c.file.replace("docs/", "")}](../${c.file.replace("docs/", "")})`
      : "（未執筆）";
    lines.push(`| ${c.chapter} | ${file} | ${links} |`);
  }
  lines.push("", "## 公式ページ一覧（llms.txt）", "");
  if (map.pages.length === 0) {
    lines.push("まだ取得していません。");
  } else {
    lines.push("| ページ | 説明 |", "|---|---|");
    for (const p of map.pages)
      lines.push(`| [${p.title}](${p.url}) | ${p.description.replace(/\|/g, "\\|")} |`);
  }
  return `${lines.join("\n")}\n`;
}

function loadSnapshot(): DocMap {
  if (!existsSync(SNAPSHOT)) return { checkedAt: null, source: LLMS_TXT, pages: [] };
  return JSON.parse(readFileSync(SNAPSHOT, "utf8")) as DocMap;
}

async function main() {
  const args = process.argv.slice(2);
  const offline = args.includes("--offline");
  const diffOutIndex = args.indexOf("--diff-out");
  const diffOut = diffOutIndex >= 0 ? args[diffOutIndex + 1] : undefined;

  const before = loadSnapshot();
  let map = before;

  if (!offline) {
    const res = await fetch(LLMS_TXT);
    if (!res.ok) throw new Error(`${LLMS_TXT} の取得に失敗: HTTP ${res.status}`);
    const pages = parseLlmsTxt(await res.text());
    if (pages.length === 0)
      throw new Error(
        "llms.txt からページを1件も読み取れませんでした。形式が変わった可能性があります",
      );
    map = { checkedAt: new Date().toISOString().slice(0, 10), source: LLMS_TXT, pages };

    const diff = diffPages(before.pages, pages);
    const md = before.pages.length === 0 ? "" : diffToMarkdown(diff);
    if (diffOut) writeFileSync(diffOut, md);
    console.log(md || "差分なし（または初回取得）");
    writeFileSync(SNAPSHOT, `${JSON.stringify(map, null, 2)}\n`);
  }

  writeFileSync(OUTPUT, renderDocMap(map));
  console.log(`docs/_generated/doc-map.md を更新しました（${map.pages.length} ページ）`);
}

runMain(import.meta.url, main);
