import factsJson from "../../data/facts.json" with { type: "json" };

/**
 * 変わりうる値の単一ソース。
 * 本文やサンプルコードに数字を直書きせず、必ずここを経由する。
 */
export interface Facts {
  lastVerified: string;
  model: { pinned: string; aliases: string[] };
  pricing: { inputPerMtok: number; outputPerMtok: number };
  rateLimits: { tokensPerSecond: number; requestsPerMinute: number };
  context: { totalTokens: number; statePlusLongestQuestion: number };
  endpoint: string;
  sdk: { js: string; jsVersion: string; python: string };
  signup: { waitlist: boolean; startingCredit: string };
}

export const facts: Facts = factsJson;
