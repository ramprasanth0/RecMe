# RecMe — Key Decisions (Do Not Re-Litigate)

These are firm decisions already made. Do not propose alternatives unless there is a critical bug.

---

## AI Engine

**Decision:** Google Gemini (`gemini-2.0-flash`) via `@google/genai` SDK.

- Was originally Claude (Anthropic). Migrated in v0.5.
- `ANTHROPIC_API_KEY` and `@anthropic-ai/sdk` do NOT exist in this project.
- For recommendations: use `generateContent` (non-streaming) with `responseMimeType: "application/json"` and `thinkingBudget: 0`
- For chat: use `generateContentStream` (SSE) — `responseMimeType` is invalid on streaming calls
- Temperature: `0.3`, topP: `0.8` for recommendations (keeps results on-query)
- `maxOutputTokens: 8192` — never lower this; Gemini thinking eats hidden tokens

---

## Auth

**Decision:** Custom httpOnly cookie session (`recme_user_id`), NOT NextAuth, NOT Supabase SSR auth helpers.

- Cookie is set in route handlers after OAuth/OTP success
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are **not used** — do not add them
- Supabase is used only for the database and for sending OTP emails
- `getUserWithFreshToken()` handles Spotify token refresh proactively

---

## Spotify playlists

**Decision:** `POST /me/playlists` (not `/users/{id}/playlists`) and `public: true`.

- `/users/{id}/playlists` returns 403 for reasons related to namespace matching
- `public: true` is required because only `playlist-modify-public` scope is requested

**Decision:** Track URI resolution via Spotify search, NOT via Gemini-provided URIs.

- Gemini hallucinated/guessed Spotify URIs in early versions — they were wrong
- `searchTrack(title, artist)` does a live Spotify search: `title+artist` first, then `title` only as fallback
- Tracks not found on Spotify are returned in a `notFound[]` array and shown to the user with "add manually" label
- No match validation (fuzzy scoring etc.) — first result is always accepted; AI disclaimer shown in UI

---

## Movie posters

**Decision:** Server-side TMDB enrichment after Gemini response.

- Gemini hallucinated `tmdbId` values — posters were wrong
- After Gemini returns titles, `/api/gemini/recommend` calls `searchMovieTMDB(title, year)` in parallel for all items
- TMDB-verified `tmdbId`, `posterPath`, `genres`, `rating`, `synopsis` replace AI values
- Falls back to AI values only if TMDB returns no match
- `include_adult=false` on all TMDB calls

---

## Routing

**Decision:** `/home` is the universal landing page. `/` redirects to `/home`.

- Both guests and logged-in users land on `/home`
- SSR auth detection on `/home` — reads `recme_user_id` cookie server-side
- No `/dashboard` or separate guest/auth routes
- Middleware only protects `/personalize` and `/profile`

---

## Navigation (3 sections)

**Decision:** Home / Personalize / Profile. Chat is accessible from Home.

- Removed the Chat section from the nav — `/chat` is still a full page but not a primary nav item
- Personalize holds: AI playlist generator + user's Spotify top artists/tracks
- Profile holds: genre preferences + saved recommendations + connected accounts

---

## Album art

**Decision:** iTunes Search API via server-side proxy at `/api/itunes/artwork`.

- Spotify image URLs (`i.scdn.co`) are available for Spotify-connected users but not email users
- iTunes gives 600×600 artwork for any track without auth
- Direct browser fetch blocked by CORS → server-side proxy required
- 24-hour Next.js data cache on the proxy

---

## Caching

**Decision:** Module-level `autoRecCache` in `useRecommendations.ts` for auto-fetched recs.

- Gemini recommendations for `/home` take 3–8 seconds
- Module-level object survives component unmount/remount during Next.js client-side navigation
- Cache is keyed by `"music"` | `"movie"`
- Only auto-fetch (silent=true) results are cached; user-typed mood queries are never cached
- Cache TTL = tab lifetime (cleared on hard refresh or tab close)

---

## Gemini prompt structure

**Decision:** Query-first prompt architecture in `buildSystemPrompt()`.

- User query appears at the TOP as the PRIMARY directive
- Spotify/genre context is labelled "secondary tiebreaker only — never override query relevance"
- Rule 7: "If query asks for discovery, NEVER recommend tracks already in user's top tracks"
- This fixed the problem where Spotify context was dominating and making queries irrelevant (BUG-16)

---

## What NOT to do

- Do not use `NEXTAUTH_SECRET` — it's not a dependency
- Do not use `@anthropic-ai/sdk` — Gemini replaced Claude
- Do not add `responseMimeType` to streaming Gemini calls — it causes a 400
- Do not lower `maxOutputTokens` below 8192 — truncation will return
- Do not remove `thinkingBudget: 0` — thinking tokens silently eat output quota
- Do not use `/users/{id}/playlists` for Spotify playlist creation — use `/me/playlists`
- Do not trust Gemini's `tmdbId` values — always verify via TMDB search
- Do not call iTunes API directly from the browser — always use the server proxy
- Do not use `<Image fill>` with `min-h-screen` parents — use CSS `backgroundImage` instead (the image resolves to height 0)
- Do not run `grid-cols-3` on the navbar — use `flex` + `ml-auto` (grid breaks mobile alignment)
