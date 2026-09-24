import { describe, expect, it } from "vitest";
import { load } from "./load.js";

const { maskPersonalInfo } = await load<typeof import("../tasks/q05-mask.js")>("q05-mask");

describe("第5問 個人情報を隠す", () => {
  it("電話番号", () => {
    expect(maskPersonalInfo("連絡は090-1234-5678まで")).toBe("連絡は［電話番号］まで");
    expect(maskPersonalInfo("03-1234-5678")).toBe("［電話番号］");
    expect(maskPersonalInfo("09012345678です")).toBe("［電話番号］です");
  });

  it("メールアドレス", () => {
    expect(maskPersonalInfo("taro.y+fes@example.co.jp へ")).toBe("［メール］ へ");
  });

  it("それ以外は変えない", () => {
    expect(maskPersonalInfo("財布を2つ拾いました（午後3時）")).toBe(
      "財布を2つ拾いました（午後3時）",
    );
  });
});
