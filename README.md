# 🔴 RecMe — Your taste. Amplified.

> AI-powered music and movie recommendations, personalised to your Spotify listening history.

[![Live](https://img.shields.io/badge/Live-rec--me--mu.vercel.app-1DB954?style=flat-square&logo=vercel)](https://rec-me-mu.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/DB-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)

---

## What is RecMe?

RecMe is a dark, editorial-grade web app that uses your Spotify listening history as input and Google Gemini AI as its engine to recommend music and movies that actually fit your taste.

Every recommendation comes with a human-readable reason explaining *why* it was picked for you — not just a ranked list.

### Core ideas

- **It knows you** — uses your real Spotify top artists, top tracks, and genre preferences, not generic popularity signals
- **It explains itself** — every rec includes a one-sentence reason tied to the specific query
- **It acts** — can push AI-generated playlists directly into your Spotify account
- **It looks great** — cinematic dark UI inspired by Letterboxd × Spotify × luxury editorial

---

## Features

| Feature | Details |
|---|---|
| 🎵 Music recommendations | AI picks based on mood input + Spotify listening history |
| 🎬 Movie recommendations | AI picks with TMDB-verified posters, ratings, and synopsis |
| 🎭 Mood search | Type any mood, vibe, or description — AI returns matched results |
| 🤖 Auto-recommendations | Personalised recs load automatically on home page, cached for tab session |
| 🎧 AI playlist creation | Describe a vibe → Gemini generates a tracklist → pushed to your Spotify |
| 💬 AI chat | Full conversational interface with streaming responses + session history |
| 🔖 Saved recs | Bookmark music and movies, view later in Profile |
| 📊 Top artists & tracks | View your Spotify top 20 artists and top 50 tracks |
| 🎛️ Genre preferences | Set music and movie genre preferences that inform all AI recommendations |
| 🌍 Trending | TMDB trending movies — edge-cached, updated hourly |
| 🔐 Dual auth | Spotify OAuth (full access) + email magic link (movie-only) |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 + CSS variables + Framer Motion |
| Database | Supabase (Postgres + RLS) |
| Auth | Custom httpOnly cookie session over Supabase |
| AI Engine | Google Gemini `gemini-2.0-flash` via `@google/genai` |
| Music data | Spotify Web API |
| Movie data | TMDB API |
| Album art | iTunes Search API (server-side proxy) |
| Validation | Zod (all AI and external API responses) |
| Hosting | Vercel |

---

## Architecture

### System overview

```mermaid
graph TD
    subgraph Browser
        UI[Next.js Client Components]
        Cache[autoRecCache\nmodule-level JS object]
    end

    subgraph Vercel["Vercel (Next.js 14 App Router)"]
        Pages[Server Components\n/home /personalize /profile /chat]
        API[Route Handlers\n/api/*]
        EdgeCache[Edge Cache ISR\n/api/tmdb/trending\nTTL: 1h]
        DataCache[Next.js Data Cache\nTMDB search: 24h\niTunes artwork: 24h]
    end

    subgraph Supabase
        DB[(Postgres\nusers · chat_sessions · recommendations)]
    end

    subgraph External["External APIs"]
        Gemini[Google Gemini\ngemini-2.0-flash]
        Spotify[Spotify Web API]
        TMDB[TMDB API]
        iTunes[iTunes Search API]
    end

    UI -->|POST /api/gemini/recommend| API
    UI -->|POST /api/gemini route SSE| API
    UI -->|GET /api/tmdb/trending| EdgeCache
    UI -->|GET /api/itunes/artwork| DataCache
    UI -->|GET /api/spotify/top-*| API

    API --> Gemini
    API --> Spotify
    EdgeCache --> DataCache
    DataCache --> TMDB
    DataCache --> iTunes

    Pages --> DB
    API --> DB

    API -->|AI recs| Cache
```

---

### Auth flow

```mermaid
sequenceDiagram
    participant User
    participant App as Next.js App
    participant Spotify as Spotify OAuth
    participant Supabase

    Note over User,Supabase: Path A — Spotify OAuth

    User->>App: Click "Connect with Spotify"
    App->>Spotify: Redirect to /authorize (scopes: user-top-read, playlist-modify-public)
    Spotify-->>User: Show permission screen
    User->>Spotify: Approve
    Spotify->>App: GET /api/auth/callback/spotify?code=...
    App->>Spotify: Exchange code → access + refresh tokens
    App->>Supabase: Upsert users row (spotify_id, tokens, display_name, avatar_url)
    App-->>User: Set httpOnly cookie recme_user_id + redirect /home

    Note over User,Supabase: Path B — Email Magic Link

    User->>App: Enter email → POST /api/auth/email/start
    App->>Supabase: signInWithOtp({ email })
    Supabase-->>User: Send magic link email
    User->>App: Click link → GET /api/auth/callback/email?token_hash=...
    App->>Supabase: verifyOtp({ token_hash })
    App->>Supabase: Upsert users row (email only)
    App-->>User: Set httpOnly cookie recme_user_id + redirect /home
```

---

### AI recommendation flow

```mermaid
sequenceDiagram
    participant Client
    participant API as /api/gemini/recommend
    participant Gemini as Gemini AI
    participant Spotify as Spotify Search
    participant TMDB as TMDB API

    Client->>API: POST { type, mood }
    API->>API: getUserWithFreshToken() — read Supabase, refresh Spotify token if needed
    API->>API: buildSystemPrompt() — query-first, Spotify context secondary
    API->>Gemini: generateContent (responseMimeType: json, thinkingBudget: 0)
    Gemini-->>API: JSON { type, items[] }
    API->>API: Zod validation

    alt type === "music" and Spotify token available
        API->>Spotify: searchTrack() for each item in parallel
        Spotify-->>API: Spotify URIs (or null if not found)
        API->>API: Filter out unmatched tracks
    end

    alt type === "movie"
        API->>TMDB: searchMovieTMDB(title, year) for each item in parallel
        TMDB-->>API: Verified tmdbId, posterPath, genres, rating, synopsis
        API->>API: Replace AI values with TMDB-verified data
    end

    API-->>Client: { type, items[] } (enriched)
    Client->>Client: autoRecCache[type] = items (tab-lifetime cache)
```

---

### AI playlist creation flow

```mermaid
sequenceDiagram
    participant User
    participant Client as PlaylistGenerator
    participant API as /api/spotify/generate-playlist
    participant Gemini as Gemini AI
    participant Spotify as Spotify API

    User->>Client: Submit description + track count
    Client->>API: POST { description, trackCount }

    API->>API: getUserWithFreshToken()
    API->>Spotify: GET /me/top/artists (context for Gemini)
    Spotify-->>API: Top artists list

    API->>Gemini: generateContent — playlist name + track suggestions
    Gemini-->>API: { playlistName, tracks: [{title, artist}] }

    API->>Spotify: searchTrack() for all tracks in parallel
    Note over API,Spotify: title+artist query first, title-only fallback

    API->>Spotify: POST /me/playlists { name, public: true }
    Spotify-->>API: { playlistId, external_urls }

    API->>Spotify: POST /playlists/{id}/items { uris: found[] }
    Spotify-->>API: Tracks added

    API-->>Client: { playlistName, playlistUrl, tracksAdded, tracks: found[], notFound[] }
    Client-->>User: Show result — playlist link + found/notFound split
```

---

### Caching layers

```mermaid
graph TB
    subgraph Browser["Browser Tab"]
        autoRecCache["autoRecCache\nMusic + Movie AI recs\nTTL: tab lifetime"]
    end

    subgraph Vercel["Vercel / Next.js"]
        EdgeCache["Edge Cache ISR\n/api/tmdb/trending\nTTL: 1 hour"]
        DataCache["Next.js Data Cache\nTMDB search: 24h\nTMDB poster: 24h\niTunes artwork: 24h\nTMDB trending: 1h"]
    end

    subgraph NeverCached["Never Cached"]
        Mood["Mood-based AI recs\n(user typed input)"]
        SpotifyData["Spotify top artists/tracks\n(live user data)"]
        Playlists["Playlist creation\n(write operation)"]
        Chat["Gemini chat SSE\n(no-cache header)"]
        Profile["User profile/preferences\n(from Supabase)"]
    end

    Browser --> EdgeCache
    EdgeCache -->|cache miss| DataCache
    DataCache -->|cache miss| TMDB & iTunes

    style autoRecCache fill:#1a2a1a,stroke:#1DB954,color:#ccc
    style EdgeCache fill:#1a1a2a,stroke:#4a6fa5,color:#ccc
    style DataCache fill:#1a1a2a,stroke:#4a6fa5,color:#ccc
    style NeverCached fill:#2a1a1a,stroke:#F5A623,color:#ccc
```

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — fonts, OG metadata, film-grain
│   ├── globals.css             # CSS variables, design tokens, film-grain keyframe
│   ├── page.tsx                # Redirects → /home
│   ├── home/page.tsx           # Universal landing (SSR auth detection)
│   ├── personalize/page.tsx    # AI playlist + Spotify top data (auth required)
│   ├── profile/page.tsx        # Preferences + saved recs (auth required)
│   ├── chat/page.tsx           # Full chat interface
│   ├── signin/page.tsx         # Spotify + email sign-in
│   └── api/
│       ├── auth/               # OAuth callbacks, email OTP, logout
│       ├── gemini/             # Recommendations + streaming chat
│       ├── spotify/            # Top artists/tracks, playlist creation
│       ├── tmdb/               # Trending + poster proxy
│       ├── itunes/             # Album art proxy (CORS workaround)
│       ├── recommendations/    # Saved recs CRUD (Supabase)
│       ├── chat/               # Chat session CRUD (Supabase)
│       └── profile/            # Genre preferences update
│
├── components/
│   ├── landing/LandingContent.tsx       # Home page body (client)
│   ├── dashboard/                       # MusicTab, MoviesTab, DashboardContent
│   ├── personalize/PersonalizeContent.tsx
│   ├── profile/ProfileClient.tsx
│   ├── chat/                            # ChatPageClient, ChatSidebar, StreamingChat
│   └── shared/                          # Navbar, RecommendationCard, MoodInput,
│                                        # TabSwitcher, PlaylistCreator, PlaylistGenerator
│
├── hooks/
│   ├── useRecommendations.ts   # Gemini recs + module-level autoRecCache
│   └── useChat.ts              # Chat session management
│
├── lib/
│   ├── gemini.ts               # Gemini client
│   ├── gemini/prompt.ts        # buildSystemPrompt(), buildChatSystemPrompt()
│   ├── spotify.ts              # All Spotify helpers (auth, data, playlists, search)
│   ├── tmdb.ts                 # TMDB search + trending
│   ├── env.ts                  # Typed lazy env accessor
│   └── auth/session.ts         # getUserWithFreshToken()
│
└── types/                      # Zod schemas + TypeScript types
    ├── recommendations.ts
    ├── spotify.ts
    ├── tmdb.ts
    └── db.ts
```

---

## Pages

### `/home` — Universal landing

```
Guest view                          Logged-in view
─────────────────────────           ─────────────────────────────
Hero: "Your taste. Amplified."      Time-aware greeting + username
CTAs: Spotify + Email sign-in       Auto-loaded AI music recs
                                    Auto-loaded AI movie recs
TMDB trending movies strip          TMDB trending movies strip
Curated music strip                 (personalised ranking by taste)
Sticky sign-in banner
```

### `/personalize` — Your Spotify data + AI playlists

- Describe a playlist vibe → AI generates tracklist → pushed to Spotify
- View your top 20 artists (with image + top genre)
- View your top 50 tracks (with album art + artist)

### `/profile` — Preferences + history

- Set music and movie genre preferences (used in all AI prompts)
- View and unsave bookmarked recommendations
- Connected accounts — Spotify connection status + reconnect

### `/chat` — Full AI conversation

- Streaming Gemini responses (SSE)
- Left sidebar: all past sessions, deletable
- Context-aware: AI knows your Spotify artists and genre preferences

---

## Local setup

> **Note:** Spotify OAuth does not work on localhost — the redirect URI is production-only. Use the live site to test auth.

```bash
git clone https://github.com/ramprasanth0/RecMe.git
cd RecMe
npm install
```

Create `.env.local`:

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

```bash
npm run dev       # http://localhost:3000
npm run typecheck # must pass before any commit
npm run lint      # must pass before any commit
```

---

## Deployment

Deployed on Vercel. Every push to `main` triggers a production deployment.

### Required Supabase manual step

> **Authentication → URL Configuration → Redirect URLs**
> Add: `https://rec-me-mu.vercel.app/api/auth/callback/email`
>
> Email magic link auth fails in production without this.

---

## Database schema

```sql
-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  spotify_id text unique,
  spotify_access_token text,
  spotify_refresh_token text,
  display_name text,
  avatar_url text,
  preferences jsonb default '{}',  -- { music_genres: [], movie_genres: [] }
  created_at timestamptz default now()
);

-- Chat sessions
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type text check (type in ('music', 'movie')),
  messages jsonb default '[]',     -- [{ role, content, timestamp }]
  created_at timestamptz default now()
);

-- Saved recommendations
create table recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type text check (type in ('music', 'movie')),
  item_data jsonb,                 -- full MusicItem or MovieItem object
  saved_at timestamptz default now()
);
```

---

## Design system

| Token | Value | Use |
|---|---|---|
| `--background` | `#0A0A0A` | Page backgrounds |
| `--surface` | `#111111` | Cards, panels |
| `--music-accent` | `#1DB954` | Spotify green — music actions |
| `--movie-accent` | `#F5A623` | Warm amber — movie actions |
| `--foreground` | `#DDDDDD` | Primary text |
| `--muted-foreground` | `#888888` | Secondary text |

**Fonts:** Playfair Display (headings) · Inter (body) · JetBrains Mono (AI output)

**Motion:** Framer Motion — page entrance, staggered card reveals, tab cross-fade, logo animation

---

## More documentation

| File | Contents |
|---|---|
| `handoff/architecture.md` | Full stack, data flow, env vars reference |
| `handoff/auth-flow.md` | OAuth + OTP flows, cookie model, token refresh |
| `handoff/routes-and-api.md` | Every page and API route documented |
| `handoff/design-system.md` | Tokens, components, animation patterns |
| `handoff/key-decisions.md` | Firm decisions and what NOT to do |
| `project-architecture/caching.md` | All caching layers with TTLs and rationale |
| `diagrams/caching-architecture.md` | Mermaid diagrams for caching |
| `diagrams/ai-playlist-creation.md` | Mermaid diagrams for playlist flow |
| `BUG_REPORT.md` | 20 bugs resolved — root causes and fixes |

---

*Built with Next.js · Supabase · Google Gemini · Spotify API · TMDB · Deployed on Vercel*
