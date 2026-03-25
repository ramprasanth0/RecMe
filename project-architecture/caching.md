# RecMe — Caching Architecture

All caching mechanisms in the project, their scope, TTL, and purpose.

---

## Overview

RecMe uses three distinct caching layers:

| Layer | Mechanism | Where | Scope |
|---|---|---|---|
| Edge / CDN | Next.js ISR `revalidate` export | Route segment | Vercel edge, shared across all users |
| Server | `fetch(..., { next: { revalidate } })` | Individual fetch calls | Next.js Data Cache, per unique URL |
| Client | Module-level JS object | `useRecommendations` hook | Browser tab memory, per user session |
| Anti-cache | `Cache-Control: no-cache` header | SSE streaming routes | Prevents buffering on streaming responses |

---

## 1. Edge Cache — ISR Route Segment

**File:** `src/app/api/tmdb/trending/route.ts:4`

```ts
export const revalidate = 3600; // 1 hour
```

**What it caches:** The entire HTTP response of `GET /api/tmdb/trending`.

**How it works:** Next.js/Vercel caches the first response at the CDN edge. All subsequent requests within the 1-hour window are served from the edge without hitting the server or TMDB. After 1 hour, the next request triggers a background regeneration (stale-while-revalidate).

**Why:** TMDB trending data changes at most daily. Caching at the edge eliminates TMDB API calls for every guest page load and keeps the landing page fast globally.

---

## 2. Server Cache — Next.js Data Cache (`fetch` revalidate)

These cache entries are stored in Next.js's built-in Data Cache (on the server / Vercel infra), keyed by the exact fetch URL. Each unique URL gets its own TTL.

### 2a. TMDB Trending Movies
**File:** `src/lib/tmdb.ts:73`
```ts
fetch(`${TMDB_API}/trending/movie/week`, {
  next: { revalidate: 3600 }, // 1 hour
})
```
**TTL:** 1 hour — trending data is stable within an hour.

### 2b. TMDB Movie Search (per title+year)
**File:** `src/lib/tmdb.ts:43`
```ts
fetch(`${TMDB_API}/search/movie?query=...&year=...`, {
  next: { revalidate: 86400 }, // 24 hours
})
```
**TTL:** 24 hours — movie metadata doesn't change day-to-day. Each unique `title+year` query gets its own cache entry, so popular movies are almost always served from cache after first request.

### 2c. TMDB Movie Detail (poster enrichment)
**File:** `src/app/api/tmdb/poster/route.ts:20`
```ts
fetch(`${TMDB_API}/movie/${id}`, {
  next: { revalidate: 86400 }, // 24 hours
})
```
**TTL:** 24 hours — poster paths and metadata for a specific movie ID are stable. Cache key is the movie ID.

### 2d. iTunes Album Art Search
**File:** `src/app/api/itunes/artwork/route.ts:16`
```ts
fetch(`https://itunes.apple.com/search?term=...`, {
  next: { revalidate: 86400 }, // 24 hours
})
```
**TTL:** 24 hours — album art URLs for a given `track+artist` query are stable. Avoids repeat iTunes lookups for the same song.

---

## 3. Client Cache — Module-Level In-Memory Store

**File:** `src/hooks/useRecommendations.ts:8`

```ts
const autoRecCache: Partial<Record<"music" | "movie", MusicItem[] | MovieItem[]>> = {};
```

**Scope:** Declared at module scope (outside any React component). Persists for the lifetime of the browser tab — survives component unmount/remount caused by route navigation.

**What it caches:** Auto-fetched AI recommendations (the `silent=true` mount-triggered fetches for music and movie). Does NOT cache user-triggered mood searches.

**How it works:**

```
First mount:
  hasFetched.current = false  →  fetch fires  →  results stored in autoRecCache["music"] / ["movie"]

Re-mount (navigate away and back):
  useState initializer reads autoRecCache["music"] → items pre-populated
  hasFetched.current = true  →  no fetch fires  →  instant display, no loading state
```

**Why:** Auto-fetched personalized recommendations (Gemini + Spotify context + TMDB enrichment) take 3–8 seconds. Caching means the user only pays this cost once per tab session.

---

## 4. Anti-Cache Headers — SSE Streaming Routes

**Files:**
- `src/app/api/gemini/route.ts:100`
- `src/app/api/chat/route.ts:79`

```ts
headers: {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
}
```

**Purpose:** These routes stream AI responses as Server-Sent Events. The `no-cache` header prevents browsers, CDNs, and proxies from buffering or caching the stream — every byte must reach the client in real time as Gemini produces it.

---

## Cache Invalidation

| Cache | Invalidation trigger |
|---|---|
| Vercel edge (ISR) | TTL expiry → background regeneration on next request |
| Next.js Data Cache | TTL expiry, or `next build` / `revalidateTag()` (not currently called) |
| `autoRecCache` | Browser tab close / hard refresh (module reloads) |
| iTunes / TMDB fetch cache | TTL expiry |

---

## What Is NOT Cached

- **Gemini AI recommendations** triggered by mood input — always fresh, never cached
- **Spotify top artists / top tracks** — always fetched live (user's listening changes frequently)
- **Playlist creation and track search** — write operations, never cached
- **User profile and preferences** — always fetched from Supabase at request time
