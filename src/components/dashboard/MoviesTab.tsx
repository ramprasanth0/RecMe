"use client";

import { useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { MoodInput } from "@/components/shared/MoodInput";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import type { MovieItem } from "@/types/recommendations";

const SAMPLE_RECS: MovieItem[] = [
  { title: "Interstellar", year: 2014, tmdbId: 157336, genres: ["Sci-Fi", "Drama"], reason: "Epic scope meets deep emotional resonance", rating: 8.7 },
  { title: "Drive", year: 2011, tmdbId: 64690, genres: ["Crime", "Drama"], reason: "Stylish noir with a killer soundtrack", rating: 7.8 },
  { title: "Arrival", year: 2016, tmdbId: 329865, genres: ["Sci-Fi", "Drama"], reason: "Mind-bending storytelling with emotional depth", rating: 7.9 },
  { title: "Moonlight", year: 2016, tmdbId: 376867, genres: ["Drama"], reason: "Intimate and beautifully crafted character study", rating: 7.4 },
  { title: "Blade Runner 2049", year: 2017, tmdbId: 335984, genres: ["Sci-Fi"], reason: "Visually stunning sequel that surpasses the original", rating: 7.5 },
  { title: "Parasite", year: 2019, tmdbId: 496243, genres: ["Thriller", "Drama"], reason: "Masterful genre-blending social commentary", rating: 8.5 },
  { title: "Whiplash", year: 2014, tmdbId: 244786, genres: ["Drama", "Music"], reason: "Intense and electrifying pursuit of perfection", rating: 8.5 },
  { title: "Her", year: 2013, tmdbId: 152601, genres: ["Romance", "Sci-Fi"], reason: "Tender exploration of love in a digital age", rating: 8.0 },
];

const TRENDING: MovieItem[] = [
  { title: "Dune: Part Two", year: 2024, tmdbId: 693134, genres: ["Sci-Fi", "Adventure"], reason: "Expansive and visually breathtaking", rating: 8.3 },
  { title: "The Brutalist", year: 2024, tmdbId: 549509, genres: ["Drama"], reason: "Ambitious epic about the immigrant experience", rating: 7.8 },
  { title: "Anora", year: 2024, tmdbId: 1064213, genres: ["Drama", "Comedy"], reason: "Sharp and surprising Palme d'Or winner", rating: 7.5 },
  { title: "Conclave", year: 2024, tmdbId: 974453, genres: ["Thriller", "Drama"], reason: "Gripping Vatican political thriller", rating: 7.6 },
  { title: "The Substance", year: 2024, tmdbId: 933260, genres: ["Horror", "Sci-Fi"], reason: "Bold body horror with a statement", rating: 7.2 },
  { title: "Nosferatu", year: 2024, tmdbId: 426063, genres: ["Horror"], reason: "Atmospheric reimagining of the classic", rating: 7.0 },
];

export function MoviesTab() {
  const [recs] = useState<MovieItem[]>(SAMPLE_RECS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMood, setLastMood] = useState<string | null>(null);

  const handleMoodSubmit = async (mood: string) => {
    setIsLoading(true);
    setLastMood(mood);
    // Phase 5: Replace with actual Gemini API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-10">
      {/* Mood input */}
      <MoodInput
        activeTab="movies"
        onSubmit={handleMoodSubmit}
        isLoading={isLoading}
      />

      {/* AI Recommendations */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-movie-accent" />
          <h2 className="text-base font-semibold">
            {lastMood ? `Recommendations for "${lastMood}"` : "Picked for you"}
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-movie-accent/10 text-movie-accent ml-auto">
            AI
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface border border-white/5 overflow-hidden">
                <div className="aspect-[2/3] bg-surface-light animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-surface-light rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-surface-light rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recs.map((item, i) => (
              <RecommendationCard key={i} type="movie" item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Trending this week</h2>
        </div>

        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {TRENDING.map((item, i) => (
            <div key={i} className="shrink-0 w-[160px]">
              <RecommendationCard type="movie" item={item} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
