# Future Ideas & Feature Backlog

## RecMe Dashboard (User Analytics & Wrap-up)
A premium analytical feature designed to give users a dynamic "Wrapped" experience year-round based on their Spotify listening and movie watching habits.

### Concept Core
- Parse real-time Spotify top artists and tracks (leveraging `short_term`, `medium_term`, and `long_term` from `/v1/me/top/artists` and `/v1/me/top/tracks`).
- Extract genres assigned to those artists to build a "Vibe Phase" or "Mood Profile."
- Compare the user's movie-watching habits (clicks tracked natively in Supabase) against their music habits.
- Present a gorgeous Dashboard (protected by `<ProFeatureGate>`) highlighting overlaps, mood calendars, and generative AI feedback such as: *"You've been hovering around Cyberpunk tropes and 80s Synth-pop."*

### Development Considerations & Limits
- **Spotify Developer Mode**: The app is restricted to 25 whitelisted user accounts. The system works flawlessly within this cap but must apply for quota extension to scale past 25 users.
- **Stateless Analytics**: Rather than a heavy, long-running cron job scraping `user-read-recently-played` 24/7 (which strains architecture), the feature is designed to generate insights dynamically "on-load" utilizing Spotify's native aggregation endpoints to compute top lists on the fly. 
- **Required Scopes**: Must verify `user-top-read` is configured within NextAuth / Supabase session handshakes to successfully retrieve the top charts securely.

---

*This document is intended as a backlog for future development milestones once the core infrastructure handles traffic scaling and Razorpay upgrades natively.*
