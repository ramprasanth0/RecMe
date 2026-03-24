const POSTER_URL =
  "https://image.tmdb.org/t/p/w1280/gEU2QniE6E77NI6lCU6MxlNBvIe.jpg"; // Interstellar

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Movie poster background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${POSTER_URL})` }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Film grain */}
      <div className="absolute inset-0 film-grain pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-display text-3xl font-bold tracking-tight text-white">
            Rec<span className="text-[var(--music-accent)]">Me</span>
          </span>
          <p className="text-white/50 text-sm mt-2">Your taste. Amplified.</p>
        </div>

        {/* Sign-in box */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-8 space-y-6">
          <div>
            <h1 className="text-white text-xl font-semibold">Welcome back</h1>
            <p className="text-white/50 text-sm mt-1">
              Connect your Spotify account to get personalised recommendations.
            </p>
          </div>

          <a
            href="/api/auth/spotify/start"
            className="flex items-center justify-center gap-3 w-full py-3 rounded-full bg-[var(--music-accent)] text-black text-sm font-semibold hover:brightness-110 transition-all"
          >
            <SpotifyIcon className="w-5 h-5" />
            Continue with Spotify
          </a>

          <p className="text-white/30 text-xs text-center leading-relaxed">
            We request access to your top tracks, artists, and the ability to
            create playlists on your behalf.
          </p>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-white/40 text-xs hover:text-white/70 transition-colors">
            ← Back to home
          </a>
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
