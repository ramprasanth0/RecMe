# RecMe — Your taste. Amplified.

RecMe is a minimalistic, editorial-grade web application that provides AI-powered music and movie recommendations. It leverages a user's Spotify listening history and mood input, powered by Google Gemini AI, to deliver personalized suggestions with human-readable explanations.

## Project Overview

*   **Architecture:** Next.js 14 (App Router) with a cinematic, dark UI.
*   **AI Engine:** Google Gemini `gemini-2.0-flash` for generating recommendations and conversational chat.
*   **Backend:** Supabase for authentication (Spotify OAuth + Email Magic Link) and data persistence (user preferences, saved recommendations, chat history).
*   **Integrations:**
    *   **Spotify Web API:** Fetches user top artists/tracks, manages playlists, and provides music recommendations.
    *   **TMDB API:** Sources movie details, posters, and trending lists.
    *   **Genius API:** Extracts song lyrics and track insights.
    *   **iTunes Search API:** Serves as a server-side proxy for high-quality album artwork.

## Development & Execution

### Key Commands

*   **Development:** `npm run dev`
*   **Build:** `npm run build`
*   **Start Production:** `npm run start`
*   **Type Checking:** `npm run typecheck` (Must pass before commit)
*   **Linting:** `npm run lint` (Must pass before commit)
*   **Unit Tests:** `npm run test` (Vitest)
*   **E2E Tests:** `npm run test:e2e` (Playwright)

### Local Setup

1.  **Environment Variables:** Create a `.env.local` file with keys for Spotify, TMDB, Gemini, and Supabase (see `CLAUDE.md` for the full list).
2.  **Spotify OAuth:** Note that Spotify OAuth requires a production-aligned redirect URI; local testing may require tunneling or mock bypasses for auth flows.
3.  **Supabase Migration:** Ensure the initial schema and subsequent migrations (found in `supabase/migrations/`) are applied to your local or hosted Supabase instance.

## Technical Conventions

### Code Style & Standards

*   **Type Safety:** Strict TypeScript usage is enforced. Use `Zod` for all external API and AI response validation.
*   **Surgical Edits:** When modifying components, maintain the cinematic editorial aesthetic (Glassmorphism, Framer Motion staggered animations, deep blacks).
*   **API Performance:** 
    *   Prefer server-side batching (e.g., fetching artwork in `Promise.all` within route handlers) to minimize client-side waterfall requests.
    *   Utilize `Cache-Control` headers for proxy routes (iTunes, TMDB) to leverage Vercel's edge caching.
*   **Persistence:** 
    *   User-specific facts go to Supabase.
    *   Team-wide architecture or workflow rules go to `GEMINI.md`.
    *   Machine-local or private notes go to the private project memory.
*   **Github Standards:**
    * Always run tests and analyze with lint and perform local build before committing.
    * Never commit the .env.local file.
    * Commit message should be in the format: "feat: add new feature" or "fix: fix bug".

### File Structure Patterns

*   `src/app/api/`: Route handlers for external integrations and AI orchestration.
*   `src/components/shared/`: Reusable UI components like `RecommendationCard`, `MoodInput`, and carousels.
*   `src/lib/`: Core logic for API clients (Spotify, TMDB, Gemini) and auth session management.
*   `src/types/`: Centralized Zod schemas and TypeScript interfaces for data consistency.

## Testing Practices

*   **Empirical Reproduction:** For bug fixes, verify the failure with a test case in `src/__tests__/` before applying the fix.
*   **E2E Coverage:** Use Playwright for critical flows (Guest landing, protected route redirection, Spotify data rendering).
*   **Unit Tests:** Vitest handles logic-heavy modules like session refresh, proxy headers, and security-sensitive data pruning.
