# Kyu 6: Choice (pick one)

- Time: 20 min
- Read first (official): [Primitives](https://docs.typesafe.ai/primitives) / [Choice](https://docs.typesafe.ai/primitives/choice)
- You will be able to: route posts to the right team, and read confidence

## Choice picks one, and also returns the probability of every option

🟢 Evergreen

### In one line

We ask "Which team should handle this post?" and have Jev pick one of five teams.
You get back more than the name of the chosen team: Jev also tells you **the probability of each and every team**.

### Properly

```ts
import { choice } from "@typesafe-ai/sdk";

export const department = choice("Which team should handle this post?", {
  honbu: "Main office. Overall schedule, volunteers, trash, thanks and general feedback",
  yatai: "Food stalls. Which stalls are open, prices, food",
  kotsu: "Traffic and parking. Cars, roads, buses",
  otoshimono: "Lost and found. Things lost or found",
  kyugo: "First aid and safety. Injuries, feeling unwell, danger",
});
```

The labels are Japanese team names used as code identifiers: honbu (main office), yatai (food stalls), kotsu (traffic and parking), otoshimono (lost and found), kyugo (first aid and safety).

The answer you get back:

| Field | Meaning |
|---|---|
| `choice` | The chosen label (e.g. `"kyugo"`) |
| `probabilities` | The probability of every label. They add up to 1 |
| `confidence` | How sure it is about the answer |

```bash
npm run k06
```

<details><summary>Going deeper (for pros)</summary>

- The labels (`honbu` and so on) are identifiers for your code; the descriptions are text that tells Jev what to judge by. Keep the labels short and stable, and tune the meaning in the descriptions
- The type of `choice` is inferred as a union of the labels (`"honbu" | "yatai" | ...`). You can check exhaustiveness with a `switch`
- Posts that fit none of the options will arrive, so whether to add an escape-hatch label such as `other` is a design decision. Without one, such posts get forced into one of the others

</details>

> Primary source: https://docs.typesafe.ai/primitives/choice

## Probability and confidence are different things

🟢 Evergreen

### In one line

- **probability** … "how likely it is to be each team"
- **confidence** … "whether it picked without hesitation"

If one team is clearly the favorite, confidence is high. If the votes are split, confidence is low.

### Properly

Here are two sample results (replay) side by side.

```
p05 "An elderly man has collapsed next to the tower stage! ..."
    → kyugo (confidence 0.92)
      kyugo       ███████████████████░ 0.97

p11 "The trash bins are overflowing and litter is scattered on the street."
    → honbu (confidence 0.44)
      honbu       ██████████████░░░░░░ 0.71
      yatai       ███░░░░░░░░░░░░░░░░░ 0.17
      kotsu       ██░░░░░░░░░░░░░░░░░░ 0.08
```

For p11, "main office" comes first, but the probability is spread out: "maybe it's trash near the food stalls," "maybe it's about the road."
Posts like this are exactly the ones worth having a person check.

<details><summary>Going deeper (for pros)</summary>

- confidence describes how peaked the probability distribution is. A flat distribution means "nothing stands out"
- The probability of the chosen label (0.71 in the example above) is not the same as confidence. With many labels, the whole distribution can be flat even when the top label's probability is fairly high
- The confidence in the sample data (synthetic) was computed by this course. For how the real API defines confidence, see the official Confidence page. The 3rd Dan covers this in detail

</details>

> Primary source: https://docs.typesafe.ai/confidence
