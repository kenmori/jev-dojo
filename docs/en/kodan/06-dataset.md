# 6th Dan: Build an evaluation dataset

- Time: 60 min (including labeling)
- Read first (official): [Machine learning primer](https://docs.typesafe.ai/introduction/machine-learning-primer)
- You will be able to: define for yourself what counts as the right answer, label 50 or more posts, and measure in numbers how much labels disagree

## The right answer is something you decide

🟢 Evergreen

### In one line

There is no universal right answer to "Is this post a complaint?"
Whether you call "The fireworks woke my baby. It would be nice if they ended a little earlier" a complaint depends on how the organizers want to run things.
Before you measure how accurate Jev is, first decide **your own right answers** and write them down.

### Properly

The data is the 60 posts in [data/posts.ja.json](../../../data/posts.ja.json). An English translation of the same posts is in [data/posts.en.json](../../../data/posts.en.json); the 8th Dan uses both.

The author's example labels are in [data/labels.json](../../../data/labels.json). **They are not the ground truth. They are one person's judgment, following the guide below.**

```bash
npm run label   # label posts one at a time; if you stop, it picks up where you left off
npm run d6      # show what is in the data, and how well your labels agree with the author's example
```

Your labels are saved to `data/labels.mine.json`, and the 7th and 8th Dan use them automatically.

<details><summary>Going deeper (for pros)</summary>

- 60 posts is the bare minimum for "seeing a trend". Before using this in production, take a random sample of a few hundred real posts and label them
- Label the evaluation data **before** you look at Jev's output. If you see its answers first, they will pull your judgment along
- Any skew in the posts (few complaints, only 7 first-aid posts, and so on) becomes a weakness of the measurement itself. Numbers for small classes swing a lot

</details>

> Primary source: https://docs.typesafe.ai/introduction/machine-learning-primer

## Write down the labeling rules for the posts you hesitate on

🟡 Semi-stable

### In one line

For the posts that are hard to call, write the rules down in words. Without rules, even the same person will judge differently from one day to the next.

### Properly

**Complaint (isComplaint)**

- Yes: the post describes a problem, dissatisfaction, or a request for improvement. This includes indirect wording ("it would be nice if..."), sarcasm ("What a great festival"), and polite requests
- No: questions, thanks, impressions, lost-item reports, advertising
- A report of danger ("a lantern looks like it is about to fall") is "yes", because it asks for something to be fixed

**Team (department)**

| Label | Covers |
|---|---|
| honbu (main office) | the overall schedule, volunteers, trash, toilets, directions, thanks and general opinions |
| yatai (food stalls) | whether a stall is open, prices, food, stall equipment |
| kotsu (traffic and parking) | cars, bicycles, roads, buses, road closures, wheelchair routes |
| otoshimono (lost and found) | lost items, found items, pets that ran away |
| kyugo (first aid and safety) | injuries, feeling unwell, lost children, dangerous situations |
| sonota (none of the above) | posts that have nothing to do with the festival |

**Urgency (urgency)**

| Level | Rule of thumb |
|---|---|
| 2 | involves people's safety or health; needs action right now |
| 1 | someone is in trouble now, or it will get worse if left alone; should be handled today |
| 0 | can be handled later, or answered when someone has time |

**Tags (used in the 8th Dan)**: 敬語 (honorific), 主語省略 (omitted subject), 婉曲 (indirect), 皮肉 (sarcasm). Add every tag that applies (only in the author's example).

<details><summary>Going deeper (for pros)</summary>

- Once the guide is written, have two people label the same posts and measure how well they agree (Cohen's κ). `npm run d6` prints the κ between your labels and the author's example
- When an item has a low κ, the problem is in the guide before it is in Jev. Line up the posts where you disagreed, add rules, and label again
- This guide is also a first draft of Jev's criteria (2nd Dan). A rule you cannot explain to a person will not get through to Jev either

</details>

> Primary source: https://docs.typesafe.ai/primitives
