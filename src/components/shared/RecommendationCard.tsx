"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Bookmark, BookmarkCheck, Plus, ExternalLink, Play, ListMusic, Music2 } from "lucide-react";
import type { MusicItem, MovieItem } from "@/types/recommendations";
import { cn } from "@/lib/utils";
import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import { TrailerModal } from "@/components/shared/TrailerModal";

async function fetchItunesAlbumArt(title: string, artist: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ title, artist });
    const res = await fetch(`/api/itunes/artwork?${params}`);
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

interface MusicCardProps {
  type: "music";
  item: MusicItem;
  onAddToPlaylist?: (item: MusicItem) => void;
}

interface MovieCardProps {
  type: "movie";
  item: MovieItem;
}

type RecCardProps = MusicCardProps | MovieCardProps;

export function RecommendationCard(props: RecCardProps) {
  if (props.type === "music")
    return <MusicCard item={props.item} onAddToPlaylist={props.onAddToPlaylist} />;
  return <MovieCard item={props.item} />;
}

function MusicCard({
  item,
  onAddToPlaylist,
}: {
  item: MusicItem;
  onAddToPlaylist?: (item: MusicItem) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [albumArt, setAlbumArt] = useState<string | null>(item.albumArt ?? null);
  const [queueSuccess, setQueueSuccess] = useState(false);
  const [queueError, setQueueError] = useState(false);
  const { playTrack, addToQueue, currentTrack, isPlaying } = useSpotifyPlayer();

  const isNowPlaying = currentTrack?.name.toLowerCase() === item.title.toLowerCase();

  useEffect(() => {
    if (albumArt) return;
    fetchItunesAlbumArt(item.title, item.artist).then((art) => {
      if (art) setAlbumArt(art);
    });
  }, [item.title, item.artist, albumArt]);

  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${item.title} ${item.artist}`)}`;

  async function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    playTrack({ title: item.title, artist: item.artist, uri: item.spotifyUri });
  }

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (saved) return;
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "music",
          item_data: { title: item.title, artist: item.artist, reason: item.reason },
        }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 2000);
      }
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 2000);
    }
  }

  async function handleAddToQueue(e: React.MouseEvent) {
    e.stopPropagation();
    if (queueSuccess) return;

    try {
      let uri = item.spotifyUri;
      if (!uri) {
        // Fallback search if URI is missing
        const res = await fetch(`/api/spotify/search-track?title=${encodeURIComponent(item.title)}&artist=${encodeURIComponent(item.artist)}`);
        if (res.ok) {
          const data = await res.json();
          uri = data.uri;
        }
      }

      if (uri) {
        await addToQueue(uri);
        setQueueSuccess(true);
        setTimeout(() => setQueueSuccess(false), 2000);
      } else {
        throw new Error("No URI found");
      }
    } catch (err) {
      console.error("Failed to add to queue", err);
      setQueueError(true);
      setTimeout(() => setQueueError(false), 2000);
    }
  }

  return (
    <div 
      className="group/card relative rounded-xl bg-surface border border-border overflow-hidden transition-all duration-300 hover:border-[var(--music-accent)]/30 hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/20"
      data-testid="music-recommendation-card"
    >
      <div className="aspect-square bg-surface-light relative overflow-hidden">
        {albumArt ? (
          <Image
            src={albumArt}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <Music2 className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300">
          {/* Center: Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handlePlay}
              className="w-14 h-14 rounded-full bg-[var(--music-accent)] flex items-center justify-center text-black hover:scale-110 transition-transform shadow-xl"
              title="Play"
            >
              {isNowPlaying && isPlaying ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-4 bg-black animate-[bounce_1s_infinite] rounded-full" />
                  <div className="w-1.5 h-6 bg-black animate-[bounce_1s_infinite_0.2s] rounded-full" />
                  <div className="w-1.5 h-4 bg-black animate-[bounce_1s_infinite_0.4s] rounded-full" />
                </div>
              ) : (
                <Play className="w-7 h-7 ml-1" fill="currentColor" />
              )}
            </button>
          </div>

          {/* Top Right: Open in Spotify */}
          <div className="absolute top-2 right-2">
            <a
              href={spotifySearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-[var(--music-accent)] hover:text-black hover:scale-110 transition-all shadow-lg"
              title="Open in Spotify"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Bottom Left: Add to Saved */}
          <div className="absolute bottom-2 left-2">
            <button
              onClick={handleSave}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg",
                saved
                  ? "bg-[var(--music-accent)] text-black"
                  : saveError
                    ? "bg-red-500/80 text-white"
                    : "bg-white/15 backdrop-blur-md text-white"
              )}
              title={saved ? "Saved" : saveError ? "Save failed" : "Save to recommendations"}
            >
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>

          {/* Bottom Right: Add to Queue */}
          <div className="absolute bottom-2 right-2">
            <button
              onClick={handleAddToQueue}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg",
                queueSuccess
                  ? "bg-[var(--music-accent)] text-black"
                  : queueError
                  ? "bg-red-500/80 text-white"
                  : "bg-white/15 backdrop-blur-md text-white hover:bg-white hover:text-black hover:scale-110"
              )}
              title={queueSuccess ? "Added to Queue" : queueError ? "Failed to add" : "Add to Queue"}
            >
              <ListMusic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
        <p className="text-[11px] text-muted-foreground/60 font-mono leading-relaxed line-clamp-2 mt-1.5">
          {item.reason}
        </p>
      </div>
    </div>
  );
}

function MovieCard({ item }: { item: MovieItem }) {
  const [posterPath, setPosterPath] = useState<string | null>(item.posterPath ?? null);
  const [rating, setRating] = useState<number | null>(item.rating ?? null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    if (posterPath || !item.tmdbId || item.tmdbId === 0) return;
    fetch(`/api/tmdb/poster?id=${item.tmdbId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.posterPath) setPosterPath(data.posterPath);
        if (data.rating && !rating) setRating(data.rating);
      })
      .catch(() => {});
  }, [item.tmdbId, posterPath, rating]);

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (saved) return;
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "movie",
          item_data: {
            title: item.title,
            year: item.year,
            tmdbId: item.tmdbId,
            genres: item.genres,
            reason: item.reason,
            posterPath,
            rating,
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 2000);
      }
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 2000);
    }
  }

  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w780${posterPath}`
    : null;

  return (
    <div className="group/card relative rounded-xl bg-surface border border-border overflow-hidden transition-all duration-300 hover:border-[var(--movie-accent)]/30 hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/20">
      <div className="aspect-[2/3] bg-surface-light relative overflow-hidden">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <FilmIcon className="w-12 h-12" />
          </div>
        )}
        {rating && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[var(--movie-accent)] text-xs font-mono font-bold">
            {rating.toFixed(1)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/card:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-2">
          {/* AI reason shown on hover (desktop) / always (touch) */}
          <p className="text-[11px] text-white/80 font-mono leading-relaxed line-clamp-3 mb-1 hidden [@media(hover:none)]:hidden group-hover/card:block">
            {item.reason}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsTrailerOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-[var(--movie-accent)] flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg"
              title="Watch Trailer"
            >
              <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
            </button>
            <a
              href={item.tmdbId ? `https://www.themoviedb.org/movie/${item.tmdbId}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:scale-110 transition-transform"
              title="View on TMDB"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={handleSave}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform",
                saved
                  ? "bg-[var(--movie-accent)] text-black"
                  : saveError
                    ? "bg-red-500/80 text-white"
                    : "bg-white/15 backdrop-blur-sm text-white"
              )}
              title={saved ? "Saved" : saveError ? "Save failed" : "Save"}
            >
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="shrink-0">{item.year}</span>
          {item.genres.length > 0 && (
            <>
              <span className="opacity-30">·</span>
              <span className="truncate">{item.genres.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
        {item.synopsis ? (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 mt-1">
            {item.synopsis}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground/60 font-mono leading-relaxed line-clamp-2 mt-1">
            {item.reason}
          </p>
        )}
      </div>
      
      {item.tmdbId && (
        <TrailerModal
          tmdbId={item.tmdbId}
          title={item.title}
          year={item.year}
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
        />
      )}
    </div>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" /><line x1="7" x2="7" y1="2" y2="22" /><line x1="17" x2="17" y1="2" y2="22" /><line x1="2" x2="22" y1="12" y2="12" /><line x1="2" x2="7" y1="7" y2="7" /><line x1="2" x2="7" y1="17" y2="17" /><line x1="17" x2="22" y1="7" y2="7" /><line x1="17" x2="22" y1="17" y2="17" />
    </svg>
  );
}
