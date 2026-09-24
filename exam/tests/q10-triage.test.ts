import { describe, expect, it } from "vitest";
import { boardQuestions } from "../../src/lib/board.js";
import { createDojo } from "../../src/lib/client.js";
import { getPost } from "../../src/lib/posts.js";
import { load } from "./load.js";

const { triage } = await load<typeof import("../tasks/q10-triage.js")>("q10-triage");
const dojo = () => createDojo("board-ja", { mode: "replay" });

describe("第10問 総合", () => {
  for (const id of ["p02", "p05", "p09", "p16", "p25", "p45"]) {
    it(`${id} を規則どおりに仕分ける`, async () => {
      const text = getPost(id).text;
      const raw = await dojo().client.systemOne({ state: text, questions: boardQuestions });
      const d = raw.answers.department;
      const expected = {
        department: d.choice,
        lane: d.confidence >= 0.7 ? "auto" : d.confidence >= 0.4 ? "confirm" : "human",
        callNow: d.choice === "kyugo" || raw.answers.urgency.score >= 1.5,
      };
      expect(await triage(dojo(), text)).toEqual(expected);
    });
  }
});
