import Link from "next/link";
import { Music, Film, Sparkles } from "lucide-react";

export default function RootPage() {
  // Phase 2 will add SSR auth detection here
  // For now, render a placeholder landing
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[var(--music-accent)]" />
          <span className="font-mono text-sm tracking-widest uppercase text-[var(--muted-text)]">
            RecMe
          </span>
          <Sparkles className="w-5 h-5 text-[var(--movie-accent)]" />
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
          Your taste.{" "}
          <span className="bg-gradient-to-r from-[var(--music-accent)] to-[var(--movie-accent)] bg-clip-text text-transparent">
            Amplified.
          </span>
        </h1>

        <p className="text-lg text-[var(--muted-text)] max-w-lg mx-auto">
          Discover music and movies the world is obsessed with — powered by AI
          that knows your taste.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/api/auth/callback/spotify"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--music-accent)] text-black font-semibold text-sm hover:brightness-110 transition-all"
          >
            <Music className="w-4 h-4" />
            Connect with Spotify
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-[var(--primary-text)] font-semibold text-sm hover:bg-white/5 transition-all"
          >
            <Film className="w-4 h-4" />
            Continue with Email
          </Link>
        </div>
      </div>

      {/* Placeholder for trending sections */}
      <div className="mt-24 w-full max-w-6xl space-y-12">
        <section>
          <h2 className="font-display text-2xl font-semibold mb-6">
            Trending Movies
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-lg bg-[var(--surface)] animate-pulse"
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold mb-6">
            Trending Music
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-[var(--surface)] animate-pulse"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
