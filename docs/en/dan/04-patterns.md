# 4th Dan: Four patterns

- Time: 40 min
- Read first (official): [Patterns](https://docs.typesafe.ai/patterns) / [Fan-out](https://docs.typesafe.ai/patterns/fan-out) / [Composite scoring](https://docs.typesafe.ai/patterns/composite-scoring) / [Intent routing](https://docs.typesafe.ai/patterns/intent-routing)
- You will be able to: choose between fan-out, confidence-gated routing, composite scoring and intent routing

## Route by purpose, and ask the questions you will likely need up front

<!-- freshness: evergreen -->

You send each post down a different path depending on "what does this person want?" (An answer? A fix? Just to say thanks?)
It is faster to **ask, in the first request**, the questions each path is likely to need.

[src/steps/d4-patterns.ts](../../../src/steps/d4-patterns.ts) asks four questions in one request.

| Question | Used when |
|---|---|
| `intent` (purpose) | Always |
| `lostItemFound` "If this post is about a lost item, did the writer lose it or find it?" | Only when intent is lostItem |
| `fixNeedsStaffNow` "If this post reports a problem, does staff need to go to the spot?" | Only when intent is fix |
| `answerFromFaq` "If this post is a question, can the FAQ answer it?" | Only when intent is answer |

The last three are **speculative questions**. The premise ("If this post is ...") is written into the question, and the code decides whether to use the answer.

```ts
export const handlers: Record<string, Handler> = {
  answer: (a) => (a.answerFromFaq >= 1.5 ? "Reply with a link to the FAQ" : "The main office replies individually"),
  fix: (a) => (a.fixNeedsStaffNow >= 0.5 ? "Send staff to the spot" : "Log it as an improvement note and reply"),
  lostItem: (a) => (a.lostItemFound === "found" ? "Add to the found-items list" : "Add to the lost-items matching list"),
  thanks: () => "Give it a like and close it",
  none: () => "Mark as a candidate to hide",
};
```

```bash
npm run d4
```

<details><summary>Going deeper (for pros)</summary>

- Independent questions about the same state can be answered in parallel when you send them together, and they cannot see each other's answers (official skill). That is why each question has to state its own premise
- You need a second request when the first answer means you must "go and fetch new evidence", "build a new state", or "decide what the next options are"
- Speculative questions still use tokens. Whether bundling more pays off is something you measure, just as in Kyu 4

</details>

> Primary source: https://docs.typesafe.ai/patterns/fan-out

## Combine scores with weights, and keep safety conditions separate

<!-- freshness: evergreen -->

Turn "urgency", "how much it sounds like a complaint" and "chance it is a first-aid case" into scores, add them up with weights, and you get an order in which to handle posts.
Changing the weights does not require asking Jev again.

```ts
export const DEFAULT_WEIGHTS: Weights = { urgency: 0.6, complaint: 0.25, kyugo: 0.15 };

export function priority(p: Prediction, w: Weights = DEFAULT_WEIGHTS): number {
  const kyugo = p.departmentProbabilities.kyugo ?? 0;
  const total = w.urgency + w.complaint + w.kyugo;
  return (w.urgency * (p.urgency / 2) + w.complaint * p.complaint + w.kyugo * kyugo) / total;
}
```

`npm run d4` sorts the 60 posts by priority, then also shows the order after switching the weights to "complaints weigh more". No extra Jev calls are made.

The fourth pattern, confidence-gated routing, is exactly the three lanes from the 3rd Dan.

<details><summary>Going deeper (for pros)</summary>

- A weighted sum suits "preferences that can make up for each other". **It does not suit rules like "one serious condition is enough to fail"**. A post like a lost child (p16), even with somewhat lower urgency, can slip down the ranking under a weighted sum. Keep safety-related conditions as separate conditions, like `safetyFloor` in the 3rd Dan
- If you store the judgments themselves, you can change weights, thresholds and display in code alone, without running inference again (official skill)
- Once labeled results pile up, you can also use these scores as features for classic machine learning

</details>

> Primary source: https://docs.typesafe.ai/patterns/composite-scoring
