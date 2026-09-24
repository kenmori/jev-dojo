import { boardQuestions } from "../../src/lib/board.js";
import type { Dojo } from "../../src/lib/client.js";
import type { Lane } from "./types.js";

export async function triage(
  dojo: Dojo,
  text: string,
): Promise<{ department: string; lane: Lane; callNow: boolean }> {
  const r = await dojo.client.systemOne({ state: text, questions: boardQuestions });
  const { department, urgency } = r.answers;
  const lane: Lane =
    department.confidence >= 0.7 ? "auto" : department.confidence >= 0.4 ? "confirm" : "human";
  return {
    department: department.choice,
    lane,
    callNow: department.choice === "kyugo" || urgency.score >= 1.5,
  };
}
