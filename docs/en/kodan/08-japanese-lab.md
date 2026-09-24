# 8th Dan: Japanese lab

- Time: 60 min
- Read first (official): [Models](https://docs.typesafe.ai/models) (the part about language support) / [Model jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- You will be able to: run the same task in Japanese and English and measure the accuracy gap yourself, and choose thresholds for Japanese from your own data

## Follow the official instructions to the letter

<!-- freshness: evergreen -->

The official docs say: "English is its strongest language. It can handle Japanese and other languages, but not necessarily as well. If you use it in a language other than English, test it on your own text."
This chapter is that test, done exactly as instructed.

We classify the 60 posts twice, in Japanese and in an English translation with the same content, and compare:

- accuracy against the labels (complaint, team, urgency)
- the distribution of confidence
- the share of posts where Japanese and English gave the same answer
- accuracy by wording style (敬語 (honorific), 主語省略 (omitted subject), 婉曲 (indirect), 皮肉 (sarcasm))
- the actual posts where the Japanese and English answers differ

```bash
npm run d8
```

Report: [_generated/lab-ja-en.en.md](../../_generated/lab-ja-en.en.md)

**What is bundled now is sample data (synthetic), with identical values for Japanese and English.** To see a real gap, add your API key and run:

```bash
npm run record d8   # classify all 120 posts (Japanese and English) with the real API and record them
npm run reports     # rebuild the reports
```

<details><summary>Going deeper (for pros)</summary>

- The English was translated from the Japanese, not by a professional translator. How it was translated (how the nuance of honorifics or sarcasm comes across in English) may affect the results. If a post bothers you, fix its translation and measure again
- For posts where Japanese and English disagree, check against the labels which language got it wrong. A disagreement does not mean Japanese is the bad one
- Re-run this with every model update, alongside `docs/_generated/eval-history.md` (the weekly live evaluation)

</details>

> Primary source: https://docs.typesafe.ai/models

## If the numbers look bad, suspect the question design first

<!-- freshness: evergreen -->

Even if the Japanese numbers are bad, do not jump to "Jev is weak at Japanese".
Most of the time, the cause is in how the question is written.

1. Line up the posts where the answers differ, and check whether they cluster in certain tags (敬語 (honorific), 主語省略 (omitted subject), 婉曲 (indirect), 皮肉 (sarcasm))
2. If they do, add that wording to the criteria's `include` (2nd Dan)
3. Measure again on the same 60 posts (7th Dan)
4. Record what you changed and how the numbers moved

**The work of this chapter includes changing the design and measuring again.**

<details><summary>Going deeper (for pros)</summary>

- With 60 posts you cannot make statistically strong claims. A single post moves a share by several points. Stop at "a trend", and always state the count and the limits
- Overstated conclusions cost the whole course its credibility. Always present numbers together with the code that reproduces them (`npm run d8`)
- The official docs publish the known weak spots of each version (jaggedness). First check whether they say anything about Japanese or about wording styles

</details>

> Primary source: https://docs.typesafe.ai/model-jaggedness/jev-1.13
