import { readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { FIXTURES_DIR, readFixture, requestKey } from "../../src/lib/fixtures.js";

const stepDirs = readdirSync(FIXTURES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "errors")
  .map((d) => d.name);

describe("fixtures/", () => {
  for (const dir of stepDirs) {
    const files = readdirSync(join(FIXTURES_DIR, dir)).filter((f) => f.endsWith(".json"));

    it(`${dir}: ファイル名がリクエスト内容のハッシュと一致する`, () => {
      for (const f of files) {
        const fixture = readFixture(join(FIXTURES_DIR, dir, f));
        expect(`${requestKey(fixture.request)}.json`, `${dir}/${f}`).toBe(basename(f));
      }
    });

    it(`${dir}: APIキーなどの秘密が入っていない`, () => {
      for (const f of files) {
        const text = JSON.stringify(readFixture(join(FIXTURES_DIR, dir, f)));
        expect(text).not.toMatch(/authorization|bearer|api[_-]?key/i);
      }
    });
  }
});
