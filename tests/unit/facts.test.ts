import { describe, expect, it } from "vitest";
import { facts } from "../../src/lib/facts.js";

describe("data/facts.json", () => {
  it("最終確認日は YYYY-MM-DD", () => {
    expect(facts.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("固定モデルはエイリアスではなくバージョンID", () => {
    expect(facts.model.aliases).not.toContain(facts.model.pinned);
    expect(facts.model.pinned).toMatch(/^jev-\d+\.\d+\.\d+$/);
  });

  it("package.json の SDK バージョンと一致している", async () => {
    const pkg = await import("../../package.json", { with: { type: "json" } });
    expect(pkg.default.dependencies[facts.sdk.js as "@typesafe-ai/sdk"]).toBe(facts.sdk.jsVersion);
  });
});
