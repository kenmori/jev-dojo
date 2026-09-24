/**
 * 環境の健康診断。詰まったら最初にこれを打つ。
 *
 *   npm run doctor
 */

import { readdirSync } from "node:fs";
import { TypeSafeClient, VERSION } from "@typesafe-ai/sdk";
import { loadDotEnv } from "./lib/env.js";
import { facts } from "./lib/facts.js";
import { FIXTURES_DIR, resolveMode } from "./lib/fixtures.js";
import { t } from "./lib/i18n.js";

loadDotEnv();

const ok = (msg: string) => console.log(`✅ ${msg}`);
const ng = (msg: string) => console.log(`❌ ${msg}`);
const info = (msg: string) => console.log(`ℹ️  ${msg}`);

let failed = false;

const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
if (major > 20 || (major === 20 && minor >= 12)) ok(`Node.js ${process.versions.node}`);
else {
  ng(
    t(
      `Node.js ${process.versions.node}（20.12 以上が必要です。.nvmrc を参照）`,
      `Node.js ${process.versions.node} (20.12 or later is required; see .nvmrc)`,
    ),
  );
  failed = true;
}

if (VERSION === facts.sdk.jsVersion) ok(`${facts.sdk.js} ${VERSION}`);
else
  info(
    t(
      `${facts.sdk.js} ${VERSION}（教材の検証は ${facts.sdk.jsVersion}。npm install し直すと揃います）`,
      `${facts.sdk.js} ${VERSION} (the course is verified with ${facts.sdk.jsVersion}; reinstall with npm install to match)`,
    ),
  );

const fixtureCount = readdirSync(FIXTURES_DIR, { recursive: true }).filter((f) =>
  String(f).endsWith(".json"),
).length;
ok(
  t(
    `fixture ${fixtureCount} 件（npm run demo で再生できます）`,
    `${fixtureCount} fixtures (replay them with npm run demo)`,
  ),
);

let mode: string;
try {
  mode = resolveMode();
  ok(`JEV_MODE: ${mode}`);
} catch (err) {
  ng(err instanceof Error ? err.message : String(err));
  failed = true;
  mode = "replay";
}

const key = process.env.TYPESAFE_API_KEY?.trim();
if (!key) {
  info(
    t(
      "TYPESAFE_API_KEY なし。replay（再生）だけで進められます。キーを入れると live で動きます",
      "No TYPESAFE_API_KEY. You can continue with replay only; add a key to run live",
    ),
  );
} else {
  ok(t("TYPESAFE_API_KEY あり", "TYPESAFE_API_KEY is set"));
  try {
    const client = new TypeSafeClient({ apiKey: key, retry: { maxRetries: 0 } });
    const models = await client.models.list();
    ok(
      t(
        `API 疎通 OK（利用できるモデル: ${models.map((m) => m.name).join(", ")}）`,
        `API reachable (available models: ${models.map((m) => m.name).join(", ")})`,
      ),
    );
    if (models.some((m) => m.name === facts.model.pinned))
      ok(
        t(
          `固定モデル ${facts.model.pinned} あり`,
          `pinned model ${facts.model.pinned} is available`,
        ),
      );
    else {
      ng(
        t(
          `固定モデル ${facts.model.pinned} が一覧にありません。data/facts.json が古い可能性があります`,
          `pinned model ${facts.model.pinned} is not in the list. data/facts.json may be out of date`,
        ),
      );
      failed = true;
    }
  } catch (err) {
    ng(
      t(
        `API 疎通に失敗: ${err instanceof Error ? err.message : String(err)}`,
        `Could not reach the API: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
    failed = true;
  }
  info(
    t(
      "残りクレジットは SDK からは取得できないため、ダッシュボードで確認してください",
      "Remaining credit is not available from the SDK; check your dashboard",
    ),
  );
}

process.exitCode = failed ? 1 : 0;
