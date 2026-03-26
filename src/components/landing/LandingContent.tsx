"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TabSwitcher } from "@/components/shared/TabSwitcher";
import { MoodInput } from "@/components/shared/MoodInput";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { CardCarousel } from "@/components/shared/CardCarousel";
import { TrendingMovieCard } from "@/components/shared/TrendingMovieCard";
import { useRecommendations } from "@/hooks/useRecommendations";
import { Sparkles, AlertCircle } from "lucide-react";
import type { MusicItem, MovieItem } from "@/types/recommendations";
import type { TrendingMovie } from "@/types/trending";
import { getGreeting } from "@/lib/utils";

const SAMPLE_MUSIC: MusicItem[] = [
  { title: "Blinding Lights", artist: "The Weeknd", reason: "Cinematic synths that match late-night energy" },
  { title: "Redbone", artist: "Childish Gambino", reason: "Smooth funk with a dreamy, nostalgic pull" },
  { title: "Pink + White", artist: "Frank Ocean", reason: "Warm and reflective — perfect for winding down" },
  { title: "Electric Feel", artist: "MGMT", reason: "Bright indie pop with irresistible groove" },
  { title: "Midnight City", artist: "M83", reason: "Euphoric synth-pop that feels like a night drive" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", reason: "Dark, brooding rock with a magnetic riff" },
  { title: "Nights", artist: "Frank Ocean", reason: "A perfect beat switch halfway through" },
  { title: "Losing It", artist: "FISHER", reason: "High energy tech house for late nights" },
  { title: "The Less I Know The Better", artist: "Tame Impala", reason: "Iconic bassline with a psychedelic pop feel" },
  { title: "Bad Guy", artist: "Billie Eilish", reason: "Whisper-pop with a heavy, bouncy bass" },
];

const SAMPLE_MOVIES: MovieItem[] = [
  { title: "Interstellar", year: 2014, tmdbId: 157336, genres: ["Sci-Fi", "Drama"], reason: "Epic scope meets deep emotional resonance", rating: 8.7 },
  { title: "Drive", year: 2011, tmdbId: 64690, genres: ["Crime", "Drama"], reason: "Stylish noir with a killer soundtrack", rating: 7.8 },
  { title: "Arrival", year: 2016, tmdbId: 329865, genres: ["Sci-Fi", "Drama"], reason: "Mind-bending storytelling with emotional depth", rating: 7.9 },
  { title: "Moonlight", year: 2016, tmdbId: 376867, genres: ["Drama"], reason: "Intimate and beautifully crafted character study", rating: 7.4 },
  { title: "Blade Runner 2049", year: 2017, tmdbId: 335984, genres: ["Sci-Fi"], reason: "Visually stunning sequel that surpasses the original", rating: 7.5 },
  { title: "Parasite", year: 2019, tmdbId: 496243, genres: ["Thriller", "Drama"], reason: "Masterful genre-blending social commentary", rating: 8.5 },
  { title: "Dune", year: 2021, tmdbId: 438631, genres: ["Sci-Fi", "Adventure"], reason: "A monumental cinematic achievement with stunning score", rating: 7.8 },
  { title: "The Dark Knight", year: 2008, tmdbId: 155, genres: ["Action", "Crime", "Drama"], reason: "A gripping and psychologically complex thriller", rating: 9.0 },
  { title: "Inception", year: 2010, tmdbId: 27205, genres: ["Action", "Sci-Fi", "Thriller"], reason: "Mind-bending original concept with incredible visuals", rating: 8.8 },
  { title: "Everything Everywhere All at Once", year: 2022, tmdbId: 545611, genres: ["Action", "Adventure", "Sci-Fi"], reason: "Wildly inventive and deeply emotional multiverse story", rating: 8.0 },
];

interface LandingContentProps {
  isAuthenticated: boolean;
  userName?: string | null;
}

export function LandingContent({ isAuthenticated, userName }: LandingContentProps) {
  const [activeTab, setActiveTab] = useState<"music" | "movies">("music");
  const [greeting, setGreeting] = useState<string>("");

  // Trending state
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [trendingMoviesLoaded, setTrendingMoviesLoaded] = useState(false);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Fetch trending movies when movies tab is opened
  useEffect(() => {
    if (activeTab !== "movies" || trendingMoviesLoaded) return;
    setTrendingMoviesLoaded(true);
    fetch("/api/tmdb/trending")
      .then((r) => r.json())
      .then((data) => {
        const movies: TrendingMovie[] = (data.results ?? []).slice(0, 20).map(
          (m: { id: number; title: string; release_date: string; poster_path: string | null; vote_average: number }) => ({
            tmdbId: m.id,
            title: m.title,
            year: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : 0,
            posterPath: m.poster_path,
            rating: m.vote_average > 0 ? m.vote_average : null,
          })
        );
        setTrendingMovies(movies);
      })
      .catch(() => {});
  }, [activeTab, trendingMoviesLoaded]);

  function handleTabChange(tab: "music" | "movies") {
    setActiveTab(tab);
    if (tab === "movies" && isAuthenticated) movieRecs.triggerAutoFetch();
  }

  const musicRecs = useRecommendations({
    type: "music",
    autoFetch: isAuthenticated,
    autoPrompt: "songs I probably haven't heard yet but would love — deep cuts and hidden gems from artists similar to my taste, no chart hits or songs already in my top tracks",
  });
  const movieRecs = useRecommendations({
    type: "movie",
    autoFetch: isAuthenticated,
    autoPrompt: "movies that match my preferred genres — acclaimed and underrated films I might have missed",
  });

  const active = activeTab === "music" ? musicRecs : movieRecs;
  const displayMusic = (musicRecs.autoItems.length > 0 ? musicRecs.autoItems : SAMPLE_MUSIC) as MusicItem[];
  const displayMovies = (movieRecs.autoItems.length > 0 ? movieRecs.autoItems : SAMPLE_MOVIES) as MovieItem[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen pt-32 px-4 sm:px-6 pb-12"
    >
      <div className="max-w-5xl mx-auto">
        {/* Greeting or tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          className="text-center mb-8"
        >
          {isAuthenticated && userName ? (
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {greeting},{" "}
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
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <TabSwitcher defaultTab="music" onTabChange={handleTabChange} />
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

        {/* Searched Recommendation Section */}
        {(active.searchedItems.length > 0 || (active.isLoading && !active.isAutoLoading)) && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles
                className="w-4 h-4"
                style={{
                  color: activeTab === "music" ? "var(--music-accent)" : "var(--movie-accent)",
                }}
              />
              <h2 className="text-lg font-semibold">
                {active.lastMood ? `Recommendations for "${active.lastMood}"` : "Searching..."}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/5 text-muted-foreground ml-auto">
                AI
              </span>
            </div>

            {active.isLoading && !active.isAutoLoading ? (
              <div className="flex gap-3 overflow-hidden pb-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xl bg-surface border border-border overflow-hidden flex-shrink-0 ${activeTab === "music" ? "w-44" : "w-36"}`}
                  >
                    <div className={`${activeTab === "music" ? "aspect-square" : "aspect-[2/3]"} bg-surface-light animate-pulse`} />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-surface-light rounded animate-pulse w-3/4" />
                      <div className="h-2 bg-surface-light rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`search-${activeTab}`}
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                >
                  <CardCarousel>
                    {activeTab === "music"
                      ? (active.searchedItems as MusicItem[]).map((item, i) => (
                          <motion.div
                            key={`search-${item.title}-${i}`}
                            className="w-44 flex-shrink-0"
                            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } }}
                          >
                            <RecommendationCard type="music" item={item} />
                          </motion.div>
                        ))
                      : (active.searchedItems as MovieItem[]).map((item, i) => (
                          <motion.div
                            key={`search-${item.title}-${i}`}
                            className="w-36 flex-shrink-0"
                            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } }}
                          >
                            <RecommendationCard type="movie" item={item} />
                          </motion.div>
                        ))}
                  </CardCarousel>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}

        {/* AI Picked for You / Trending Placeholder */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-muted-foreground">
              {isAuthenticated ? "Picked for you" : "Trending recommendations"}
            </h2>
          </div>

          {active.isAutoLoading ? (
            <div className="flex gap-3 overflow-hidden pb-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-xl bg-surface border border-border overflow-hidden flex-shrink-0 ${activeTab === "music" ? "w-44" : "w-36"}`}
                >
                  <div className={`${activeTab === "music" ? "aspect-square" : "aspect-[2/3]"} bg-surface-light animate-pulse`} />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-surface-light rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-surface-light rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`auto-${activeTab}`}
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              >
                <CardCarousel>
                  {activeTab === "music"
                    ? displayMusic.map((item, i) => (
                        <motion.div
                          key={`auto-${item.title}-${i}`}
                          className="w-44 flex-shrink-0"
                          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } }}
                        >
                          <RecommendationCard type="music" item={item} />
                        </motion.div>
                      ))
                    : displayMovies.map((item, i) => (
                        <motion.div
                          key={`auto-${item.title}-${i}`}
                          className="w-36 flex-shrink-0"
                          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } }}
                        >
                          <RecommendationCard type="movie" item={item} />
                        </motion.div>
                      ))}
                </CardCarousel>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Trending rows — Movies tab */}
        {activeTab === "movies" && trendingMovies.length > 0 && (
          <div className="mt-10">
            <CardCarousel title="Trending This Week" accentColor="var(--movie-accent)">
              {trendingMovies.map((movie) => (
                <TrendingMovieCard key={movie.tmdbId} {...movie} />
              ))}
            </CardCarousel>
          </div>
        )}

        {/* Sign-in prompt for guests */}
        {!isAuthenticated && (
          <div className="mt-12 text-center glass rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-3">
              Connect Spotify for personalized music recommendations
            </p>
            <a
              href="/signin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--music-accent)] text-black text-sm font-medium hover:brightness-110 transition-all"
            >
              Connect with Spotify
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
