import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * どちらの SDK の fetch オプションにも渡せる fetch。
 * TypeSafe SDK は文字列の URL、Anthropic SDK は URL や Request も渡してくる。
 */
export type AnyFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/**
 * 記録／再生の切り替え（plan.md §8）。
 *
 * - replay: fixtures/ に保存したレスポンスを返す。APIキー不要・課金ゼロ
 * - live:   本物の API を叩く
 * - record: 本物の API を叩き、レスポンスを fixtures/ に保存する
 */
export type Mode = "replay" | "live" | "record";

import { LANG, t } from "./i18n.js";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FIXTURES_DIR = join(ROOT, "fixtures");

export function resolveMode(env: NodeJS.ProcessEnv = process.env): Mode {
  const explicit = env.JEV_MODE?.trim();
  if (explicit === "replay" || explicit === "live" || explicit === "record") return explicit;
  if (explicit)
    throw new Error(
      t(
        `JEV_MODE は replay / live / record のいずれかです（今: ${explicit}）`,
        `JEV_MODE must be replay / live / record (got: ${explicit})`,
      ),
    );
  return env.TYPESAFE_API_KEY?.trim() ? "live" : "replay";
}

export interface FixtureMeta {
  /** synthetic: 手で作った見本。live: 実APIから録ったもの */
  source: "synthetic" | "live";
  recordedAt: string | null;
  note?: string;
}

export interface FixtureRequest {
  method: string;
  path: string;
  body: unknown;
}

export interface FixtureResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface Fixture {
  meta: FixtureMeta;
  request: FixtureRequest;
  response: FixtureResponse;
}

/** キーの順番に左右されない JSON 文字列 */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** リクエスト内容から fixture のファイル名を決める。質問文を1文字変えると別の fixture になる */
export function requestKey(req: FixtureRequest): string {
  const hash = createHash("sha256")
    .update(`${req.method} ${req.path}\n${stableStringify(req.body ?? null)}`)
    .digest("hex");
  return hash.slice(0, 16);
}

/**
 * 章の fixture の置き場所。英語モード（JEV_LANG=en）では質問文が変わるので fixtures/en/ 以下に分ける。
 * こうしておくと、片方の言語だけを録り直しても、もう片方の fixture は消えない。
 */
export function stepDir(step: string): string {
  return LANG === "en" ? join("en", step) : step;
}

export function fixtureFile(step: string, req: FixtureRequest): string {
  return join(FIXTURES_DIR, stepDir(step), `${requestKey(req)}.json`);
}

function toRequest(input: string | URL | Request, init?: RequestInit): FixtureRequest {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const url = input instanceof Request ? input.url : String(input);
  const path = new URL(url).pathname;
  const raw = init?.body;
  const body = typeof raw === "string" && raw.length > 0 ? JSON.parse(raw) : null;
  return { method, path, body };
}

function toResponse(res: FixtureResponse): Response {
  const body = res.body === undefined ? null : JSON.stringify(res.body);
  return new Response(body, {
    status: res.status,
    headers: { "content-type": "application/json", ...res.headers },
  });
}

export function readFixture(file: string): Fixture {
  return JSON.parse(readFileSync(file, "utf8")) as Fixture;
}

/** fixtures/<step>/ から応答を返す fetch。見つからなければ録り直しを促す */
export function createReplayFetch(step: string, onReplay?: (meta: FixtureMeta) => void): AnyFetch {
  return async (input, init) => {
    const req = toRequest(input, init);
    const file = fixtureFile(step, req);
    if (!existsSync(file)) {
      throw new Error(
        [
          t(
            `fixture がありません: ${relative(ROOT, file)}`,
            `Fixture not found: ${relative(ROOT, file)}`,
          ),
          t(
            "質問や state を書き換えた場合は、APIキーを設定して `npm run record` で録り直してください。",
            "If you changed a question or the state, set your API key and re-record with `npm run record`.",
          ),
        ].join("\n"),
      );
    }
    const fixture = readFixture(file);
    onReplay?.(fixture.meta);
    return toResponse(fixture.response);
  };
}

/** 本物の API を叩きつつ、応答を fixtures/<step>/ に保存する fetch */
export function createRecordingFetch(step: string, realFetch: AnyFetch = fetch): AnyFetch {
  return async (input, init) => {
    const res = await realFetch(input, init);
    const text = await res.clone().text();
    const req = toRequest(input, init);
    const file = fixtureFile(step, req);
    const fixture: Fixture = {
      meta: { source: "live", recordedAt: new Date().toISOString() },
      request: req,
      response: {
        status: res.status,
        headers: pickHeaders(res.headers),
        body: text.length > 0 ? JSON.parse(text) : undefined,
      },
    };
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(fixture, null, 2)}\n`);
    return res;
  };
}

const KEPT_HEADERS = ["retry-after", "retry-after-ms", "x-typesafe-request-id"];

function pickHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of KEPT_HEADERS) {
    const value = headers.get(name);
    if (value !== null) out[name] = value;
  }
  return out;
}

/** 保存済みの応答をそのまま返す fetch。エラー系の contract テスト用 */
export function fetchFromResponses(...responses: FixtureResponse[]): AnyFetch & { calls: number } {
  let i = 0;
  const f = async () => {
    const res = responses[Math.min(i, responses.length - 1)];
    i += 1;
    f.calls = i;
    if (!res) throw new Error("responses が空です");
    return toResponse(res);
  };
  f.calls = 0;
  return f;
}

/** fixture が入っているディレクトリの一覧（FIXTURES_DIR からの相対パス。例: "k10-hello", "en/k10-hello"） */
export function listFixtureDirs(): string[] {
  return readdirSync(FIXTURES_DIR, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".json"))
    .map((d) => relative(FIXTURES_DIR, d.parentPath))
    .filter((dir, i, all) => all.indexOf(dir) === i)
    .sort();
}
