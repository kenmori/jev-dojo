# Advanced D: Using the official agent skill

- Time: 20 min
- Read first (official): [Agent skill](https://docs.typesafe.ai/agent-skill)
- You will be able to: install the official agent skill, have a coding agent write code that uses Jev, and review the result from this course's point of view

## The official skill installs with one command

🔴 Volatile

### In one line

There is an official add-on that teaches coding agents such as Claude Code "how to use Jev." It is called a skill.

### Properly

These are the steps from the README of the official repository (typesafe-ai/skills).

```bash
# Claude Code
claude plugin marketplace add typesafe-ai/skills
claude plugin install typesafe@typesafe-ai

# Other agents (via skills.sh)
npx skills add typesafe-ai/skills --skill typesafe-ai
```

In Claude Code you can call it explicitly with `/typesafe:typesafe-ai`.

<details><summary>Going deeper (for pros)</summary>

- The skill's content (SKILL.md) says again and again, "the live docs are the source of truth; read them as part of the task." The skill itself only points the way; it is designed to send the agent to docs.typesafe.ai for the details
- Several points in this course's Dan chapters (question IDs are not sent to the model, Noul has no confidence, include a no-match option, and so on) were confirmed in this SKILL.md

</details>

> Primary source: https://docs.typesafe.ai/agent-skill

## Review the agent's code from this course's point of view

🟢 Evergreen

### In one line

Have an agent write the message-board sorting, then check it using what you learned in this course. The goal is not just to get code written, but to **spot the problems**.

### Properly

An example request to the agent:

> Using TypeSafe, sort posts on the local festival message board to the right team. Have a person check anything uncertain.

Check the code it produces with this checklist.

| Check | Chapter |
|---|---|
| Does the state hold only what is needed, with names? | 1st Dan |
| Is there a "none of the above" option? | 2nd Dan |
| Are lanes split by confidence, with the thresholds as constants? | 3rd Dan |
| Are independent questions asked in one call? | Kyu 4, 4th Dan |
| Is it asking Jev something a rule could handle? | 5th Dan |
| Is there a way (an evaluation dataset) to measure the thresholds? | 6th Dan, 7th Dan |
| Is the model version pinned? | 9th Dan |
| Is the API key kept out of the browser? | Advanced A |
| Is user text kept separate from instructions? | 10th Dan |

<details><summary>Going deeper (for pros)</summary>

- The official skill tells the agent to keep the existing tech stack and scope, and to add TypeSafe only where understanding meaning is needed. If the agent rewrote unrelated parts, point that out too
- Thresholds and cookbook numbers that appear in the agent's output are "examples to evaluate." Do not use them as production values as they are

</details>

> Primary source: https://docs.typesafe.ai/agent-skill
