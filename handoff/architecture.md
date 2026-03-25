# RecMe — Architecture

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 + CSS variables |
| Database + Auth | Supabase (Postgres, RLS, OTP) |
| AI | Google Gemini (`gemini-2.0-flash`) via `@google/genai` |
| Music data | Spotify Web API |
| Movie data | TMDB API |
| Album art | iTunes Search API (server-side proxy) |
| Animations | Framer Motion v12 |
| Validation | Zod |
| Hosting | Vercel (free tier, Node 20.x) |

---

## Folder structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout — fonts, OG metadata, film-grain body
│   ├── page.tsx                  # Redirects → /home
│   ├── globals.css               # CSS variables, film-grain keyframe, base styles
│   ├── home/page.tsx             # Universal landing (guest + logged-in, SSR)
│   ├── personalize/page.tsx      # AI playlist + top artists/tracks (auth required)
│   ├── profile/page.tsx          # Preferences + saved recs (auth required)
│   ├── chat/page.tsx             # Full chat interface (auth required)
│   ├── signin/page.tsx           # Spotify + email sign-in options
│   ├── not-found.tsx             # Custom 404
│   └── api/                      # Route handlers (see routes-and-api.md)
│
├── components/
│   ├── landing/LandingContent.tsx      # Client component — home page body
│   ├── dashboard/                      # DashboardContent, MusicTab, MoviesTab
│   ├── personalize/PersonalizeContent.tsx
│   ├── profile/ProfileClient.tsx
│   ├── chat/                           # ChatPageClient, ChatSidebar, StreamingChat
│   └── shared/                         # Navbar, RecommendationCard, MoodInput,
│                                       # TabSwitcher, PlaylistCreator, PlaylistGenerator,
│                                       # AiThinkingLoader
│
├── hooks/
│   ├── useRecommendations.ts     # Gemini rec fetch + module-level autoRecCache
│   └── useChat.ts                # Chat session management
│
├── lib/
│   ├── gemini.ts                 # Gemini client wrapper
│   ├── gemini/prompt.ts          # buildSystemPrompt(), buildChatSystemPrompt()
│   ├── spotify.ts                # All Spotify API helpers (auth, top data, playlists, search)
│   ├── tmdb.ts                   # TMDB search, trending, poster fetch
│   ├── env.ts                    # Typed lazy env accessor (throws on missing keys)
│   ├── utils.ts                  # cn() (clsx + tailwind-merge)
│   ├── auth/session.ts           # getUserWithFreshToken() — Supabase + token refresh
│   └── supabase/
│       ├── server.ts             # Server-side Supabase client (cookie-based)
│       ├── client.ts             # Browser Supabase client
│       └── admin.ts              # Service-role client (server only)
│
├── types/
│   ├── recommendations.ts        # MusicItem, MovieItem, Zod schemas
│   ├── spotify.ts                # Spotify API response shapes
│   ├── tmdb.ts                   # TMDB response shapes
│   └── db.ts                     # Supabase table row types
│
└── middleware.ts                 # Protects /personalize and /profile
```

---

## Supabase schema

```sql
-- Users (one row per auth user)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  spotify_id text unique,
  spotify_access_token text,
  spotify_refresh_token text,
  display_name text,
  avatar_url text,
  preferences jsonb default '{}',   -- { music_genres: string[], movie_genres: string[] }
  created_at timestamptz default now()
);

-- Chat sessions
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type text check (type in ('music', 'movie')),
  messages jsonb default '[]',       -- [{ role, content, timestamp }]
  created_at timestamptz default now()
);

-- Saved recommendations
create table recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type text check (type in ('music', 'movie')),
  item_data jsonb,                   -- full MusicItem or MovieItem object
  saved_at timestamptz default now()
);
```

RLS is enabled. Users can only read/write their own rows.

---

## Session / auth model

- Auth is **not** NextAuth. It is a custom httpOnly cookie system on top of Supabase.
- Session cookie name: `recme_user_id` (value = Supabase user UUID)
- Cookie is set in the Spotify and email callback route handlers
- `getUserWithFreshToken(userId)` in `lib/auth/session.ts` reads the user row and proactively refreshes the Spotify access token if it's near expiry
- Middleware checks for `recme_user_id` cookie and redirects to `/?error=unauthenticated` if missing (only for protected routes)

---

## Caching layers

See `project-architecture/caching.md` for full prose and `diagrams/caching-architecture.md` for Mermaid diagrams.

| Layer | Mechanism | TTL |
|---|---|---|
| Edge (ISR) | `export const revalidate = 3600` on `/api/tmdb/trending` | 1 hour |
| Server (fetch) | `fetch(..., { next: { revalidate } })` per URL | 1h (trending) / 24h (search, poster, iTunes) |
| Client | Module-level `autoRecCache` object in `useRecommendations.ts` | Tab lifetime |
| Anti-cache | `Cache-Control: no-cache` on SSE streaming routes | — |

---

## Environment variables

```bash
# Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=https://rec-me-mu.vercel.app/api/auth/callback/spotify

# TMDB
TMDB_API_KEY=

# Gemini
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gfdtuqlzvehrvtfexoeg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `ANTHROPIC_API_KEY` are NOT used. Do not add them.

---

## Data flow — AI recommendations

```
User visits /home (logged in)
  → LandingContent mounts
  → useRecommendations({ autoFetch: true, autoPrompt: "..." }) fires
  → POST /api/gemini/recommend { type, mood }
      → getUserWithFreshToken()  (Supabase + Spotify refresh)
      → buildSystemPrompt()      (query-first, Spotify context secondary)
      → gemini.generateContent() (responseMimeType: "application/json", thinkingBudget: 0)
      → Zod validation
      → For music: parallel Spotify searchTrack() to pre-resolve URIs
      → For movies: parallel TMDB searchMovieTMDB() to verify IDs + enrich poster/synopsis
      → Response.json({ type, items })
  → autoRecCache[type] = items  (persists tab session)
  → RecommendationCard renders each item
```

---

## Data flow — AI playlist creation

```
User on /personalize → types description → submits PlaylistGenerator
  → POST /api/spotify/generate-playlist { description, trackCount }
      → getUserWithFreshToken()
      → GET /api/spotify/top-artists (Spotify context for Gemini prompt)
      → gemini.generateContent() → JSON { playlistName, tracks: [{title, artist}] }
      → Promise.all: searchTrack() for each track (title+artist, fallback title-only)
      → POST /me/playlists → playlistId
      → POST /playlists/{id}/items → adds found URIs
      → Return { playlistName, playlistUrl, tracksAdded, tracks: found[], notFound[] }
  → PlaylistGenerator shows result card with found/notFound split
```
