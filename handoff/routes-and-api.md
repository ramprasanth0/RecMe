# RecMe — Routes and API Reference

---

## Page routes

| Route | Auth required | Description |
|---|---|---|
| `/` | No | Redirects to `/home` |
| `/home` | No (but personalises if authed) | Universal landing — SSR auth detection, guest or personalised |
| `/signin` | No | Spotify OAuth + email magic link |
| `/personalize` | Yes (middleware) | AI playlist generator + Spotify top artists/tracks |
| `/profile` | Yes (middleware) | Genre preferences + saved recommendations |
| `/chat` | No (page-level gating) | Full streaming chat with session history |
| `/not-found` (404) | No | Custom 404 page |

---

## API route handlers

### Auth

| Route | Method | Description |
|---|---|---|
| `/api/auth/spotify/start` | GET | Begin Spotify OAuth — redirects to Spotify authorize URL |
| `/api/auth/spotify/reconnect` | GET | Force re-auth with `show_dialog=true` (scope upgrade) |
| `/api/auth/callback/spotify` | GET | Spotify OAuth callback — exchanges code, sets cookie, redirects `/home` |
| `/api/auth/email/start` | POST | Sends Supabase OTP magic link to provided email |
| `/api/auth/callback/email` | GET | Email OTP verification — sets cookie, redirects `/home` |
| `/api/auth/logout` | POST | Clears `recme_user_id` cookie, redirects `/home` |

---

### Gemini AI

| Route | Method | Description |
|---|---|---|
| `/api/gemini/recommend` | POST | Non-streaming recommendation endpoint. Body: `{ type: "music"\|"movie", mood: string }`. Returns `{ type, items }`. Server-side TMDB enrichment for movies, Spotify URI resolution for music. `maxDuration: 30`. |
| `/api/gemini/route` (chat) | POST | Streaming SSE chat endpoint. Reads user session for Spotify context. Returns `text/event-stream`. `maxDuration: 60`. |

**Gemini model:** `gemini-2.0-flash`
**Key settings on recommend:** `temperature: 0.3`, `topP: 0.8`, `maxOutputTokens: 8192`, `thinkingBudget: 0`, `responseMimeType: "application/json"`

---

### Spotify

| Route | Method | Description |
|---|---|---|
| `/api/spotify/top-artists` | GET | Returns user's top 20 artists (long-term). Requires auth cookie. |
| `/api/spotify/top-tracks` | GET | Returns user's top 50 tracks (long-term). Requires auth cookie. |
| `/api/spotify/create-playlist` | POST | Creates an empty named playlist. Body: `{ name: string }`. Returns `{ playlistId, playlistUrl }`. |
| `/api/spotify/generate-playlist` | POST | Full AI playlist flow. Body: `{ description: string, trackCount: number }`. Returns `{ playlistName, playlistUrl, tracksAdded, tracksTotal, tracks: found[], notFound[] }`. `maxDuration: 60`. |

---

### TMDB

| Route | Method | Description |
|---|---|---|
| `/api/tmdb/trending` | GET | Trending movies from TMDB `/trending/movie/week`. ISR `revalidate: 3600`. |
| `/api/tmdb/poster` | GET | Movie detail by TMDB ID. Query param: `id`. 24h server cache. |

---

### iTunes

| Route | Method | Description |
|---|---|---|
| `/api/itunes/artwork` | GET | Server-side iTunes Search API proxy. Query params: `title`, `artist`. Returns `{ artworkUrl }`. 24h server cache. Exists to work around CORS restriction on browser-side iTunes calls. |

---

### Chat sessions (Supabase CRUD)

| Route | Method | Description |
|---|---|---|
| `/api/chat/sessions` | GET | List all chat sessions for authenticated user |
| `/api/chat/sessions` | POST | Create new chat session. Body: `{ type: "music"\|"movie" }` |
| `/api/chat/sessions/[id]` | GET | Get single session with messages |
| `/api/chat/sessions/[id]` | DELETE | Delete session |

---

### Saved recommendations (Supabase CRUD)

| Route | Method | Description |
|---|---|---|
| `/api/recommendations` | GET | List saved recommendations for authenticated user |
| `/api/recommendations` | POST | Save a recommendation. Body: `{ type, item_data }` |
| `/api/recommendations/[id]` | DELETE | Remove a saved recommendation |

---

### Profile

| Route | Method | Description |
|---|---|---|
| `/api/profile/preferences` | PUT | Update user genre preferences. Body: `{ music_genres: string[], movie_genres: string[] }` |

---

### Stubs / unused

| Route | Status |
|---|---|
| `/api/recs/auto` | Returns HTTP 501 — not called by any page, safe to delete |
