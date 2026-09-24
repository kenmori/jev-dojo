# Kyu 4: Ask in one batch

- Time: 20 min
- Read first (official): [Fan-out](https://docs.typesafe.ai/patterns/fan-out) / [Parallel questions](https://docs.typesafe.ai/cookbooks/parallel_questions)
- You will be able to: put Noul, Choice and Score into one request, and measure speed and cost

## Write three questions in one letter

🟢 Evergreen

### In one line

You don't need to ask "Is it a complaint?", "Which team?" and "How urgent?" in three separate rounds.
Write all three questions in one letter, and one reply answers them all.

### Properly

Put the questions you built in Kyu 7, Kyu 6 and Kyu 5 into `questions` as they are ([src/steps/k04-batch.ts](../../../src/steps/k04-batch.ts)).

```ts
import { department } from "./k06-choice.js";
import { urgency } from "./k05-score.js";
import { isComplaint } from "./k07-noul.js";

const result = await client.systemOne({
  state: post.text,
  questions: { isComplaint, department, urgency },
});

result.answers.isComplaint.noul;     // number
result.answers.department.choice;    // "honbu" | "yatai" | ...
result.answers.urgency.score;        // number
```

Even when you mix different kinds of questions, the type of each answer is inferred correctly.

```bash
npm run k04
```

<details><summary>Going deeper (for pros)</summary>

- Each question is answered independently. When there is a dependency such as "ask about urgency only if it is a complaint," you choose between splitting it into two steps in code, or asking everything at once and throwing answers away in code later. The latter is the idea behind fan-out (speculative fan-out), covered in the 4th Dan
- There are two context-length limits: one for "the whole request" and one for "state + the longest question" ([facts.en.md](../../_generated/facts.en.md#context-length)). Adding too many questions can hit the limit

</details>

> Primary source: https://docs.typesafe.ai/cookbooks/parallel_questions

## Batching "should" be faster and cheaper, so measure it

🟡 Semi-stable

### In one line

We actually measure the difference between one batched call and three calls with one question each.
Measuring is more reliable than guessing.

### Properly

`npm run k04` runs it both ways and shows the input token counts and times side by side.

```
▼ Compare
1 batched call : input ○ tok / output ○ tok → $… | ○ ms
3 separate calls: input ○ tok / output ○ tok → $… | ○ ms
```

- **Tokens**: the state (the post text) is sent only once, so the batched call should use fewer
- **Time**: there is only one network round trip, so the batched call should be faster

Checking these "shoulds" is the point of this chapter. Replay (playing back samples) makes no network calls, so you cannot compare times with it. Add your key and try it live.

<details><summary>Going deeper (for pros)</summary>

- A single measurement varies. For a serious comparison, run it several times under the same conditions and take the median
- The price is set by the unit prices for input and output tokens ([facts.en.md](../../_generated/facts.en.md#pricing)). Every sample in this course calculates and prints its cost with [src/lib/cost.ts](../../../src/lib/cost.ts)
- When sending a lot of requests, watch the rate limits too ([facts.en.md](../../_generated/facts.en.md#rate-limits)). When the SDK receives a 429, it respects `retry-after` and retries automatically. Before writing your own retries, check that behavior in [tests/contract/errors.test.ts](../../../tests/contract/errors.test.ts). Production operation is covered in the 9th Dan

</details>

> Primary source: https://docs.typesafe.ai/patterns/fan-out
