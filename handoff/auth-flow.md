# RecMe — Auth Flow

RecMe uses a **custom cookie-based session** built on top of Supabase. There is no NextAuth, no Supabase SSR auth helpers for session management — just a single httpOnly cookie (`recme_user_id`) set after successful OAuth or OTP verification.

---

## Option 1 — Spotify OAuth

```
User clicks "Connect with Spotify" on /signin
  → GET /api/auth/spotify/start
      → Builds Spotify authorize URL with scopes (below)
      → Redirects to accounts.spotify.com

User approves on Spotify
  → Spotify redirects to /api/auth/callback/spotify?code=...
      → Exchange code for access + refresh tokens
      → Upsert into users table (spotify_id, display_name, avatar_url, tokens)
      → Set httpOnly cookie: recme_user_id = user.id (30 days, SameSite=Lax)
      → Redirect to /home
```

### Spotify scopes requested
```
user-read-private
user-read-email
user-top-read
playlist-modify-public
```

### Token refresh
`getUserWithFreshToken(userId)` in `src/lib/auth/session.ts`:
1. Reads user row from Supabase
2. If `spotify_access_token` is present, calls `GET https://api.spotify.com/v1/me` to check validity
3. On 401, calls `POST https://accounts.spotify.com/api/token` with `refresh_token`
4. Updates the `users` row with the new access token
5. Returns the user object with a fresh token

### Reconnect (scope upgrade)
`GET /api/auth/spotify/reconnect` — forces re-auth with `show_dialog=true`. Used when a user needs to grant newly added scopes (e.g. `playlist-modify-public` was added after initial sign-up).

---

## Option 2 — Email magic link

```
User enters email on /signin → clicks "Continue with Email"
  → POST /api/auth/email/start { email }
      → supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: "...callback/email" } })
      → Returns 200 (email sent)

User clicks link in email
  → Arrives at /api/auth/callback/email?token_hash=...&type=email
      → supabase.auth.verifyOtp({ token_hash, type: "email" })
      → On success: upsert into users table (email only, no Spotify tokens)
      → Set httpOnly cookie: recme_user_id = user.id (30 days)
      → Redirect to /home
```

> **CRITICAL**: `https://rec-me-mu.vercel.app/api/auth/callback/email` must be added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs. Without this, email auth fails in production.

### Email users vs Spotify users
Email users have no `spotify_access_token`. They can:
- Get movie recommendations (Gemini, no Spotify context)
- Browse trending content
- Save recommendations

They **cannot**:
- Get personalised music recommendations (no Spotify listening data)
- Create Spotify playlists
- See top artists/tracks on `/personalize`

---

## Logout

```
POST /api/auth/logout
  → Clears recme_user_id cookie (maxAge = 0)
  → Redirects to /home
```

---

## Middleware

`src/middleware.ts` protects `/personalize` and `/profile` only.

`/home` is NOT middleware-protected — it handles auth state at the page level (Server Component checks the cookie and renders different content).

---

## Cookie details

| Property | Value |
|---|---|
| Name | `recme_user_id` |
| Value | Supabase user UUID |
| HttpOnly | Yes |
| SameSite | Lax |
| Max-Age | 30 days |
| Path | / |

The cookie is set in route handlers (server-side) and never accessible via `document.cookie`.
