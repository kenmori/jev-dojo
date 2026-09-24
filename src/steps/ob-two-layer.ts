/**
 * 応用B LLMとの二層構成（Jevが決め、LLMが書く）
 *
 *   1. Jev が判断する（担当・緊急度・苦情かどうか）
 *   2. コードが方針を決める（返信するか、人に回すか）
 *   3. LLM（Claude）が返信の下書きを書く
 *   4. Jev が下書きを検査する（できない約束をしていないか）
 *
 *   npm run ob
 */
import Anthropic from "@anthropic-ai/sdk";
import { noul } from "@typesafe-ai/sdk";
import { boardQuestions } from "../lib/board.js";
import { createDojo, type Dojo } from "../lib/client.js";
import { sumUsage } from "../lib/cost.js";
import { loadDotEnv } from "../lib/env.js";
import type { Prediction } from "../lib/evaluate.js";
import { createRecordingFetch, createReplayFetch, type Mode } from "../lib/fixtures.js";
import { getPost } from "../lib/posts.js";
import { footer, runMain, title } from "../lib/print.js";
import { route } from "./d3-lanes.js";
import { intentQuestions } from "./d4-patterns.js";

export const STEP = "ob-two-layer";
export const CLAUDE_STEP = "ob-two-layer-claude";
export const CLAUDE_MODEL = "claude-opus-5";

export const POST_IDS = ["p02", "p05", "p09", "p12", "p25"] as const;

const DEPARTMENT_NAMES: Record<string, string> = {
  honbu: "運営本部",
  yatai: "屋台・出店係",
  kotsu: "交通・駐車場係",
  otoshimono: "落とし物係",
  kyugo: "救護・安全係",
  sonota: "運営本部",
};

export type Plan =
  | { kind: "callNow"; reason: string }
  | { kind: "noReply"; reason: string }
  | { kind: "draft"; department: string; tone: "apology" | "answer" | "thanks" };

/** 1回のリクエストで、仕分けの3問と「投稿の目的」（四段の intent）を聞く */
export const questions = { ...boardQuestions, intent: intentQuestions.intent } as const;

export type Intent = keyof typeof intentQuestions.intent.criteria;

/** 方針はコードで決める。LLM に「返信するべきか」を考えさせない */
export function plan(p: Prediction, intent: Intent): Plan {
  if (p.department === "kyugo" || p.urgency >= 1.5) {
    return { kind: "callNow", reason: "安全にかかわる。下書きを待たず、すぐ人が対応する" };
  }
  if (p.department === "sonota" || intent === "none") {
    return { kind: "noReply", reason: "お祭りと関係のない投稿" };
  }
  if (route(p).lane === "human") {
    return { kind: "noReply", reason: "判断に迷いがあるので、人が読んでから返信する" };
  }
  const department = DEPARTMENT_NAMES[p.department] ?? "運営本部";
  if (intent === "thanks") return { kind: "draft", department, tone: "thanks" };
  if (intent === "fix" || p.complaint >= 0.5) return { kind: "draft", department, tone: "apology" };
  return { kind: "draft", department, tone: "answer" };
}

const TONE: Record<"apology" | "answer" | "thanks", string> = {
  apology: "不便をかけたことへのお詫びと、担当に伝えたことを伝える",
  answer: "問い合わせを受け付けたことと、担当から案内することを伝える",
  thanks: "投稿へのお礼を伝える",
};

/** LLM に渡すのは「決まったこと」だけ。判断の材料をもう一度考えさせない */
export function buildPrompt(postText: string, p: Extract<Plan, { kind: "draft" }>) {
  return {
    system: [
      "あなたは地域のお祭りの運営スタッフとして、掲示板の投稿への返信の下書きを書きます。",
      "日本語で、2〜3文、やわらかく丁寧に書いてください。",
      "日時・金額・対応の結果など、投稿にない事実は書かないでください。できるかどうかわからない約束もしないでください。",
      "下書きの本文だけを出力してください。",
    ].join("\n"),
    user: `投稿:\n${postText}\n\n担当: ${p.department}\n返信の目的: ${TONE[p.tone]}`,
  };
}

export const draftCheck = {
  noPromise: noul(
    "`draft` は、`post` に書かれていない事実や、できるかどうかわからない約束を含んでいませんか？",
    {
      true: "含んでいない。受付・お礼・お詫び・担当への連絡の範囲にとどまっている",
      false: "日時・結果・対応内容などを、根拠なく約束したり断定したりしている",
    },
  ),
  fitsPost: noul("`draft` は、`post` への返信として内容がかみ合っていますか？"),
} as const;

export function createClaude(mode: Mode): Anthropic {
  loadDotEnv();
  if (mode === "replay") {
    return new Anthropic({
      apiKey: "replay-mode-no-key",
      fetch: createReplayFetch(CLAUDE_STEP),
      maxRetries: 0,
    });
  }
  return new Anthropic(mode === "record" ? { fetch: createRecordingFetch(CLAUDE_STEP) } : {});
}

export async function writeDraft(
  claude: Anthropic,
  postText: string,
  p: Extract<Plan, { kind: "draft" }>,
) {
  const prompt = buildPrompt(postText, p);
  const response = await claude.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    output_config: { effort: "low" },
    // 安全分類器に断られたときに、サーバー側で別のモデルに回す
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });
  if (response.stop_reason === "refusal") return { text: undefined, usage: response.usage };
  const text = response.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("")
    .trim();
  return { text, usage: response.usage };
}

export async function judge(dojo: Dojo, id: string, text: string) {
  const r = await dojo.client.systemOne({ state: text, questions });
  const { isComplaint, department, urgency, intent } = r.answers;
  const prediction: Prediction = {
    id,
    complaint: isComplaint.noul,
    department: department.choice,
    departmentConfidence: department.confidence,
    departmentProbabilities: { ...department.probabilities },
    urgency: urgency.score,
    urgencyConfidence: urgency.confidence,
    usage: r.usage,
  };
  return { prediction, intent: intent.choice };
}

export async function run(dojo: Dojo, claude: Anthropic) {
  const rows = [];
  for (const id of POST_IDS) {
    const post = getPost(id);
    const { prediction, intent } = await judge(dojo, id, post.text);
    const decided = plan(prediction, intent);
    if (decided.kind !== "draft") {
      rows.push({
        post,
        prediction,
        intent,
        plan: decided,
        draft: undefined,
        check: undefined,
        jevUsage: [prediction.usage],
      });
      continue;
    }
    const draft = await writeDraft(claude, post.text, decided);
    if (!draft.text) {
      rows.push({
        post,
        prediction,
        intent,
        plan: decided,
        draft: undefined,
        check: undefined,
        jevUsage: [prediction.usage],
      });
      continue;
    }
    const c = await dojo.client.systemOne({
      state: { post: post.text, draft: draft.text },
      questions: draftCheck,
    });
    rows.push({
      post,
      prediction,
      intent,
      plan: decided,
      draft: draft.text,
      check: { noPromise: c.answers.noPromise.noul, fitsPost: c.answers.fitsPost.noul },
      jevUsage: [prediction.usage, c.usage],
    });
  }
  return rows;
}

async function main() {
  const dojo = createDojo(STEP);
  const claude = createClaude(dojo.mode);
  const rows = await run(dojo, claude);

  title("応用B LLMとの二層構成");
  for (const r of rows) {
    console.log(`${r.post.id} 「${r.post.text}」`);
    console.log(
      `  Jev: 目的 ${r.intent} ／ 担当 ${r.prediction.department} ／ 緊急度 ${r.prediction.urgency.toFixed(2)} ／ 苦情 ${r.prediction.complaint.toFixed(2)}`,
    );
    if (r.plan.kind !== "draft") {
      console.log(
        `  コード: ${r.plan.kind === "callNow" ? "すぐ人が対応" : "返信しない"}（${r.plan.reason}）\n`,
      );
      continue;
    }
    console.log(`  コード: 下書きを作る（${r.plan.department}、${r.plan.tone}）`);
    console.log(`  Claude: ${r.draft ?? "（生成されず）"}`);
    if (r.check) {
      const ok = r.check.noPromise >= 0.8 && r.check.fitsPost >= 0.8;
      console.log(
        `  Jev の検査: 約束なし ${r.check.noPromise.toFixed(2)} ／ かみ合い ${r.check.fitsPost.toFixed(2)} → ${ok ? "下書きとして担当に渡す" : "人が書き直す"}`,
      );
    }
    console.log("");
  }
  console.log(
    "※ Claude の費用は Jev とは別に、Anthropic の料金でかかります（下の表示は Jev 分のみ）",
  );
  footer(dojo, sumUsage(...rows.flatMap((r) => r.jevUsage)));
}

runMain(import.meta.url, main);
