/**
 * 電子書籍（EPUB 3）を作る。Kindle Direct Publishing にそのまま入稿できる形を目指す。
 *
 *   npm run epub                              # 公開中の教材（docs/）で試す → dist/jev-dojo.epub
 *   JEV_LANG=en npm run epub                  # 英語版の教材で試す → dist/jev-dojo.en.epub
 *   npm run epub -- --book ../jev-dojo-book   # 書籍原稿（book.json）から作る
 *
 * 書籍だけの原稿は、このリポジトリの外（非公開のリポジトリなど）に置き、--book で指定する。
 * 章の並びは book.json に書く。書き方は book-template/ を参照。
 *
 * 電子書籍ではスクリプトが動かず、Kindle では SVG の表示も安定しないので、
 * Mermaid の図とグラフはブラウザで描画して PNG にして埋め込む。
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, normalize, relative, resolve } from "node:path";
import JSZip from "jszip";
import { marked } from "marked";
import facts from "../data/facts.json" with { type: "json" };
import pkg from "../package.json" with { type: "json" };
import { ROOT } from "../src/lib/fixtures.js";
import { LANG, type Lang, t } from "../src/lib/i18n.js";
import { runMain } from "../src/lib/print.js";
import { chaptersFor, launch } from "./build-pdf.js";

const REPO_URL = "https://github.com/kenmori/jev-dojo/blob/main";

/** book.json の中身 */
export interface BookManifest {
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  language: Lang;
  /** 版をまたいで変えない ID。省略するとタイトルと著者から決まる */
  identifier?: string;
  description?: string;
  /** 表紙の画像（book.json からの相対パス）。KDP では表紙は別途アップロードもできる */
  cover?: string;
  /** 章の並び。"repo:docs/..." はこのリポジトリのファイル、それ以外は book.json からの相対パス */
  chapters: { src: string; part?: string }[];
  /**
   * 章の扉に置くキービジュアルの場所（book.json からの相対パス）。{nn} は章のファイル名の先頭の番号
   * （chapters/05-noul.md なら 05）に置き換わる。ファイルがある章だけ、見出しのすぐ下に入る
   */
  keyVisual?: string;
  /** 出力ファイル名（dist/ の下） */
  output?: string;
}

export interface ResolvedChapter {
  /** 読み込むファイルの絶対パス */
  path: string;
  /** EPUB 内のファイル名 */
  xhtml: string;
  /** この章から始まる部の名前（目次で章をまとめる） */
  part?: string;
  /** 章の扉に置くキービジュアル（絶対パス。ファイルがあるときだけ） */
  keyVisual?: string;
}

/** 目次の 1 項目。sections は章の中の見出し（h2） */
export interface TocEntry {
  title: string;
  xhtml: string;
  part?: string;
  sections?: { title: string; id: string }[];
}

/** 公開中の教材だけで作る、試し刷り用の book.json */
export function defaultManifest(lang: Lang): BookManifest {
  return {
    title: lang === "ja" ? "jev-dojo（公開版）" : "jev-dojo (public edition)",
    subtitle:
      lang === "ja"
        ? "Jev（TypeSafe AI の System One モデル）を級・段で学ぶ"
        : "Learn Jev (TypeSafe AI's System One model) through kyu and dan ranks",
    author: "kenmori",
    language: lang,
    chapters: chaptersFor(lang).map((c) => ({ src: `repo:${c.file}` })),
    output: lang === "ja" ? "jev-dojo.epub" : "jev-dojo.en.epub",
  };
}

export function resolveSrc(src: string, bookDir: string): string {
  return src.startsWith("repo:") ? join(ROOT, src.slice("repo:".length)) : resolve(bookDir, src);
}

export function resolveChapters(m: BookManifest, bookDir: string): ResolvedChapter[] {
  return m.chapters.map((c, i) => ({
    path: resolveSrc(c.src, bookDir),
    xhtml: `ch${String(i + 1).padStart(2, "0")}.xhtml`,
    ...(c.part !== undefined ? { part: c.part } : {}),
    ...keyVisualFor(m, c.src, bookDir),
  }));
}

function keyVisualFor(m: BookManifest, src: string, bookDir: string): { keyVisual?: string } {
  const nn = basename(src).match(/^(\d+)/)?.[1];
  if (!m.keyVisual || !nn) return {};
  const file = resolve(bookDir, m.keyVisual.replaceAll("{nn}", nn));
  return existsSync(file) ? { keyVisual: file } : {};
}

/** 章の見出し（最初の # の行）のすぐ下に、キービジュアルの画像を入れる */
export function insertKeyVisual(markdown: string, imagePath: string, alt: string): string {
  return markdown.replace(/^(# .+)$/m, `$1\n\n![${alt}](${imagePath})\n`);
}

/** タイトルと著者から、版をまたいで変わらない urn:uuid を作る */
export function stableIdentifier(m: BookManifest): string {
  if (m.identifier) return m.identifier;
  const h = createHash("sha256").update(`${m.title}\n${m.author}`).digest("hex");
  return `urn:uuid:${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * 章の Markdown を電子書籍向けに書き換える。
 * - 賞味期限の目印は消す
 * - 折りたたみ（もっと深く）は、普通の囲みの節にする
 * - 章どうしのリンクは EPUB 内のファイルへ、それ以外のリポジトリ内のファイルは GitHub へ
 */
/**
 * 原稿の `{{facts.model.pinned}}` のような書き方を、data/facts.json の値に置き換える。
 * 検証日やモデルのバージョンを本文に手で書かずにすむ（改訂のときに直し忘れない）。
 */
export function fillFacts(markdown: string, source: unknown = facts): string {
  return markdown.replace(/\{\{facts\.([\w.]+)\}\}/g, (_, key: string) => {
    const value = key
      .split(".")
      .reduce<unknown>(
        (v, k) => (v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined),
        source,
      );
    if (value === undefined || (typeof value === "object" && value !== null)) {
      throw new Error(
        t(`data/facts.json に「${key}」がありません`, `"${key}" is not a value in data/facts.json`),
      );
    }
    return String(value);
  });
}

/**
 * 脚注。原稿の `[^key]` を「※1」の注番号にし、`[^key]: 説明` の行を章の終わりの「注」にまとめる。
 * EPUB 3 の noteref / footnote なので、Kindle では番号をタップすると説明がポップアップで出る。
 * 番号は章ごとに、本文に出てくる順に振る。
 */
export function applyFootnotes(markdown: string): string {
  const defs = new Map<string, string>();
  const body = markdown.replace(
    /^\[\^([\w-]+)\]:[ \t]*(.+)$\n?/gm,
    (_m, key: string, text: string) => {
      defs.set(key, text.trim());
      return "";
    },
  );
  const order: string[] = [];
  /** 注ごとに、本文で最初に出てきた場所（注から戻るリンクの行き先） */
  const firstRef = new Map<string, number>();
  let refs = 0;
  const withRefs = body.replace(/\[\^([\w-]+)\]/g, (_m, key: string) => {
    if (!defs.has(key)) throw new Error(`脚注の説明がありません: [^${key}]`);
    let n = order.indexOf(key) + 1;
    if (n === 0) n = order.push(key);
    refs += 1;
    if (!firstRef.has(key)) firstRef.set(key, refs);
    return `<a class="noteref" epub:type="noteref" href="#fn-${n}" id="fnref-${refs}">※${n}</a>`;
  });
  if (order.length === 0) return withRefs;
  const notes = order
    .map(
      (key, i) =>
        // aside＋footnote にすると、Apple Books などは中身を隠してポップアップだけにする。
        // 章末の「注」を必ず読めるよう、ふつうの段落＋endnote にし、番号から本文へ戻れるようにする
        `<p class="footnote" epub:type="endnote" id="fn-${i + 1}"><a href="#fnref-${firstRef.get(key)}">※${i + 1}</a>　${marked.parseInline(defs.get(key) ?? "", { async: false }) as string}</p>`,
    )
    .join("\n");
  return `${withRefs.trimEnd()}\n\n<section class="footnotes" epub:type="endnotes">\n<p class="footnotes-title">注</p>\n${notes}\n</section>\n`;
}

export function prepareMarkdown(
  markdown: string,
  path: string,
  byPath: Map<string, string>,
): { markdown: string; images: string[] } {
  const images: string[] = [];
  const dir = dirname(path);
  const md = applyFootnotes(fillFacts(markdown))
    .replace(/^<!-- freshness: [\w-]+ -->\n?/gm, "")
    .replace(
      /<details><summary>(.*?)<\/summary>/g,
      '<div class="deeper"><p class="deeper-title">$1</p>',
    )
    .replace(/<\/details>/g, "</div>")
    .replace(
      /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g,
      (whole, bang: string, text: string, href: string) => {
        if (/^(https?:|mailto:|#)/.test(href)) return whole;
        const [p = "", hash = ""] = href.split("#");
        const target = p.startsWith("repo:") ? join(ROOT, p.slice(5)) : normalize(join(dir, p));
        if (bang) {
          images.push(target);
          return `<img class="figure-src" data-src="${target}" alt="${text}"/>`;
        }
        const chapter = byPath.get(target);
        if (chapter) return `[${text}](${chapter})`;
        const rel = relative(ROOT, target);
        if (rel.startsWith("..")) return text; // リポジトリの外（書籍原稿どうし以外）へのリンクは文字だけ残す
        return `[${text}](${REPO_URL}/${rel}${hash ? `#${hash}` : ""})`;
      },
    );
  return { markdown: md, images };
}

const CSS = `
body { line-height: 1.7; }
h1 { font-size: 1.5em; margin: 0 0 1em; }
.toc-part { font-weight: bold; margin: 1.2em 0 0.3em; }
ul.toc { list-style: none; margin: 0; padding-left: 1em; }
ul.toc li { margin: 0.3em 0; }
h2 { font-size: 1.25em; margin: 1.6em 0 0.6em; border-bottom: 1px solid #999; }
h3 { font-size: 1.1em; margin: 1.2em 0 0.4em; }
/* 番号付きの問題の中の選択肢（(a)(b)…）には、箇条書きの記号を付けない */
ol ul { list-style: none; padding-left: 0.5em; margin: 0.3em 0; }
/* 表の中の長いコードは、狭い画面では途中で折り返す */
td code { word-break: break-all; }
pre { white-space: pre-wrap; word-wrap: break-word; font-size: 0.8em; line-height: 1.4; background: #f4f4f4; padding: 0.6em; }
code { font-family: monospace; }
table { border-collapse: collapse; margin: 0.8em 0; font-size: 0.9em; }
th, td { border: 1px solid #999; padding: 0.2em 0.4em; vertical-align: top; }
th { background: #EDF0F5; font-weight: bold; }
blockquote { margin: 0.8em 0; padding-left: 0.8em; border-left: 3px solid #999; }
.caution { margin: 1em 0; padding: 0.2em 0.9em; border: 2px solid #000; }
.deeper { border: 1px solid #bbb; padding: 0 0.8em; margin: 1em 0; }
.deeper-title { font-weight: bold; }
img { max-width: 100%; }
.figure { text-align: center; margin: 1em 0; }
a.noteref { font-size: 0.75em; vertical-align: super; text-decoration: none; }
.footnotes { margin-top: 2em; border-top: 1px solid #999; font-size: 0.85em; }
.footnotes-title { font-weight: bold; }
p.footnote { margin: 0.4em 0; }
`;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function xhtmlDoc(lang: Lang, title: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head><meta charset="UTF-8"/><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="../style.css"/></head>
<body>
${body}
</body>
</html>
`;
}

/**
 * 部ごとにまとめる。part を持つ章から新しい部が始まり、part のない章は直前の部に入る。
 * part が空文字の章は、部の外に出る（奥付など）。最初の部より前の章も部の外。
 */
export function groupByPart(entries: TocEntry[]): { part?: string; chapters: TocEntry[] }[] {
  const groups: { part?: string; chapters: TocEntry[] }[] = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (e.part) groups.push({ part: e.part, chapters: [e] });
    else if (e.part === undefined && last) last.chapters.push(e);
    else if (last && !last.part) last.chapters.push(e);
    else groups.push({ chapters: [e] });
  }
  return groups;
}

/** Kindle のメニューから開く目次（部 → 章 → 見出し）。landmarks は「最初から読む」などの目印 */
export function navXhtml(
  lang: Lang,
  entries: TocEntry[],
  landmarks: { type: string; href: string; title: string }[] = [],
): string {
  const heading = lang === "ja" ? "目次" : "Contents";
  const chapter = (e: TocEntry) => {
    const secs = (e.sections ?? [])
      .map((s) => `<li><a href="text/${e.xhtml}#${s.id}">${esc(s.title)}</a></li>`)
      .join("");
    return `<li><a href="text/${e.xhtml}">${esc(e.title)}</a>${secs ? `<ol>${secs}</ol>` : ""}</li>`;
  };
  const items = groupByPart(entries)
    .map((g) =>
      g.part
        ? `<li><a href="text/${g.chapters[0]?.xhtml}">${esc(g.part)}</a><ol>${g.chapters.map(chapter).join("\n")}</ol></li>`
        : g.chapters.map(chapter).join("\n"),
    )
    .join("\n");
  const marks = landmarks.length
    ? `\n<nav epub:type="landmarks" id="landmarks" hidden=""><ol>${landmarks
        .map((l) => `<li><a epub:type="${l.type}" href="${l.href}">${esc(l.title)}</a></li>`)
        .join("")}</ol></nav>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head><meta charset="UTF-8"/><title>${heading}</title></head>
<body>
<nav epub:type="toc" id="toc"><h1>${heading}</h1><ol>
${items}
</ol></nav>${marks}
</body>
</html>
`;
}

/** 本文の中に置く、めくって読める目次のページ（部 → 章の 2 段） */
export function tocPageBody(lang: Lang, entries: TocEntry[]): string {
  const heading = lang === "ja" ? "目次" : "Contents";
  const li = (e: TocEntry) => `<li><a href="${e.xhtml}">${esc(e.title)}</a></li>`;
  const blocks = groupByPart(entries)
    .map((g) =>
      g.part
        ? `<p class="toc-part">${esc(g.part)}</p><ul class="toc">${g.chapters.map(li).join("")}</ul>`
        : `<ul class="toc">${g.chapters.map(li).join("")}</ul>`,
    )
    .join("\n");
  return `<h1>${heading}</h1>\n${blocks}`;
}

export function contentOpf(
  m: BookManifest,
  items: { id: string; href: string; type: string; properties?: string }[],
  spine: string[],
  modified: string,
): string {
  const manifestItems = items
    .map(
      (i) =>
        `<item id="${i.id}" href="${i.href}" media-type="${i.type}"${i.properties ? ` properties="${i.properties}"` : ""}/>`,
    )
    .join("\n    ");
  const title = m.subtitle ? `${m.title}: ${m.subtitle}` : m.title;
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${m.language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${esc(stableIdentifier(m))}</dc:identifier>
    <dc:title>${esc(title)}</dc:title>
    <dc:creator>${esc(m.author)}</dc:creator>
    <dc:language>${m.language}</dc:language>
    ${m.publisher ? `<dc:publisher>${esc(m.publisher)}</dc:publisher>` : ""}
    ${m.description ? `<dc:description>${esc(m.description)}</dc:description>` : ""}
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine>
    ${spine.map((id) => `<itemref idref="${id}"/>`).join("\n    ")}
  </spine>
</package>
`;
}

const CONTAINER = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>
`;

function parseArgs(argv: string[]): { bookDir?: string } {
  const i = argv.indexOf("--book");
  return { bookDir: i >= 0 ? argv[i + 1] : undefined };
}

async function main() {
  const { bookDir } = parseArgs(process.argv.slice(2));
  const baseDir = bookDir ? resolve(bookDir) : ROOT;
  const manifest: BookManifest = bookDir
    ? (JSON.parse(readFileSync(join(baseDir, "book.json"), "utf8")) as BookManifest)
    : defaultManifest(LANG);
  const chapters = resolveChapters(manifest, baseDir);
  for (const c of chapters) {
    if (!existsSync(c.path))
      throw new Error(
        t(`章のファイルがありません: ${c.path}`, `Chapter file not found: ${c.path}`),
      );
  }
  const byPath = new Map(chapters.map((c) => [c.path, c.xhtml]));

  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", CONTAINER);
  zip.file("OEBPS/style.css", CSS);

  const items: { id: string; href: string; type: string; properties?: string }[] = [
    { id: "nav", href: "nav.xhtml", type: "application/xhtml+xml", properties: "nav" },
    { id: "css", href: "style.css", type: "text/css" },
  ];
  const spine: string[] = [];
  const toc: TocEntry[] = [];

  const coverPath = manifest.cover ? resolve(baseDir, manifest.cover) : undefined;
  if (coverPath && !existsSync(coverPath)) {
    console.warn(
      t(
        `表紙の画像がないので、表紙なしで作ります: ${coverPath}`,
        `Cover image not found; building without a cover: ${coverPath}`,
      ),
    );
  }
  if (coverPath && existsSync(coverPath)) {
    const ext = extname(coverPath).toLowerCase();
    const type = ext === ".png" ? "image/png" : "image/jpeg";
    zip.file(`OEBPS/images/cover${ext}`, readFileSync(coverPath));
    items.push({ id: "cover-image", href: `images/cover${ext}`, type, properties: "cover-image" });
    zip.file(
      "OEBPS/text/cover.xhtml",
      xhtmlDoc(
        manifest.language,
        manifest.title,
        `<div class="figure"><img src="../images/cover${ext}" alt="${esc(manifest.title)}"/></div>`,
      ),
    );
    items.push({ id: "cover", href: "text/cover.xhtml", type: "application/xhtml+xml" });
    spine.push("cover");
  }

  const browser = await launch();
  let figureCount = 0;
  try {
    const page = await browser.newPage({ deviceScaleFactor: 2 });
    const mermaidJs = join(ROOT, "node_modules", "mermaid", "dist", "mermaid.min.js");
    const fontCss = ["400.css", "700.css"]
      .map(
        (f) =>
          `<link rel="stylesheet" href="file://${join(ROOT, "node_modules", "@fontsource", "noto-sans-jp", f)}">`,
      )
      .join("");

    for (const [i, c] of chapters.entries()) {
      const source = readFileSync(c.path, "utf8");
      const chapterTitle = source.match(/^# (.+)$/m)?.[1]?.trim() ?? "";
      const prepared = prepareMarkdown(
        c.keyVisual
          ? insertKeyVisual(
              source,
              relative(dirname(c.path), c.keyVisual),
              `${chapterTitle}の扉の絵`,
            )
          : source,
        c.path,
        byPath,
      );
      let html = (marked.parse(prepared.markdown, { async: false }) as string).replace(
        /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
        (_m, code: string) => `<pre class="mermaid">${code}</pre>`,
      );
      // SVG の画像は、中身をその場に埋め込んでからブラウザで PNG にする
      html = html.replace(
        /<img class="figure-src" data-src="([^"]+)" alt="([^"]*)"\s*\/?>/g,
        (_m, src: string, alt: string) =>
          !existsSync(src)
            ? `<span>${alt}</span>`
            : src.endsWith(".svg")
              ? `<div class="figure" data-alt="${alt}">${readFileSync(src, "utf8").replace(/<\?xml[^>]*>\s*/, "")}</div>`
              : // PNG・JPEG の挿絵も、ほかの図と同じく画面の幅に合わせて PNG にする
                `<div class="figure" data-alt="${alt}" data-photo="1"><img src="file://${src}" alt="${alt}" style="max-width:720px"></div>`,
      );
      const scratch = join(ROOT, "dist", "epub-work.html");
      mkdirSync(dirname(scratch), { recursive: true });
      writeFileSync(
        scratch,
        `<!doctype html><html lang="${manifest.language}"><head><meta charset="utf-8">${fontCss}<style>body{font-family:"Noto Sans JP",sans-serif;width:720px;background:#fff}.figure{display:inline-block}</style></head><body>${html}</body></html>`,
      );
      await page.goto(`file://${scratch}`);
      await page.addScriptTag({ path: mermaidJs });
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
          // 箱の中の日本語が語の途中で折り返されないよう、折り返す幅を広げる
          flowchart: { wrappingWidth: 320 },
        });
        await document.fonts.ready;
        if (document.querySelector(".mermaid")) await m.run();
        await document.fonts.ready;
      });
      // 図を1つずつ PNG にして、<img> に置き換える
      const figures = page.locator(".mermaid, .figure");
      const n = await figures.count();
      const names: string[] = [];
      for (let k = 0; k < n; k++) {
        figureCount += 1;
        // 挿絵（PNG・JPEG）は JPEG にして、本のファイルを小さく保つ。図やグラフは文字が多いので PNG のまま
        const photo = (await figures.nth(k).getAttribute("data-photo")) === "1";
        const name = `fig${String(figureCount).padStart(3, "0")}.${photo ? "jpg" : "png"}`;
        zip.file(
          `OEBPS/images/${name}`,
          await figures
            .nth(k)
            .screenshot(photo ? { type: "jpeg", quality: 85 } : { omitBackground: false }),
        );
        items.push({
          id: name.replace(/\.\w+$/, ""),
          href: `images/${name}`,
          type: photo ? "image/jpeg" : "image/png",
        });
        names.push(name);
      }
      const { body, sections } = await page.evaluate((imgNames: string[]) => {
        const figs = Array.from(document.querySelectorAll(".mermaid, .figure"));
        figs.forEach((el, k) => {
          const div = document.createElement("div");
          div.className = "figure";
          const img = document.createElement("img");
          img.setAttribute("src", `../images/${imgNames[k]}`);
          img.setAttribute("alt", el.getAttribute("data-alt") ?? "figure");
          div.appendChild(img);
          el.replaceWith(div);
        });
        // 章の中の見出し（h2）に ID を振り、目次から飛べるようにする
        const sections = Array.from(document.querySelectorAll("h2")).map((h, k) => {
          h.id = `sec-${k + 1}`;
          return { title: (h.textContent ?? "").trim(), id: h.id };
        });
        const s = new XMLSerializer();
        return {
          body: Array.from(document.body.childNodes)
            .map((node) => s.serializeToString(node))
            .join(""),
          sections,
        };
      }, names);
      const title = (
        readFileSync(c.path, "utf8").match(/^# (.+)$/m)?.[1] ?? `Chapter ${i + 1}`
      ).trim();
      zip.file(`OEBPS/text/${c.xhtml}`, xhtmlDoc(manifest.language, title, body));
      const id = c.xhtml.replace(".xhtml", "");
      items.push({ id, href: `text/${c.xhtml}`, type: "application/xhtml+xml" });
      spine.push(id);
      toc.push({
        title,
        xhtml: c.xhtml,
        sections,
        ...(c.part !== undefined ? { part: c.part } : {}),
      });
    }
  } finally {
    await browser.close();
  }

  // めくって読める目次のページを、表紙のすぐ後ろに置く
  zip.file(
    "OEBPS/text/toc.xhtml",
    xhtmlDoc(
      manifest.language,
      manifest.language === "ja" ? "目次" : "Contents",
      tocPageBody(manifest.language, toc),
    ),
  );
  items.push({ id: "toc-page", href: "text/toc.xhtml", type: "application/xhtml+xml" });
  spine.splice(spine.includes("cover") ? 1 : 0, 0, "toc-page");
  const landmarks = [
    ...(spine.includes("cover")
      ? [{ type: "cover", href: "text/cover.xhtml", title: manifest.title }]
      : []),
    {
      type: "toc",
      href: "text/toc.xhtml",
      title: manifest.language === "ja" ? "目次" : "Contents",
    },
    {
      type: "bodymatter",
      href: `text/${toc[0]?.xhtml ?? "toc.xhtml"}`,
      title: manifest.language === "ja" ? "本文" : "Start",
    },
  ];
  zip.file("OEBPS/nav.xhtml", navXhtml(manifest.language, toc, landmarks));
  const modified = `${new Date().toISOString().slice(0, 19)}Z`;
  zip.file("OEBPS/content.opf", contentOpf(manifest, items, spine, modified));

  const out = join(ROOT, "dist", manifest.output ?? `${pkg.name}.epub`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      mimeType: "application/epub+zip",
    }),
  );
  console.log(
    t(
      `作成: ${relative(ROOT, out)}（${chapters.length} 章、図 ${figureCount} 点）`,
      `Built: ${relative(ROOT, out)} (${chapters.length} chapters, ${figureCount} figures)`,
    ),
  );
}

runMain(import.meta.url, main);
