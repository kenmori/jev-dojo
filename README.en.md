# jev-dojo

[日本語](README.md) | English

**A hands-on course for learning Jev (TypeSafe AI's System One model), grade by grade, like martial-arts ranks.**
You start by cloning the repository and seeing your first result in 5 minutes, with no API key.

<!-- facts:start -->
```
Last verified: 2026-09-24 | Model: jev-1.13.0 | SDK: @typesafe-ai/sdk 0.6.0
Official docs diff check: not run yet
```

Estimated Jev cost of sending every English sample request once in live mode: about $0.0043 (101,472 input tokens, 0.085% of the $5 sign-up credit). Estimated from the token counts of the sample (synthetic) data. Claude usage in Advanced B is billed separately
<!-- facts:end -->

## Get started in 5 minutes

```bash
git clone https://github.com/kenmori/jev-dojo
cd jev-dojo
npm install
cp .env.example .env  # the place for your key later
echo "JEV_LANG=en" >> .env   # samples print English
npm run demo          # replays recorded results. No API key, no cost
npm run k10           # calls the real API (put your key in TYPESAFE_API_KEY in .env first)
```

`JEV_LANG=en` makes every sample print English. You can also prefix a single command instead: `JEV_LANG=en npm run demo`.

If you do not want to install Node.js locally, open the repository with "Code → Codespaces" and you get a ready-to-run environment.
If you get stuck, `npm run doctor` checks your setup.

## Grade map

Kyu are beginner grades that count down from 10 to 4; Dan are expert ranks that count up from 1st to 10th.
Go from the top row down, and left to right within each row.

| Stage | Chapters (left to right) | What you can do after it |
|---|---|---|
| Beginner (Kyu) | [Kyu 10 What is Jev?](docs/en/kyu/10-what-is-jev.md) → [Kyu 9 Set up](docs/en/kyu/09-setup.md) → [Kyu 8 Your first call](docs/en/kyu/08-first-call.md) → [Kyu 7 Noul](docs/en/kyu/07-noul.md) → [Kyu 6 Choice](docs/en/kyu/06-choice.md) → [Kyu 5 Score](docs/en/kyu/05-score.md) → [Kyu 4 Ask in one batch](docs/en/kyu/04-batch.md) | Ask Jev with the three question shapes |
| Intermediate (Dan) | [1st Dan state](docs/en/dan/01-state.md) → [2nd Dan instructions](docs/en/dan/02-instructions.md) → [3rd Dan confidence](docs/en/dan/03-confidence.md) → [4th Dan patterns](docs/en/dan/04-patterns.md) → [5th Dan code boundary](docs/en/dan/05-boundary.md) | Write criteria and send unsure answers to a person |
| Advanced (high Dan) | [6th Dan dataset](docs/en/kodan/06-dataset.md) → [7th Dan calibration](docs/en/kodan/07-calibration.md) → [8th Dan Japanese lab](docs/en/kodan/08-japanese-lab.md) → [9th Dan production](docs/en/kodan/09-production.md) → [10th Dan limits and misuse](docs/en/kodan/10-limits.md) | Measure accuracy and decide if it is ready for production |
| Mastery | [Okugi mechanism](docs/en/kaiden/01-mechanism.md) → [Final exam](docs/en/kaiden/02-exam.md) | Check how it works from the recordings, then take the exam |

The full list of chapters is in [docs/en/00-index.md](docs/en/00-index.md).

## What makes this course different

- **Layered design** … Every section starts with a plain explanation a 13-year-old can follow, moves on to code and real output, and ends with a collapsed deep dive for professionals
- **Backed by commands and tests** … Of all 23 chapters, 21 have a command to run and 19 have automated tests (see "How to run each chapter" below). `npm test` passes without an API key
- **One running example that grows** … You sort posts on "the local festival message board," adding features chapter by chapter
- **Built not to go stale** … Prices, rate limits and model IDs are collected in [data/facts.json](data/facts.json) and never written directly in the text. A weekly CI job detects changes in the official docs
- **Primary sources come first** … Every section ends with a link to the official docs. This course provides an order to learn in and a place to practice; it does not replace the official docs

## Commands

| Command | What it does |
|---|---|
| `npm run demo` | Replays the samples of 17 chapters in a row (no API key needed) |
| `npm run doctor` | Checks Node, your key and connectivity |
| `npm run k10` to `npm run k04` | Runs the Kyu samples |
| `npm run d1` to `npm run d10` | Runs the Dan and high Dan samples |
| `npm run ob` | Advanced B (Jev + Claude) |
| `npm run okugi` | Checks properties of the "shape" of answers from recorded responses (Okugi) |
| `npm run show -- p22` | Shows every recorded answer for one post (3rd–8th Dan) |
| `npm run lab:complaint` | Compares the complaint question before and after a fix, in the same request (needs an API key) |
| `npm run exam` | Grades the final exam |
| `npm run label` | Label the evaluation dataset yourself (6th Dan) |
| `npm run reports` | Rebuilds the 7th and 8th Dan reports and charts from fixtures |
| `npm test` | Unit + contract tests (no API key needed) |
| `npm run test:eval` | Live evaluation against the real API (only when you have a key) |
| `npm run check` | Runs types, lint, freshness of generated files and tests together |
| `npm run record` | Re-records fixtures against the real API (needs an API key; **without a chapter name it deletes and re-records every fixture**, so commit them first) |
| `npm run facts` | Updates generated files from `data/facts.json` |

## How to run each chapter

| Group | Chapters | How to run | Automated tests |
|---|---|---|---|
| Replayed by `npm run demo` | Kyu 10 to Kyu 4 (6 chapters, excluding Kyu 9), 1st to 10th Dan (10 chapters), Advanced B | Each can also be run on its own, e.g. `npm run k10` | Yes |
| Run with a separate command | [Kyu 9](docs/en/kyu/09-setup.md) | `npm run doctor` (checks your setup) | No |
| | [Okugi](docs/en/kaiden/01-mechanism.md) | `npm run okugi` | Yes |
| | [Kaiden](docs/en/kaiden/02-exam.md) | `npm run exam` | Yes (checks that the model answers score full marks) |
| | [Advanced A](docs/en/advanced/a-tanstack-cloudflare.md) | `cd app && npm run dev` | No (CI only builds and type-checks) |
| No command (reading only) | [Advanced C](docs/en/advanced/c-frameworks.md), [Advanced D](docs/en/advanced/d-agent-skill.md) | — | No |

## Directory layout

```
docs/        Course text (kyu, dan, kodan = high Dan, advanced). docs/en/ is the English version. _generated/ is generated
src/lib/     Thin SDK wrapper, cost calculation, record/replay, evaluation metrics, chart generation
src/steps/   Runnable sample for each chapter
data/        Message board posts, facts.json (the single source for volatile facts)
fixtures/    Recorded API responses
tests/       unit / contract / eval
exam/        Final exam (tasks = problems, solutions = model answers, tests = grading)
scripts/     Fact checks, official docs diffing, fixture re-recording, report generation
app/         Advanced A web app (TanStack Start + Cloudflare Workers; its UI is in Japanese only)
```

## Status

The text of all 23 chapters is complete: Beginner (Kyu), Intermediate (Dan), Advanced (high Dan), Mastery (Kaiden) and Extensions (Advanced A to D).

The Japanese fixtures were recorded by the author against the real API (model version: [facts.en.md](docs/_generated/facts.en.md)).
The English-mode fixtures (`JEV_LANG=en`) and Advanced B are still **hand-made samples (synthetic data), not real API results**. Replays say so when they run, and the English 7th and 8th Dan reports computed from them do not represent Jev's performance.

## License

- Code: MIT
- Course text (`docs/`): [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). You may read and share it freely for non-commercial purposes. You may not sell it, include it in a paid course, or distribute modified versions
- The book 『ハンズオン Jev 入門』 (Kindle, Japanese) is a separate work from this course. Its text is not in this repository

See [LICENSE](LICENSE) for details.

This is not an official TypeSafe AI course and is not affiliated with TypeSafe AI.
