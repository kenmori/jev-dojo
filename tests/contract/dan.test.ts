/**
 * 段・高段・応用の章を、記録済みレスポンスで再生して動きを確かめる。
 */
import { describe, expect, it } from "vitest";
import { exampleLabels } from "../../src/lib/board.js";
import { createDojo } from "../../src/lib/client.js";
import { boardDojo, predictAll, summarize } from "../../src/lib/evaluate.js";
import { LANG } from "../../src/lib/i18n.js";
import { compareLanguages } from "../../src/lib/reports.js";
import * as care from "../../src/steps/care.js";
import * as d1 from "../../src/steps/d1-state.js";
import * as d2 from "../../src/steps/d2-instructions.js";
import * as d3 from "../../src/steps/d3-lanes.js";
import * as d4 from "../../src/steps/d4-patterns.js";
import * as d5 from "../../src/steps/d5-boundary.js";
import * as d9 from "../../src/steps/d9-production.js";
import * as d10 from "../../src/steps/d10-limits.js";
import * as ob from "../../src/steps/ob-two-layer.js";

const replay = (step: string) => createDojo(step, { mode: "replay" });

describe("初段", () => {
  it("詰め込んだ state は入力トークンが一番多い", async () => {
    const rows = await d1.run(replay(d1.STEP));
    const tokens = Object.fromEntries(rows.map((r) => [r.variant, r.usage.input_tokens]));
    expect(tokens.overloaded).toBeGreaterThan(tokens.structured ?? 0);
    expect(tokens.overloaded).toBeGreaterThan(tokens.textOnly ?? 0);
  });
});

describe("二段", () => {
  it("sonota を足した質問は、sonota の確率を返す", async () => {
    const { noMatch } = await d2.run(replay(d2.STEP));
    for (const r of noMatch) {
      expect(Object.keys(r.withOther.probabilities)).toContain("sonota");
      expect(Object.keys(r.without.probabilities)).not.toContain("sonota");
    }
  });
});

describe("三段", () => {
  it("全件がどれかのレーンに入る", async () => {
    const { rows } = await d3.run(boardDojo(LANG, { mode: "replay" }));
    expect(rows).toHaveLength(60);
    for (const r of rows) expect(["auto", "confirm", "human"]).toContain(r.routing.lane);
  });
});

describe("四段", () => {
  it("intent ごとに処理が決まり、優先度で並べられる", async () => {
    const { intents, predictions } = await d4.run(
      replay(d4.STEP),
      boardDojo(LANG, { mode: "replay" }),
    );
    expect(intents).toHaveLength(d4.INTENT_POSTS.length);
    for (const r of intents) expect(r.action.length).toBeGreaterThan(0);
    const ranked = d4.rank(predictions);
    expect(ranked[0]?.priority).toBeGreaterThanOrEqual(ranked.at(-1)?.priority ?? 1);
  });
});

describe.runIf(LANG === "ja")("四段 もう一歩（救護が要るか・日本語の書籍だけ）", () => {
  it("救護の Noul と担当の Choice で、先頭に出す投稿を比べられる", async () => {
    const { rows } = await care.run(replay(care.STEP), boardDojo("ja", { mode: "replay" }));
    expect(rows).toHaveLength(60);
    for (const r of rows) expect(r.needsCare).toBeGreaterThanOrEqual(0);
    // 迷子が見つかったお礼は「救護が要る」が高く出るが、急ぎ度が低いので先頭には出ない
    const p50 = rows.find((r) => r.id === "p50");
    expect(p50?.needsCare).toBeGreaterThanOrEqual(care.CARE_MIN);
    expect(p50?.byNoul).toBe(false);
    expect(rows.filter((r) => r.byNoul).length).toBeGreaterThan(0);
  });
});

describe("五段", () => {
  it("Jev に送る state から電話番号が消えている", async () => {
    const { classified } = await d5.run(replay(d5.STEP));
    for (const c of classified) expect(c.masked).not.toMatch(/\d{3}-\d{4}-\d{4}/);
  });
});

describe("七段・八段", () => {
  it("日英とも60件そろい、指標が 0〜1 に収まる", async () => {
    const ja = await predictAll(boardDojo("ja", { mode: "replay" }), "ja");
    const en = await predictAll(boardDojo("en", { mode: "replay" }), "en");
    const s = summarize(ja, exampleLabels.items);
    expect(s.n).toBe(60);
    expect(s.complaint.brier).toBeGreaterThanOrEqual(0);
    expect(s.complaint.brier).toBeLessThanOrEqual(1);
    const c = compareLanguages(ja, en, exampleLabels.items);
    expect(c.departmentAgreement).toBeGreaterThanOrEqual(0);
    expect(c.departmentAgreement).toBeLessThanOrEqual(1);
  });
});

describe("九段", () => {
  it("全件を処理し、1件1行のログを残す。予算を超えたら止まる", async () => {
    const r = await d9.run(boardDojo(LANG, { mode: "replay" }), {
      ...d9.DEFAULT_OPTIONS,
      perMinute: 10_000,
    });
    expect(r.results.every((x) => x.ok)).toBe(true);
    expect(r.logs).toHaveLength(60);
    expect(JSON.stringify(r.logs)).not.toMatch(/花火|fireworks/);
    await expect(
      d9.run(boardDojo(LANG, { mode: "replay" }), {
        concurrency: 1,
        perMinute: 10_000,
        budgetUSD: 0,
      }),
    ).rejects.toThrow(/予算|Budget/);
  });
});

describe("十段", () => {
  it("インジェクションの投稿はコードの検査で人に回る", async () => {
    const { injection } = await d10.run(replay(d10.STEP));
    for (const r of injection) expect(r.flagged).toBe(true);
  });
});

describe("応用B", () => {
  it("救護は下書きを作らず、下書きには Jev の検査が付く", async () => {
    const dojo = replay(ob.STEP);
    const rows = await ob.run(dojo, ob.createClaude("replay"));
    expect(rows.find((r) => r.post.id === "p05")?.plan.kind).toBe("callNow");
    for (const r of rows.filter((x) => x.draft)) {
      expect(r.check?.noPromise).toBeGreaterThanOrEqual(0);
    }
  });
});
