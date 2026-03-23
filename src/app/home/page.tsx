import { Music, Film } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-[var(--muted-text)] mb-8">
        Your personalized music and movie recommendations.
      </p>

      {/* Tab placeholder */}
      <div className="flex items-center gap-2 mb-8">
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--music-accent)] text-black text-sm font-semibold">
          <Music className="w-4 h-4" />
          Music
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-[var(--muted-text)] text-sm font-semibold hover:bg-white/5 transition-colors">
          <Film className="w-4 h-4" />
          Movies
        </button>
      </div>

      {/* Content placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">AI Recommendations</h2>
          <div className="rounded-xl bg-[var(--surface)] p-6 min-h-[300px] flex items-center justify-center text-[var(--muted-text)]">
            Connect Spotify to get personalized recommendations
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Trending</h2>
          <div className="rounded-xl bg-[var(--surface)] p-6 min-h-[300px] flex items-center justify-center text-[var(--muted-text)]">
            Trending content will appear here
          </div>
        </div>
      </div>
    </main>
  );
}
