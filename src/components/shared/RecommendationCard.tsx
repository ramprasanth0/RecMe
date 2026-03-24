"use client";

import Image from "next/image";
import { Bookmark, Plus, ExternalLink } from "lucide-react";
import type { MusicItem, MovieItem } from "@/types/recommendations";

interface MusicCardProps {
  type: "music";
  item: MusicItem;
}

interface MovieCardProps {
  type: "movie";
  item: MovieItem;
}

type RecCardProps = MusicCardProps | MovieCardProps;

export function RecommendationCard(props: RecCardProps) {
  if (props.type === "music") return <MusicCard item={props.item} />;
  return <MovieCard item={props.item} />;
}

function MusicCard({ item }: { item: MusicItem }) {
  return (
    <div className="group relative rounded-xl bg-surface border border-white/5 overflow-hidden hover:border-[var(--music-accent)]/20 transition-all duration-300">
      {/* Album art */}
      <div className="aspect-square bg-surface-light relative overflow-hidden">
        {item.albumArt ? (
          <Image src={item.albumArt} alt={item.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <Music className="w-12 h-12" />
          </div>
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button className="w-8 h-8 rounded-full bg-[var(--music-accent)] flex items-center justify-center text-black">
            <Plus className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
        <p className="text-xs text-muted-foreground/70 font-mono leading-relaxed line-clamp-2 mt-1.5">
          {item.reason}
        </p>
      </div>
    </div>
  );
}

function Music({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function MovieCard({ item }: { item: MovieItem }) {
  const posterUrl = item.posterPath
    ? `https://image.tmdb.org/t/p/w300${item.posterPath}`
    : null;

  return (
    <div className="group relative rounded-xl bg-surface border border-white/5 overflow-hidden hover:border-[var(--movie-accent)]/20 transition-all duration-300">
      {/* Poster */}
      <div className="aspect-[2/3] bg-surface-light relative overflow-hidden">
        {posterUrl ? (
          <Image src={posterUrl} alt={item.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <Film className="w-12 h-12" />
          </div>
        )}
        {/* Rating badge */}
        {item.rating && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[var(--movie-accent)] text-xs font-mono font-bold">
            {item.rating.toFixed(1)}
          </div>
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button className="w-8 h-8 rounded-full bg-[var(--movie-accent)] flex items-center justify-center text-black">
            <ExternalLink className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.year}</span>
          {item.genres.length > 0 && (
            <>
              <span className="opacity-30">|</span>
              <span className="truncate">{item.genres.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground/70 font-mono leading-relaxed line-clamp-2 mt-1.5">
          {item.reason}
        </p>
      </div>
    </div>
  );
}

function Film({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" /><line x1="7" x2="7" y1="2" y2="22" /><line x1="17" x2="17" y1="2" y2="22" /><line x1="2" x2="22" y1="12" y2="12" /><line x1="2" x2="7" y1="7" y2="7" /><line x1="2" x2="7" y1="17" y2="17" /><line x1="17" x2="22" y1="7" y2="7" /><line x1="17" x2="22" y1="17" y2="17" />
    </svg>
  );
}
