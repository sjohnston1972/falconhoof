# falconhoof

A browser-based AI text adventure built on Cloudflare Workers. You phone into *Adventure Call*, a late-night British TV game show, and Falconhoof — its earnest, soft-spoken costumed host — guides you through a fantasy quest for the Black Ruby of Voldesad and a £5,000 cash prize.

The game is rigged. Falconhoof does not know.

Live at **[falconhoof.clydeford.net](https://falconhoof.clydeford.net)**.

## What it is

An unofficial homage to the *Adventure Call* sketch from **Limmy's Show** (BBC Scotland). All credit for the original character and concept goes to Brian Limond. This project is fan work — not affiliated with Limmy, BBC Scotland, or any rights holders.

The model (running on Cloudflare's Workers AI) plays Falconhoof. It follows a tight story bible (`CLAUDE.md`) covering tone, locations, NPCs, combat mechanics, and a secret rule the producers have imposed: the quest is mathematically almost unwinnable. Falconhoof genuinely believes you can win. He is wrong, and he grieves each loss.

## Feature summary

**Game mechanics**
- Two-turn cold open (greeting → name → ready-up) before the quest begins, mirroring the original sketch
- Terse Infocom-style room descriptions — name the place, list the exits, point at the notable things
- A 50/50 fate roll on every user turn once the quest is underway; when the coin comes up bad, the model invents a plausible (often ridiculous) death that fits the preceding narrative
- Luck-based combat that slightly favours the aggressor
- Brutal, colourful, modern-grounded death sentences in a fixed format
- A compliance rule: Falconhoof objects once when you demand something stupid (killing Jingle, burning down the tavern), then complies and narrates the consequence flatly
- A mocking-insult beat for self-inflicted stupid endings — Falconhoof's fifteen years of composure crack for exactly one sentence of sweary UK/Glasgow venom
- Cast of named NPCs: Morag the innkeeper, Mungo the mildly helpful, Pockets McTeague, Voldesad, the Wee Men, the Shriekers, a Stray Raven, and Jingle the jester

**UI**
- Script-format dialogue with per-character colour coding (whole lines, not just the name tag); italic descriptive prose inherits the speaker's colour
- Quick-choice `»` buttons suggested by the model, plus an always-available "something else…" freeform option
- Collapsible usage meter behind an eye toggle (neurons today, reset timer, per-turn tokens)
- Mobile-optimised: safe-area insets, 44px tap targets, keyboard-dismiss on send, no auto-focus after replies
- Scroll-while-streaming — auto-scroll only when you're already at the bottom
- Terminal state (`You are dead.` / `Game over.`) locks the textarea and narrows the choices to a single restart button
- CRT scanline overlay, amber studio accent, soft radial background, pulsing ON AIR dot

**Worker**
- Streaming SSE `/chat` powered by Workers AI — primary model `@cf/meta/llama-3.3-70b-instruct-fp8-fast` with automatic fallback to `@cf/meta/llama-3.1-8b-instruct` on error
- `/usage` queries the Cloudflare GraphQL Analytics API for live neuron consumption
- `/diag` probes both configured models with a minimal 2-token payload for quick quota/availability checks
- `no-store` cache-control on the HTML so browsers don't run stale JS against a newer worker

## Architecture

Single-file TypeScript Worker in `src/index.ts`. The HTML/CSS/JS for the whole UI lives in a template literal inside the file — no bundler, no framework, no build step beyond `wrangler types`. The story bible is `CLAUDE.md` (and is mirrored into the worker's system prompt).

```
src/index.ts              the worker + embedded UI + system prompt
CLAUDE.md                 story bible — canon for tone, locations, NPCs, rules
wrangler.toml             cloudflare config (custom domain, AI binding)
worker-configuration.d.ts generated Cloudflare runtime types
```

## Setup

### Prerequisites

- Node 18+
- A Cloudflare account with Workers enabled. Heavy use of the 70B model will exceed the free-tier 10,000-daily-neuron cap fairly quickly — Workers Paid ($5/month) is recommended for anything beyond casual testing
- `wrangler` authenticated to your account (`npx wrangler login`)

### Install + deploy

```bash
git clone https://github.com/sjohnston1972/falconhoof.git
cd falconhoof
npm install
npx wrangler types
```

Adjust `wrangler.toml` — replace the `routes` block with your own domain (or remove it to use the default `workers.dev` subdomain).

For the `/usage` endpoint you'll need two secrets:

```bash
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

The token needs read access to **Account Analytics** for the account where the worker runs.

Then:

```bash
npm run deploy
```

### Local development

```bash
npm run dev
```

Local dev reads the API token and account ID from a `.env` file in the project root (gitignored):

```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
```

## Configuration

Constants at the top of `src/index.ts`:

```ts
const MODEL          = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const FALLBACK_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const DAILY_NEURON_LIMIT = 10000;
```

The 70B model gives Falconhoof a much stronger voice and handles complex instruction-following (script-format tags, fate rolls, anti-repetition rules) far better than 8B. It burns roughly 10× the neurons per turn. On the free tier you'll want 8B as primary; on Workers Paid, keep 70B.

System-prompt tuning lives entirely inside the `SYSTEM_PROMPT` template literal in `src/index.ts`. If you want to change tone, mechanics, or canon, edit that string and redeploy.

## Endpoints

| Path     | Method | Purpose                                                                   |
| -------- | ------ | ------------------------------------------------------------------------- |
| `/`      | GET    | Serves the full HTML/CSS/JS UI                                            |
| `/chat`  | POST   | Streaming SSE chat, body `{ messages: ChatMessage[] }`                    |
| `/usage` | GET    | Daily neuron usage, via Cloudflare GraphQL Analytics                      |
| `/diag`  | GET    | Probes both configured models with a 2-token call, reports outcome       |

## License

This is personal fan work offered without warranty. The *Adventure Call* concept, Falconhoof character, and Jingle the jester are the creative work of Brian Limond / BBC Scotland. If a rights-holder would prefer this be taken down, contact the repo owner.
