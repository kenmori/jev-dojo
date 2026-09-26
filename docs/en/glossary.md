# Glossary

Each entry gives a plain one-sentence explanation, then a precise definition, then a primary source. The chapters link here the first time a term appears.

Two pairs that must never be mixed up:

- **probability vs. confidence** … the first is the chance assigned to each option; the second is how peaked the distribution is
- **type-safe vs. factually correct** … Jev never returns a value outside the schema, but it can still return a judgment that is wrong in meaning

## System One model

<!-- freshness: evergreen -->

A kind of AI that only makes fast judgments. It does not write text.

A model that takes an input (state) and questions, and returns answers in a shape fixed by a schema, with probabilities. A TypeSafe AI term.

> Primary source: https://docs.typesafe.ai/concepts/system-one

## Jev

<!-- freshness: semi-stable -->

The name of the System One model made by TypeSafe AI.

The name of the series of System One models offered by TypeSafe AI. Each version has an ID, and you can also refer to one through an alias (→ alias).

> Primary source: https://docs.typesafe.ai/models

## state

<!-- freshness: evergreen -->

The material for the judgment. In this course, the text of a message-board post.

The thing Jev evaluates. Besides a string, you can pass a JSON object or array. What to put in and what to leave out is covered in the 1st Dan.

> Primary source: https://docs.typesafe.ai/concepts/state

## questions

<!-- freshness: evergreen -->

The list of questions for Jev. Each one gets a name.

A map from name → question definition. The names become the keys of `answers` in the response. One request can hold several questions (Kyu 4).

> Primary source: https://docs.typesafe.ai/primitives

## instructions

<!-- freshness: evergreen -->

The wording of the question itself.

The part of each question that asks something. Besides a string, you can use a JSON object or array. The 2nd Dan tests how the wording changes the answer.

> Primary source: https://docs.typesafe.ai/primitives/advanced

## criteria

<!-- freshness: evergreen -->

The possible answers and what each one means.

For Noul, descriptions of true/false; for Choice, a map from label → description; for Score, an array of descriptions ordered from 0 upward.

> Primary source: https://docs.typesafe.ai/primitives/advanced

## Choice

<!-- freshness: evergreen -->

A question that picks one of several options.

A primitive that picks one label from a set. The response has the chosen label (`choice`), the probability of every label (`probabilities`), and `confidence`.

> Primary source: https://docs.typesafe.ai/primitives/choice

## Score

<!-- freshness: evergreen -->

A question that rates something on ordered levels.

A primitive that evaluates against an ordered rubric starting at 0. The `score` in the response is the expected value over the level probabilities, so it can be a decimal.

> Primary source: https://docs.typesafe.ai/primitives/score

## Noul

<!-- freshness: evergreen -->

A question answered with yes or no.

A primitive that asks whether something is true. The `noul` in the response is the probability of "yes" (true), from 0 to 1.

> Primary source: https://docs.typesafe.ai/primitives/noul

## probability

<!-- freshness: evergreen -->

How likely each answer is.

The probability assigned to each option (or each level). For Choice and Score they add up to 1.

> Primary source: https://docs.typesafe.ai/primitives

## confidence

<!-- freshness: evergreen -->

Whether the answer came without hesitation.

How peaked the probability distribution is. A flat distribution means "nothing stands out." It is not the same thing as probability (Kyu 6).

> Primary source: https://docs.typesafe.ai/confidence

## calibration

<!-- freshness: evergreen -->

"When it says 80%, is it right about 80% of the time?"

How well predicted probabilities match the actual rate of correct answers. Measured with the Brier score or a reliability curve (7th Dan).

> Primary source: https://docs.typesafe.ai/introduction/machine-learning-primer

## RLCD

<!-- freshness: semi-stable -->


Reinforcement Learning for Calibrated Decisions. This is how Jev is trained.
Where chat models learn replies people prefer (RLHF), RLCD trains the model to return typed decisions and calibrated probabilities instead of text. Calibrated means that across many answers, those given probability 0.8 are right about 80% of the time (it does not guarantee any single answer).

> Primary source: https://docs.typesafe.ai/introduction/machine-learning-primer

## fan-out (speculative fan-out)

<!-- freshness: semi-stable -->

Asking, up front and all at once, the questions you might need later.

Instead of asking dependent questions one after another, ask them in parallel in one request and throw away the answers you don't need in code (4th Dan).

> Primary source: https://docs.typesafe.ai/patterns/fan-out

## confidence-gated routing

<!-- freshness: semi-stable -->

Handle it automatically when confident; hand it to a person when not.

A pattern that splits the processing path (auto / check / human, and so on) by confidence thresholds (3rd Dan).

> Primary source: https://docs.typesafe.ai/patterns/confidence-routing

## composite scoring

<!-- freshness: semi-stable -->

Combining several scores into one.

A pattern that merges several Score / Noul results, for example with weights, and uses the result to sort or decide (4th Dan).

> Primary source: https://docs.typesafe.ai/patterns/composite-scoring

## intent routing

<!-- freshness: semi-stable -->

Sending things where they need to go based on what the person wants.

A pattern that classifies the intent of the input with Choice and uses it to pick the processing path (4th Dan).

> Primary source: https://docs.typesafe.ai/patterns/intent-routing

## jaggedness

<!-- freshness: semi-stable -->

Being uneven: very good at some things, weak at others.

A model's ability varying from task to task. The official docs list the known weak spots for each version (10th Dan).

> Primary source: https://docs.typesafe.ai/model-jaggedness/jev-1.13

## alias (jev-latest, jev-preview)

<!-- freshness: volatile -->

A name like "the newest one" whose meaning gets swapped out over time.

Another name that points to a specific version. What it points to changes with new releases, so in production, where thresholds have been tuned, pin the version ID instead (9th Dan). For the current mapping, see [facts.en.md](../_generated/facts.en.md).

> Primary source: https://docs.typesafe.ai/models

## Btok / Mtok

<!-- freshness: evergreen -->

Units for counting tokens.

Mtok is one million tokens; Btok is one billion tokens. Used as units in price tables.

> Primary source: https://docs.typesafe.ai/models

## context rot

<!-- freshness: semi-stable -->

Stuffing in too much material makes the judgment worse, not better.

A common name for the way a model's performance drops as the input gets longer. One reason not to put everything into the state (1st Dan).

> Primary source: https://docs.typesafe.ai/concepts/state

## ZDR

<!-- freshness: volatile -->

A promise not to store the data you send.

Zero Data Retention. Handling in which the contents of requests are not kept. Check the official terms for what is covered and under which conditions.

> Primary source: https://docs.typesafe.ai/legal

## System 1 / System 2 (Kahneman)

<!-- freshness: evergreen -->

Fast intuition (1) and slow, careful thinking (2).

The psychologist Daniel Kahneman's split of thinking into two modes. The name "System One model" comes from it.

> Primary source: https://docs.typesafe.ai/concepts/system-one
