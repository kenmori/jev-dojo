/**
 * 教材本文の lint（plan.md §7, §9）。
 *
 * 1. h2 ごとに `> 一次情報:` の行があること
 * 2. h2 ごとに賞味期限の目印（<!-- freshness: ... -->）があること
 * 3. data/facts.json の揮発する値（価格・レート制限・モデルIDなど）を直書きしていないこと
 *
 *   npx tsx scripts/lint-docs.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { type Facts, facts } from "../src/lib/facts.js";
import { ROOT } from "../src/lib/fixtures.js";
import { runMain } from "../src/lib/print.js";

export interface LintError {
  file: string;
  line: number;
  message: string;
}

/** 見出しルールを免除するファイル（目次など） */
const SECTION_RULE_EXEMPT = new Set(["docs/00-index.md", "docs/en/00-index.md"]);
/** 賞味期限の目印。本文には表示されず、PDF では見出しの縁の色になる */
const LABEL = /^<!-- freshness: (evergreen|semi-stable|volatile) -->$/;
const PRIMARY = /^>\s*(一次情報|Primary source):/;

/** 本文に直書きしてはいけない値 */
export function volatileValues(f: Facts): string[] {
  const numbers = [
    f.pricing.inputPerMtok,
    f.pricing.outputPerMtok,
    f.rateLimits.tokensPerSecond,
    f.rateLimits.requestsPerMinute,
    f.context.totalTokens,
    f.context.statePlusLongestQuestion,
  ].filter((n) => n >= 10 || !Number.isInteger(n));
  return [
    ...numbers.flatMap((n) => [String(n), n.toLocaleString("en-US")]),
    f.model.pinned,
    f.signup.startingCredit,
    f.sdk.jsVersion,
  ].filter((v, i, all) => all.indexOf(v) === i);
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** URL とリンク先は対象外にする（例: /model-jaggedness/jev-1.13 は公式のパス） */
function stripUrls(line: string): string {
  return line.replace(/\]\([^)]*\)/g, "]()").replace(/https?:\/\/\S+/g, "");
}

export function lintSections(file: string, text: string): LintError[] {
  const errors: LintError[] = [];
  const lines = text.split("\n");
  let inCode = false;
  const sections: { title: string; line: number; body: string[] }[] = [];
  lines.forEach((line, i) => {
    if (line.startsWith("```")) inCode = !inCode;
    if (!inCode && /^## /.test(line)) sections.push({ title: line, line: i + 1, body: [] });
    else sections.at(-1)?.body.push(line);
  });
  for (const s of sections) {
    if (!s.body.some((l) => PRIMARY.test(l))) {
      errors.push({
        file,
        line: s.line,
        message: `「${s.title}」に \`> 一次情報:\` の行がありません`,
      });
    }
    if (!s.body.some((l) => LABEL.test(l))) {
      errors.push({
        file,
        line: s.line,
        message: `「${s.title}」に賞味期限の目印（<!-- freshness: evergreen | semi-stable | volatile -->）がありません`,
      });
    }
  }
  return errors;
}

export function lintVolatile(file: string, text: string, f: Facts = facts): LintError[] {
  const errors: LintError[] = [];
  const patterns = volatileValues(f).map(
    (v) => [v, new RegExp(`(?<![\\w.,])${escapeRegExp(v)}(?![\\w]|[.,]\\d)`)] as const,
  );
  const versionId = /\bjev-\d+\.\d+(\.\d+)?\b/;
  text.split("\n").forEach((raw, i) => {
    const line = stripUrls(raw);
    for (const [value, re] of patterns) {
      if (re.test(line)) {
        errors.push({
          file,
          line: i + 1,
          message: `揮発する値「${value}」を直書きしています。_generated/facts.md へのリンクにしてください`,
        });
      }
    }
    if (versionId.test(line) && !line.includes(f.model.pinned)) {
      errors.push({
        file,
        line: i + 1,
        message:
          "モデルのバージョンIDを直書きしています。_generated/facts.md へのリンクにしてください",
      });
    }
  });
  return errors;
}

/** README は facts ブロックの外だけを見る */
const README_BLOCK = /<!-- facts:start -->[\s\S]*?<!-- facts:end -->/;

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => join(d.parentPath, d.name))
    .filter((p) => !relative(ROOT, p).startsWith("docs/_generated"));
}

export function lintAll(): LintError[] {
  const errors: LintError[] = [];
  for (const abs of markdownFiles(join(ROOT, "docs"))) {
    const file = relative(ROOT, abs);
    const text = readFileSync(abs, "utf8");
    if (!SECTION_RULE_EXEMPT.has(file)) errors.push(...lintSections(file, text));
    errors.push(...lintVolatile(file, text));
  }
  for (const name of ["README.md", "README.en.md"]) {
    const path = join(ROOT, name);
    if (!existsSync(path)) continue;
    const readme = readFileSync(path, "utf8");
    // 行番号を保つため、ブロックは同じ行数の空行に置き換える
    const masked = readme.replace(README_BLOCK, (m) => "\n".repeat(m.split("\n").length - 1));
    errors.push(...lintVolatile(name, masked));
  }
  return errors;
}

async function main() {
  const errors = lintAll();
  for (const e of errors) console.error(`${e.file}:${e.line}  ${e.message}`);
  if (errors.length > 0) {
    console.error(`\ndocs lint: ${errors.length} 件のエラー`);
    process.exitCode = 1;
  } else {
    console.log("docs lint: OK");
  }
}

runMain(import.meta.url, main);
