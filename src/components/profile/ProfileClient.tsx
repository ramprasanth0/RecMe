"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Music, Film, Bookmark, Check, Trash2 } from "lucide-react";
import type { DBUser } from "@/types/db";
import { cn } from "@/lib/utils";
import { ProBadge } from "@/components/shared/ProBadge";

const MUSIC_GENRES = [
  "Pop", "Rock", "Hip-Hop", "R&B", "Electronic", "Jazz",
  "Classical", "Country", "Indie", "Metal", "Folk", "Latin",
];

const MOVIE_GENRES = [
  "Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance",
  "Thriller", "Animation", "Documentary", "Fantasy", "Crime", "Mystery",
];

interface SavedRec {
  id: string;
  type: "music" | "movie";
  item_data: Record<string, unknown>;
  saved_at: string;
}

export function ProfileClient({ user, isPro }: { user: DBUser | null; isPro: boolean }) {
  const [musicGenres, setMusicGenres] = useState<string[]>(
    user?.preferences?.music_genres ?? []
  );
  const [movieGenres, setMovieGenres] = useState<string[]>(
    user?.preferences?.movie_genres ?? []
  );
  const [savedRecs, setSavedRecs] = useState<SavedRec[]>([]);
  const [saving, setSaving] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [recsError, setRecsError] = useState(false);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((data) => setSavedRecs(data.recommendations || []))
      .catch(() => setRecsError(true));
  }, []);

  function toggleGenre(
    genre: string,
    current: string[],
    setter: (v: string[]) => void
  ) {
    setter(
      current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre]
    );
  }

  async function savePreferences() {
    setSaving(true);
    setPrefsError(null);
    setPrefsSaved(false);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          music_genres: musicGenres,
          movie_genres: movieGenres,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch {
      setPrefsError("Could not save preferences — please try again.");
    }
    setSaving(false);
  }

  async function deleteRec(id: string) {
    try {
      const res = await fetch(`/api/recommendations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSavedRecs((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Non-blocking: log but don't interrupt the UI — item stays in list
      console.error("Failed to delete recommendation");
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Connected Account */}
      <section className="rounded-xl bg-surface border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Account</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt=""
              width={48}
              height={48}
              className="rounded-full shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate flex items-center gap-2">
              {user.display_name || "User"}
              {isPro && <ProBadge size="md" />}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {user.spotify_id ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[var(--music-accent)]/10 text-[var(--music-accent)]">
                  <Music className="w-3 h-3" />
                  Spotify connected
                </span>
                <a
                  href="/api/auth/spotify/reconnect"
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  Reconnect
                </a>
              </div>
            ) : (
              <a
                href="/api/auth/spotify/start"
                className="text-xs px-3 py-1.5 rounded-full bg-[var(--music-accent)] text-black font-medium hover:brightness-110 transition-all"
              >
                Connect Spotify
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Genre Preferences */}
      <section className="rounded-xl bg-surface border border-border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[var(--music-accent)]" />
            <h2 className="text-base font-semibold">Music Genres</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {MUSIC_GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre, musicGenres, setMusicGenres)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                musicGenres.includes(genre)
                  ? "bg-[var(--music-accent)]/10 border-[var(--music-accent)]/30 text-[var(--music-accent)]"
                  : "bg-surface-light border-border text-muted-foreground hover:border-foreground/20"
              )}
            >
              {musicGenres.includes(genre) && <Check className="w-3 h-3 inline mr-1" />}
              {genre}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Film className="w-5 h-5 text-[var(--movie-accent)]" />
          <h2 className="text-base font-semibold">Movie Genres</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOVIE_GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre, movieGenres, setMovieGenres)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                movieGenres.includes(genre)
                  ? "bg-[var(--movie-accent)]/10 border-[var(--movie-accent)]/30 text-[var(--movie-accent)]"
                  : "bg-surface-light border-border text-muted-foreground hover:border-foreground/20"
              )}
            >
              {movieGenres.includes(genre) && <Check className="w-3 h-3 inline mr-1" />}
              {genre}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="text-sm px-5 py-2.5 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : prefsSaved ? "Saved!" : "Save Preferences"}
          </button>
          {prefsError && (
            <p className="text-xs text-red-500">{prefsError}</p>
          )}
        </div>
      </section>

      {/* Saved Recommendations */}
      <section className="rounded-xl bg-surface border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bookmark className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Saved Recommendations</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {savedRecs.length} saved
          </span>
        </div>

        {recsError ? (
          <p className="text-sm text-red-500 py-4 text-center">
            Could not load saved recommendations — please refresh.
          </p>
        ) : savedRecs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Save music or movies from your recommendations to see them here.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {savedRecs.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light group"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    rec.type === "music"
                      ? "bg-[var(--music-accent)]/10"
                      : "bg-[var(--movie-accent)]/10"
                  )}
                >
                  {rec.type === "music" ? (
                    <Music className="w-3.5 h-3.5 text-[var(--music-accent)]" />
                  ) : (
                    <Film className="w-3.5 h-3.5 text-[var(--movie-accent)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {(rec.item_data.title as string) || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {rec.type === "music"
                      ? (rec.item_data.artist as string)
                      : `${rec.item_data.year || ""} ${
                          Array.isArray(rec.item_data.genres)
                            ? (rec.item_data.genres as string[]).join(", ")
                            : ""
                        }`}
                  </p>
                </div>
                <button
                  onClick={() => deleteRec(rec.id)}
                  className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-2 rounded hover:bg-red-400/10 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
