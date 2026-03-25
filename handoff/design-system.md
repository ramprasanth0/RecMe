# RecMe — Design System

---

## Design direction

Dark, cinematic, editorial. References: Letterboxd × Spotify dark UI × luxury magazine.

**Avoid:** default shadcn-looking cards, flat white cards, generic SaaS layouts, excessive borders, purple gradients.

---

## Color tokens (CSS variables in `globals.css`)

| Token | Value | Use |
|---|---|---|
| `--background` | `#0A0A0A` | Page background |
| `--surface` | `#111111` | Cards, panels |
| `--surface-light` | `#1A1A1A` | Elevated surfaces, nav items |
| `--border` | `rgba(255,255,255,0.08)` | Subtle dividers |
| `--foreground` | `#DDDDDD` | Primary text |
| `--muted-foreground` | `#888888` | Secondary/muted text |
| `--music-accent` | `#1DB954` | Spotify green — music actions |
| `--movie-accent` | `#F5A623` | Warm amber — movie actions |

Access in Tailwind: `bg-[var(--music-accent)]`, `text-[var(--movie-accent)]`
Access in CSS: `var(--music-accent)`

---

## Typography

| Role | Font | Tailwind class |
|---|---|---|
| Display / headings | Playfair Display | `font-display` (configured in `tailwind.config.ts`) |
| Body / UI | Inter | default (`font-sans`) |
| AI output / mono | JetBrains Mono | `font-mono` |

Fonts are loaded via `next/font/google` in `src/app/layout.tsx` and exposed as CSS variables (`--font-inter`, `--font-jetbrains`).

---

## Key shared components

### `<Navbar />` (`src/components/shared/Navbar.tsx`)
- Fixed top bar; `z-40`
- Left: RecMe logo with one-shot "RecommendMe" expand animation on page load only (module-level `logoAnimationDone` flag prevents re-trigger on route changes)
- Center: nav links (Home, Personalize, Profile) — hidden below `sm`, full flex on desktop
- Right: hamburger (mobile only) or avatar + logout (desktop)
- Mobile: AnimatePresence dropdown with all nav links + profile row + sign out

### `<RecommendationCard />` (`src/components/shared/RecommendationCard.tsx`)
- Unified card for music and movie items
- Music: iTunes album art (lazy-fetched via `/api/itunes/artwork`), title, artist, AI reason, Save + Spotify search link
- Movie: TMDB poster, title, year, genres, rating, synopsis, AI reason, Save + TMDB link
- Action buttons use `opacity-0 group-hover/card:opacity-100` on desktop; always visible on touch (CSS `@media (hover: none)` override)

### `<MoodInput />` (`src/components/shared/MoodInput.tsx`)
- Text area with animated floating label
- Submit button accent color switches based on `type` prop (music = green, movie = amber)
- `w-11 h-11` minimum touch target on submit button

### `<TabSwitcher />` (`src/components/shared/TabSwitcher.tsx`)
- Animated pill switcher between "Music" and "Movies"
- Active tab has glowing border + accent color
- Framer Motion `layoutId` for the sliding pill

### `<PlaylistGenerator />` (`src/components/personalize/`)
- AI playlist creation form — description textarea + track count selector
- Result shows playlist link + found/notFound track split
- Found tracks: green CheckCircle2
- Not found: red XCircle with "Not available on Spotify — add manually"
- Bottom disclaimer: "AI may make mistakes — double check before sharing"

### `<AiThinkingLoader />` (`src/components/shared/AiThinkingLoader.tsx`)
- Animated loader shown while Gemini is processing
- Used in recommendation card grids and chat

---

## Layout patterns

- Full-bleed sections with `w-full` containers
- Recommendation grids: responsive, typically `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Trending rows: `flex gap-4 overflow-x-auto` with scrollbar hidden
- Scroll affordance fade: `after:absolute after:right-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-background after:pointer-events-none`
- Cards: `rounded-xl bg-surface border border-border`
- Frosted panels: `bg-background/80 backdrop-blur-md`
- Film grain: `film-grain` class on `<body>` applies a CSS noise texture overlay (defined in `globals.css`)

---

## Animation conventions

- Page entrance: `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`
- Staggered cards: wrap in `<motion.div>` with incrementing `delay` (0.05s × index)
- Tab cross-fade: `AnimatePresence mode="wait"` + fade in/out
- Hover lift: `whileHover={{ y: -2 }}` on cards
- All transitions: `ease: [0.4, 0, 0.2, 1]` (Material Design standard easing)
- Duration: 0.3–0.55s depending on element size

---

## Tailwind config notes

- `font-display` maps to Playfair Display
- Custom `bg-surface` and `bg-surface-light` are defined as CSS variable aliases in `tailwind.config.ts`
- `film-grain` utility class defined in `globals.css` using a CSS noise pseudo-element
- Plugin: `tailwindcss-animate` (v3 compatible, replaces shadcn's tw-animate-css)
