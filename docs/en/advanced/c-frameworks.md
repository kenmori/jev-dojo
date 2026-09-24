# Advanced C: Where framework integrations stand

- Time: 20 min
- Read first (official): [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript) / [API](https://docs.typesafe.ai/api)
- You will be able to: choose, with reasons, between using Jev through a framework and using the official SDK directly

## When in doubt, using the official SDK directly is the simplest

🟢 Evergreen

### In one line

If you already use an AI framework, its "Jev part" keeps your code in the same style.
If not, using the official SDK directly is the simplest. Either way, what you send (state and questions) is the same.

### Properly

| What to check | Why |
|---|---|
| Who makes it (official / the framework / an individual) | Updates may stop |
| Is the version below 1.0, or marked experimental? | The API may change |
| Can you get confidence, probabilities and usage? | Needed in the 3rd, 7th and 9th Dan |
| Can you pin the model ID? | Needed in the 9th Dan |
| Can you swap out `fetch`? | Needed for tests (record/replay) |
| Environment variable names | May differ from the official SDK |

This course uses the official SDK directly because it meets every condition above and has the fewest dependencies.

<details><summary>Going deeper (for pros)</summary>

- A framework's abstraction may move Jev-specific information (such as confidence) somewhere else or rename it. When you migrate, run the 7th Dan measurement again through the framework and make sure you get the same numbers
- Whichever way you choose, underneath it is a single `POST /v1/systemone` request. When stuck, look at the raw HTTP (Kyu 8)

</details>

> Primary source: https://docs.typesafe.ai/api

## As of 2026-09-24, there are three integrations besides the official SDK

🔴 Volatile

### In one line

These are the integration packages that could be confirmed on npm on that date. They can change within weeks, so always check the latest before using one.

### Properly

| Package | Provider | Version checked | How you call it |
|---|---|---|---|
| `@typesafe-ai/sdk` | TypeSafe AI (official) | 0.6.x | `client.systemOne({ state, questions })` |
| `@ai-sdk/typesafe-ai` | Vercel AI SDK | 3.0.x | `experimental_evaluate({ model, state, questions })` |
| `@tanstack/ai-typesafe` | TanStack AI | 0.1.x | `decide({ adapter, state, questions })` |
| `@effect-agent/ai-typesafe` | An individual (for Effect) | 0.1 beta | Could not check the README |

For LangChain, an npm search on that date found no dedicated integration package. If you use Jev inside LangChain, the safe approach is to wrap the official SDK call as a function (a tool).

Differences from the official SDK that could be read from the READMEs:

- **Vercel AI SDK**: yes/no is `type: "boolean"` (matching Jev's Noul). The API key environment variable is `TYPESAFE_AI_API_KEY` (a different name from the official SDK's `TYPESAFE_API_KEY`). Confidence is at `result.providerMetadata.typesafe.confidence[questionId]`. The evaluation feature is experimental
- **TanStack AI**: its own style, `boolean` / `choice({ instructions, options })` / `score({ instructions, levels })`. It does not depend on the official SDK and calls the HTTP API directly with `fetch`

<details><summary>Going deeper (for pros)</summary>

- The Vercel AI SDK README says "TypeSafe returns rounded values (2 decimal places)." That is one reason not to compare probabilities for exact equality (the Kyu 7 tests compare within a tolerance)
- This table is volatile information written by hand. It is not covered by automatic detection like facts.json. Read it as information that is at least as old as the date in the heading

</details>

> Primary source: https://docs.typesafe.ai/sdk/javascript
