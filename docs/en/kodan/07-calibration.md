# 7th Dan: Measure calibration

- Time: 45 min
- Read first (official): [Machine learning primer](https://docs.typesafe.ai/introduction/machine-learning-primer) / [Classification using confidence](https://docs.typesafe.ai/cookbooks/classification_using_confidence)
- You will be able to: read a Brier score and a reliability curve, and choose thresholds by measurement instead of by gut feeling

## When it says 80%, is it right 80% of the time?

🟢 Evergreen

### In one line

Collect the days when the weather forecast said "80% chance of rain". If it really rained on about 8 out of every 10 of those days, you can trust that forecast.
We call this being well calibrated.

### Properly

| Measure | Meaning | Good value |
|---|---|---|
| Accuracy | the share that is right when you cut at 0.5 | the higher the better |
| Brier score | the average of (probability − 1 if correct, 0 if not)² | closer to 0 is better. Always answering 0.5 gives 0.25 |
| ECE | split probabilities into bins, then average the gap between "the probability it said" and "the share that really happened" | closer to 0 is better |
| Reliability curve | predicted probability on the horizontal axis, the real share on the vertical axis | closer to the diagonal is better |

```bash
npm run d7
```

The calculations are in [src/lib/metrics.ts](../../../src/lib/metrics.ts), and all of them are tested without an API key.

Report: [_generated/calibration.en.md](../../_generated/calibration.en.md)

<details><summary>Going deeper (for pros)</summary>

- High accuracy does not guarantee trustworthy probabilities (the model can be poorly calibrated). If you automate with a threshold, what you need to check is how reliable the probabilities are
- The official skill says that System One models are trained to make calibrated judgments, but that you should verify performance in your own domain. This chapter is that verification
- When a bin has few items, the points on the reliability curve swing a lot. Split 60 items into 5 bins and some bins hold only a handful

</details>

> Primary source: https://docs.typesafe.ai/introduction/machine-learning-primer

## Choose the threshold by measuring

🟡 Semi-stable

### In one line

In Kyu 7 we provisionally said "automate it if the probability is 0.8 or higher".
Here we start from a goal, "what we decide automatically should be right at least 95% of the time", and work backwards to the threshold.

### Properly

`npm run d7` prints a table of what happens as you move the threshold t.

- If p ≥ t, decide "complaint" automatically; if p ≤ 1 − t, decide "not a complaint" automatically
- Anything in between goes to a person

| Threshold | Share decided automatically | Accuracy of those |
|---|---|---|
| raise it and | it goes down (more work for people) | it goes up (in theory) |

The smallest threshold that meets your target accuracy is the point that balances effort against accuracy.

> The numbers shown in replay are computed from hand-made sample data. Do not draw conclusions about Jev's performance from this table.

<details><summary>Going deeper (for pros)</summary>

- Set the target accuracy from the cost of a wrong decision. If missing a complaint is expensive, an asymmetric design is possible, such as making only the "not a complaint" threshold stricter
- Measure thresholds again **for every model version**. That is why you pin the version (9th Dan)
- The thresholds and demo results in the official cookbooks are examples to evaluate, not rules that work everywhere (official skill)

</details>

> Primary source: https://docs.typesafe.ai/cookbooks/classification_using_confidence
