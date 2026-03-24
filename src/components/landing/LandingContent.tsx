"use client";

import { useState } from "react";
import { TabSwitcher } from "@/components/shared/TabSwitcher";
import { MoodInput } from "@/components/shared/MoodInput";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { useRecommendations } from "@/hooks/useRecommendations";
import { Sparkles, AlertCircle } from "lucide-react";
import type { MusicItem, MovieItem } from "@/types/recommendations";

const SAMPLE_MUSIC: MusicItem[] = [
  { title: "Blinding Lights", artist: "The Weeknd", reason: "Cinematic synths that match late-night energy" },
  { title: "Redbone", artist: "Childish Gambino", reason: "Smooth funk with a dreamy, nostalgic pull" },
  { title: "Pink + White", artist: "Frank Ocean", reason: "Warm and reflective — perfect for winding down" },
  { title: "Electric Feel", artist: "MGMT", reason: "Bright indie pop with irresistible groove" },
  { title: "Midnight City", artist: "M83", reason: "Euphoric synth-pop that feels like a night drive" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", reason: "Dark, brooding rock with a magnetic riff" },
];

const SAMPLE_MOVIES: MovieItem[] = [
  { title: "Interstellar", year: 2014, tmdbId: 157336, genres: ["Sci-Fi", "Drama"], reason: "Epic scope meets deep emotional resonance", rating: 8.7 },
  { title: "Drive", year: 2011, tmdbId: 64690, genres: ["Crime", "Drama"], reason: "Stylish noir with a killer soundtrack", rating: 7.8 },
  { title: "Arrival", year: 2016, tmdbId: 329865, genres: ["Sci-Fi", "Drama"], reason: "Mind-bending storytelling with emotional depth", rating: 7.9 },
  { title: "Moonlight", year: 2016, tmdbId: 376867, genres: ["Drama"], reason: "Intimate and beautifully crafted character study", rating: 7.4 },
  { title: "Blade Runner 2049", year: 2017, tmdbId: 335984, genres: ["Sci-Fi"], reason: "Visually stunning sequel that surpasses the original", rating: 7.5 },
  { title: "Parasite", year: 2019, tmdbId: 496243, genres: ["Thriller", "Drama"], reason: "Masterful genre-blending social commentary", rating: 8.5 },
];

interface LandingContentProps {
  isAuthenticated: boolean;
  userName?: string | null;
}

export function LandingContent({ isAuthenticated, userName }: LandingContentProps) {
  const [activeTab, setActiveTab] = useState<"music" | "movies">("music");

  const musicRecs = useRecommendations({ type: "music" });
  const movieRecs = useRecommendations({ type: "movie" });

  const active = activeTab === "music" ? musicRecs : movieRecs;
  const displayMusic = (musicRecs.items.length > 0 ? musicRecs.items : SAMPLE_MUSIC) as MusicItem[];
  const displayMovies = (movieRecs.items.length > 0 ? movieRecs.items : SAMPLE_MOVIES) as MovieItem[];

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Greeting or tagline */}
        <div className="text-center mb-8">
          {isAuthenticated && userName ? (
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {getGreeting()},{" "}
              <span className="text-[var(--music-accent)]">{userName}</span>
            </h1>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Your taste.{" "}
              <span className="bg-gradient-to-r from-[var(--music-accent)] to-[var(--movie-accent)] bg-clip-text text-transparent">
                Amplified.
              </span>
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {isAuthenticated
              ? "Get personalized recommendations powered by AI"
              : "Discover music and movies — powered by AI that learns your taste"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <TabSwitcher defaultTab="music" onTabChange={setActiveTab} />
        </div>

        {/* AI mood input */}
        <div className="max-w-2xl mx-auto mb-10">
          <MoodInput
            activeTab={activeTab}
            onSubmit={active.fetchRecs}
            isLoading={active.isLoading}
          />
        </div>

        {/* Error */}
        {active.error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2.5 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{active.error}</span>
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles
            className="w-4 h-4"
            style={{
              color: activeTab === "music" ? "var(--music-accent)" : "var(--movie-accent)",
            }}
          />
          <h2 className="text-lg font-semibold">
            {active.lastMood
              ? `Recommendations for "${active.lastMood}"`
              : isAuthenticated
                ? "Picked for you"
                : "Trending recommendations"}
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground ml-auto">
            AI
          </span>
        </div>

        {/* Recommendation grid */}
        {active.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface border border-white/5 overflow-hidden">
                <div className={`${activeTab === "music" ? "aspect-square" : "aspect-[2/3]"} bg-surface-light animate-pulse`} />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-surface-light rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-surface-light rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {activeTab === "music"
              ? displayMusic.map((item, i) => (
                  <RecommendationCard key={`${item.title}-${i}`} type="music" item={item} />
                ))
              : displayMovies.map((item, i) => (
                  <RecommendationCard key={`${item.title}-${i}`} type="movie" item={item} />
                ))}
          </div>
        )}

        {/* Sign-in prompt for guests */}
        {!isAuthenticated && (
          <div className="mt-12 text-center glass rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-3">
              Connect Spotify for personalized music recommendations
            </p>
            <a
              href="/api/auth/spotify/start"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--music-accent)] text-black text-sm font-medium hover:brightness-110 transition-all"
            >
              Connect with Spotify
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
