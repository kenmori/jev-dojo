# Kaiden: Final exam

- Time: 2 to 3 hours
- Read first (official): [How to build with System One](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
- You will be able to: prove what you have learned by turning it into code with your own hands

## Write 10 functions and the tests grade them

<!-- freshness: evergreen -->

There are 10 functions with the body left blank. You fill them in yourself, and automated tests grade them.
Get them all right and you reach **Kaiden (full mastery)**. You do not need an API key.

```bash
npm run exam   # grade
```

The tasks are in [exam/tasks](../../../exam/tasks). The comment at the top of each file is the problem statement, written in both Japanese and English. Delete the `throw new Error(...)` line marked "not implemented" and write the function.

| Task | Covers | What you write |
|---|---|---|
| Q1 | 2nd Dan | the team Choice (with a way out) |
| Q2 | 1st Dan | a state with named fields |
| Q3 | 3rd Dan | sorting into 3 lanes, and alerting first aid |
| Q4 | 4th Dan | a weighted priority, plus "serious conditions" that the weights cannot override |
| Q5 | 5th Dan | hiding phone numbers and email addresses before sending |
| Q6 | 6th Dan | Cohen's κ |
| Q7 | 7th Dan | the smallest threshold that meets a target accuracy |
| Q8 | 9th Dan | processing that respects a concurrency limit and a budget |
| Q9 | Okugi | checking the shape of a Score answer |
| Q10 | Everything | triaging posts using recorded responses |

| Score | Grade |
|---|---|
| 10 | Kaiden (full mastery) |
| 8–9 | Shihandai (assistant master) |
| 5–7 | Yudansha (black belt) |
| 0–4 | Shugyo-chu (in training) |

<details><summary>Going deeper (for pros)</summary>

- To see why a task failed, run `npx vitest run --project exam`. Reading the tests ([exam/tests](../../../exam/tests)) is good study too
- Sample solutions are in [exam/solutions](../../../exam/solutions). **Do not open them until you have solved everything.** Run `npm run exam -- --solutions` to grade the sample solutions and confirm they score 10
- Q10 does not call the real API. It runs on recorded responses (`fixtures/board-ja`)

</details>

> Primary source: https://docs.typesafe.ai/concepts/how-to-build-with-system-one

## True mastery is redoing it all with your own work data

<!-- freshness: evergreen -->

Passing the exam only proves something about this message board.
True Kaiden is **when you can do the same thing again with the data from your own work**.

Steps for redoing it with your own subject:

1. Pick one judgment from your own work, and split it into the part that stays in code and the part you hand to Jev (5th Dan)
2. Take 50 or more items from real data, write a guide, and label them (6th Dan)
3. Design the questions, measure, fix the wording, and measure again (2nd Dan, 7th Dan)
4. If you use it in Japanese, measure the gap between Japanese and English (8th Dan)
5. Choose thresholds, split into 3 lanes, pin the version, and run it (3rd Dan, 9th Dan)
6. Explain it to others, keeping "what has been confirmed" separate from "what is not known" (Okugi)

<details><summary>Going deeper (for pros)</summary>

- Check whether you can explain, one by one and for your own subject, the 7 learning goals of this course (§3.1 of plan.md)
- If you record your own subject's results the same way as `npm run okugi`, with shape properties kept separate from observations, you can use them for comparison when the model is updated

</details>

> Primary source: https://docs.typesafe.ai/concepts/how-to-build-with-system-one
