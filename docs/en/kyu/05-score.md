# Kyu 5: Score (rate it)

- Time: 20 min
- Read first (official): [Primitives](https://docs.typesafe.ai/primitives) / [Score](https://docs.typesafe.ai/primitives/score)
- You will be able to: rate urgency on three levels, and explain why score can be a decimal

## Score rates things on ordered levels

🟢 Evergreen

### In one line

We ask "How urgent is it?" and have Jev rate it on three levels: 0, 1 and 2.
The difference from Choice is that **the levels have an order**. 1 is more urgent than 0, and 2 is more urgent than 1.

### Properly

```ts
import { score } from "@typesafe-ai/sdk";

export const urgency = score("How urgently should the organizers respond to this post?", [
  "Not urgent. It can wait until after the festival",                 // 0
  "Should be handled today",                                          // 1
  "Needs action right now. Someone's safety or health is involved",   // 2
]);
```

- The second argument is an **array**. Item 0 means 0 points, item 1 means 1 point, and so on (you need at least two)
- The answer you get back has `score` (the expected value), `probabilities` (the probability of each level), `legend` (the descriptions of the levels) and `confidence`

```bash
npm run k05
```

<details><summary>Going deeper (for pros)</summary>

- Use Choice for categories with no order (such as routing to teams), and Score for ratings with an order (urgency, quality, satisfaction). If you put unordered options into a Score, the expected value stops meaning anything
- The more concretely you describe each level (the rubric), the steadier the ratings. Avoid rubrics that only say "high" and "low"

</details>

> Primary source: https://docs.typesafe.ai/primitives/score

## score is an expected value, so it can be a decimal

🟢 Evergreen

### In one line

If it is "18% likely to be 0 points, 64% for 1 point, 18% for 2 points," the average is 1.00 points.
score is this **average (expected value)**. That is why it can be a decimal like 1.4.

### Properly

Expected value = Σ (points × probability of those points)

```
0 × 0.18 + 1 × 0.64 + 2 × 0.18 = 1.00
```

A decimal is awkward to show on screen, so the code rounds it to a level ([src/steps/k05-score.ts](../../../src/steps/k05-score.ts)).

```ts
export function toLevel(expected: number): 0 | 1 | 2 {
  if (expected < 0.5) return 0;
  if (expected < 1.5) return 1;
  return 2;
}
```

<details><summary>Going deeper (for pros)</summary>

- The same expected value of 1.0 can mean completely different things: "1 point at 100%" versus "0 points at 50%, 2 points at 50%." The second means "either very urgent or not urgent at all." Make it a habit to **look at the distribution and confidence, not just the expected value**
- Whether to round, or to sort by the raw expected value, is also a design decision. Combining several Scores (composite scoring) is covered in the 4th Dan

</details>

> Primary source: https://docs.typesafe.ai/primitives/score
