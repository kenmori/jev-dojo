# Contents

**How to take this course in English.** Every sample can print its questions and output in English.
Add `JEV_LANG=en` to your `.env` file (see [.env.example](../../.env.example)), or put it in front of each command: `JEV_LANG=en npm run k07`.
Chapter code blocks show the plain command (`npm run k07`); they assume you have set `JEV_LANG=en`.

**Kyu and dan.** The chapters are ranked like martial-arts belts: **kyu** are beginner grades that count down from 10 to 4, and **dan** are expert ranks that count up from 1st to 10th.

---

Every chapter is written in the same three layers.

- **In one line** … an analogy and a diagram. No jargon. Anyone can read it
- **Properly** … definitions → code → run it → output. Hands on
- **Going deeper (for pros)** … inside a collapsed block. Design trade-offs, failure cases, primary sources

If this is your first time, it is fine to leave the collapsed blocks closed.

Each section starts with a freshness label.

| Label | Meaning |
|---|---|
| 🟢 Evergreen | Stays true even when the model changes |
| 🟡 Semi-stable | Review it when something big changes |
| 🔴 Volatile | Changes often. For numbers, see [_generated/facts.en.md](../_generated/facts.en.md) |

`npm run demo` plays 17 chapters back to back. Kyu 9, Okugi, Kaiden and Advanced A each run with the command in the tables below. Advanced C and Advanced D are reading only; they have no command to run.

## Beginner (kyu)

| Chapter | Title | Goal | Command |
|---|---|---|---|
| Kyu 10 | [What is Jev?](kyu/10-what-is-jev.md) | Explain how it differs from an LLM with a picture | `npm run k10` |
| Kyu 9 | [Set up](kyu/09-setup.md) | `npm run check` passes | `npm run doctor` |
| Kyu 8 | [Your first call](kyu/08-first-call.md) | POST with curl and read the JSON | `npm run k08` |
| Kyu 7 | [Noul (yes/no)](kyu/07-noul.md) | Decide "Is this a complaint?" | `npm run k07` |
| Kyu 6 | [Choice (pick one)](kyu/06-choice.md) | Route posts to the right team | `npm run k06` |
| Kyu 5 | [Score (rate it)](kyu/05-score.md) | Rate urgency on three levels | `npm run k05` |
| Kyu 4 | [Ask in one batch](kyu/04-batch.md) | Put all three kinds in one request. Measure speed and cost | `npm run k04` |

## Intermediate (dan)

| Chapter | Title | Goal | Command |
|---|---|---|---|
| 1st Dan | [Designing the state](dan/01-state.md) | Decide what to send and what to leave out | `npm run d1` |
| 2nd Dan | [Instructions and criteria](dan/02-instructions.md) | Check that the wording changes the answer | `npm run d2` |
| 3rd Dan | [Confidence](dan/03-confidence.md) | Build three lanes (auto / check / human) | `npm run d3` |
| 4th Dan | [Four patterns](dan/04-patterns.md) | fan-out, intent routing, composite scoring | `npm run d4` |
| 5th Dan | [Where code ends and Jev begins](dan/05-boundary.md) | Split what stays in code from what goes to Jev | `npm run d5` |

## Advanced (upper dan)

| Chapter | Title | Goal | Command |
|---|---|---|---|
| 6th Dan | [Build an evaluation dataset](kodan/06-dataset.md) | Define the right answers yourself and label them | `npm run label` / `npm run d6` |
| 7th Dan | [Measure calibration](kodan/07-calibration.md) | Choose thresholds by measuring | `npm run d7` |
| 8th Dan | [Japanese lab](kodan/08-japanese-lab.md) | Measure the accuracy gap between Japanese and English yourself | `npm run d8` |
| 9th Dan | [Running in production](kodan/09-production.md) | Throughput, retries, pinning, budget, logs | `npm run d9` |
| 10th Dan | [Limits and misuse](kodan/10-limits.md) | Type-safe ≠ factual, injection | `npm run d10` |

## Kaiden

| Chapter | Title | Goal | Command |
|---|---|---|---|
| Okugi | [Understanding the mechanism](kaiden/01-mechanism.md) | Say where what is known ends and what is unknown begins | `npm run okugi` |
| Kaiden | [Final exam](kaiden/02-exam.md) | Prove it by solving 10 problems yourself | `npm run exam` |

## Extras (optional)

| Chapter | Title | Command |
|---|---|---|
| Advanced A | [TanStack Start + Cloudflare Workers](advanced/a-tanstack-cloudflare.md) | `cd app && npm run dev` |
| Advanced B | [Two layers with an LLM (Jev decides, the LLM writes)](advanced/b-two-layer.md) | `npm run ob` |
| Advanced C | [Where framework integrations stand](advanced/c-frameworks.md) | — |
| Advanced D | [Using the official agent skill](advanced/d-agent-skill.md) | — |

## Resources

- [Glossary](glossary.md)
- [Facts that can change (pricing, rate limits, model IDs)](../_generated/facts.en.md)
- [Map to the official docs](../_generated/doc-map.md)
- [Last verified](../_generated/last-verified.md)
- [Calibration report (7th Dan)](../_generated/calibration.en.md)
- [Japanese lab report (8th Dan)](../_generated/lab-ja-en.en.md)
