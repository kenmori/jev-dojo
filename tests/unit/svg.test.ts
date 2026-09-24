import { describe, expect, it } from "vitest";
import { barChart, groupedBarChart, reliabilityDiagram } from "../../src/lib/svg.js";

describe("svg", () => {
  it("棒グラフは値を表示し、ラベルをエスケープする", () => {
    const svg = barChart("t", [{ label: "<a&b>", value: 0.42 }]);
    expect(svg).toContain("0.42");
    expect(svg).toContain("&lt;a&amp;b&gt;");
    expect(svg.startsWith("<svg")).toBe(true);
  });

  it("グループ棒グラフは系列ごとに棒を描く", () => {
    const svg = groupedBarChart(
      "t",
      ["x", "y"],
      [
        { name: "ja", values: [0.5, 0.6] },
        { name: "en", values: [0.7, Number.NaN] },
      ],
    );
    // 凡例2つ ＋ 棒4本
    expect(svg.match(/fill="#(2563eb|f59e0b)"/g)?.length).toBe(6);
    expect(svg).not.toContain("NaN");
  });

  it("信頼度曲線は件数0のビンを描かない", () => {
    const svg = reliabilityDiagram("t", [
      {
        name: "ja",
        points: [
          { meanPredicted: 0.1, observed: 0.2, count: 3 },
          { meanPredicted: Number.NaN, observed: Number.NaN, count: 0 },
        ],
      },
    ]);
    expect(svg.match(/<circle/g)?.length).toBe(1);
    expect(svg).not.toContain("NaN");
  });
});
