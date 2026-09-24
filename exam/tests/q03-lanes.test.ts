import { describe, expect, it } from "vitest";
import type { Answer } from "../tasks/types.js";
import { load } from "./load.js";

const { laneFor } = await load<typeof import("../tasks/q03-lanes.js")>("q03-lanes");
const t = { auto: 0.7, confirm: 0.4, safetyFloor: 0.2 };
const a = (over: Partial<Answer>): Answer => ({
  department: "honbu",
  confidence: 0.8,
  probabilities: { honbu: 0.9, kyugo: 0.05 },
  urgency: 0,
  complaint: 0,
  ...over,
});

describe("第3問 3レーン", () => {
  it("境界値を含めて正しく分ける", () => {
    expect(laneFor(a({ confidence: 0.7 }), t).lane).toBe("auto");
    expect(laneFor(a({ confidence: 0.69 }), t).lane).toBe("confirm");
    expect(laneFor(a({ confidence: 0.4 }), t).lane).toBe("confirm");
    expect(laneFor(a({ confidence: 0.39 }), t).lane).toBe("human");
  });

  it("救護の可能性があれば知らせる。担当が救護なら知らせない", () => {
    expect(laneFor(a({ probabilities: { honbu: 0.7, kyugo: 0.2 } }), t).notifyKyugo).toBe(true);
    expect(laneFor(a({ probabilities: { honbu: 0.8, kyugo: 0.19 } }), t).notifyKyugo).toBe(false);
    expect(laneFor(a({ department: "kyugo", probabilities: { kyugo: 0.9 } }), t).notifyKyugo).toBe(
      false,
    );
  });
});
