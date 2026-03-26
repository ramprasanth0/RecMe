"use client";

import Image from "next/image";
import { ListMusic } from "lucide-react";
import type { TrendingPlaylist } from "@/types/trending";

export function TrendingPlaylistCard({ name, imageUrl, spotifyUrl, trackCount, description }: TrendingPlaylist) {
  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group w-36 flex-shrink-0 space-y-2 cursor-pointer"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-light">
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
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="space-y-0.5 px-0.5">
        <p className="text-xs font-medium truncate leading-tight">{name}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {description || `${trackCount} tracks`}
        </p>
      </div>
    </a>
  );
}
