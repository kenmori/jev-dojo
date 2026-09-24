import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { TypeSafeClient } from "@typesafe-ai/sdk";
import facts from "../../../data/facts.json";
import { boardQuestions } from "../../../src/lib/board";
import type { Prediction } from "../../../src/lib/evaluate";
import { route } from "../../../src/lib/lanes";

/**
 * 投稿を判定するサーバー関数。Cloudflare Workers の上で動く。
 * APIキーはサーバー側（Workers の secret）にだけ置き、ブラウザには渡さない。
 */

interface Fixture {
  meta: { source: "synthetic" | "live" };
  request: { body: { state: unknown } };
  response: { status: number; body: unknown };
}

// キーがないときのデモ用。三段〜七段と同じ、記録済みの応答をバンドルに含める
const fixtures = Object.values(
  import.meta.glob<Fixture>("../../../fixtures/board-ja/*.json", {
    eager: true,
    import: "default",
  }),
);

type Answers = {
  isComplaint: { noul: number };
  department: { choice: string; confidence: number; probabilities: Record<string, number> };
  urgency: { score: number; confidence: number };
};

export interface JudgeResult {
  mode: "live" | "demo";
  synthetic: boolean;
  model: string;
  prediction: Prediction;
  routing: ReturnType<typeof route>;
}

function toPrediction(answers: Answers, usage: Prediction["usage"]): Prediction {
  return {
    id: "input",
    complaint: answers.isComplaint.noul,
    department: answers.department.choice as Prediction["department"],
    departmentConfidence: answers.department.confidence,
    departmentProbabilities: answers.department.probabilities,
    urgency: answers.urgency.score,
    urgencyConfidence: answers.urgency.confidence,
    usage,
  };
}

export const judgePost = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const text =
      typeof input === "object" && input && "text" in input ? String(input.text).trim() : "";
    if (!text) throw new Error("投稿の文章を入れてください");
    if (text.length > 1000) throw new Error("1000文字以内にしてください");
    return { text };
  })
  .handler(async ({ data }): Promise<JudgeResult> => {
    const apiKey = (env as { TYPESAFE_API_KEY?: string }).TYPESAFE_API_KEY?.trim();

    if (!apiKey) {
      const fx = fixtures.find((f) => f.request.body.state === data.text);
      if (!fx) {
        throw new Error(
          "デモモード（APIキー未設定）では、左の見本の投稿だけ判定できます。自由な文章を試すには TYPESAFE_API_KEY を設定してください",
        );
      }
      const body = fx.response.body as {
        model: string;
        answers: Answers;
        usage: Prediction["usage"];
      };
      const prediction = toPrediction(body.answers, body.usage);
      return {
        mode: "demo",
        synthetic: fx.meta.source === "synthetic",
        model: body.model,
        prediction,
        routing: route(prediction),
      };
    }

    const client = new TypeSafeClient({ apiKey, defaultModel: facts.model.pinned });
    const r = await client.systemOne({ state: data.text, questions: boardQuestions });
    const prediction = toPrediction(r.answers, r.usage);
    return {
      mode: "live",
      synthetic: false,
      model: r.model,
      prediction,
      routing: route(prediction),
    };
  });
