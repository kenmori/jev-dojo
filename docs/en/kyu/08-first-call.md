# Kyu 8: Your first call

- Time: 20 min
- Read first (official): [Quick start](https://docs.typesafe.ai/introduction/quickstart) / [API](https://docs.typesafe.ai/api)
- You will be able to: POST with curl and read the JSON that comes back

## You send one JSON object and get one JSON object back

<!-- freshness: semi-stable -->

Asking Jev something is like mailing a letter in a fixed format and getting a reply in a fixed format.
The SDK is a tool that writes that letter for you, but first let's write one by hand.

All you send is one JSON object.

```bash
curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "jev-latest",
    "state": "What time do volunteers need to gather?",
    "questions": {
      "isQuestion": {
        "type": "noul",
        "instructions": "Is this post a question for the organizers?"
      }
    }
  }'
```

| Key | Meaning |
|---|---|
| `model` | Which model to ask |
| `state` | The material for the judgment. Here, the text of a post |
| `questions` | The list of questions. You choose the name (here, `isQuestion`) |
| `type` | The shape of the answer: `noul` (yes/no), `choice` (pick one), `score` (rate it) |
| `instructions` | The question itself |

The JSON that comes back looks roughly like this.

```json
{
  "model": "(the version of the model that actually answered)",
  "answers": {
    "isQuestion": { "type": "noul", "noul": 0.98 }
  },
  "usage": { "input_tokens": 64, "output_tokens": 0 }
}
```

- `answers.isQuestion.noul` … the probability of "yes"
- `usage.input_tokens` … the token count that the price is based on

[src/steps/k08-raw.ts](../../../src/steps/k08-raw.ts) does the same thing in TypeScript, without the SDK.

```bash
npm run k08
```

<details><summary>Going deeper (for pros)</summary>

- The names in `questions` become the keys of `answers`. With the SDK, this mapping is inferred as TypeScript types (Kyu 7 onward)
- If you pass an alias (such as `jev-latest`) as `model`, the `model` in the response holds the version that was actually used. You can use this to find out where an alias currently points ([scripts/verify-facts.ts](../../../scripts/verify-facts.ts))
- `state` and `instructions` accept not only strings but also JSON objects and arrays (covered in the 2nd Dan)
- The numbers in the JSON above are this course's samples. Run it yourself to see the real values

</details>

> Primary source: https://docs.typesafe.ai/api
