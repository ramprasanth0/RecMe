"use client";

import { useState } from "react";

const POSTER_URL =
  "https://image.tmdb.org/t/p/w1280/gEU2QniE6E77NI6lCU6MxlNBvIe.jpg";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || emailStatus === "loading") return;
    setEmailStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/email/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send link");
      setEmailStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setEmailStatus("error");
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Movie poster background — CSS background avoids Next.js fill/height constraints */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url('${POSTER_URL}')` }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="font-display text-3xl font-bold tracking-tight text-white">
            Rec<span className="text-[var(--music-accent)]">Me</span>
          </a>
          <p className="text-white/50 text-sm mt-2">Your taste. Amplified.</p>
        </div>

        {/* Sign-in box */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-8 space-y-5">
          <div>
            <h1 className="text-white text-xl font-semibold">Sign in</h1>
            <p className="text-white/50 text-sm mt-1">
              Connect with Spotify for music, or use email for movies only.
            </p>
          </div>

          {/* Spotify */}
          <a
            href="/api/auth/spotify/start"
            className="flex items-center justify-center gap-3 w-full py-3 rounded-full bg-[var(--music-accent)] text-black text-sm font-semibold hover:brightness-110 transition-all"
          >
            <SpotifyIcon className="w-5 h-5" />
            Continue with Spotify
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          {/* Email */}
          {emailStatus === "sent" ? (
            <div className="text-center py-3 space-y-1">
              <p className="text-white text-sm font-medium">Check your inbox ✓</p>
              <p className="text-white/50 text-xs">
                We sent a sign-in link to <span className="text-white/70">{email}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-lg bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
              />
              {errorMsg && (
                <p className="text-red-400 text-xs">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={!email.trim() || emailStatus === "loading"}
                className="w-full py-3 rounded-full bg-white/15 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all disabled:opacity-40"
              >
                {emailStatus === "loading" ? "Sending…" : "Continue with Email"}
              </button>
            </form>
          )}

          <p className="text-white/25 text-xs text-center leading-relaxed">
            Spotify access lets us personalise music picks and create playlists.
            Email-only accounts get movie recommendations.
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
