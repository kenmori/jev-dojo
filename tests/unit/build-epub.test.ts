import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyFootnotes,
  contentOpf,
  defaultManifest,
  fillFacts,
  groupByPart,
  insertKeyVisual,
  navXhtml,
  prepareMarkdown,
  resolveChapters,
  stableIdentifier,
  tocPageBody,
} from "../../scripts/build-epub.js";
import { ROOT } from "../../src/lib/fixtures.js";

describe("build-epub", () => {
  it("公開版の book.json は、存在する章だけを並べる（日本語・英語）", () => {
    for (const lang of ["ja", "en"] as const) {
      for (const c of resolveChapters(defaultManifest(lang), ROOT)) {
        expect(existsSync(c.path), c.path).toBe(true);
      }
    }
  });

  it("repo: はリポジトリのファイル、それ以外は book.json からの相対パス", () => {
    const [a, b] = resolveChapters(
      {
        title: "t",
        author: "a",
        language: "ja",
        chapters: [{ src: "repo:docs/glossary.md" }, { src: "x.md" }],
      },
      "/tmp/book",
    );
    expect(a?.path).toBe(join(ROOT, "docs/glossary.md"));
    expect(b?.path).toBe("/tmp/book/x.md");
    expect(b?.xhtml).toBe("ch02.xhtml");
  });

  it("目印を消し、折りたたみを囲みにし、リンクを書き換える", () => {
    const path = join(ROOT, "docs/dan/03-confidence.md");
    const byPath = new Map([[join(ROOT, "docs/kyu/06-choice.md"), "ch05.xhtml"]]);
    const md = [
      "## 見出し",
      "<!-- freshness: evergreen -->",
      "[6級](../kyu/06-choice.md) と [コード](../../src/lib/lanes.ts) と [公式](https://docs.typesafe.ai/x)",
      "<details><summary>もっと深く（プロ向け）</summary>",
      "本文",
      "</details>",
      "![図](repo:docs/_generated/charts/lab-accuracy.svg)",
    ].join("\n");
    const out = prepareMarkdown(md, path, byPath);
    expect(out.markdown).not.toContain("freshness");
    expect(out.markdown).toContain("[6級](ch05.xhtml)");
    expect(out.markdown).toContain(
      "(https://github.com/kenmori/jev-dojo/blob/main/src/lib/lanes.ts)",
    );
    expect(out.markdown).toContain("(https://docs.typesafe.ai/x)");
    expect(out.markdown).toContain(
      '<div class="deeper"><p class="deeper-title">もっと深く（プロ向け）</p>',
    );
    expect(out.markdown).not.toContain("<details");
    expect(out.images).toEqual([join(ROOT, "docs/_generated/charts/lab-accuracy.svg")]);
  });

  it("ID は同じタイトル・著者なら毎回同じ", () => {
    const m = { title: "本", author: "著者", language: "ja" as const, chapters: [] };
    expect(stableIdentifier(m)).toBe(stableIdentifier({ ...m }));
    expect(stableIdentifier(m)).toMatch(/^urn:uuid:[0-9a-f-]{36}$/);
    expect(stableIdentifier({ ...m, identifier: "urn:isbn:1" })).toBe("urn:isbn:1");
  });

  it("content.opf と目次に、章と書誌情報が入る", () => {
    const m = { title: "本 & 題", author: "著者", language: "ja" as const, chapters: [] };
    const opf = contentOpf(
      m,
      [{ id: "ch01", href: "text/ch01.xhtml", type: "application/xhtml+xml" }],
      ["ch01"],
      "2026-09-24T00:00:00Z",
    );
    expect(opf).toContain("<dc:title>本 &amp; 題</dc:title>");
    expect(opf).toContain('<itemref idref="ch01"/>');
    expect(opf).toContain('<meta property="dcterms:modified">2026-09-24T00:00:00Z</meta>');
    expect(navXhtml("en", [{ title: "Kyu 10", xhtml: "ch01.xhtml" }])).toContain(
      '<a href="text/ch01.xhtml">Kyu 10</a>',
    );
  });
});

describe("目次", () => {
  const entries = [
    { title: "はじめに", xhtml: "ch01.xhtml" },
    {
      title: "第1章",
      xhtml: "ch02.xhtml",
      part: "第1部",
      sections: [{ title: "節 & 1", id: "sec-1" }],
    },
    { title: "第2章", xhtml: "ch03.xhtml" },
    { title: "付録A", xhtml: "ch04.xhtml", part: "付録" },
    { title: "奥付", xhtml: "ch05.xhtml", part: "" },
  ];

  it("part のある章から部が始まり、空文字の章は部の外に出る", () => {
    expect(groupByPart(entries).map((g) => [g.part, g.chapters.map((c) => c.title)])).toEqual([
      [undefined, ["はじめに"]],
      ["第1部", ["第1章", "第2章"]],
      ["付録", ["付録A"]],
      [undefined, ["奥付"]],
    ]);
  });

  it("メニューの目次は部 → 章 → 見出しの入れ子にし、landmarks を付ける", () => {
    const nav = navXhtml("ja", entries, [{ type: "toc", href: "text/toc.xhtml", title: "目次" }]);
    expect(nav).toContain(
      '<li><a href="text/ch02.xhtml">第1部</a><ol><li><a href="text/ch02.xhtml">第1章</a>',
    );
    expect(nav).toContain('<a href="text/ch02.xhtml#sec-1">節 &amp; 1</a>');
    expect(nav).toContain('<nav epub:type="landmarks"');
    expect(nav).toContain('<a epub:type="toc" href="text/toc.xhtml">目次</a>');
  });

  it("目次のページは部 → 章の 2 段で、見出しは入れない", () => {
    const page = tocPageBody("ja", entries);
    expect(page).toContain('<p class="toc-part">第1部</p>');
    expect(page).toContain('<a href="ch03.xhtml">第2章</a>');
    expect(page).not.toContain("sec-1");
  });
});

describe("insertKeyVisual", () => {
  it("章の見出しのすぐ下に画像を入れ、ほかの見出しには入れない", () => {
    const md = "# 第5章 Noul\n\n本文\n\n## 節\n";
    const out = insertKeyVisual(md, "../images/ch05-key.png", "第5章 Noulの扉の絵");
    expect(out).toBe(
      "# 第5章 Noul\n\n![第5章 Noulの扉の絵](../images/ch05-key.png)\n\n\n本文\n\n## 節\n",
    );
  });
});

describe("fillFacts", () => {
  it("{{facts.…}} を facts.json の値に置き換える", () => {
    const src = { lastVerified: "2026-01-01", model: { pinned: "jev-9" } };
    expect(fillFacts("検証日 {{facts.lastVerified}}／{{facts.model.pinned}}", src)).toBe(
      "検証日 2026-01-01／jev-9",
    );
  });
  it("ない値やオブジェクトはエラーにする", () => {
    expect(() => fillFacts("{{facts.nope}}", {})).toThrow();
    expect(() => fillFacts("{{facts.model}}", { model: { a: 1 } })).toThrow();
  });
});

describe("applyFootnotes", () => {
  it("[^key] を出てくる順に ※1, ※2 にし、章の終わりに注をまとめる", () => {
    const md = "Jev[^a] と API[^b]。もう一度 Jev[^a]。\n\n[^b]: 窓口\n[^a]: モデル\n";
    const out = applyFootnotes(md);
    expect(out).toContain('href="#fn-1" id="fnref-1">※1</a>');
    expect(out).toContain('href="#fn-2" id="fnref-2">※2</a>');
    expect(out).toContain('href="#fn-1" id="fnref-3">※1</a>');
    expect(out).toContain(
      '<p class="footnote" epub:type="endnote" id="fn-1"><a href="#fnref-1">※1</a>　モデル</p>',
    );
    // 2 つ目の注は、本文で最初に出てきた ※2（fnref-2）へ戻る
    expect(out).toContain('<a href="#fnref-2">※2</a>　窓口');
    expect(out).toContain('<section class="footnotes" epub:type="endnotes">');
    expect(out).not.toContain("<aside");
    expect(out).not.toContain("[^b]:");
  });
  it("説明のない注はエラーにする", () => {
    expect(() => applyFootnotes("Jev[^x]")).toThrow();
  });
  it("注がなければ何も足さない", () => {
    expect(applyFootnotes("本文だけ")).toBe("本文だけ");
  });
});
