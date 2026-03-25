"use client";

import { useState } from "react";
import { X, Loader2, Music, ExternalLink, Check } from "lucide-react";
import type { MusicItem } from "@/types/recommendations";
import { cn } from "@/lib/utils";

interface PlaylistCreatorProps {
  tracks: MusicItem[];
  onClose: () => void;
}

type Status = "idle" | "creating" | "success" | "error";

export function PlaylistCreator({ tracks, onClose }: PlaylistCreatorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{
    playlistUrl: string;
    tracksAdded: number;
    tracksTotal: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setStatus("creating");
    setError(null);

    try {
      const res = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          tracks: tracks.map((t) => ({
            title: t.title,
            artist: t.artist,
            spotifyUri: t.spotifyUri,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create playlist");
      }

      const data = await res.json();
      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold">Create Spotify Playlist</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-light transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {status === "success" && result ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[var(--music-accent)]/10 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-[var(--music-accent)]" />
              </div>
              <div>
                <p className="font-medium">Playlist created!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.tracksAdded} of {result.tracksTotal} tracks added
                </p>
              </div>
              <a
                href={result.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--music-accent)] text-black text-sm font-medium hover:brightness-110 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Spotify
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Track preview */}
              <div className="rounded-lg bg-surface-light p-3 max-h-40 overflow-y-auto space-y-2">
                {tracks.map((track, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Music className="w-3.5 h-3.5 text-[var(--music-accent)] shrink-0" />
                    <span className="truncate">{track.title}</span>
                    <span className="text-muted-foreground truncate ml-auto text-xs">
                      {track.artist}
                    </span>
                  </div>
                ))}
              </div>

              {/* Name input */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Playlist name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My RecMe Mix"
                  className="w-full rounded-lg bg-surface-light border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--music-accent)]"
                  disabled={status === "creating"}
                />
              </div>

              {/* Description input */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="AI-curated by RecMe"
                  className="w-full rounded-lg bg-surface-light border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--music-accent)]"
                  disabled={status === "creating"}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={!name.trim() || status === "creating"}
                className={cn(
                  "w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  name.trim() && status !== "creating"
                    ? "bg-[var(--music-accent)] text-black hover:brightness-110"
                    : "bg-surface-light text-muted-foreground cursor-not-allowed"
                )}
              >
                {status === "creating" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Playlist ({tracks.length} tracks)</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
