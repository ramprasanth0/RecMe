"use client";

import Image from "next/image";
import { ExternalLink, Music2, Play } from "lucide-react";
import type { TrendingSong } from "@/types/trending";
import { useSpotifyPlayer } from "@/context/SpotifyPlayerContext";
import { cn } from "@/lib/utils";

export function TrendingSongCard({ title, artist, albumArt, spotifyUrl }: TrendingSong) {
  const { playTrack, currentTrack, isPlaying } = useSpotifyPlayer();

  // We consider the track "active" if the titles roughly match (since we might not have URIs initially for trending songs)
  const isNowPlaying = currentTrack?.name.toLowerCase() === title.toLowerCase();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack({ title, artist });
  };

  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group w-36 flex-shrink-0 space-y-2 cursor-pointer block"
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
          "absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center",
          isNowPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button 
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-[var(--music-accent)] flex items-center justify-center text-black hover:scale-110 transition-transform mb-2 shadow-lg"
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
          
          <span className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#1DB954] hover:text-black transition-colors text-white">
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
      <div className="space-y-0.5 px-0.5">
        <p className={cn(
          "text-xs font-medium truncate leading-tight transition-colors",
          isNowPlaying ? "text-[var(--music-accent)]" : ""
        )}>{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{artist}</p>
      </div>
    </a>
  );
}
