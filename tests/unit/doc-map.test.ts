import { describe, expect, it } from "vitest";
import { diffPages, diffToMarkdown, parseLlmsTxt } from "../../scripts/sync-doc-map.js";

const sample = `# TypeSafe

## Docs

- [Introduction](https://docs.typesafe.ai/introduction.md): What TypeSafe is
- [Noul](https://docs.typesafe.ai/primitives/noul.md): Yes/no questions
- [Legal](https://docs.typesafe.ai/legal.md)
`;

describe("parseLlmsTxt", () => {
  it("リンク行だけを拾う", () => {
    const pages = parseLlmsTxt(sample);
    expect(pages).toHaveLength(3);
    expect(pages[1]).toEqual({
      title: "Noul",
      url: "https://docs.typesafe.ai/primitives/noul.md",
      description: "Yes/no questions",
    });
    expect(pages[2]?.description).toBe("");
  });
});

describe("diffPages", () => {
  const a = { title: "A", url: "u/a", description: "x" };
  const b = { title: "B", url: "u/b", description: "y" };

  it("追加・削除・説明の変更を見分ける", () => {
    const diff = diffPages(
      [a, b],
      [
        { ...a, description: "x2" },
        { title: "C", url: "u/c", description: "" },
      ],
    );
    expect(diff.added.map((p) => p.url)).toEqual(["u/c"]);
    expect(diff.removed.map((p) => p.url)).toEqual(["u/b"]);
    expect(diff.changed.map((c) => c.after.description)).toEqual(["x2"]);
  });

  it("差分がなければ Markdown は空", () => {
    expect(diffToMarkdown(diffPages([a], [a]))).toBe("");
  });
});
