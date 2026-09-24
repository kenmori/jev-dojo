/**
 * 教材本文から PDF 版を作る。
 *
 *   npm run pdf                               # dist/jev-dojo.pdf と dist/jev-dojo.html
 *   JEV_LANG=en npm run pdf                   # 英語版 dist/jev-dojo.en.pdf
 *   PDF_BROWSER=/path/to/chrome npm run pdf   # ブラウザの場所を指定する
 *
 * ブラウザは Chrome / Chromium を使う。見つからないときは PDF_BROWSER で指定するか、
 * `npx playwright install chromium` でインストールする。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { marked } from "marked";
import { type Browser, chromium } from "playwright-core";
import pkg from "../package.json" with { type: "json" };
import { facts } from "../src/lib/facts.js";
import { FIXTURES_DIR, listFixtureDirs, ROOT, readFixture } from "../src/lib/fixtures.js";
import { LANG, t } from "../src/lib/i18n.js";
import { runMain } from "../src/lib/print.js";

const REPO_URL = "https://github.com/kenmori/jev-dojo/blob/main";

/** PDF に入れる順番。英語版は docs/en/ の本文と英語の生成ページを使う */
export function chaptersFor(lang: "ja" | "en"): { part: string; file: string }[] {
  const d = lang === "ja" ? "docs" : "docs/en";
  const P =
    lang === "ja"
      ? {
          intro: "はじめに",
          kyu: "入門（級）",
          dan: "中級（段）",
          kodan: "上級（高段）",
          kaiden: "皆伝",
          adv: "発展",
          ref: "資料",
        }
      : {
          intro: "Introduction",
          kyu: "Beginner (kyu)",
          dan: "Intermediate (dan)",
          kodan: "Advanced (upper dan)",
          kaiden: "Kaiden",
          adv: "Extensions",
          ref: "Reference",
        };
  const gen = (name: string) => `docs/_generated/${name}${lang === "ja" ? ".md" : ".en.md"}`;
  return [
    { part: P.intro, file: `${d}/00-index.md` },
    ...[
      "10-what-is-jev",
      "09-setup",
      "08-first-call",
      "07-noul",
      "06-choice",
      "05-score",
      "04-batch",
    ].map((f) => ({ part: P.kyu, file: `${d}/kyu/${f}.md` })),
    ...["01-state", "02-instructions", "03-confidence", "04-patterns", "05-boundary"].map((f) => ({
      part: P.dan,
      file: `${d}/dan/${f}.md`,
    })),
    ...["06-dataset", "07-calibration", "08-japanese-lab", "09-production", "10-limits"].map(
      (f) => ({
        part: P.kodan,
        file: `${d}/kodan/${f}.md`,
      }),
    ),
    ...["01-mechanism", "02-exam"].map((f) => ({ part: P.kaiden, file: `${d}/kaiden/${f}.md` })),
    ...["a-tanstack-cloudflare", "b-two-layer", "c-frameworks", "d-agent-skill"].map((f) => ({
      part: P.adv,
      file: `${d}/advanced/${f}.md`,
    })),
    { part: P.ref, file: `${d}/glossary.md` },
    { part: P.ref, file: gen("facts") },
    { part: P.ref, file: gen("calibration") },
    { part: P.ref, file: gen("lab-ja-en") },
  ];
}

export const CHAPTERS = chaptersFor("ja");

const idFor = (file: string) => `ch-${file.replace(/^docs\//, "").replace(/[^\w]+/g, "-")}`;

/** リンクと画像を PDF 用に書き換える */
export function rewrite(markdown: string, file: string, known: Set<string>): string {
  const dir = dirname(file);
  return markdown
    .replace(/<details><summary>(.*?)<\/summary>/g, "<details open><summary>$1</summary>")
    .replace(
      /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g,
      (whole, bang: string, text: string, href: string) => {
        if (/^(https?:|mailto:|#)/.test(href)) return whole;
        const [path = "", hash = ""] = href.split("#");
        const target = normalize(join(dir, path));
        if (bang) {
          const abs = join(ROOT, target);
          if (!existsSync(abs)) return whole;
          // <img> で読み込むと SVG の中の文字にページのフォントが効かないので、SVG をそのまま埋め込む
          const svg = readFileSync(abs, "utf8").replace(/<\?xml[^>]*>\s*/, "");
          return `<div class="figure" role="img" aria-label="${text}">${svg.trim()}</div>`;
        }
        if (known.has(target)) return `[${text}](#${idFor(target)})`;
        return `[${text}](${REPO_URL}/${target}${hash ? `#${hash}` : ""})`;
      },
    );
}

function syntheticFixtures(): boolean {
  for (const dir of listFixtureDirs()) {
    for (const f of readdirSync(join(FIXTURES_DIR, dir))) {
      if (readFixture(join(FIXTURES_DIR, dir, f)).meta.source === "synthetic") return true;
    }
  }
  return false;
}

/**
 * 日本語フォントは同梱の Noto Sans JP（OFL）を使う。
 * OS のフォントに任せると、環境によっては中国語用のフォントで組まれ、漢字の字形が日本語と変わってしまう。
 */
const FONT_CSS = ["400.css", "700.css"].map(
  (f) => `file://${join(ROOT, "node_modules", "@fontsource", "noto-sans-jp", f)}`,
);

const CSS = `
@page { size: A4; margin: 18mm 16mm 20mm; }
:root { --fg: #111827; --muted: #6b7280; --line: #d1d5db; --accent: #2563eb; }
body { font-family: "Noto Sans JP", sans-serif; color: var(--fg); font-size: 10.5pt; line-height: 1.75; }
h1 { font-size: 20pt; border-bottom: 3px solid var(--accent); padding-bottom: 4px; margin-top: 0; }
h2.fresh-evergreen { border-left-color: #16a34a; }
h2.fresh-semi-stable { border-left-color: #eab308; }
h2.fresh-volatile { border-left-color: #dc2626; }
h2 { font-size: 14pt; margin-top: 1.6em; border-left: 5px solid var(--accent); padding-left: 8px; break-after: avoid; }
h3 { font-size: 11.5pt; margin-top: 1.2em; break-after: avoid; }
section.chapter { break-before: page; }
.part { color: var(--muted); font-size: 9pt; letter-spacing: 0.1em; }
pre { background: #f6f8fa; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 10px; font-size: 8.5pt; line-height: 1.5; white-space: pre-wrap; word-break: break-all; break-inside: avoid; }
code { font-family: "SFMono-Regular", Menlo, Consolas, "DejaVu Sans Mono", "Noto Sans JP", monospace; font-size: 0.9em; }
svg text { font-family: "Noto Sans JP", sans-serif !important; }
.figure svg { max-width: 100%; height: auto; }
:not(pre) > code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
table { border-collapse: collapse; width: 100%; font-size: 9pt; margin: 0.8em 0; break-inside: avoid; }
th, td { border: 1px solid var(--line); padding: 4px 6px; vertical-align: top; }
th { background: #f3f4f6; }
blockquote { margin: 0.8em 0; padding: 4px 12px; border-left: 4px solid var(--line); color: #374151; background: #fafafa; }
details { border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px 12px; margin: 1em 0; background: #fcfcfd; }
summary { font-weight: bold; color: #374151; list-style: none; }
summary::-webkit-details-marker { display: none; }
a { color: var(--accent); text-decoration: none; }
img { max-width: 100%; }
pre.mermaid { background: none; border: 0; text-align: center; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: center; }
.cover h1 { font-size: 30pt; border: 0; }
.cover .sub { font-size: 14pt; color: #374151; }
.cover .meta { margin-top: 3em; color: var(--muted); font-size: 9.5pt; }
.notice { border: 1px solid #fca5a5; background: #fef2f2; padding: 8px 12px; border-radius: 6px; font-size: 9.5pt; }
.toc ol { padding-left: 1.2em; }
.toc li { margin: 2px 0; }
.toc .toc-part { margin-top: 0.8em; font-weight: bold; list-style: none; margin-left: -1.2em; }
`;

export function buildHtml(): string {
  const chapters = chaptersFor(LANG);
  const known = new Set(chapters.map((c) => c.file));
  const date = new Date().toISOString().slice(0, 10);
  const synthetic = syntheticFixtures();

  const sections = chapters.map(({ part, file }) => {
    const md = rewrite(readFileSync(join(ROOT, file), "utf8"), file, known);
    const html = (marked.parse(md, { async: false }) as string)
      .replace(
        /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
        (_m, code: string) => `<pre class="mermaid">${code}</pre>`,
      )
      // 賞味期限の目印を、見出しの縁の色（緑・黄・赤）にする
      .replace(
        /<h2([^>]*)>([\s\S]*?)<\/h2>\s*<!-- freshness: (evergreen|semi-stable|volatile) -->/g,
        (_m, attrs: string, inner: string, fresh: string) =>
          `<h2 class="fresh-${fresh}"${attrs}>${inner}</h2>`,
      );
    return `<section class="chapter" id="${idFor(file)}"><div class="part">${part}</div>${html}</section>`;
  });

  const titleOf = (file: string) =>
    (readFileSync(join(ROOT, file), "utf8").match(/^# (.+)$/m)?.[1] ?? file).trim();
  let lastPart = "";
  const toc = chapters
    .map(({ part, file }) => {
      const head = part !== lastPart ? `<li class="toc-part">${part}</li>` : "";
      lastPart = part;
      return `${head}<li><a href="#${idFor(file)}">${titleOf(file)}</a></li>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="${LANG}"><head><meta charset="utf-8"><title>jev-dojo</title>
${FONT_CSS.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")}
<style>${CSS}</style></head>
<body>
<div class="cover">
  <h1>jev-dojo</h1>
  <div class="sub">${t("Jev（TypeSafe AI の System One モデル）を級・段で学ぶ", "Learn Jev (TypeSafe AI's System One model) through kyu and dan ranks")}</div>
  <div class="meta">
    ${t(`版: ${pkg.version}（${date} 生成）`, `Version ${pkg.version} (built ${date})`)}<br>
    ${t("内容の最終検証", "Content last verified")}: ${facts.lastVerified} / ${t("対象モデル", "Model")}: ${facts.model.pinned} / SDK: ${facts.sdk.js} ${facts.sdk.jsVersion}<br>
    ${t("コード", "Code")}: ${REPO_URL.replace("/blob/main", "")}
  </div>
  <p class="meta">
    © 2026 kenmori. ${t("この PDF の再配布・転売はできません。", "This PDF may not be redistributed or resold.")}<br>
    ${t("本教材は TypeSafe AI の公式教材ではなく、TypeSafe AI とは関係がありません。", "This is not an official TypeSafe AI course and is not affiliated with TypeSafe AI.")}<br>
    ${t("料金・レート制限・モデルなどの変わりやすい情報は、必ず公式ドキュメントで確認してください。", "Always check prices, rate limits, models and other changing facts in the official docs.")}
  </p>
  ${
    synthetic
      ? `<p class="notice">${t("この版の実行例・レポートの数値には、手で作った見本データ（合成）が含まれています。実APIの測定結果ではありません。", "Sample outputs and report numbers in this edition include hand-made sample data (synthetic). They are NOT real API measurements.")}</p>`
      : ""
  }
</div>
<section class="chapter toc"><h1>${t("目次", "Contents")}</h1><ol>${toc}</ol></section>
${sections.join("\n")}
</body></html>`;
}

export async function launch(): Promise<Browser> {
  const path = process.env.PDF_BROWSER;
  if (path) return chromium.launch({ executablePath: path });
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    try {
      return await chromium.launch();
    } catch {
      throw new Error(
        "Chrome / Chromium が見つかりません。PDF_BROWSER=/path/to/chrome npm run pdf で場所を指定するか、npx playwright install chromium を実行してください",
      );
    }
  }
}

async function main() {
  const out = join(ROOT, "dist");
  mkdirSync(out, { recursive: true });
  const html = buildHtml();
  const base = LANG === "ja" ? "jev-dojo" : "jev-dojo.en";
  const htmlPath = join(out, `${base}.html`);
  writeFileSync(htmlPath, html);

  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`);
    await page.addScriptTag({
      path: join(ROOT, "node_modules", "mermaid", "dist", "mermaid.min.js"),
    });
    await page.evaluate(async () => {
      const m = (
        window as unknown as { mermaid: { initialize(o: object): void; run(): Promise<void> } }
      ).mermaid;
      m.initialize({
        startOnLoad: false,
        theme: "neutral",
        fontFamily: '"Noto Sans JP", sans-serif',
        // シーケンス図の参加者（あなたのプログラム・Jev など）は上にだけ出す
        sequence: { mirrorActors: false },
      });
      await document.fonts.ready;
      await m.run();
    });
    // フォントは文字の範囲ごとに分かれて読み込まれる。印刷の前に、ページで使う全文字の分を読み込ませる
    await page.evaluate(async () => {
      const text = document.body.textContent ?? "";
      await Promise.all(
        ["400", "700"].map((w) => document.fonts.load(`${w} 16px "Noto Sans JP"`, text)),
      );
      await document.fonts.ready;
    });
    await page.pdf({
      path: join(out, `${base}.pdf`),
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="width:100%;font-size:8px;color:#9ca3af;text-align:center;">jev-dojo — <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
    });
  } finally {
    await browser.close();
  }
  console.log(
    t(
      `作成: ${relative(ROOT, join(out, `${base}.pdf`))}（プレビュー用 HTML: ${relative(ROOT, htmlPath)}）`,
      `Built: ${relative(ROOT, join(out, `${base}.pdf`))} (preview HTML: ${relative(ROOT, htmlPath)})`,
    ),
  );
}

runMain(import.meta.url, main);
