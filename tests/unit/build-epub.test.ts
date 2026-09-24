import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyFootnotes,
  contentOpf,
  defaultManifest,
  fillFacts,
  navXhtml,
  prepareMarkdown,
  resolveChapters,
  stableIdentifier,
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
      '<aside class="footnote" epub:type="footnote" id="fn-1"><p>※1　モデル</p></aside>',
    );
    expect(out).not.toContain("[^b]:");
  });
  it("説明のない注はエラーにする", () => {
    expect(() => applyFootnotes("Jev[^x]")).toThrow();
  });
  it("注がなければ何も足さない", () => {
    expect(applyFootnotes("本文だけ")).toBe("本文だけ");
  });
});
