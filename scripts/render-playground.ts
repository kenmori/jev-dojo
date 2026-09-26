/**
 * 記録済みのリクエスト（fixtures/）から、TypeSafe の Playground にそのまま貼れる JSON のページを作る。
 *
 * - docs/_generated/playground.md
 *
 *   npm run playground            # 生成
 *   npm run playground -- --check # 生成物が最新か確認するだけ（CI 用）
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { facts } from "../src/lib/facts.js";
import { FIXTURES_DIR, ROOT } from "../src/lib/fixtures.js";
import { runMain } from "../src/lib/print.js";

const OUT = join(ROOT, "docs", "_generated", "playground.md");

/** 本の章の順。dir は fixtures/ の下のフォルダ、anchor はページ内リンクの名前 */
export const SECTIONS = [
  { dir: "k10-hello", anchor: "k10", title: "第 3 章 最初の質問（npm run k10）" },
  { dir: "k08-raw", anchor: "k08", title: "第 4 章 注文票を TypeScript で送る（npm run k08）" },
  { dir: "k07-noul", anchor: "k07", title: "第 5 章 はい・いいえで聞く（npm run k07）" },
  { dir: "k06-choice", anchor: "k06", title: "第 6 章 選ばせる（npm run k06）" },
  { dir: "k05-score", anchor: "k05", title: "第 7 章 点をつけさせる（npm run k05）" },
  { dir: "k04-batch", anchor: "k04", title: "第 8 章 まとめて聞く（npm run k04）" },
  { dir: "d1-state", anchor: "d1", title: "第 9 章 state ― 何を渡すか（npm run d1）" },
  { dir: "d2-instructions", anchor: "d2", title: "第 10 章 質問文と基準（npm run d2）" },
  {
    dir: "board-ja",
    anchor: "board-ja",
    title: "第 10〜15 章 本番用の質問と 60 件の投稿（npm run show、d3、d7）",
  },
  { dir: "d4-intent", anchor: "d4", title: "第 12 章 目的を聞いて振り分ける（npm run d4）" },
  {
    dir: "d4-care",
    anchor: "care",
    title: "第 12 章 もう一歩: 救護が要るかを Noul で聞く（npm run care）",
  },
  { dir: "d5-boundary", anchor: "d5", title: "第 13 章 落とし物の照合（npm run d5）" },
  { dir: "board-en", anchor: "board-en", title: "第 16 章 英語の投稿（npm run d8）" },
  { dir: "d10-limits", anchor: "d10", title: "第 17 章 判定を操作しようとする投稿（npm run d10）" },
] as const;

type Body = { state: unknown; questions: Record<string, unknown>; model?: string };
type Post = { id: string; text: string };

const posts: Post[] = [
  ...JSON.parse(readFileSync(join(ROOT, "data", "posts.ja.json"), "utf8")),
  ...JSON.parse(readFileSync(join(ROOT, "data", "posts.en.json"), "utf8")),
];

/** state の中の投稿の文章 */
function postText(state: unknown): string | undefined {
  if (typeof state === "string") return state;
  const text = (state as { post?: { text?: unknown } })?.post?.text;
  return typeof text === "string" ? text : undefined;
}

function label(state: unknown): string {
  const text = postText(state) ?? "";
  const post = posts.find((p) => p.text === text);
  const short = text.length > 40 ? `${text.slice(0, 40)}…` : text;
  const extra =
    typeof state === "object" && state !== null
      ? "history" in state
        ? "（C 全部詰め込む）"
        : "board" in state
          ? "（B 前提を足す）"
          : ""
      : "";
  return `${post ? `${post.id} ` : ""}「${short}」${extra}`;
}

const sortKey = (state: unknown) => {
  const text = postText(state);
  const id = posts.find((p) => p.text === text)?.id ?? "p99";
  const size = JSON.stringify(state).length;
  return `${id}-${String(size).padStart(8, "0")}`;
};

/** Playground の State の欄は JSON のオブジェクトなので、文字列の state は { "post": … } に包む */
const playgroundState = (state: unknown) => (typeof state === "string" ? { post: state } : state);

const json = (v: unknown) => `\`\`\`json\n${JSON.stringify(v, null, 2)}\n\`\`\``;

function readBodies(dir: string): Body[] {
  const path = join(FIXTURES_DIR, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(path, f), "utf8")))
    .filter((fx) => fx.meta?.source === "live" && fx.request?.path === "/v1/systemone")
    .map((fx) => fx.request.body as Body);
}

export function renderSection(s: (typeof SECTIONS)[number], bodies: Body[]): string {
  // 質問の組み合わせごとにまとめる
  const groups = new Map<string, { questions: Body["questions"]; bodies: Body[] }>();
  for (const b of bodies) {
    const key = JSON.stringify(b.questions);
    const g = groups.get(key) ?? { questions: b.questions, bodies: [] };
    g.bodies.push(b);
    groups.set(key, g);
  }
  let out = `\n<a id="${s.anchor}"></a>\n\n## ${s.title}\n`;
  let n = 0;
  const count = (q: Body["questions"]) => Object.keys(q).length;
  for (const { questions, bodies: group } of [...groups.values()].sort(
    (a, b) => count(a.questions) - count(b.questions),
  )) {
    n += 1;
    const names = Object.keys(questions).join("、");
    if (groups.size > 1) out += `\n### 質問 ${n}: ${names}\n`;
    out += `\n**Questions** に貼る\n\n${json(questions)}\n`;
    const states = [...new Map(group.map((b) => [JSON.stringify(b.state), b.state])).values()].sort(
      (a, b) => sortKey(a).localeCompare(sortKey(b)),
    );
    out +=
      states.length > 1
        ? `\n**State** に貼る（${states.length} 件。1 件ずつ貼り替えて「Run request」を押す）\n`
        : "\n**State** に貼る\n";
    for (const st of states) {
      out += `\n${label(st)}\n\n${json(playgroundState(st))}\n`;
    }
  }
  return out;
}

export function renderPlayground(): string {
  const toc = SECTIONS.map((s) => `- [${s.title}](#${s.anchor})`).join("\n");
  const body = SECTIONS.map((s) => renderSection(s, readBodies(s.dir))).join("");
  return `<!-- このファイルは記録済みの答え（fixtures/）から自動で作っています（npm run playground）。直接編集しないでください -->
# Playground に貼る JSON

書籍『ハンズオン Jev 入門』のサンプルが Jev に送った中身を、TypeSafe の [Playground](https://console.typesafe.ai/playground) にそのまま貼れる形で並べたページです。
コードを書かずに、画面から同じ質問を試せます。使い方は、書籍の第 4 章「Playground で同じ注文票を試す」を見てください。

> **費用について:** Playground の「Run request」は、本物の Jev に送ります。**押すたびに、あなたの TypeSafe のアカウントに費用がかかります。** 投稿 1 件に質問 1 つなら、入力は 300〜400 トークンほどで、1 回あたり 0.01 円に満たない程度です（現時点の料金。[facts.md](facts.md)）。state や質問が長いほど高くなります。使った量は、Playground の左の「Usage」で確かめられます。

## 使い方

![Playground の画面。① State の欄に投稿、② Questions の欄に質問を貼り、③ 右下の Run request で送る](../images/playground-steps.png)

1. [console.typesafe.ai/playground](https://console.typesafe.ai/playground) を開く（ログインが必要です）
2. **① State** の欄（左）の中身をすべて消して、試したい投稿の JSON を貼る
3. **② Questions** の欄（右）の中身をすべて消して、各節の「Questions に貼る」の JSON を貼る
4. **③** 右下の「Run request」を押す（Mac では ⌘ + Enter でも送れる）。答えは画面の下の Response の欄に出ます

気をつけること:

- 本の数字は、固定したモデル（\`${facts.model.pinned}\`）で記録したものです。Playground の画面の下でモデルを選べるときは、\`${facts.model.pinned}\` を選ぶと本の数字に近くなります
- サンプルの中には、state を文字列のまま送っているものがあります。Playground の State の欄は JSON のオブジェクトなので、このページでは \`{ "post": "…" }\` の形に包んでいます。著者が第 5 章・第 6 章・第 9 章で試したところ、包んだ形でも、モデルが \`jev-latest\` のままでも、確率は本の数字との差が 0.01 以内でした。試したときは \`jev-latest\` が \`${facts.model.pinned}\` を指していて（答えの JSON の \`model\` で確かめられます）、第 9 章の入力トークン（409）も本と同じでした
- Choice の答えは、画面では確率の高い選択肢から一部だけが表示されます（すべての確率は、Response の欄の右上の \`</>\` で JSON を開くと見られます）
- 同じ質問でも、送るたびに確率はわずかにぶれます（書籍の第 3 章）

## 目次

${toc}
${body}`;
}

async function main() {
  const text = renderPlayground();
  if (process.argv.includes("--check")) {
    const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (current !== text) {
      console.error(
        "docs/_generated/playground.md が古いです。npm run playground を実行してください",
      );
      process.exit(1);
    }
    console.log("playground.md は最新です");
    return;
  }
  writeFileSync(OUT, text);
  console.log(`作成: ${OUT}`);
}

runMain(import.meta.url, main);
