"use client";

import { useState } from "react";
import Image from "next/image";
import { Film, Star, Play } from "lucide-react";
import type { TrendingMovie } from "@/types/trending";
import { TrailerModal } from "@/components/shared/TrailerModal";

export function TrendingMovieCard({ title, year, posterPath, rating, tmdbId }: TrendingMovie) {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w300${posterPath}`
    : null;

  return (
    <>
      <div
        onClick={() => setIsTrailerOpen(true)}
        className="group w-28 flex-shrink-0 space-y-2 cursor-pointer"
      >
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-light">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          {/* Rating badge */}
          {rating !== null && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm z-10">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-medium text-white">{rating.toFixed(1)}</span>
            </div>
          )}
          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <span className="w-10 h-10 rounded-full bg-[var(--movie-accent)] flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg">
              <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
            </span>
          </div>
        </div>
        <div className="space-y-0.5 px-0.5">
          <p className="text-xs font-medium truncate leading-tight group-hover:text-[var(--movie-accent)] transition-colors">{title}</p>
          <p className="text-[11px] text-muted-foreground">{year}</p>
        </div>
      </div>

      <TrailerModal
        tmdbId={tmdbId}
        title={title}
        year={year}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />
    </>
  );
}
