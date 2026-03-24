"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { MoodInput } from "@/components/shared/MoodInput";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { useRecommendations } from "@/hooks/useRecommendations";
import { AiThinkingLoader } from "@/components/shared/AiThinkingLoader";
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

export function MoviesTab() {
  const { items: aiRecs, isLoading, error, lastMood, fetchRecs } = useRecommendations({
    type: "movie",
  });
  const [trending, setTrending] = useState<MovieItem[]>([]);

  useEffect(() => {
    fetch("/api/tmdb/trending")
      .then((r) => r.json())
      .then((data) => {
        if (!data.results) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: MovieItem[] = data.results.slice(0, 10).map((m: any) => ({
          title: m.title,
          year: new Date(m.release_date).getFullYear(),
          tmdbId: m.id,
          genres: [],
          reason: m.overview?.slice(0, 80) || "Trending this week",
          posterPath: m.poster_path,
          rating: m.vote_average,
        }));
        setTrending(items);
      })
      .catch(() => {});
  }, []);

  const displayRecs = (aiRecs.length > 0 ? aiRecs : SAMPLE_RECS) as MovieItem[];

  return (
    <div className="space-y-10">
      {/* Mood input */}
      <MoodInput activeTab="movies" onSubmit={fetchRecs} isLoading={isLoading} />

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Recommendations */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-movie-accent" />
          <h2 className="text-base font-semibold">
            {lastMood ? `Recommendations for "${lastMood}"` : "Picked for you"}
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-movie-accent/10 text-movie-accent ml-auto">
            AI
          </span>
        </div>

        {isLoading ? (
          <AiThinkingLoader type="movie" count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayRecs.map((item, i) => (
              <RecommendationCard key={`${item.title}-${i}`} type="movie" item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Trending this week</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {trending.map((item, i) => (
              <div key={i} className="shrink-0 w-[160px]">
                <RecommendationCard type="movie" item={item} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
