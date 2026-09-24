/**
 * 記録済みレスポンスを再生して、各章のコードがパース・分岐まで正しく動くかを見る。
 * APIキー不要。CI の主力（plan.md §8）。
 */
import { describe, expect, it } from "vitest";
import { argmax, isClose, sumsToOne } from "../../src/lib/approx.js";
import { createDojo } from "../../src/lib/client.js";
import * as k04 from "../../src/steps/k04-batch.js";
import * as k05 from "../../src/steps/k05-score.js";
import * as k06 from "../../src/steps/k06-choice.js";
import * as k07 from "../../src/steps/k07-noul.js";
import * as k08 from "../../src/steps/k08-raw.js";
import * as k10 from "../../src/steps/k10-hello.js";

const replay = (step: string, model?: string) =>
  createDojo(step, { mode: "replay", ...(model ? { model } : {}) });

describe("10級", () => {
  it("noul は 0〜1 の確率", async () => {
    const { result } = await k10.run(replay(k10.STEP, "jev-latest"));
    const p = result.answers.isQuestion.noul;
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
    expect(result.usage.input_tokens).toBeGreaterThan(0);
  });
});

describe("8級", () => {
  it("生の HTTP でも同じ形の JSON が返る", async () => {
    const { status, json } = await k08.run(replay(k08.STEP));
    expect(status).toBe(200);
    expect(json.answers.isQuestion.type).toBe("noul");
    expect(typeof json.answers.isQuestion.noul).toBe("number");
  });
});

describe("7級", () => {
  it("はっきりした苦情は自動、お礼は苦情ではない", async () => {
    const rows = await k07.run(replay(k07.STEP));
    const byId = Object.fromEntries(rows.map((r) => [r.post.id, r]));
    expect(byId.p02?.action).toBe("苦情として担当へ回す");
    expect(byId.p12?.action).toBe("苦情ではない");
  });

  it("確率は許容幅で比べる（完全一致で比べない）", async () => {
    const rows = await k07.run(replay(k07.STEP));
    const p02 = rows.find((r) => r.post.id === "p02");
    expect(p02 && isClose(p02.probability, 0.9, 0.1)).toBe(true);
  });
});

describe("6級", () => {
  it("choice は一番確率が高いラベルで、確率の合計は1", async () => {
    const rows = await k06.run(replay(k06.STEP));
    for (const { answer } of rows) {
      expect(answer.choice).toBe(argmax(answer.probabilities));
      expect(sumsToOne(answer.probabilities, 0.02)).toBe(true);
      expect(Object.keys(answer.probabilities).sort()).toEqual(
        Object.keys(k06.department.criteria).sort(),
      );
    }
  });

  it("倒れた人の投稿は救護へ", async () => {
    const rows = await k06.run(replay(k06.STEP));
    expect(rows.find((r) => r.post.id === "p05")?.answer.choice).toBe("kyugo");
  });
});

describe("5級", () => {
  it("score は確率の期待値", async () => {
    const rows = await k05.run(replay(k05.STEP));
    for (const { answer } of rows) {
      const expected = Object.entries(answer.probabilities).reduce(
        (acc, [level, p]) => acc + Number(level) * p,
        0,
      );
      expect(isClose(answer.score, expected, 0.02)).toBe(true);
      expect(answer.score).toBeGreaterThanOrEqual(0);
      expect(answer.score).toBeLessThanOrEqual(k05.urgency.criteria.length - 1);
    }
  });

  it("倒れた人の投稿は最も急ぐ段階", async () => {
    const rows = await k05.run(replay(k05.STEP));
    const p05 = rows.find((r) => r.post.id === "p05");
    expect(p05 && k05.toLevel(p05.answer.score)).toBe(2);
  });
});

describe("4級", () => {
  it("まとめて聞いても3種類の答えがそろう", async () => {
    const r = await k04.run(replay(k04.STEP));
    expect(r.batched.answers.isComplaint.type).toBe("noul");
    expect(r.batched.answers.department.type).toBe("choice");
    expect(r.batched.answers.urgency.type).toBe("score");
  });

  it("まとめたほうが入力トークンが少ない（state を1回しか送らないため）", async () => {
    const r = await k04.run(replay(k04.STEP));
    expect(r.batched.usage.input_tokens).toBeLessThan(r.separateUsage.input_tokens);
  });
});

describe("fixture がない", () => {
  it("録り直しを促すメッセージで失敗する", async () => {
    const dojo = replay("k10-hello");
    await expect(
      dojo.client.systemOne({
        state: "fixture にない投稿",
        questions: { x: k07.isComplaint },
      }),
    ).rejects.toThrow(/npm run record/);
  });
});
