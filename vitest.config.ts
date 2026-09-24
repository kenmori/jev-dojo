import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", include: ["tests/unit/**/*.test.ts"] } },
      { test: { name: "contract", include: ["tests/contract/**/*.test.ts"] } },
      { test: { name: "eval", include: ["tests/eval/**/*.test.ts"], testTimeout: 60_000 } },
      { test: { name: "exam", include: ["exam/tests/**/*.test.ts"] } },
    ],
  },
});
