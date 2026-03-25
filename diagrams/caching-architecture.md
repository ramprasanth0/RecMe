# RecMe — Caching Architecture Diagrams

## 1. Full Caching Layer Overview

```mermaid
graph TB
    subgraph Browser["Browser (Tab)"]
        autoRecCache["autoRecCache\nModule-level JS object\nMusic + Movie AI recs\nTTL: tab lifetime"]
    end

    subgraph Vercel["Vercel / Next.js Server"]
        EdgeCache["Edge Cache (ISR)\n/api/tmdb/trending\nTTL: 1 hour"]
        DataCache["Next.js Data Cache\nper fetch() URL\nTMDB search: 24h\nTMDB trending: 1h\nTMDB poster: 24h\niTunes artwork: 24h"]
    end

    subgraph External["External APIs"]
        TMDB["TMDB API"]
        iTunes["iTunes Search API"]
        Gemini["Gemini AI"]
        Spotify["Spotify API"]
    end

    Browser -->|"GET /api/tmdb/trending"| EdgeCache
    EdgeCache -->|"Cache miss / expired"| DataCache
    DataCache -->|"Cache miss / expired"| TMDB
    DataCache -->|"Cache miss / expired"| iTunes

    Browser -->|"POST /api/gemini/recommend\n(auto-fetch, silent)"| Vercel
    Vercel --> Gemini
    Vercel --> Spotify
    Vercel -->|"AI results"| autoRecCache

    Browser -->|"POST /api/gemini/recommend\n(mood search)"| Vercel
    Vercel --> Gemini

    style autoRecCache fill:#1a2a1a,stroke:#1DB954,color:#ccc
    style EdgeCache fill:#1a1a2a,stroke:#4a6fa5,color:#ccc
    style DataCache fill:#1a1a2a,stroke:#4a6fa5,color:#ccc
```

---

## 2. Client-Side autoRecCache Flow

```mermaid
flowchart TD
    A([Component mounts]) --> B{autoRecCache\nhas data?}

    B -- Yes --> C[Seed useState from cache\nhasFetched = true]
    C --> D([Render immediately\nno loading state])

    B -- No --> E[hasFetched = false\nsetItems empty]
    E --> F[useEffect fires\nautoFetch + autoPrompt set]
    F --> G[POST /api/gemini/recommend\nsilent = true]
    G --> H[Show skeleton\nisLoading = true]
    H --> I[Gemini returns items]
    I --> J[setItems + write to autoRecCache]
    J --> K([Render results])

    L([User types mood + submits]) --> M[POST /api/gemini/recommend\nsilent = false]
    M --> N[setLastMood = mood]
    N --> O[Show skeleton]
    O --> P[Gemini returns items]
    P --> Q[setItems only\nNOT written to cache]
    Q --> R([Render mood results])
```

---

## 3. Server-Side TMDB Cache Flow

```mermaid
sequenceDiagram
    participant Browser
    participant VercelEdge as Vercel Edge (ISR)
    participant NextData as Next.js Data Cache
    participant TMDB as TMDB API

    Browser->>VercelEdge: GET /api/tmdb/trending

    alt Edge cache fresh (< 1h)
        VercelEdge-->>Browser: Cached response ⚡
    else Edge cache stale / miss
        VercelEdge->>NextData: fetch /trending/movie/week

        alt Data cache fresh (< 1h)
            NextData-->>VercelEdge: Cached fetch result ⚡
        else Data cache stale / miss
            NextData->>TMDB: GET /trending/movie/week
            TMDB-->>NextData: Movie list
            NextData-->>VercelEdge: Fresh result (cached for 1h)
        end

        VercelEdge-->>Browser: Response (cached at edge for 1h)
    end

    Note over Browser,TMDB: searchMovieTMDB() and poster enrichment\nfollow same pattern with 24h TTL
```

---

## 4. Cache TTL Summary

```mermaid
gantt
    title Cache TTL Comparison
    dateFormat  HH:mm
    axisFormat  %H:%M

    section Edge Cache
    TMDB Trending (ISR)       :active, 00:00, 1h

    section Next.js Data Cache
    TMDB Trending fetch       :active, 00:00, 1h
    TMDB Movie Search         :crit, 00:00, 24h
    TMDB Poster Detail        :crit, 00:00, 24h
    iTunes Album Art          :crit, 00:00, 24h

    section Client Memory
    autoRecCache (tab life)   :done, 00:00, 24h
```

---

## 5. What is Never Cached

```mermaid
flowchart LR
    A["🎭 Mood-based AI recs\n(user typed input)"] --> Z["Always live ♻️"]
    B["🎵 Spotify top artists/tracks\n(user listening data)"] --> Z
    C["📋 Playlist creation\n(write operation)"] --> Z
    D["🔍 Spotify track search\n(per-request)"] --> Z
    E["👤 User profile/preferences\n(from Supabase)"] --> Z
    F["🤖 Gemini chat messages\n(SSE stream, no-cache header)"] --> Z
```
