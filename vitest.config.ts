import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", include: ["tests/unit/**/*.test.ts"] } },
      { test: { name: "contract", include: ["tests/contract/**/*.test.ts"] } },
      // 英語モード（JEV_LANG=en）でも、同じ contract テストが通ることを確かめる
      {
        test: {
          name: "contract-en",
          include: ["tests/contract/steps.test.ts", "tests/contract/dan.test.ts"],
          env: { JEV_LANG: "en" },
        },
      },
      { test: { name: "eval", include: ["tests/eval/**/*.test.ts"], testTimeout: 60_000 } },
      { test: { name: "exam", include: ["exam/tests/**/*.test.ts"] } },
    ],
  },
});
