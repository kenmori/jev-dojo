# 1st Dan: Designing the state

- Time: 30 min
- Read first (official): [State](https://docs.typesafe.ai/concepts/state) / [How to build with System One](https://docs.typesafe.ai/concepts/how-to-build-with-system-one)
- You will be able to: decide what goes into the state and what stays out, weighing both accuracy and cost

## More material does not mean a better decision

<!-- freshness: evergreen -->

When you ask a teacher "Is this essay a complaint?", you could hand over just the essay, add a note about the message board, or dump every past essay on the desk.
Too much material actually blurs the judgment. And the more material you send, the more it costs (in tokens).

[src/steps/d1-state.ts](../../../src/steps/d1-state.ts) asks "Is this a complaint?" about the same post (p08, an indirect request) three times, changing only how the state is passed.

| | What the state holds | Aim |
|---|---|---|
| A | `{ post: { text } }` | The bare minimum |
| B | `{ board: { name, purpose }, post: { text, author } }` | Add context that matters for the decision, as named fields |
| C | `{ post: { text }, history: [the other 59 posts] }` | Stuff in unrelated material |

```bash
npm run d1
```

The output shows the **input token count** next to each probability. The stuffed version C uses far more tokens than B (the token counts in the sample data are estimates, so check the exact ratio live). To see how the probability moves, run it live and check with your own eyes.

> The probabilities shown in replay are hand-made samples. Even if it looks like "C lowers the probability", that is not a result from the real API.

<details><summary>Going deeper (for pros)</summary>

- The official skill recommends "passing enough relevant state to answer (the text, who wrote it, relationships, policies, current facts)" and "using named JSON fields when the context has several parts"
- The drop in performance as input gets longer is commonly called context rot. Jev has two context-length limits: "total" and "state + longest question" ([facts.en.md](../../_generated/facts.en.md#context-length))
- "Put everything in, just in case" can lower accuracy and is certain to raise the cost. Decide what to add by measuring before and after you add it (6th and 7th Dan)

</details>

> Primary source: https://docs.typesafe.ai/concepts/state

## Point to a place in the state from the question

<!-- freshness: evergreen -->

If you give your material names, the question can say exactly where to look, like "Is `post.text` a complaint?"

The 1st Dan question points to a place in the state with a path wrapped in backticks.

```ts
export const isComplaint = noul("Is `post.text` a complaint about the organizers?", {
  true: "The writer describes a problem, dissatisfaction, or a request for improvement. Includes indirect wording",
  false: "A question, thanks, a report, or anything else that is not a complaint",
});
```

Even when the board description (`board`) sits next to the post (`post`), as in B, it is clear that the thing to judge is the text of the post.

<details><summary>Going deeper (for pros)</summary>

- Referring to nested state with a backticked path such as `ticket.messages[0].text` is the style the official skill recommends
- The question ID (the key name, such as `isComplaint`) is **not sent to the model**. It is a name for your code. Put the full meaning of the question in the instructions and criteria
- Keeping user-written text in a named field is also the foundation of the prompt-injection defenses covered in the 10th Dan

</details>

> Primary source: https://docs.typesafe.ai/concepts/how-to-build-with-system-one
