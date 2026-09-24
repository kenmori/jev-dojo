import { describe, expect, it } from "vitest";
import { load } from "./load.js";

const { departmentQuestion } =
  await load<typeof import("../tasks/q01-question.js")>("q01-question");

describe("第1問 担当部署の Choice", () => {
  it("type は choice で、instructions がある", () => {
    const q = departmentQuestion();
    expect(q.type).toBe("choice");
    expect(typeof q.instructions === "string" && q.instructions.trim().length > 0).toBe(true);
  });

  it("逃げ道の sonota を含む6つの選択肢", () => {
    expect(Object.keys(departmentQuestion().criteria).sort()).toEqual(
      ["honbu", "kotsu", "kyugo", "otoshimono", "sonota", "yatai"].sort(),
    );
  });

  it("すべての選択肢に説明がある", () => {
    for (const d of Object.values(departmentQuestion().criteria)) {
      expect(typeof d === "string" && d.trim().length > 0).toBe(true);
    }
  });
});
