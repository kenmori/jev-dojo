# Kyu 9: Set up

- Time: 15 min
- Read first (official): [Quick start](https://docs.typesafe.ai/introduction/quickstart) / [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- You will be able to: `git clone` → `npm install` → pass `npm run check`

## The samples run on recorded answers, even without an API key

<!-- freshness: volatile -->

Before you get an API key, let's get everything running on your machine.
There is a mode (replay) that shows answers recorded earlier, like playing back a video.

You need Node.js (for the version, see [.nvmrc](../../../.nvmrc) and `engines` in `package.json`) and Git.

```bash
git clone https://github.com/kenmori/jev-dojo
cd jev-dojo
npm install
npm run demo     # Plays the samples of 17 chapters back to back. No API key, no cost
npm run check    # Type check, lint, tests. When everything is green, you are ready
```

To take the course in English, set `JEV_LANG=en`. Either add it to `.env` (see [.env.example](../../../.env.example); create `.env` as shown in the next section), or put it in front of each command: `JEV_LANG=en npm run demo`.
The chapters write the plain command (`npm run k07`) and assume this setting.

If you would rather not install Node.js, open the repository from GitHub via "Code → Codespaces". The same environment starts up in your browser ([.devcontainer](../../../.devcontainer/devcontainer.json)).

<details><summary>Going deeper (for pros)</summary>

The run mode is switched with the environment variable `JEV_MODE` ([src/lib/fixtures.ts](../../../src/lib/fixtures.ts)).

| Mode | What it does | API key | Cost |
|---|---|---|---|
| `replay` | Returns responses saved in `fixtures/` | Not needed | None |
| `live` | Calls the real API | Needed | Yes |
| `record` | Calls the real API and saves the responses to `fixtures/` | Needed | Yes |

If it is not set, the rule is "live if there is a key, replay if not."
Under the hood, it just passes a function that returns responses from files to the SDK's `fetch` option.
A fixture's file name is a hash of the request, so if you change even one character of a question, it tells you "no fixture found."

`JEV_LANG` switches the language of the questions and the output. In English mode the questions are different, so their fixtures live separately under `fixtures/en/`.

The fixtures that ship with the repository are **hand-made samples (synthetic data)**. They are not real API results.
You can replace them with real ones using `npm run record`. You can tell which is which from each fixture's `meta.source` and from the message printed when you run a sample.

</details>

> Primary source: https://docs.typesafe.ai/sdk/javascript

## Put your key in .env before using the real API

<!-- freshness: volatile -->

Set up the "password" you need to talk to the real Jev.

1. Follow the official Quick start to create an account and issue an API key
2. Create `.env` and paste the key into it

```bash
cp .env.example .env
# Open .env and paste your key after TYPESAFE_API_KEY=
npm run doctor   # Checks Node, the key and the connection in one go
npm run k10      # The Kyu 10 sample against the real API
```

For the sign-up credit and pricing, see [facts.en.md](../../_generated/facts.en.md#pricing).
Every sample prints its cost each time it runs, like "This run: input ○ tok → $0.00000…".

<details><summary>Going deeper (for pros)</summary>

- `.env` is already in `.gitignore`. Do not commit your key
- The SDK reads `TYPESAFE_API_KEY` from the environment automatically. This course loads `.env` with Node's `process.loadEnvFile` ([src/lib/env.ts](../../../src/lib/env.ts))
- If you call the API directly from a browser, the key is visible to anyone using the page. By default the SDK refuses to run in a browser (`dangerouslyAllowBrowser`). Building it into a web app is covered in Advanced A

</details>

> Primary source: https://docs.typesafe.ai/introduction/quickstart
