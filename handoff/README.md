# RecMe — Context Handoff

This folder is a self-contained briefing package for a new model (or engineer) to take over the project without reading the entire codebase from scratch.

## Read in this order

1. **[project-state.md](./project-state.md)** — what's built, what's pending, overall status
2. **[architecture.md](./architecture.md)** — stack, folder layout, data flow, caching
3. **[auth-flow.md](./auth-flow.md)** — how authentication works end-to-end
4. **[routes-and-api.md](./routes-and-api.md)** — all pages and API route handlers
5. **[design-system.md](./design-system.md)** — tokens, fonts, component patterns
6. **[key-decisions.md](./key-decisions.md)** — decisions already made (do not re-litigate)

For error history, see **[../BUG_REPORT.md](../BUG_REPORT.md)** — 20 bugs, all resolved.

## Quick facts

| Item | Value |
|---|---|
| App name | RecMe |
| Tagline | "Your taste. Amplified." |
| Live URL | https://rec-me-mu.vercel.app |
| GitHub | https://github.com/ramprasanth0/RecMe |
| Stack | Next.js 14 · Supabase · Gemini AI · Spotify API · TMDB |
| AI model | `gemini-2.0-flash` (via `@google/genai`) |
| Current branch | `main` — deployed to Vercel on push |
| Node version | 20.x |

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in keys (see architecture.md)
npm run dev
```

> Spotify OAuth does **not** work on localhost — the redirect URI is hardcoded to the Vercel production URL. Test auth flows on the deployed site.

## Verify before any commit

```bash
npm run lint
npm run typecheck
```

Both must pass cleanly. No warnings are acceptable.
