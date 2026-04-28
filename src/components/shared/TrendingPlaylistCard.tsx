"use client";

import Image from "next/image";
import { ListMusic, Play } from "lucide-react";
import type { TrendingPlaylist } from "@/types/trending";
import { cn } from "@/lib/utils";

interface Props extends TrendingPlaylist {
  onPlay?: () => void;
  isPlaying?: boolean;
}

export function TrendingPlaylistCard({ name, imageUrl, spotifyUrl, trackCount, description, onPlay, isPlaying }: Props) {
  return (
    <div className="group w-36 flex-shrink-0 space-y-2 relative">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-light cursor-pointer">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ListMusic className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        <div className={cn(
          "absolute inset-0 transition-opacity flex items-center justify-center bg-black/40",
          isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {onPlay && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onPlay();
              }}
              className="w-12 h-12 rounded-full bg-[var(--music-accent)] text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              aria-label={`Play ${name}`}
            >
              <Play className="w-6 h-6 ml-1 fill-current" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-0.5 px-0.5">
        <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
          <p className={cn("text-xs font-medium truncate leading-tight", isPlaying && "text-[var(--music-accent)]")}>{name}</p>
        </a>
        {description && (
          <p className="text-[11px] text-muted-foreground truncate">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
