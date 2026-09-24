# 9th Dan: Running in production

- Time: 45 min
- Read first (official): [Models](https://docs.typesafe.ai/models) / [API](https://docs.typesafe.ai/api) / [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- You will be able to: design rate limiting, retries, version pinning, cost monitoring and logging with production in mind

## A threshold belongs to the model you measured, so pin the version

<!-- freshness: evergreen -->

`jev-latest` is a name that means "the newest one", so what it points to changes when a new model comes out.
If you measured and chose a threshold in the 7th Dan, that threshold is **only valid for the model you measured**. That is why you pin the version in production.

- Every sample in this course from Kyu 9 on uses a pinned model ([src/lib/client.ts](../../../src/lib/client.ts); for the value, see [facts.en.md](../../_generated/facts.en.md#model))
- The `model` field of a response holds the model that actually answered. `npm run d9` warns you if the model you asked for and the model in the response differ
- When a new version appears, the weekly CI job (`freshness.yml`) checks where `jev-latest` points and opens an Issue

Steps for moving to a new version:

1. Change the pinned model in `data/facts.json`
2. Re-record with `npm run record`, and look at how the answers changed with `git diff fixtures/`
3. Measure the 7th and 8th Dan again, and choose the thresholds again

<details><summary>Going deeper (for pros)</summary>

- An alias can point to something else after a new release, so the official advice is to pin the version once you have tuned thresholds
- Treat moving to a new version as seriously as a code change. Do not do it without review and measurement

</details>

> Primary source: https://docs.typesafe.ai/models

## Leave retries to the SDK; keep throughput, budget and logs in your code

<!-- freshness: semi-stable -->

Before you send 60 posts at once, decide "how many at the same time", "how many per minute" and "how much money at most".
Keep a record for each item so you can trace what happened afterwards.

[src/steps/d9-production.ts](../../../src/steps/d9-production.ts) and [src/lib/production.ts](../../../src/lib/production.ts):

| Mechanism | Where it lives |
|---|---|
| Retries and backoff (429, 5xx, connection errors) | **The SDK**. It also respects `retry-after`. Do not write your own |
| Timeout | **The SDK**'s `timeout` (per attempt) |
| Concurrency | Your code (`createLimiter`) |
| Per-minute cap | Your code (`createRateGate`). Leave headroom instead of running right at the official limit |
| Budget cap | Your code (`BudgetGuard`). Stop when it is exceeded |
| Logs | Your code. One line of JSON per request. Do not write the post text |

```bash
npm run d9   # the log goes to logs/d9-production.jsonl
```

You can check how the SDK retries in [tests/contract/errors.test.ts](../../../tests/contract/errors.test.ts).

<details><summary>Going deeper (for pros)</summary>

- The official docs say rate limits "may change without notice". For the values, see [facts.en.md](../../_generated/facts.en.md#rate-limits); in code, read them from facts.json
- The SDK's timeout is per attempt; there is no cap on the retries as a whole. If you need an overall deadline, pass an `AbortSignal`
- Keep the `requestId` (the `x-typesafe-request-id` response header) in your logs so a support request can be traced. You can get it with `withResponse()`
- Post text can contain personal information, so by default it is not logged. If you do log it, first decide how long to keep it and who may read it
- When something fails, sort it into one of four causes: not enough evidence / a model error / a code error / a service outage (official skill)

</details>

> Primary source: https://docs.typesafe.ai/sdk/javascript
