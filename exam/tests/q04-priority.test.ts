import { describe, expect, it } from "vitest";
import type { Answer } from "../tasks/types.js";
import { load } from "./load.js";

const { order } = await load<typeof import("../tasks/q04-priority.js")>("q04-priority");
const item = (id: string, over: Partial<Answer>) => ({
  id,
  department: "honbu",
  confidence: 0.8,
  probabilities: { honbu: 1 },
  urgency: 0,
  complaint: 0,
  ...over,
});

describe("第4問 優先度", () => {
  it("重みで並べる", () => {
    const items = [
      item("a", { urgency: 1, complaint: 0 }),
      item("b", { urgency: 0, complaint: 1 }),
    ];
    expect(order(items, { urgency: 0.9, complaint: 0.1 })).toEqual(["a", "b"]);
    expect(order(items, { urgency: 0.1, complaint: 0.9 })).toEqual(["b", "a"]);
  });

  it("重大な条件は、重みにかかわらず前に来る", () => {
    const items = [
      item("complaint", { urgency: 1.4, complaint: 1 }),
      item("lostChild", { urgency: 0.2, probabilities: { kyugo: 0.3, honbu: 0.7 } }),
      item("urgent", { urgency: 1.5 }),
    ];
    const out = order(items, { urgency: 0.1, complaint: 0.9 });
    expect(out.slice(0, 2).sort()).toEqual(["lostChild", "urgent"]);
    expect(out[2]).toBe("complaint");
  });
});
