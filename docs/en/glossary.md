# Glossary

Each entry has "In one line", "Precisely" and a primary source. The chapters link here the first time a term appears.

Two pairs that must never be mixed up:

- **probability vs. confidence** … the first is the chance assigned to each option; the second is how peaked the distribution is
- **type-safe vs. factually correct** … Jev never returns a value outside the schema, but it can still return a judgment that is wrong in meaning

## System One model

🟢 Evergreen

- **In one line**: A kind of AI that only makes fast judgments. It does not write text.
- **Precisely**: A model that takes an input (state) and questions, and returns answers in a shape fixed by a schema, with probabilities. A TypeSafe AI term.

> Primary source: https://docs.typesafe.ai/concepts/system-one

## Jev

🟡 Semi-stable

- **In one line**: The name of the System One model made by TypeSafe AI.
- **Precisely**: The name of the series of System One models offered by TypeSafe AI. Each version has an ID, and you can also refer to one through an alias (→ alias).

> Primary source: https://docs.typesafe.ai/models

## state

🟢 Evergreen

- **In one line**: The material for the judgment. In this course, the text of a message-board post.
- **Precisely**: The thing Jev evaluates. Besides a string, you can pass a JSON object or array. What to put in and what to leave out is covered in the 1st Dan.

> Primary source: https://docs.typesafe.ai/concepts/state

## questions

🟢 Evergreen

- **In one line**: The list of questions for Jev. Each one gets a name.
- **Precisely**: A map from name → question definition. The names become the keys of `answers` in the response. One request can hold several questions (Kyu 4).

> Primary source: https://docs.typesafe.ai/primitives

## instructions

🟢 Evergreen

- **In one line**: The wording of the question itself.
- **Precisely**: The part of each question that asks something. Besides a string, you can use a JSON object or array. The 2nd Dan tests how the wording changes the answer.

> Primary source: https://docs.typesafe.ai/primitives/advanced

## criteria

🟢 Evergreen

- **In one line**: The possible answers and what each one means.
- **Precisely**: For Noul, descriptions of true/false; for Choice, a map from label → description; for Score, an array of descriptions ordered from 0 upward.

> Primary source: https://docs.typesafe.ai/primitives/advanced

## Choice

🟢 Evergreen

- **In one line**: A question that picks one of several options.
- **Precisely**: A primitive that picks one label from a set. The response has the chosen label (`choice`), the probability of every label (`probabilities`), and `confidence`.

> Primary source: https://docs.typesafe.ai/primitives/choice

## Score

🟢 Evergreen

- **In one line**: A question that rates something on ordered levels.
- **Precisely**: A primitive that evaluates against an ordered rubric starting at 0. The `score` in the response is the expected value over the level probabilities, so it can be a decimal.

> Primary source: https://docs.typesafe.ai/primitives/score

## Noul

🟢 Evergreen

- **In one line**: A question answered with yes or no.
- **Precisely**: A primitive that asks whether something is true. The `noul` in the response is the probability of "yes" (true), from 0 to 1.

> Primary source: https://docs.typesafe.ai/primitives/noul

## probability

🟢 Evergreen

- **In one line**: How likely each answer is.
- **Precisely**: The probability assigned to each option (or each level). For Choice and Score they add up to 1.

> Primary source: https://docs.typesafe.ai/primitives

## confidence

🟢 Evergreen

- **In one line**: Whether the answer came without hesitation.
- **Precisely**: How peaked the probability distribution is. A flat distribution means "nothing stands out." It is not the same thing as probability (Kyu 6).

> Primary source: https://docs.typesafe.ai/confidence

## calibration

🟢 Evergreen

- **In one line**: "When it says 80%, is it right about 80% of the time?"
- **Precisely**: How well predicted probabilities match the actual rate of correct answers. Measured with the Brier score or a reliability curve (7th Dan).

> Primary source: https://docs.typesafe.ai/introduction/machine-learning-primer

## RLCD

🟡 Semi-stable

- **In one line**: (not written yet)
- **Precisely**: TODO: check the definition in the official docs before filling this in. Do not guess.

> Primary source: https://docs.typesafe.ai/

## fan-out (speculative fan-out)

🟡 Semi-stable

- **In one line**: Asking, up front and all at once, the questions you might need later.
- **Precisely**: Instead of asking dependent questions one after another, ask them in parallel in one request and throw away the answers you don't need in code (4th Dan).

> Primary source: https://docs.typesafe.ai/patterns/fan-out

## confidence-gated routing

🟡 Semi-stable

- **In one line**: Handle it automatically when confident; hand it to a person when not.
- **Precisely**: A pattern that splits the processing path (auto / check / human, and so on) by confidence thresholds (3rd Dan).

> Primary source: https://docs.typesafe.ai/patterns/confidence-routing

## composite scoring

🟡 Semi-stable

- **In one line**: Combining several scores into one.
- **Precisely**: A pattern that merges several Score / Noul results, for example with weights, and uses the result to sort or decide (4th Dan).

> Primary source: https://docs.typesafe.ai/patterns/composite-scoring

## intent routing

🟡 Semi-stable

- **In one line**: Sending things where they need to go based on what the person wants.
- **Precisely**: A pattern that classifies the intent of the input with Choice and uses it to pick the processing path (4th Dan).

> Primary source: https://docs.typesafe.ai/patterns/intent-routing

## jaggedness

🟡 Semi-stable

- **In one line**: Being uneven: very good at some things, weak at others.
- **Precisely**: A model's ability varying from task to task. The official docs list the known weak spots for each version (10th Dan).

> Primary source: https://docs.typesafe.ai/model-jaggedness/jev-1.13

## alias (jev-latest, jev-preview)

🔴 Volatile

- **In one line**: A name like "the newest one" whose meaning gets swapped out over time.
- **Precisely**: Another name that points to a specific version. What it points to changes with new releases, so in production, where thresholds have been tuned, pin the version ID instead (9th Dan). For the current mapping, see [facts.en.md](../_generated/facts.en.md).

> Primary source: https://docs.typesafe.ai/models

## Btok / Mtok

🟢 Evergreen

- **In one line**: Units for counting tokens.
- **Precisely**: Mtok is one million tokens; Btok is one billion tokens. Used as units in price tables.

> Primary source: https://docs.typesafe.ai/models

## context rot

🟡 Semi-stable

- **In one line**: Stuffing in too much material makes the judgment worse, not better.
- **Precisely**: A common name for the way a model's performance drops as the input gets longer. One reason not to put everything into the state (1st Dan).

> Primary source: https://docs.typesafe.ai/concepts/state

## ZDR

🔴 Volatile

- **In one line**: A promise not to store the data you send.
- **Precisely**: Zero Data Retention. Handling in which the contents of requests are not kept. Check the official terms for what is covered and under which conditions.

> Primary source: https://docs.typesafe.ai/legal

## System 1 / System 2 (Kahneman)

🟢 Evergreen

- **In one line**: Fast intuition (1) and slow, careful thinking (2).
- **Precisely**: The psychologist Daniel Kahneman's split of thinking into two modes. The name "System One model" comes from it.

> Primary source: https://docs.typesafe.ai/concepts/system-one
