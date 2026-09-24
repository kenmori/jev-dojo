/**
 * data/facts.json から揮発する情報のページを生成する（plan.md §7.1, §7.5）。
 *
 * - docs/_generated/facts.md
 * - docs/_generated/last-verified.md
 * - README.md の <!-- facts:start --> 〜 <!-- facts:end --> の間
 *
 *   npm run facts            # 生成
 *   npm run facts -- --check # 生成物が最新か確認するだけ（CI 用）
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { costUSD, formatUSD, sumUsage } from "../src/lib/cost.js";
import { type Facts, facts } from "../src/lib/facts.js";
import { FIXTURES_DIR, type Fixture, ROOT } from "../src/lib/fixtures.js";
import { runMain } from "../src/lib/print.js";

const HEADER = "> 自動生成（`npm run facts`）。手で編集せず、`data/facts.json` を直してください。";
const fmt = (n: number) => n.toLocaleString("en-US");

export function renderFactsMd(f: Facts): string {
  return `# 変わりうる事実

${HEADER}

最終確認日: **${f.lastVerified}**

本文にはこれらの値を直接書きません。数字が必要なときはこのページにリンクします。
公式は「需要が非常に大きく、レート制限は予告なく変わりうる」としているため、特にレート制限は必ず公式で確認してください。

## モデル

| 項目 | 値 |
|---|---|
| 教材で固定しているバージョン | \`${f.model.pinned}\` |
| エイリアス | ${f.model.aliases.map((a) => `\`${a}\``).join(", ")} |

> 一次情報: https://docs.typesafe.ai/models

## 料金

| 項目 | 値 |
|---|---|
| 入力（100万トークンあたり） | $${f.pricing.inputPerMtok} |
| 出力（100万トークンあたり） | $${f.pricing.outputPerMtok} |
| 新規登録時のクレジット | ${f.signup.startingCredit} |
| ウェイトリスト | ${f.signup.waitlist ? "あり" : "なし"} |

> 一次情報: https://docs.typesafe.ai/models

## レート制限

| 項目 | 値 |
|---|---|
| トークン／秒 | ${fmt(f.rateLimits.tokensPerSecond)} |
| リクエスト／分 | ${fmt(f.rateLimits.requestsPerMinute)} |

> 一次情報: https://docs.typesafe.ai/models

## コンテキスト長

| 項目 | 値 |
|---|---|
| 合計 | ${fmt(f.context.totalTokens)} トークン |
| state ＋ 最長の質問 | ${fmt(f.context.statePlusLongestQuestion)} トークン |

> 一次情報: https://docs.typesafe.ai/models

## API と SDK

| 項目 | 値 |
|---|---|
| エンドポイント | \`${f.endpoint}\` |
| JavaScript SDK | \`${f.sdk.js}\` ${f.sdk.jsVersion} |
| Python SDK | \`${f.sdk.python}\` |

> 一次情報: https://docs.typesafe.ai/sdk/javascript
`;
}

export function renderLastVerifiedMd(f: Facts, docMapCheckedAt: string | null): string {
  return `# 最終確認日

${HEADER}

| 対象 | 最終確認日 | 確認方法 |
|---|---|---|
| data/facts.json（モデル・料金・レート制限など） | ${f.lastVerified} | 手動確認＋ \`npm run facts:verify\` |
| 公式ドキュメント一覧（llms.txt） | ${docMapCheckedAt ?? "未実施"} | \`npm run docmap\`（週次CI） |
`;
}

/** 全サンプルを1周したときのトークン数と、合成データが混ざっているか */
export function estimateFullRun(): { inputTokens: number; costUSD: number; synthetic: boolean } {
  const fixtures = readdirSync(FIXTURES_DIR, { recursive: true })
    .map(String)
    // errors は見本のエラー、*-claude は Anthropic の応答なので Jev の費用に含めない
    .filter((f) => f.endsWith(".json") && !f.startsWith("errors") && !/^[^/]+-claude\//.test(f))
    .map((f) => JSON.parse(readFileSync(join(FIXTURES_DIR, f), "utf8")) as Fixture);
  const usage = sumUsage(
    ...fixtures.map(
      (fx) =>
        (fx.response.body as { usage?: { input_tokens: number; output_tokens: number } }).usage ?? {
          input_tokens: 0,
          output_tokens: 0,
        },
    ),
  );
  return {
    inputTokens: usage.input_tokens,
    costUSD: costUSD(usage),
    synthetic: fixtures.some((fx) => fx.meta.source === "synthetic"),
  };
}

export function renderReadmeBlock(f: Facts, docMapCheckedAt: string | null): string {
  const est = estimateFullRun();
  return [
    "<!-- facts:start -->",
    "```",
    `最終検証: ${f.lastVerified} ｜ 対象モデル: ${f.model.pinned} ｜ SDK: ${f.sdk.js} ${f.sdk.jsVersion}`,
    `公式ドキュメント差分チェック: ${docMapCheckedAt ? `✅ ${docMapCheckedAt}` : "未実施"}`,
    "```",
    "",
    `全サンプルのリクエストを1回ずつ live で送ったときの Jev の費用の目安: 約 ${formatUSD(est.costUSD)}（入力 ${est.inputTokens.toLocaleString("en-US")} トークン、新規クレジット ${f.signup.startingCredit} の ${((est.costUSD / Number(f.signup.startingCredit.replace(/[^\d.]/g, ""))) * 100).toPrecision(2)}%）${est.synthetic ? "。※ 見本データ（合成）のトークン数からの推定" : ""}。応用B の Claude の費用は別にかかります`,
    "<!-- facts:end -->",
  ].join("\n");
}

const BLOCK = /<!-- facts:start -->[\s\S]*?<!-- facts:end -->/;

function docMapCheckedAt(): string | null {
  const file = join(ROOT, "data", "doc-map.json");
  if (!existsSync(file)) return null;
  return (JSON.parse(readFileSync(file, "utf8")) as { checkedAt: string | null }).checkedAt;
}

async function main() {
  const check = process.argv.includes("--check");
  const checkedAt = docMapCheckedAt();
  const readmePath = join(ROOT, "README.md");
  const readme = readFileSync(readmePath, "utf8");
  if (!BLOCK.test(readme))
    throw new Error("README.md に <!-- facts:start --> 〜 <!-- facts:end --> がありません");

  const outputs: [string, string][] = [
    [join(ROOT, "docs", "_generated", "facts.md"), renderFactsMd(facts)],
    [join(ROOT, "docs", "_generated", "last-verified.md"), renderLastVerifiedMd(facts, checkedAt)],
    [readmePath, readme.replace(BLOCK, renderReadmeBlock(facts, checkedAt))],
  ];

  const stale = outputs.filter(
    ([file, content]) => !existsSync(file) || readFileSync(file, "utf8") !== content,
  );
  if (check) {
    if (stale.length > 0) {
      console.error(
        `生成物が古くなっています。npm run facts を実行してください:\n${stale.map(([f]) => `  - ${relative(ROOT, f)}`).join("\n")}`,
      );
      process.exitCode = 1;
    }
    return;
  }
  for (const [file, content] of stale) writeFileSync(file, content);
  console.log(
    stale.length === 0 ? "変更なし" : `更新: ${stale.map(([f]) => relative(ROOT, f)).join(", ")}`,
  );
}

runMain(import.meta.url, main);
