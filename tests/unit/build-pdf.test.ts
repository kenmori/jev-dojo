import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAPTERS, rewrite } from "../../scripts/build-pdf.js";
import { ROOT } from "../../src/lib/fixtures.js";

const known = new Set(CHAPTERS.map((c) => c.file));

describe("build-pdf", () => {
  it("PDF に入れる章のファイルがすべて存在する", () => {
    for (const c of CHAPTERS) expect(existsSync(join(ROOT, c.file)), c.file).toBe(true);
  });

  it("章へのリンクは PDF 内のリンクに、コードへのリンクは GitHub の URL にする", () => {
    const md = rewrite(
      "[7級](../kyu/07-noul.md) と [コード](../../src/lib/lanes.ts)",
      "docs/dan/03-confidence.md",
      known,
    );
    expect(md).toContain("(#ch-kyu-07-noul-md)");
    expect(md).toContain("(https://github.com/kenmori/jev-dojo/blob/main/src/lib/lanes.ts)");
  });

  it("外部リンクはそのまま、折りたたみは開いた状態にする", () => {
    const md = rewrite(
      "[公式](https://docs.typesafe.ai/api)\n<details><summary>x</summary>",
      "docs/x.md",
      known,
    );
    expect(md).toContain("(https://docs.typesafe.ai/api)");
    expect(md).toContain("<details open>");
  });

  it("図は埋め込む", () => {
    const md = rewrite("![図](charts/lab-accuracy.svg)", "docs/_generated/lab-ja-en.md", known);
    expect(md).toContain('<div class="figure"');
    expect(md).toContain("<svg");
  });
});
