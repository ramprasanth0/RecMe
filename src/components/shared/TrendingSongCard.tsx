"use client";

import Image from "next/image";
import { ExternalLink, Music2 } from "lucide-react";
import type { TrendingSong } from "@/types/trending";

export function TrendingSongCard({ title, artist, albumArt, spotifyUrl }: TrendingSong) {
  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group w-36 flex-shrink-0 space-y-2 cursor-pointer"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-light">
        {albumArt ? (
          <Image
            src={albumArt}
            alt={title}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Spotify link overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
            <ExternalLink className="w-3.5 h-3.5 text-black" />
          </span>
        </div>
      </div>
      <div className="space-y-0.5 px-0.5">
        <p className="text-xs font-medium truncate leading-tight">{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{artist}</p>
      </div>
    </a>
  );
}
