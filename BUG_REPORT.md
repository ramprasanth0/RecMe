# RecMe — Bug Report
**Project:** RecMe v0.5 · **Stack:** Next.js 14 · Gemini · Spotify API

---

## BUG-01 · Gemini returning Markdown-fenced JSON instead of raw JSON
**Time:** 08:48–09:00 · **Commits:** `cfc2dc9` → `a54e03c` → `54ab94d`
**Status:** ✅ Fixed · **Severity:** Critical

**What happened:**
Gemini wrapped all JSON responses in Markdown code fences (` ```json ... ``` `). `JSON.parse()` threw on every response. No recommendations or playlists could be rendered.

**Root cause:**
Gemini models default to conversational/Markdown formatted output. Without an explicit instruction, the model treats any JSON block as a code sample and wraps it accordingly.

**Fix (3 rounds):**
1. `cfc2dc9` — Added strip function to remove ` ```json ` / ` ``` ` wrappers before parsing in the playlist route
2. `a54e03c` — Added `responseMimeType: "application/json"` to the Gemini config for the playlist route
3. `54ab94d` — Extended the fence-stripping and JSON-forcing to all Gemini routes globally

---

## BUG-02 · SSE line buffering broken across network chunks
**Time:** 09:04 · **Commit:** `6a773e5`
**Status:** ✅ Fixed · **Severity:** High

**What happened:**
The SSE stream parser in `useRecommendations` was splitting each network chunk on `\n` directly. When a `data:` line was split across two TCP packets, it produced two unparseable fragments and dropped the event entirely. Streaming recommendations silently failed mid-load.

**Root cause:**
`ReadableStream` chunks don't align to line boundaries. The parser assumed one chunk = one complete SSE event.

**Fix:**
Implemented a carry-over buffer — leftover text at the end of each chunk is prepended to the next chunk before line-splitting.

---

## BUG-03 · `responseMimeType: "application/json"` rejected in streaming mode
**Time:** 09:24 · **Commit:** `aae4478`
**Status:** ✅ Fixed · **Severity:** High

**What happened:**
Setting `responseMimeType: "application/json"` in a `generateContentStream` call returned a `400 Bad Request` from the Gemini API. All streaming chat responses broke immediately after BUG-01's fix attempt was extended to the streaming route.

**Root cause:**
`responseMimeType` is only valid for non-streaming `generateContent` calls. The Gemini SDK rejects it on streaming requests.

**Fix:**
Removed `responseMimeType` from `src/app/api/gemini/route.ts` (the streaming chat route). JSON enforcement for chat remained prompt-only. Also bumped `maxOutputTokens` as a first attempt at BUG-05.

---

## BUG-04 · Recommendations JSON truncated — Vercel 15s timeout cutting stream mid-response
**Time:** 09:39 · **Commit:** `c003004`
**Status:** ✅ Fixed · **Severity:** Critical

**What happened:**
Even after BUG-02 and BUG-03 fixes, recommendations were still failing intermittently. Vercel's 15-second serverless function timeout was terminating the streaming response before Gemini finished writing the full JSON object, producing truncated invalid JSON that could not be parsed. The UI showed no cards.

**Root cause:**
Two compounding issues: (1) Vercel free-tier 15s function limit cut the stream early; (2) SSE streaming added overhead on top of an already slow Gemini generation.

**Fix:**
- Switched `/api/gemini/recommend` from `generateContentStream` (SSE) to `generateContent` (single blocking response) with `responseMimeType: "application/json"` — valid here since it's non-streaming
- Updated `useRecommendations` hook from SSE reader to a simple `fetch` + `JSON.parse`
- Set `maxDuration: 30` on the route handler to extend the function timeout

---

## BUG-05 · iTunes album art blocked by CORS
**Time:** 09:39 · **Commit:** `c003004` (same fix batch as BUG-04)
**Status:** ✅ Fixed · **Severity:** Medium

**What happened:**
`RecommendationCard` was calling `itunes.apple.com` directly from the browser to fetch album artwork. All requests were silently blocked by the browser's CORS policy. Every music card showed the placeholder icon.

**Root cause:**
iTunes Search API does not return `Access-Control-Allow-Origin` headers for arbitrary browser origins.

**Fix:**
Created a server-side proxy at `/api/itunes/artwork` that fetches from iTunes server-side (no CORS restriction) and returns the image URL. Results are cached 24h server-side. `RecommendationCard` now calls the proxy endpoint.

---

## BUG-06 · AI Playlist Generator timing out on Vercel
**Time:** 13:27 · **Commit:** `31e3788`
**Status:** ✅ Fixed · **Severity:** High

**What happened:**
The generate-playlist route consistently timed out in production. For a 15-track request, the route was performing 15 sequential Spotify `GET /search` calls — one per track — pushing total execution time well past 15 seconds.

**Root cause:**
No batching or parallelism in the Spotify track search loop. Execution time scaled linearly with playlist size.

**Fix:**
- Switched sequential searches to batched `Promise.all` calls
- Extended route `maxDuration` to 60 seconds
- Capped maximum playlist size at 20 tracks (down from 30)

---

## BUG-07 · Hydration mismatch on time-aware greeting
**Time:** 13:50 · **Commit:** `ccd31bf`
**Status:** ✅ Fixed · **Severity:** Low

**What happened:**
The "Good morning / afternoon / evening" greeting was computed on the Vercel server (UTC timezone) during SSR and then recomputed on the client (IST, UTC+5:30) during hydration. The mismatch caused a React hydration warning and a visible text flicker on first load.

**Root cause:**
`new Date().getHours()` on the server returns UTC time; on the browser it returns the user's local time. Rendered server HTML and client hydration output didn't match.

**Fix:**
Moved greeting computation entirely into `useEffect` — the component renders an empty string on the server, then sets the correct local-time greeting after mount.

---

## BUG-08 · `maxOutputTokens` too low — AI response cut off before JSON closes
**Time:** 14:02 · **Commit:** `dc668e7`
**Status:** ✅ Partially fixed (continued in BUG-10) · **Severity:** High

**What happened:**
Even with non-streaming recommendations (BUG-04 fix), responses with 6–8 items were still being truncated. The JSON object was cut off before the closing `]` and `}`, causing parse failures.

**Root cause:**
`maxOutputTokens` was set to 2000. A full 8-item recommendation list with titles, artists, reasons, and metadata in structured JSON exceeds this budget — especially with Gemini's verbose formatting style.

**Fix (round 1):**
Increased `maxOutputTokens` to 4096. Capped playlist track count at 20 to keep prompt + response within budget.

---

## BUG-09 · Stale Spotify OAuth scopes — existing users missing `playlist-modify-public`
**Time:** 14:13 · **Commit:** `abdfca0`
**Status:** ✅ Fixed · **Severity:** High

**What happened:**
Users who authenticated before `playlist-modify-public` was added to the OAuth scope request still had tokens with the original, narrower scope set. Token refresh does not re-request new scopes — it preserves the original grant. These users hit 403 errors on every playlist creation attempt.

**Root cause:**
Spotify refresh tokens permanently carry the scopes from the original authorization. Adding new scopes to the app requires users to re-authorize entirely.

**Fix:**
Added `/api/auth/spotify/reconnect` — a force re-auth route using `show_dialog=true` that prompts Spotify to show the permission screen again even for already-connected accounts. Added a "Reconnect" button to the Profile page.

---

## BUG-10 · Gemini thinking budget silently consuming output token quota
**Time:** 14:58 · **Commit:** `76927ae`
**Status:** ✅ Fixed · **Severity:** Medium

**What happened:**
After BUG-08's fix, truncation still occurred occasionally. Investigation revealed that `gemini-2.5-flash` has an internal "thinking" phase that consumes tokens before producing any visible output — but these thinking tokens counted against `maxOutputTokens`. The actual JSON response was left with far fewer tokens than expected.

**Root cause:**
`gemini-2.5-flash` enables extended thinking by default. Thinking output is invisible in the response text but depletes the shared output token budget.

**Fix:**
Explicitly set `thinkingConfig: { thinkingBudget: 0 }` in both the recommendation and playlist routes. Also raised `maxOutputTokens` to 8192 (round 2 of BUG-08). Truncation stopped after this.

---

## BUG-11 · Playlist creation returning 403 Forbidden
**Time:** 15:15 · **Commit:** `6d12e17`
**Status:** ✅ Fixed · **Severity:** Critical

**What happened:**
`POST /users/{user_id}/playlists` returned `403 Forbidden`. Playlist creation was completely broken for all users, even those who had reconnected with the correct scopes (BUG-09).

**Root cause:**
The wrong Spotify endpoint. `/users/{id}/playlists` enforces strict user-namespace matching and applies scope validation differently depending on whether the path user ID matches the token owner. `/me/playlists` resolves automatically to the authenticated user with no such restriction.

**Fix:**
Switched from `POST /users/{user_id}/playlists` → `POST /me/playlists` in `lib/spotify.ts`.

---

## BUG-12 · Playlists created as private despite only holding public-write scope
**Time:** 15:39 · **Commit:** `baccaa6`
**Status:** ✅ Fixed · **Severity:** High

**What happened:**
Even after BUG-11 was fixed, the API returned a permission error when creating playlists. The code was setting `public: false` (private playlist) but the OAuth flow only requested `playlist-modify-public`.

**Root cause:**
Writing a private playlist requires the `playlist-modify-private` scope. The app only requested `playlist-modify-public`. Scope/intent mismatch.

**Fix:**
Changed playlist creation to `public: true` in `lib/spotify.ts` to match the granted scope.

---

## BUG-13 · Playlist URL not returned when track addition partially fails
**Time:** 15:53 · **Commit:** `6149e40`
**Status:** ✅ Fixed · **Severity:** Medium

**What happened:**
If the playlist was created on Spotify but one or more track searches returned no results (track not in Spotify's catalogue), the route threw an error and returned a `500` — discarding the valid playlist URL entirely. Users saw a failure even though a playlist had been successfully created in their Spotify account.

**Root cause:**
All-or-nothing error handling. A single failed track search caused the entire response to fail rather than returning the partial result with a warning.

**Fix:**
Route now always returns the playlist URL on success, even if some tracks were skipped. A `warning` field in the response body indicates how many tracks were added vs. total requested. `PlaylistGenerator` renders this as a non-blocking amber warning message.

---

## BUG-14 · Wrong movie posters — AI hallucinated `tmdbId` values
**Time:** Session 2 · **Status:** ✅ Fixed · **Severity:** High

**What happened:**
Movie recommendation cards showed incorrect posters. A film like "Blood Diamond" displayed the poster for an entirely different movie.

**Root cause:**
The Gemini model hallucinated `tmdbId` values — it invented numeric IDs that didn't match the actual TMDB records. The poster proxy (`/api/tmdb/poster?id=<id>`) silently fetched whatever movie TMDB returned for that wrong ID.

**Fix:**
Added server-side TMDB enrichment in `recommend/route.ts`. After Gemini returns movie titles, the route calls `searchMovieTMDB(title, year)` in parallel for all items, replacing the AI's `tmdbId`, `posterPath`, `genres`, `rating`, and `synopsis` with verified TMDB data. Falls back to AI values only if TMDB returns no match.

---

## BUG-15 · Explicit/adult content appearing in movie recommendations
**Time:** Session 2 · **Status:** ✅ Fixed · **Severity:** High

**What happened:**
Some movie recommendation results included adult content titles.

**Root cause:**
No adult content filter was applied anywhere — neither in the AI prompt nor in TMDB API calls. TMDB returns adult titles by default if `include_adult` is not explicitly set to `false`.

**Fix:**
- Added `include_adult=false` to all `searchMovieTMDB` TMDB API calls in `lib/tmdb.ts`
- Added explicit rule to Gemini system prompt: "NEVER recommend explicit, adult, or pornographic content under any circumstances"

---

## BUG-16 · Recommendations not relevant to user query
**Time:** Session 2 · **Status:** ✅ Fixed · **Severity:** High

**What happened:**
When a user typed a specific query (e.g. "movie about diamond trade in Africa"), the AI returned loosely related or entirely off-topic recommendations, diluted by the user's Spotify listening context.

**Root cause:**
Two compounding causes:
1. `temperature: 0.8` allowed the model to creatively wander from the query
2. The system prompt listed Spotify/genre context *before* the user query, causing the model to weight them equally — user context dominated when it should have been secondary

**Fix:**
- Lowered `temperature` to `0.3` and set `topP: 0.8` in `recommend/route.ts`
- Rewrote `buildSystemPrompt` in `lib/gemini/prompt.ts` with query-first structure: user query appears at the top as the PRIMARY directive, Spotify/genre context is explicitly labelled as "secondary tiebreaker only"

---

## BUG-17 · Sign-in page background image not visible
**Time:** Session 2 · **Status:** ✅ Fixed · **Severity:** Medium

**What happened:**
The movie poster background on the `/signin` page was invisible — only the dark overlay was rendered.

**Root cause:**
The background used `<Image fill>` from `next/image`. Next.js `<Image fill>` renders as `position: absolute; height: 100%`. For `height: 100%` to resolve, the parent element needs an explicit `height` property — but the parent only had `min-height: 100vh` (Tailwind `min-h-screen`). With no explicit height, the image height resolved to `0` and nothing was displayed.

**Fix:**
Replaced `<Image fill>` with a plain `<div>` using inline `style={{ backgroundImage: \`url('...')\` }}` and Tailwind classes `bg-cover bg-center` — same pattern used on the working 404 page. No height resolution issue with CSS backgrounds.

---

## BUG-18 · ⏺ record symbol not rendering red in browser tab title
**Time:** Session 2 · **Status:** ✅ Fixed · **Severity:** Low

**What happened:**
The tab title showed `⏺ RecMe — Your taste. Amplified.` but the ⏺ symbol appeared black/gray instead of red on most browsers and operating systems.

**Root cause:**
`⏺` (U+23FA BLACK CIRCLE FOR RECORD) is a Unicode symbol without color semantics. OS font rendering treats it as a monochrome glyph — it inherits the system text color (black/gray), not the app's accent red.

**Fix:**
Replaced `⏺` with `🔴` emoji in `src/app/layout.tsx`. The 🔴 emoji is universally rendered as a red circle across all platforms and browsers.

---

**Total bugs:** 18 · **All resolved** ✅
