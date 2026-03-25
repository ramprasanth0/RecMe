# RecMe — Project State

Last updated: 2026-03-25

---

## Build phases

| Phase | Description | Status |
|---|---|---|
| 1 | Scaffold — Next.js, design tokens, base layout, fonts | ✅ Complete |
| 2 | Smart landing — SSR auth detection, guest/logged-in split | ✅ Complete |
| 3 | Spotify OAuth — token storage, refresh, reconnect flow | ✅ Complete |
| 4 | Dashboard — Music/Movies tabs, mood input, trending rows | ✅ Complete |
| 5 | Gemini AI — streaming chat, recommendation engine | ✅ Complete |
| 6 | Playlist creation, saved recs, profile preferences | ✅ Complete |
| 7 | Polish — mobile layout, animations, deployment readiness | ✅ Complete |

---

## What exists and works

### Pages
- `/home` — universal landing; shows trending content for guests, personalised AI recs for logged-in users
- `/personalize` — AI playlist generator + user's Spotify top artists/tracks grid (auth required)
- `/profile` — connected accounts, genre preferences, saved recommendations (auth required)
- `/chat` — full AI chat with session history, left sidebar, streaming Gemini responses
- `/signin` — Spotify OAuth + email magic link options with movie poster background
- `404` — custom not-found page with poster background

### Core features
- Spotify OAuth with token storage, proactive refresh, reconnect route
- Email magic link auth via Supabase OTP
- Gemini AI recommendations (non-streaming JSON, server-side TMDB enrichment)
- AI chat (streaming SSE via Gemini)
- Spotify top artists + top tracks fetched on `/personalize`
- AI playlist generation: Gemini suggests tracks → Spotify search → `POST /me/playlists` → `POST /playlists/{id}/items`
- Notifies user of tracks not found on Spotify (shown separately with "add manually" label)
- Saved recommendations (Supabase `recommendations` table) — save/unsave on card hover
- Chat session history (Supabase `chat_sessions`) — listed in sidebar, deletable
- TMDB trending (ISR, 1-hour revalidation)
- iTunes album art server-side proxy (24-hour cache)
- Profile genre preferences — music + movie chips, saved to Supabase
- Loading skeletons (`loading.tsx`) for `/home`, `/chat`, `/personalize`, `/profile`
- OG/Twitter card metadata in `layout.tsx`
- Security headers in `next.config.mjs`
- Mobile navbar with hamburger menu + AnimatePresence dropdown

### Animations
- Framer Motion page entrance + staggered card reveals
- Tab cross-fade (Music ↔ Movies)
- RecMe logo: one-shot animation on page load only — "RecMe" expands to "RecommendMe" then collapses back
- Film grain texture overlay on all major backgrounds

---

## Known manual step (not automatable in code)

> **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**
> Add: `https://rec-me-mu.vercel.app/api/auth/callback/email`
>
> Without this, email magic link auth silently fails in production. The link redirects to Supabase's default page instead of the app.

---

## What is NOT built / out of scope

- No `/` root page — it redirects immediately to `/home`
- No "Where to Watch" integration (TMDB provides a link to TMDB page only)
- No Google OAuth (email magic link is the non-Spotify option)
- No push notifications or background jobs
- No onboarding wizard (genre preferences set in `/profile`)
- `GET /api/recs/auto` exists as a stub returning HTTP 501 — not used anywhere, safe to ignore or delete

---

## Pending / nice-to-have (not planned)

Nothing is actively blocked. The project is feature-complete for MVP. Potential future work:
- "Where to Watch" data via TMDB `/watch/providers`
- Discovery tab with curated trending for logged-in users
- Genre-filtered trending
- Push new recommendations to a recurring Spotify playlist
