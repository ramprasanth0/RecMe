import Image from "next/image";
import Link from "next/link";
import { SpotifyIcon } from "@/components/shared/SpotifyIcon";

// Cinematic movie poster used as background (Blade Runner 2049 — TMDB)
const POSTER_URL =
  "https://image.tmdb.org/t/p/w1280/ilRyazdMJwN3JIKUQ0lViniMr6g.jpg";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Background poster — fixed so it always fills the viewport regardless of content height */}
      <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
        <Image
          src={POSTER_URL}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 film-grain pointer-events-none" />
      </div>

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
            className="text-sm text-white/50 hover:text-white transition-colors py-3 px-2 inline-block"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
