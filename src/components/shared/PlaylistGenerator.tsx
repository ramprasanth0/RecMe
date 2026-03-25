"use client";

import { useState } from "react";
import { Sparkles, Loader2, ExternalLink, Music, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "generating" | "success" | "error";

interface GeneratedPlaylist {
  playlistName: string;
  playlistUrl: string;
  tracksAdded: number;
  tracksTotal: number;
  tracks: { title: string; artist: string }[];
  warning?: string;
}

const PROMPT_SUGGESTIONS = [
  "Chill Sunday morning with coffee",
  "Late night drive through the city",
  "Workout motivation — high energy",
  "Focus mode for deep work",
  "Feel-good 90s throwbacks",
  "Dark and cinematic instrumentals",
];

export function PlaylistGenerator() {
  const [prompt, setPrompt] = useState("");
  const [trackCount, setTrackCount] = useState(10);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GeneratedPlaylist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTracks, setShowTracks] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim() || status === "generating") return;
    setStatus("generating");
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/spotify/generate-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), trackCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate playlist");
      }

      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[var(--music-accent)]" />
        <h3 className="text-sm font-semibold">AI Playlist Generator</h3>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--music-accent)]/10 text-[var(--music-accent)] ml-auto">
          Spotify
        </span>
      </div>

      {status === "success" && result ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--music-accent)]/10 border border-[var(--music-accent)]/20">
            <div className="w-10 h-10 rounded-lg bg-[var(--music-accent)]/20 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-[var(--music-accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{result.playlistName}</p>
              <p className="text-xs text-muted-foreground">
                {result.tracksAdded} of {result.tracksTotal} tracks added to Spotify
              </p>
            </div>
            <a
              href={result.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--music-accent)] text-black text-xs font-semibold hover:brightness-110 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </a>
          </div>

          {/* Warning if tracks couldn't be added */}
          {result.warning && (
            <p className="text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2">
              {result.warning}
            </p>
          )}

          {/* Track list toggle */}
          <button
            onClick={() => setShowTracks(!showTracks)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showTracks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showTracks ? "Hide" : "Show"} track list
          </button>

          {showTracks && (
            <div className="rounded-lg bg-surface-light p-3 max-h-48 overflow-y-auto space-y-1.5">
              {result.tracks.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground/40 w-4 shrink-0 text-right">{i + 1}</span>
                  <span className="truncate">{t.title}</span>
                  <span className="text-muted-foreground truncate ml-auto">{t.artist}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setStatus("idle"); setPrompt(""); setResult(null); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Generate another →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Prompt input */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Describe your perfect playlist… e.g. 'chill late night R&B' or 'energetic workout bangers'"
              disabled={status === "generating"}
              rows={2}
              className="w-full rounded-lg bg-surface-light border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--music-accent)] resize-none disabled:opacity-50"
            />
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                disabled={status === "generating"}
                className="text-[11px] px-2.5 py-1 rounded-full bg-surface-light border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Track count */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Tracks:</span>
            {[10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setTrackCount(n)}
                className={cn(
                  "px-3 py-1.5 rounded transition-all min-w-[36px]",
                  trackCount === n
                    ? "bg-[var(--music-accent)]/10 text-[var(--music-accent)]"
                    : "hover:text-foreground"
                )}
              >
                {n}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === "generating"}
            className={cn(
              "w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
              prompt.trim() && status !== "generating"
                ? "bg-[var(--music-accent)] text-black hover:brightness-110"
                : "bg-surface-light text-muted-foreground cursor-not-allowed"
            )}
          >
            {status === "generating" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating playlist…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate &amp; Create in Spotify
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
