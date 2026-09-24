/**
 * エラー系。公式SDKはバックオフ付きのリトライを最初から行い、retry-after を尊重する。
 * 自前でリトライを書く前に、SDK が何をしてくれるかを確かめる（plan.md §8）。
 */
import {
  APITimeoutError,
  AuthenticationError,
  type Fetch,
  InternalServerError,
  RateLimitError,
  TypeSafeClient,
  UnprocessableEntityError,
} from "@typesafe-ai/sdk";
import { describe, expect, it } from "vitest";
import {
  type FixtureResponse,
  fetchFromResponses,
  ROOT,
  readFixture,
} from "../../src/lib/fixtures.js";
import { isComplaint } from "../../src/steps/k07-noul.js";

const error = (status: number): FixtureResponse =>
  readFixture(`${ROOT}/fixtures/errors/${status}.json`).response;

const ok: FixtureResponse = {
  status: 200,
  headers: {},
  body: {
    model: "jev-1.13.0",
    answers: { isComplaint: { type: "noul", noul: 0.9 } },
    usage: { input_tokens: 40, output_tokens: 0 },
  },
};

const request = { state: "テスト", questions: { isComplaint } };

const clientWith = (fetch: Fetch, maxRetries = 2) =>
  new TypeSafeClient({
    apiKey: "test",
    fetch,
    logLevel: "off",
    retry: { maxRetries, backoffInitialMs: 1, backoffMaxMs: 1 },
  });

describe("401 認証エラー", () => {
  it("AuthenticationError になり、リトライしない", async () => {
    const fetch = fetchFromResponses(error(401), ok);
    await expect(clientWith(fetch).systemOne(request)).rejects.toBeInstanceOf(AuthenticationError);
    expect(fetch.calls).toBe(1);
  });
});

describe("422 リクエストの形が不正", () => {
  it("UnprocessableEntityError になり、リトライしない", async () => {
    const fetch = fetchFromResponses(error(422), ok);
    await expect(clientWith(fetch).systemOne(request)).rejects.toBeInstanceOf(
      UnprocessableEntityError,
    );
    expect(fetch.calls).toBe(1);
  });
});

describe("429 レート制限", () => {
  it("SDK が自動でリトライして成功する", async () => {
    const fetch = fetchFromResponses(error(429), ok);
    const result = await clientWith(fetch).systemOne(request);
    expect(result.answers.isComplaint.noul).toBe(0.9);
    expect(fetch.calls).toBe(2);
  });

  it("リトライを使い切ると RateLimitError。待つべき時間が取れる", async () => {
    const fetch = fetchFromResponses(error(429));
    const err = await clientWith(fetch, 0)
      .systemOne(request)
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfterMs).toBe(10);
  });
});

describe("500 サーバの一時的な失敗", () => {
  it("リトライして、だめなら InternalServerError", async () => {
    const fetch = fetchFromResponses(error(500));
    await expect(clientWith(fetch, 2).systemOne(request)).rejects.toBeInstanceOf(
      InternalServerError,
    );
    expect(fetch.calls).toBe(3);
  });
});

describe("タイムアウト", () => {
  it("応答が来なければ APITimeoutError", async () => {
    const never: Fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      });
    const client = new TypeSafeClient({
      apiKey: "test",
      fetch: never,
      logLevel: "off",
      timeout: 20,
      retry: { maxRetries: 0 },
    });
    await expect(client.systemOne(request)).rejects.toBeInstanceOf(APITimeoutError);
  });
});
