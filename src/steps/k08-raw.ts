/**
 * 8級 最初の1回
 * SDK を使わず、HTTP の POST をそのまま送って、返ってきた JSON を眺める。
 * curl で送るのと同じ中身（docs/kyu/08-first-call.md）。
 *
 *   npm run k08
 */

import { createDojo, type Dojo } from "../lib/client.js";
import { t } from "../lib/i18n.js";
import { getPost } from "../lib/posts.js";
import { footer, runMain, title } from "../lib/print.js";

export const STEP = "k08-raw";

export function buildBody(model: string, text: string) {
  return {
    model,
    state: text,
    questions: {
      isQuestion: {
        type: "noul",
        instructions: t(
          "この投稿は、運営への質問ですか？",
          "Is this post a question for the organizers?",
        ),
      },
    },
  };
}

export async function run(dojo: Dojo) {
  const post = getPost("p07");
  const body = buildBody(dojo.model, post.text);
  const res = await dojo.fetch("/v1/systemone", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    model: string;
    answers: { isQuestion: { type: "noul"; noul: number } };
    usage: { input_tokens: number; output_tokens: number };
  };
  return { status: res.status, body, json };
}

async function main() {
  const dojo = createDojo(STEP);
  const { status, body, json } = await run(dojo);

  title(t("8級 最初の1回", "Kyu 8: Your first call"));
  console.log(t("▼ 送ったもの（リクエストボディ）", "▼ What we sent (request body)"));
  console.log(JSON.stringify(body, null, 2));
  console.log(t(`\n▼ 返ってきたもの（HTTP ${status}）`, `\n▼ What came back (HTTP ${status})`));
  console.log(JSON.stringify(json, null, 2));
  footer(dojo, json.usage);
}

runMain(import.meta.url, main);
