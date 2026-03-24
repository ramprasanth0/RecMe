import Link from "next/link";

// Cinematic movie poster used as background (Blade Runner 2049 — TMDB)
const POSTER_URL =
  "https://image.tmdb.org/t/p/w1280/ilRyazdMJwN3JIKUQ0lViniMr6g.jpg";

export default function NotFound() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${POSTER_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Film grain */}
      <div className="absolute inset-0 film-grain pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-md">
        <p className="text-[var(--music-accent)] font-mono text-sm tracking-widest uppercase mb-4">
          404
        </p>

        <h1 className="text-white text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          This page doesn&apos;t exist.
        </h1>

        <p className="text-white/60 text-sm leading-relaxed mb-8">
          If you&apos;re trying to sign up, we don&apos;t have a sign-up page&nbsp;yet.
          <br />
          Just connect with Spotify and you&apos;re in.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/api/auth/spotify/start"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--music-accent)] text-black text-sm font-semibold hover:brightness-110 transition-all"
          >
            <SpotifyIcon className="w-4 h-4" />
            Connect with Spotify
          </a>
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
