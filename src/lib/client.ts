import { type Fetch, TypeSafeClient } from "@typesafe-ai/sdk";
import { loadDotEnv } from "./env.js";
import { facts } from "./facts.js";
import {
  createRecordingFetch,
  createReplayFetch,
  type FixtureMeta,
  type Mode,
  resolveMode,
} from "./fixtures.js";
import { t } from "./i18n.js";

/**
 * TypeSafeClient の薄いラッパ。
 *
 * - モデルIDは data/facts.json の pinned に固定する
 * - JEV_MODE に応じて fetch を差し替え、APIキーなしでも動くようにする
 */
export interface Dojo {
  client: TypeSafeClient;
  /** SDK を使わずに HTTP を直接叩くとき用（8級） */
  fetch: Fetch;
  mode: Mode;
  step: string;
  model: string;
  /** replay で使った fixture のメタ情報。合成データかどうかの表示に使う */
  replayed: FixtureMeta[];
}

export interface DojoOptions {
  /** 省略時は facts.model.pinned */
  model?: string;
  mode?: Mode;
}

/** replay では本物のキーは不要。SDK のコンストラクタを通すためのダミー */
const REPLAY_KEY = "replay-mode-no-key";

export function createDojo(step: string, options: DojoOptions = {}): Dojo {
  loadDotEnv();
  const mode = options.mode ?? resolveMode();
  const model = options.model ?? facts.model.pinned;
  const replayed: FixtureMeta[] = [];

  const fetchImpl: Fetch =
    mode === "replay"
      ? createReplayFetch(step, (meta) => replayed.push(meta))
      : mode === "record"
        ? createRecordingFetch(step)
        : fetch;

  const apiKey = mode === "replay" ? REPLAY_KEY : process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      t(
        "TYPESAFE_API_KEY が設定されていません。.env にキーを入れるか、`npm run demo` でキーなしの再生を試してください。",
        "TYPESAFE_API_KEY is not set. Put your key in .env, or try the keyless replay with `npm run demo`.",
      ),
    );
  }

  const client = new TypeSafeClient({
    apiKey,
    defaultModel: model,
    fetch: fetchImpl,
    // 再生時はリトライしても同じ応答が返るだけなので無効にする
    ...(mode === "replay" ? { retry: { maxRetries: 0 } } : {}),
  });

  const baseURL = client.baseURL;
  const rawFetch: Fetch = (input, init) =>
    fetchImpl(input.startsWith("http") ? input : `${baseURL}${input}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

  return { client, fetch: rawFetch, mode, step, model, replayed };
}
