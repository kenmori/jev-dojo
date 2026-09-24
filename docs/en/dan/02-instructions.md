# 2nd Dan: Instructions and criteria

- Time: 30 min
- Read first (official): [Primitives](https://docs.typesafe.ai/primitives) / [Advanced primitives](https://docs.typesafe.ai/primitives/advanced)
- You will be able to: confirm by experiment that the wording of a question changes the answer, and spell out definitions and exceptions in a JSON structure

## How you ask changes the answer

🟢 Evergreen

### In one line

Asking just "Complaint?" is different from first explaining "It counts as a complaint if it describes a problem or asks for improvement. Indirect wording and sarcasm count too." Of course the answers differ.
People also judge inconsistently when nobody tells them the criteria.

### Properly

[src/steps/d2-instructions.ts](../../../src/steps/d2-instructions.ts) asks about the same posts in three different wordings.

| | Wording |
|---|---|
| v1 | `noul("Complaint?")` |
| v2 | A sentence question + what yes/no mean (same as Kyu 7) |
| v3 | Definition, what is included and what is excluded, **structured as JSON** |

```ts
export const structured = noul(
  {
    task: "Decide whether this post is a complaint about the organizers",
    definition: "The writer is having a problem, is dissatisfied, or is asking for improvement",
    include: ['Indirect requests ("it would be nice if...")', 'Sarcasm ("great job, organizers")', "Requests phrased very politely"],
    exclude: ["Plain questions", "Thanks or impressions", "Reports such as lost items"],
  },
  { true: "A complaint, dissatisfaction, or a request for improvement", false: "Anything else" },
);
```

The target posts are an indirect request (p08), sarcasm (p14), a very polite request (p51) and a polite question (p13).

```bash
npm run d2
```

<details><summary>Going deeper (for pros)</summary>

- The official skill says: "A plain string is fine for a simple question. When definitions, contrasts, exclusions or examples make the instruction clearer, use a structured object or array"
- Put exactly one narrow, consistent judgment into each question. If you mix two, as in "Is this a complaint and is it urgent?", you cannot tell which meaning the probability is for
- When you change the wording, redo the 7th Dan measurement to check it. Do not judge from how a single post looks
- The replay numbers are samples. Even if "v3 is the highest" there, the real API will not necessarily agree

</details>

> Primary source: https://docs.typesafe.ai/primitives/advanced

## Provide a "none of the above" option

🟢 Evergreen

### In one line

Without an "other" option, even an unrelated ad gets forced onto some team.

### Properly

The team question in Kyu 6 had no way out. The second half of the 2nd Dan compares the same ad post (p25) with two questions: "without sonota" and "with sonota" (sonota means "none of the above").

```ts
sonota: "None of the above. Ads or anything unrelated to the festival",
```

The question with this way out added is the "production" question used from the 3rd Dan on. It lives in [src/lib/board.ts](../../../src/lib/board.ts).

<details><summary>Going deeper (for pros)</summary>

- The official skill says: "If it is possible that nothing matches, include a no-match option"
- In a Choice with no way out, even when the probability leans toward one label, that label may just be "first place by elimination". Check whether confidence is low as well (3rd Dan)
- If "does anything match at all?" is useful on its own, you can also ask it as a separate Noul, apart from the Choice

</details>

> Primary source: https://docs.typesafe.ai/primitives/choice
