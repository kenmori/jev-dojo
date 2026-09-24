import { describe, expect, it } from "vitest";
import { load } from "./load.js";

const { buildState } = await load<typeof import("../tasks/q02-state.js")>("q02-state");

describe("第2問 state の設計", () => {
  it("本文と投稿者を名前付きのフィールドに入れる", () => {
    const s = buildState("ごみ箱があふれています", "りょう");
    expect(s.post).toEqual({ text: "ごみ箱があふれています", author: "りょう" });
    expect(s.board.name).toBe("地域のお祭り掲示板");
  });

  it("余計なフィールドを足さない", () => {
    expect(Object.keys(buildState("a", "b")).sort()).toEqual(["board", "post"]);
  });
});
