"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Music2, Play, ListMusic } from "lucide-react";
import type { TrendingSong } from "@/types/trending";
import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import { cn } from "@/lib/utils";

export function TrendingSongCard({ title, artist, albumArt, spotifyUrl }: TrendingSong) {
  const { playTrack, addToQueue, currentTrack, isPlaying } = useSpotifyPlayer();
  const [queueSuccess, setQueueSuccess] = useState(false);
  const [queueError, setQueueError] = useState(false);

  // We consider the track "active" if the titles roughly match (since we might not have URIs initially for trending songs)
  const isNowPlaying = currentTrack?.name.toLowerCase() === title.toLowerCase();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack({ title, artist });
  };

  const handleAddToQueue = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (queueSuccess) return;

    try {
      // For trending songs we might need to search for the URI first
      const res = await fetch(`/api/spotify/search-track?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.uri) {
          await addToQueue(data.uri);
          setQueueSuccess(true);
          setTimeout(() => setQueueSuccess(false), 2000);
          return;
        }
      }
      throw new Error("No URI found");
    } catch (err) {
      console.error("Failed to add to queue", err);
      setQueueError(true);
      setTimeout(() => setQueueError(false), 2000);
    }
  };

  return (
    <div
      className="group w-36 flex-shrink-0 space-y-2 block"
      data-testid="trending-song-card"
    >
      <div className={cn(
        "relative aspect-square rounded-xl overflow-hidden bg-surface-light transition-all",
        isNowPlaying ? "ring-2 ring-[var(--music-accent)] shadow-[0_0_15px_rgba(29,185,84,0.3)]" : ""
      )}>
        {albumArt ? (
          <Image
            src={albumArt}
            alt={title}
            fill
            sizes="144px"
            className={cn(
              "object-cover transition-transform duration-300",
              isNowPlaying ? "scale-105" : "group-hover:scale-105"
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity",
          isNowPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {/* Center: Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={handlePlay}
              className="w-12 h-12 rounded-full bg-[var(--music-accent)] flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg"
              title="Play"
            >
              {isNowPlaying && isPlaying ? (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-3 bg-black animate-[bounce_1s_infinite] rounded-full" />
                  <div className="w-1 h-4 bg-black animate-[bounce_1s_infinite_0.2s] rounded-full" />
                  <div className="w-1 h-3 bg-black animate-[bounce_1s_infinite_0.4s] rounded-full" />
                </div>
              ) : (
                <Play className="w-6 h-6 ml-1" fill="currentColor" />
              )}
            </button>
          </div>
          
          {/* Top Right: External Link */}
          <a 
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-[var(--music-accent)] hover:text-black transition-all text-white shadow-lg"
            title="Open in Spotify"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Bottom Right: Add to Queue */}
          <button
            onClick={handleAddToQueue}
            className={cn(
              "absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-lg",
              queueSuccess
                ? "bg-[var(--music-accent)] text-black"
                : queueError
                ? "bg-red-500/80 text-white"
                : "bg-white/15 backdrop-blur-md text-white hover:bg-white hover:text-black"
            )}
            title={queueSuccess ? "Added to Queue" : queueError ? "Failed to add" : "Add to Queue"}
          >
            <ListMusic className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-0.5 px-0.5">
        <p className={cn(
          "text-xs font-medium truncate leading-tight transition-colors",
          isNowPlaying ? "text-[var(--music-accent)]" : ""
        )}>{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{artist}</p>
      </div>
    </div>
  );
}
