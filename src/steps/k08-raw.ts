/**
 * 8級 最初の1回
 * SDK を使わず、HTTP の POST をそのまま送って、返ってきた JSON を眺める。
 * curl で送るのと同じ中身（docs/kyu/08-first-call.md）。
 *
 *   npm run k08
 */
import { createDojo, type Dojo } from "../lib/client.js";
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
        instructions: "この投稿は、運営への質問ですか？",
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

  title("8級 最初の1回");
  console.log("▼ 送ったもの（リクエストボディ）");
  console.log(JSON.stringify(body, null, 2));
  console.log(`\n▼ 返ってきたもの（HTTP ${status}）`);
  console.log(JSON.stringify(json, null, 2));
  footer(dojo, json.usage);
}

runMain(import.meta.url, main);
